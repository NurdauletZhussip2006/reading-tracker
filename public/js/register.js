document.getElementById('registerForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const role = document.getElementById('regRole').value;
  const librarianCode = document.getElementById('regLibrarianCode').value;

  const statusEl = document.getElementById('registerStatus');
  statusEl.textContent = 'Registering…';
  statusEl.className = 'status-area loading';

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role, librarianCode }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    statusEl.textContent = 'Registered successfully! Redirecting to login...';
    statusEl.className = 'status-area';
    setTimeout(() => (window.location.href = '/login'), 1200);
  } catch (err) {
    statusEl.textContent = err.message;
    statusEl.className = 'status-area error';
  }
});

document.getElementById('regRole').addEventListener('change', (event) => {
  const librarianCodeGroup = document.getElementById('librarianCodeGroup');
  librarianCodeGroup.style.display = event.target.value === 'librarian' ? 'block' : 'none';
});