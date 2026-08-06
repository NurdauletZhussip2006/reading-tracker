const bookForm = document.getElementById('bookForm');
const bookFormId = document.getElementById('bookFormId');
const bookTitle = document.getElementById('bookTitle');
const bookIsbn = document.getElementById('bookIsbn');
const bookAuthors = document.getElementById('bookAuthors');
const bookGenres = document.getElementById('bookGenres');
const bookPages = document.getElementById('bookPages');
const bookFormSubmit = document.getElementById('bookFormSubmit');
const bookFormCancel = document.getElementById('bookFormCancel');
const formTitle = document.getElementById('formTitle');
const adminBooksList = document.getElementById('adminBooksList');
const bookSearchFilter = document.getElementById('bookSearchFilter');
const bookGenreFilter = document.getElementById('bookGenreFilter');

let allBooks = [];

function setStatus(elementId, message, type) {
  const el = document.getElementById(elementId);
  el.textContent = message || '';
  el.className = 'status-area' + (type ? ` ${type}` : '');
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || `Request failed with status ${response.status}`);
    throw error;
  }

  return data;
}

// NEW HELPER ADDED HERE: For authenticated write requests
async function authFetchJson(url, options) {
  const response = await authFetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Request failed with status ${response.status}`);
  return data;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
function isLibrarian() {
  const auth = typeof getAuthData === 'function' ? getAuthData() : null;
  return !!(auth && auth.user && auth.user.role === 'librarian');
}

function resetForm() {
  bookForm.reset();
  bookFormId.value = '';
  formTitle.textContent = 'Add a New Book';
  bookFormSubmit.textContent = 'Create Book';
  bookFormCancel.style.display = 'none';
}

function populateGenreOptions(books) {
  const genres = [...new Set(books.flatMap((b) => b.genres))].sort();
  bookGenreFilter.innerHTML =
    '<option value="">All Genres</option>' +
    genres.map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');
}

async function loadBooks() {
  setStatus('adminBooksStatus', 'Loading…', 'loading');
  try {
    const data = await fetchJson('/api/library/books?limit=100');
    allBooks = data.books;
    populateGenreOptions(allBooks);
    applyFilters();
    setStatus('adminBooksStatus', `${data.total} book(s) total`, null);
  } catch (err) {
    setStatus('adminBooksStatus', err.message, 'error');
  }
}

function renderBookList(books) {
  if (books.length === 0) {
    adminBooksList.innerHTML = '';
    setStatus('adminBooksStatus', 'No books match your search/filter.', 'empty');
    return;
  }

  adminBooksList.innerHTML = books.map((book) => `
    <div class="admin-row">
      <div class="admin-row-info">
        <div class="admin-row-title">${escapeHtml(book.title)}</div>
        <div class="admin-row-meta">
          ${escapeHtml(book.authors.join(', '))} · ${book.pages} pages
          ${book.isbn ? ` · ISBN ${escapeHtml(book.isbn)}` : ''}
        </div>
      </div>
      ${isLibrarian() ? `
      <div class="admin-row-actions">
        <button class="admin-btn admin-btn-edit" data-edit-id="${book._id}">Edit</button>
        <button class="admin-btn admin-btn-delete" data-delete-id="${book._id}">Delete</button>
      </div>
      ` : ''}
    </div>
  `).join('');
}

function applyFilters() {
  const term = bookSearchFilter.value.trim().toLowerCase();
  const genre = bookGenreFilter.value;

  const filtered = allBooks.filter((book) => {
    const matchesSearch =
      !term ||
      book.title.toLowerCase().includes(term) ||
      book.authors.some((a) => a.toLowerCase().includes(term));

    const matchesGenre = !genre || book.genres.includes(genre);

    return matchesSearch && matchesGenre;
  });

  renderBookList(filtered);
}

bookSearchFilter.addEventListener('input', applyFilters);
bookGenreFilter.addEventListener('change', applyFilters);

bookForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    title: bookTitle.value.trim(),
    authors: bookAuthors.value.split(',').map((a) => a.trim()).filter(Boolean),
    genres: bookGenres.value.split(',').map((g) => g.trim()).filter(Boolean),
    pages: Number(bookPages.value),
  };

  if (bookIsbn.value.trim()) {
    payload.isbn = bookIsbn.value.trim();
  }

  const editingId = bookFormId.value;
  const url = editingId ? `/api/library/books/${editingId}` : '/api/library/books';
  const method = editingId ? 'PUT' : 'POST';

  setStatus('bookFormStatus', editingId ? 'Updating…' : 'Creating…', 'loading');

  try {
    // CHANGED: Using authFetchJson instead of fetchJson for Create/Update
    await authFetchJson(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setStatus('bookFormStatus', editingId ? 'Book updated.' : 'Book created.', null);
    resetForm();
    loadBooks();
  } catch (err) {
    setStatus('bookFormStatus', err.message, 'error');
  }
});

bookFormCancel.addEventListener('click', resetForm);

adminBooksList.addEventListener('click', async (event) => {
  const editBtn = event.target.closest('[data-edit-id]');
  const deleteBtn = event.target.closest('[data-delete-id]');

  if (editBtn) {
    const book = allBooks.find((b) => b._id === editBtn.dataset.editId);
    if (!book) return;

    bookFormId.value = book._id;
    bookTitle.value = book.title;
    bookIsbn.value = book.isbn || '';
    bookAuthors.value = book.authors.join(', ');
    bookGenres.value = book.genres.join(', ');
    bookPages.value = book.pages;

    formTitle.textContent = `Editing: ${book.title}`;
    bookFormSubmit.textContent = 'Save Changes';
    bookFormCancel.style.display = 'inline-block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (deleteBtn) {
    const book = allBooks.find((b) => b._id === deleteBtn.dataset.deleteId);
    if (!book) return;

    const confirmed = confirm(`Delete "${book.title}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      // CHANGED: Using authFetchJson instead of fetchJson for Delete
      await authFetchJson(`/api/library/books/${book._id}`, { method: 'DELETE' });
      loadBooks();
    } catch (err) {
      setStatus('adminBooksStatus', err.message, 'error');
    }
  }
});

if (!isLibrarian()) {
  document.getElementById('bookFormSection').style.display = 'none';
}

loadBooks();