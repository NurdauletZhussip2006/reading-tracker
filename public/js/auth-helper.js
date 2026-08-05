const AUTH_STORAGE_KEY = 'readingTrackerAuth';

function saveAuth(data) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
}

function getAuth() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function getAccessToken() {
  const auth = getAuth();
  return auth ? auth.accessToken : null;
}

async function authFetch(url, options = {}) {
  const auth = getAuth();
  const headers = { ...options.headers, 'Content-Type': 'application/json' };

  if (auth && auth.accessToken) {
    headers.Authorization = `Bearer ${auth.accessToken}`;
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401 && auth && auth.refreshToken) {
    const refreshed = await tryRefreshToken(auth);
    if (refreshed) {
      headers.Authorization = `Bearer ${refreshed}`;
      response = await fetch(url, { ...options, headers });
    }
  }

  return response;
}

async function tryRefreshToken(auth) {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: auth.user.id, refreshToken: auth.refreshToken }),
    });

    if (!res.ok) {
      clearAuth();
      return null;
    }

    const data = await res.json();
    saveAuth({ ...auth, accessToken: data.accessToken });
    return data.accessToken;
  } catch {
    clearAuth();
    return null;
  }
}

function renderAuthStatus(elementId) {
  const auth = getAuth();
  const el = document.getElementById(elementId);
  if (!el) return;

  if (auth) {
    el.innerHTML = `Logged in as <strong>${auth.user.email}</strong> (${auth.user.role}) · <a href="#" id="logoutLink">Log out</a>`;
    document.getElementById('logoutLink').addEventListener('click', async (e) => {
      e.preventDefault();
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: auth.user.id }),
      });
      clearAuth();
      window.location.reload();
    });
  } else {
    el.innerHTML = `<a href="/login">Log in</a> or <a href="/register">Register</a>`;
  }
}