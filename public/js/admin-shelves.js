const shelfForm = document.getElementById('shelfForm');
const shelfFormId = document.getElementById('shelfFormId');
const shelfName = document.getElementById('shelfName');
const shelfBookIds = document.getElementById('shelfBookIds');
const shelfFormSubmit = document.getElementById('shelfFormSubmit');
const shelfFormCancel = document.getElementById('shelfFormCancel');
const shelfFormTitle = document.getElementById('shelfFormTitle');
const adminShelvesList = document.getElementById('adminShelvesList');

let currentShelves = [];

function setStatus(elementId, message, type) {
  const el = document.getElementById(elementId);
  el.textContent = message || '';
  el.className = 'status-area' + (type ? ` ${type}` : '');
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Request failed with status ${response.status}`);
  return data;
}

async function authFetchJson(url, options) {
  const response = await authFetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Request failed with status ${response.status}`);
  return data;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function resetForm() {
  shelfForm.reset();
  shelfFormId.value = '';
  Array.from(shelfBookIds.options).forEach((opt) => (opt.selected = false));
  shelfFormTitle.textContent = 'Create a New Shelf';
  shelfFormSubmit.textContent = 'Create Shelf';
  shelfFormCancel.style.display = 'none';
}

async function loadBookOptions() {
  const data = await fetchJson('/api/library/books?limit=100');
  shelfBookIds.innerHTML = data.books
    .map((b) => `<option value="${b._id}">${escapeHtml(b.title)}</option>`)
    .join('');
}

async function loadShelves() {
  setStatus('adminShelvesStatus', 'Loading…', 'loading');
  try {
    const data = await fetchJson('/api/library/shelves');
    currentShelves = data.shelves;
    renderShelfList(currentShelves);
    setStatus('adminShelvesStatus', `${data.count} shelf(ves)`, null);
  } catch (err) {
    setStatus('adminShelvesStatus', err.message, 'error');
  }
}

function renderShelfList(shelves) {
  if (shelves.length === 0) {
    adminShelvesList.innerHTML = '';
    setStatus('adminShelvesStatus', 'No shelves yet.', 'empty');
    return;
  }

  adminShelvesList.innerHTML = shelves.map((s) => `
    <div class="admin-row">
      <div class="admin-row-info">
        <div class="admin-row-title">${escapeHtml(s.name)}</div>
        <div class="admin-row-meta">${s.bookIds.length} book(s): ${s.bookIds.map((b) => escapeHtml(b.title)).join(', ') || '—'}</div>
      </div>
      <div class="admin-row-actions">
        <button class="admin-btn admin-btn-edit" data-edit-id="${s._id}">Edit</button>
        <button class="admin-btn admin-btn-delete" data-delete-id="${s._id}">Delete</button>
      </div>
    </div>
  `).join('');
}

shelfForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const selectedBookIds = Array.from(shelfBookIds.selectedOptions).map((opt) => opt.value);

  const payload = {
    name: shelfName.value.trim(),
    bookIds: selectedBookIds,
  };

  const editingId = shelfFormId.value;
  const url = editingId ? `/api/library/shelves/${editingId}` : '/api/library/shelves';
  const method = editingId ? 'PUT' : 'POST';

  setStatus('shelfFormStatus', editingId ? 'Updating…' : 'Creating…', 'loading');

  try {
    await authFetchJson(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setStatus('shelfFormStatus', editingId ? 'Shelf updated.' : 'Shelf created.', null);
    resetForm();
    loadShelves();
  } catch (err) {
    setStatus('shelfFormStatus', err.message, 'error');
  }
});

shelfFormCancel.addEventListener('click', resetForm);

adminShelvesList.addEventListener('click', async (event) => {
  const editBtn = event.target.closest('[data-edit-id]');
  const deleteBtn = event.target.closest('[data-delete-id]');

  if (editBtn) {
    const shelf = currentShelves.find((s) => s._id === editBtn.dataset.editId);
    if (!shelf) return;

    shelfFormId.value = shelf._id;
    shelfName.value = shelf.name;

    const bookIdSet = new Set(shelf.bookIds.map((b) => b._id));
    Array.from(shelfBookIds.options).forEach((opt) => {
      opt.selected = bookIdSet.has(opt.value);
    });

    shelfFormTitle.textContent = `Editing: ${shelf.name}`;
    shelfFormSubmit.textContent = 'Save Changes';
    shelfFormCancel.style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (deleteBtn) {
    const shelf = currentShelves.find((s) => s._id === deleteBtn.dataset.deleteId);
    if (!shelf) return;

    const confirmed = confirm(`Delete shelf "${shelf.name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await authFetch(`/api/library/shelves/${shelf._id}`, { method: 'DELETE' });
      loadShelves();
    } catch (err) {
      setStatus('adminShelvesStatus', err.message, 'error');
    }
  }
});

async function init() {
  await loadBookOptions();
  await loadShelves();
}

init();