const adminLogsList = document.getElementById('adminLogsList');
const logCompletionFilter = document.getElementById('logCompletionFilter');
const logSortFilter = document.getElementById('logSortFilter');
const logSearchFilter = document.getElementById('logSearchFilter');

const logForm = document.getElementById('logForm');
const logFormId = document.getElementById('logFormId');
const logBookId = document.getElementById('logBookId');
const logDate = document.getElementById('logDate');
const logPagesRead = document.getElementById('logPagesRead');
const logMinutes = document.getElementById('logMinutes');
const logGenre = document.getElementById('logGenre');
const logRating = document.getElementById('logRating');
const logCompletionPercent = document.getElementById('logCompletionPercent');
const logFormSubmit = document.getElementById('logFormSubmit');
const logFormCancel = document.getElementById('logFormCancel');
const logFormTitle = document.getElementById('logFormTitle');
const completionFeedback = document.getElementById('completionFeedback');

let currentLogs = [];
let bookCatalogue = []; // [{ _id, title, pages, genres }]

function setStatus(elementId, message, type) {
  const el = document.getElementById(elementId);
  el.textContent = message || '';
  el.className = 'status-area' + (type ? ` ${type}` : '');
}

async function fetchJson(url) {
  const response = await authFetch(url);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      response.status === 401
        ? 'Please log in to view your reading logs.'
        : (data.error || `Request failed with status ${response.status}`)
    );
    throw error;
  }

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
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Create / edit form
// ---------------------------------------------------------------------------

async function loadBookCatalogue() {
  const data = await fetchJson('/api/library/books?limit=200');
  bookCatalogue = data.books;
  logBookId.innerHTML =
    '<option value="">Select a book...</option>' +
    bookCatalogue.map((b) => `<option value="${b._id}">${escapeHtml(b.title)}</option>`).join('');
}

function getSelectedBook() {
  return bookCatalogue.find((b) => b._id === logBookId.value);
}

function autoFillFromBook() {
  const book = getSelectedBook();
  if (!book) {
    logGenre.value = '';
    completionFeedback.textContent = '';
    return;
  }

  // Genre isn't shown as a field — it's just recorded silently from the
  // book so the dashboard's "most-read genre" metric has something to
  // aggregate on.
  logGenre.value = (book.genres && book.genres[0]) || '';
  recalculateCompletion();
}

function getPriorCumulativePages(bookId, excludeLogId) {
  // Best-effort: sums pagesRead from this book's sessions that are already
  // loaded in the current list. If a completion filter is narrowing the list
  // when this runs, the estimate may be off — it only drives the friendly
  // feedback text below, not anything the user has to trust blindly.
  return currentLogs
    .filter((l) => l.bookId && l.bookId._id === bookId && l._id !== excludeLogId)
    .reduce((sum, l) => sum + (l.pagesRead || 0), 0);
}

function recalculateCompletion() {
  const book = getSelectedBook();
  const pagesReadThisSession = Number(logPagesRead.value);
  if (!book || !book.pages || !pagesReadThisSession) {
    logCompletionPercent.value = '';
    completionFeedback.textContent = '';
    return;
  }

  const excludeId = logFormId.value || null;
  const priorPages = getPriorCumulativePages(book._id, excludeId);
  const totalPagesSoFar = priorPages + pagesReadThisSession;

  const percent = Math.min(Math.max(Math.round((totalPagesSoFar / book.pages) * 100), 0), 100);
  logCompletionPercent.value = percent;

  completionFeedback.textContent = percent >= 100
    ? `You've finished "${book.title}"! 🎉`
    : `You're now about ${percent}% through "${book.title}".`;
}

logBookId.addEventListener('change', autoFillFromBook);
logPagesRead.addEventListener('input', recalculateCompletion);

function resetForm() {
  logForm.reset();
  logFormId.value = '';
  logDate.value = todayInputValue();
  completionFeedback.textContent = '';
  logFormTitle.textContent = 'Log a Reading Session';
  logFormSubmit.textContent = 'Save Session';
  logFormCancel.style.display = 'none';
}

logForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    bookId: logBookId.value,
    date: logDate.value,
    pagesRead: Number(logPagesRead.value),
    minutes: Number(logMinutes.value),
    genre: logGenre.value.trim() || null,
    rating: logRating.value === '' ? null : Number(logRating.value),
    completionPercent: logCompletionPercent.value === '' ? null : Number(logCompletionPercent.value),
  };

  const editingId = logFormId.value;
  const url = editingId ? `/api/library/reading-logs/${editingId}` : '/api/library/reading-logs';
  const method = editingId ? 'PUT' : 'POST';

  setStatus('logFormStatus', editingId ? 'Updating…' : 'Saving…', 'loading');

  try {
    await authFetchJson(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setStatus('logFormStatus', editingId ? 'Session updated.' : 'Session logged.', null);
    resetForm();
    loadLogs();
  } catch (err) {
    setStatus('logFormStatus', err.message, 'error');
  }
});

logFormCancel.addEventListener('click', resetForm);

// ---------------------------------------------------------------------------
// List / filter / edit / delete
// ---------------------------------------------------------------------------

async function loadLogs() {
  setStatus('adminLogsStatus', 'Loading…', 'loading');

  const params = new URLSearchParams({ limit: '100' });

  const completion = logCompletionFilter.value;
  if (completion) params.set('completion', completion);

  const sort = logSortFilter.value;
  if (sort) params.set('sort', sort);

  try {
    const data = await fetchJson(`/api/library/reading-logs?${params.toString()}`);
    currentLogs = data.logs;
    renderLogs(currentLogs);
  } catch (err) {
    setStatus('adminLogsStatus', err.message, 'error');
  }
}

function renderLogs(logs) {
  const term = logSearchFilter.value.trim().toLowerCase();

  const filtered = term
    ? logs.filter((log) => log.bookId && log.bookId.title.toLowerCase().includes(term))
    : logs;

  if (filtered.length === 0) {
    adminLogsList.innerHTML = '';
    setStatus('adminLogsStatus', 'No sessions match your filters.', 'empty');
    return;
  }
  setStatus('adminLogsStatus', `${filtered.length} session(s)`, null);

  adminLogsList.innerHTML = filtered.map((log) => {
    const book = log.bookId;
    const isCompleted = (log.completionPercent || 0) >= 100;

    return `
      <div class="admin-row">
        <div class="admin-row-info">
          <div class="admin-row-title">
            ${book ? escapeHtml(book.title) : 'Unknown book'}
            ${isCompleted ? '<span class="completion-badge">Finished</span>' : ''}
          </div>
          <div class="admin-row-meta">
            ${formatDate(log.date)} · ${log.pagesRead} pages read · ${log.minutes} min
            ${book ? ` · ${book.pages} pages total` : ''}
            ${log.rating ? ` · Rated ${log.rating}/5` : ''}
          </div>
        </div>
        <div class="admin-row-actions">
          <button class="admin-btn admin-btn-edit" data-edit-id="${log._id}">Edit</button>
          <button class="admin-btn admin-btn-delete" data-delete-id="${log._id}">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

adminLogsList.addEventListener('click', async (event) => {
  const editBtn = event.target.closest('[data-edit-id]');
  const deleteBtn = event.target.closest('[data-delete-id]');

  if (editBtn) {
    const log = currentLogs.find((l) => l._id === editBtn.dataset.editId);
    if (!log) return;

    logFormId.value = log._id;
    logBookId.value = log.bookId ? log.bookId._id : '';
    logDate.value = new Date(log.date).toISOString().slice(0, 10);
    logPagesRead.value = log.pagesRead;
    logMinutes.value = log.minutes;
    logGenre.value = log.genre || '';
    logRating.value = log.rating ?? '';
    logCompletionPercent.value = log.completionPercent ?? '';

    completionFeedback.textContent = log.completionPercent
      ? (log.completionPercent >= 100
          ? `You've finished "${log.bookId ? log.bookId.title : 'this book'}"! 🎉`
          : `You're now about ${log.completionPercent}% through "${log.bookId ? log.bookId.title : 'this book'}".`)
      : '';

    logFormTitle.textContent = 'Editing Session';
    logFormSubmit.textContent = 'Save Changes';
    logFormCancel.style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (deleteBtn) {
    const log = currentLogs.find((l) => l._id === deleteBtn.dataset.deleteId);
    if (!log) return;

    const bookTitle = log.bookId ? log.bookId.title : 'this session';
    const confirmed = confirm(`Delete this reading session for "${bookTitle}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await authFetch(`/api/library/reading-logs/${log._id}`, { method: 'DELETE' });
      loadLogs();
    } catch (err) {
      setStatus('adminLogsStatus', err.message, 'error');
    }
  }
});

logCompletionFilter.addEventListener('change', loadLogs);
logSortFilter.addEventListener('change', loadLogs);
logSearchFilter.addEventListener('input', () => {
  renderLogs(currentLogs);
});

async function init() {
  resetForm();
  await loadBookCatalogue();
  await loadLogs();
}

init();