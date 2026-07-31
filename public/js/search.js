const languageSelect = document.getElementById('languageSelect');

function getSelectedLanguage() {
  return languageSelect.value;
}

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

const bookSearchForm = document.getElementById('bookSearchForm');
const bookSearchInput = document.getElementById('bookSearchInput');
const bookSearchResults = document.getElementById('bookSearchResults');

bookSearchForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const query = bookSearchInput.value.trim();
  if (!query) return;

  bookSearchResults.innerHTML = '';
  setStatus('bookSearchStatus', 'Searching…', 'loading');

  try {
    const lang = getSelectedLanguage();
    const data = await fetchJson(`/api/books/search?q=${encodeURIComponent(query)}&lang=${lang}`);

    if (data.books.length === 0) {
      setStatus('bookSearchStatus', 'No books found. Try a different search.', 'empty');
      return;
    }

    setStatus('bookSearchStatus', `Found ${data.count} book(s)`, null);
    bookSearchResults.innerHTML = data.books.map(renderBookCard).join('');
  } catch (err) {
    setStatus('bookSearchStatus', err.message, 'error');
  }
});

function renderBookCard(book) {
  const coverHtml = book.coverUrl
    ? `<img src="${book.coverUrl}" alt="${escapeHtml(book.title)}">`
    : `<div class="book-card-placeholder">📕</div>`;

  return `
    <div class="book-card">
      ${coverHtml}
      <div class="book-title">${escapeHtml(book.title)}</div>
      <div class="book-author">${escapeHtml(book.authors[0] || 'Unknown')}</div>
    </div>
  `;
}

const authorForm = document.getElementById('authorForm');
const authorInput = document.getElementById('authorInput');
const authorResult = document.getElementById('authorResult');

authorForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = authorInput.value.trim();
  if (!name) return;

  authorResult.innerHTML = '';
  setStatus('authorStatus', 'Looking up…', 'loading');

  try {
    const lang = getSelectedLanguage();
    const data = await fetchJson(`/api/authors?name=${encodeURIComponent(name)}&lang=${lang}`);

    setStatus('authorStatus', '', null);
    authorResult.innerHTML = renderAuthorCard(data);
  } catch (err) {
    if (err.statusCode === 404) {
      setStatus('authorStatus', `No information found for "${name}" in this language.`, 'empty');
    } else {
      setStatus('authorStatus', err.message, 'error');
    }
  }
});

function renderAuthorCard(author) {
  const imageHtml = author.thumbnailUrl
    ? `<img src="${author.thumbnailUrl}" alt="${escapeHtml(author.name)}">`
    : `<div class="book-card-placeholder">✍️</div>`;

  return `
    <div class="author-card">
      ${imageHtml}
      <div>
        <h3>${escapeHtml(author.name)}</h3>
        <p class="author-extract">${escapeHtml(author.extract)}</p>
        ${author.wikipediaUrl ? `<a href="${author.wikipediaUrl}" target="_blank" rel="noopener noreferrer">Read more on Wikipedia →</a>` : ''}
      </div>
    </div>
  `;
}