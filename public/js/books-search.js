const bookSearchForm = document.getElementById('bookSearchForm');
const bookSearchInput = document.getElementById('bookSearchInput');
const bookSearchResults = document.getElementById('bookSearchResults');

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
    error.statusCode = response.status;
    throw error;
  }

  return data;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

bookSearchForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const query = bookSearchInput.value.trim();
  if (!query) return;

  bookSearchResults.innerHTML = '';
  setStatus('bookSearchStatus', 'Searching…', 'loading');

  try {
    const data = await fetchJson(`/api/books/search?q=${encodeURIComponent(query)}`);

    if (data.books.length === 0) {
      setStatus('bookSearchStatus', 'No books found. Try a different search.', 'empty');
      return;
    }

    setStatus('bookSearchStatus', `Found ${data.count} book(s)`, null);
    bookSearchResults.innerHTML = data.books.map(renderBookRow).join('');
  } catch (err) {
    setStatus('bookSearchStatus', err.message, 'error');
  }
});

function renderBookRow(book) {
  const coverHtml = book.coverUrl
    ? `<img src="${book.coverUrl}" alt="${escapeHtml(book.title)}">`
    : `<img src="/images/book-cover-placeholder.png" alt="No cover available" class="book-row-placeholder-img">`;

  const bareId = book.id.replace('/works/', '');

  return `
    <a href="/search/books/details?id=${encodeURIComponent(bareId)}" class="book-row">
      ${coverHtml}
      <div class="book-row-info">
        <div class="book-row-title">${escapeHtml(book.title)}</div>
        <div class="book-row-author">${escapeHtml(book.authors.join(', '))}</div>
        <div class="book-row-meta">
          ${book.firstPublishYear ? `Year: ${book.firstPublishYear}` : ''}
          ${book.editionCount ? ` · ${book.editionCount} edition(s)` : ''}
        </div>
      </div>
    </a>
  `;
}