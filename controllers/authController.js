const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION_MINUTES,
} = require('../config/constants');

const SALT_ROUNDS = 12;

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
    const { email, password, role } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      email,
      passwordHash,
      role: role === 'librarian' ? 'librarian' : 'reader',
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

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil - new Date()) / 60000);
      return res.status(423).json({
        error: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`,
      });
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
      await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
    }

    res.json({ message: 'Logged out.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout };