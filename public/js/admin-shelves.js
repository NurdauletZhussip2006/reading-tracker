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

function isLibrarian() {
  const auth = typeof getAuthData === 'function' ? getAuthData() : null;
  return !!(auth && auth.user && auth.user.role === 'librarian');
}

function getCheckboxes() {
  return Array.from(shelfBookIds.querySelectorAll('input[type="checkbox"]'));
}

function getCheckedBookIds() {
  return getCheckboxes()
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);
}

function updateSelectedCount() {
  const count = getCheckedBookIds().length;
  const countEl = document.getElementById('shelfBookIdsCount');
  countEl.textContent = `${count} selected`;
}

function resetForm() {
  shelfForm.reset();
  shelfFormId.value = '';
  getCheckboxes().forEach((cb) => (cb.checked = false));
  updateSelectedCount();
  shelfFormTitle.textContent = 'Create a New Shelf';
  shelfFormSubmit.textContent = 'Create Shelf';
  shelfFormCancel.style.display = 'none';
}

async function loadBookOptions() {
  const data = await fetchJson('/api/library/books?limit=100');
  shelfBookIds.innerHTML = data.books
    .map(
      (b) => `
      <label class="checkbox-item">
        <input type="checkbox" value="${b._id}">
        <span>${escapeHtml(b.title)}</span>
      </label>
    `
    )
    .join('');
  updateSelectedCount();
}

shelfBookIds.addEventListener('change', (event) => {
  if (event.target.matches('input[type="checkbox"]')) {
    updateSelectedCount();
  }
});

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
    <div class="admin-row admin-row-expandable">
      <div class="admin-row-main">
        <div class="admin-row-info">
          <div class="admin-row-title">${escapeHtml(s.name)}</div>
          <div class="admin-row-meta">${s.bookIds.length} book(s)</div>
        </div>
        <div class="admin-row-actions">
          <button class="admin-btn admin-btn-view" data-toggle-id="${s._id}">View Books</button>
          ${isLibrarian() ? `
            <button class="admin-btn admin-btn-edit" data-edit-id="${s._id}">Edit</button>
            <button class="admin-btn admin-btn-delete" data-delete-id="${s._id}">Delete</button>
          ` : ''}
        </div>
      </div>
      <ul class="shelf-book-list" id="shelfBooks-${s._id}" style="display:none;">
        ${s.bookIds.map((b) => `
          <li>
            <span class="shelf-book-title">${escapeHtml(b.title)}</span>
            ${b.authors && b.authors.length ? `<span class="shelf-book-authors"> — ${escapeHtml(b.authors.join(', '))}</span>` : ''}
          </li>
        `).join('') || '<li>No books on this shelf yet.</li>'}
      </ul>
    </div>
  `).join('');
}

shelfForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const selectedBookIds = getCheckedBookIds();

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
  const toggleBtn = event.target.closest('[data-toggle-id]');

  if (toggleBtn) {
    const list = document.getElementById(`shelfBooks-${toggleBtn.dataset.toggleId}`);
    const isHidden = list.style.display === 'none';
    list.style.display = isHidden ? 'block' : 'none';
    toggleBtn.textContent = isHidden ? 'Hide Books' : 'View Books';
  }
  if (editBtn) {
    const shelf = currentShelves.find((s) => s._id === editBtn.dataset.editId);
    if (!shelf) return;

    shelfFormId.value = shelf._id;
    shelfName.value = shelf.name;

    const bookIdSet = new Set(shelf.bookIds.map((b) => b._id));
    getCheckboxes().forEach((cb) => {
      cb.checked = bookIdSet.has(cb.value);
    });
    updateSelectedCount();

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
  if (isLibrarian()) {
    await loadBookOptions();
  } else {
    document.getElementById('shelfFormSection').style.display = 'none';
  }
  await loadShelves();
}

init();