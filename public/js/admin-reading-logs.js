const adminLogsList = document.getElementById('adminLogsList');
const logCompletionFilter = document.getElementById('logCompletionFilter');
const logSortFilter = document.getElementById('logSortFilter');
const logSearchFilter = document.getElementById('logSearchFilter');

function setStatus(elementId, message, type) {
  const el = document.getElementById(elementId);
  el.textContent = message || '';
  el.className = 'status-area' + (type ? ` ${type}` : '');
}

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || `Request failed with status ${response.status}`);
    throw error;
  }

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

async function loadLogs() {
  setStatus('adminLogsStatus', 'Loading…', 'loading');

  const params = new URLSearchParams({ limit: '100' });

  const completion = logCompletionFilter.value;
  if (completion) params.set('completion', completion);

  const sort = logSortFilter.value;
  if (sort) params.set('sort', sort);

  try {
    const data = await fetchJson(`/api/library/reading-logs?${params.toString()}`);
    renderLogs(data.logs);
    setStatus('adminLogsStatus', `${data.total} session(s)`, null);
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

  adminLogsList.innerHTML = filtered.map((log) => {
    const book = log.bookId;
    const isCompleted = book && log.pagesRead >= book.pages;

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
          </div>
        </div>
      </div>
    `;
  }).join('');
}

logCompletionFilter.addEventListener('change', loadLogs);
logSortFilter.addEventListener('change', loadLogs);
logSearchFilter.addEventListener('input', () => {
  loadLogs();
});

loadLogs();