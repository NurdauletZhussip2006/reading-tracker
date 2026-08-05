document.getElementById('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  const statusEl = document.getElementById('loginStatus');
  statusEl.textContent = 'Logging in…';
  statusEl.className = 'status-area loading';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    saveAuth(data);
    window.location.href = '/dashboard';
  } catch (err) {
    statusEl.textContent = err.message;
    statusEl.className = 'status-area error';
  }
});