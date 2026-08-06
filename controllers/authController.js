const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY_MS,
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION_MINUTES,
  LIBRARIAN_SIGNUP_CODE,
} = require('../config/constants');

const SALT_ROUNDS = 12;

// Precomputed once at startup (not per-request) so that failed-login branches
// which never reach a real bcrypt.compare (unknown email, locked account) can
// still burn a comparable amount of time. Without this, those branches return
// near-instantly while a real wrong-password attempt takes ~100-250ms, which
// lets an attacker distinguish "no such account" / "locked account" from
// "wrong password" purely by response time.
const DUMMY_HASH = bcrypt.hashSync('timing-safety-constant-do-not-use', SALT_ROUNDS);

function generateAccessToken(user) {
  return jwt.sign({ sub: user._id, role: user.role }, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

function validatePasswordStrength(password) {
  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);

  if (!hasLetter || !hasNumber || !hasSpecialChar) {
    return 'Password must contain at least one letter, one number, and one special character.';
  }

  return null;
}

async function register(req, res, next) {
  try {
    const { email, password, role, librarianCode } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password must be strings.' });
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    let finalRole = 'reader';
    if (role === 'librarian') {
      if (!LIBRARIAN_SIGNUP_CODE) {
        return res.status(403).json({ error: 'Librarian signup is currently disabled.' });
      }
      if (librarianCode !== LIBRARIAN_SIGNUP_CODE) {
        return res.status(403).json({ error: 'Invalid librarian signup code.' });
      }
      finalRole = 'librarian';
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      email,
      passwordHash,
      role: finalRole,
    });

    res.status(201).json({
      id: user._id,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password must be strings.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Burn roughly the same time a real bcrypt.compare would take, and return
      // the exact same status/message as a wrong password, so response timing
      // and content can't be used to tell "no such account" apart from
      // "wrong password".
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      // Same reasoning as above: don't let a locked account respond faster,
      // or with a different status/message, than a normal wrong-password case
      // — otherwise 5 wrong guesses becomes a way to confirm an email is
      // registered. This does mean a legitimately locked-out user won't be
      // told why login is failing; that's an intentional trade-off in favor
      // of not leaking account existence.
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60000);
        user.failedLoginAttempts = 0;
      }

      await user.save();
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    user.refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    user.refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { userId, refreshToken } = req.body || {};

    if (!userId || !refreshToken) {
      return res.status(400).json({ error: 'userId and refreshToken are required.' });
    }

    const user = await User.findById(userId);

    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ error: 'Invalid refresh token.' });
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid refresh token.' });
    }

    // These checks run only after the caller has *proven* possession of a
    // valid refresh token, so they can't be used as an oracle by someone who
    // is just guessing userId/refreshToken values.
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(423).json({ error: 'Account locked due to too many failed attempts.' });
    }

    if (!user.refreshTokenExpiresAt || user.refreshTokenExpiresAt < new Date()) {
      return res.status(401).json({ error: 'Refresh token expired. Please log in again.' });
    }

    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const { userId } = req.body || {};

    if (userId) {
      await User.findByIdAndUpdate(userId, { refreshTokenHash: null, refreshTokenExpiresAt: null });
    }

    res.json({ message: 'Logged out.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout };