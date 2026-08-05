function getAuthData() {
  const raw = localStorage.getItem('readingTrackerAuth');
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveAuthData(auth) {
  localStorage.setItem('readingTrackerAuth', JSON.stringify(auth));
}

async function authFetch(url, options = {}) {
  const auth = getAuthData();
  const headers = { ...options.headers, Authorization: `Bearer ${auth ? auth.accessToken : ''}` };

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const updatedAuth = getAuthData();
      headers.Authorization = `Bearer ${updatedAuth.accessToken}`;
      response = await fetch(url, { ...options, headers });
    }
  }

  return response;
}

async function tryRefreshToken() {
  const auth = getAuthData();
  if (!auth || !auth.user) return false;

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: auth.user.id,
        refreshToken: auth.refreshToken,
      }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    auth.accessToken = data.accessToken;
    saveAuthData(auth);
    return true;
  } catch {
    return false;
  }
}