function renderAuthStatus() {
  const el = document.getElementById('authStatus');
  if (!el) return;

  const auth = getAuthData();

  if (auth && auth.accessToken && auth.user) {
    el.innerHTML = `
      <span class="user-email">${auth.user.email} (${auth.user.role})</span>
      <button class="btn-logout" id="logoutBtn">Log Out</button>
    `;
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  } else {
    el.innerHTML = `
      <a href="/login">Log In</a>
      <a href="/register">Register</a>
    `;
  }
}

async function handleLogout() {
  const auth = getAuthData();

  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: auth && auth.user ? auth.user.id : null }),
    });
  } catch {
    // Even if the network call fails, still clear local session
  }

  localStorage.removeItem('readingTrackerAuth');
  window.location.href = '/';
}

renderAuthStatus();