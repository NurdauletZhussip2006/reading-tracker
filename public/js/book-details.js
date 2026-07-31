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

function getWorkIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function loadBookDetails() {
  const workId = getWorkIdFromUrl();
  const content = document.getElementById('bookDetailsContent');

  if (!workId) {
    setStatus('bookDetailsStatus', 'No book selected.', 'error');
    return;
  }

  setStatus('bookDetailsStatus', 'Loading…', 'loading');

  try {
    const book = await fetchJson(`/api/books/${encodeURIComponent(workId)}`);
    setStatus('bookDetailsStatus', '', null);
    content.innerHTML = renderBookDetails(book);
  } catch (err) {
    setStatus('bookDetailsStatus', err.message, 'error');
  }
}

function renderBookDetails(book) {
  const ratingHtml = book.rating
    ? `<div class="detail-rating">⭐ ${book.rating.average.toFixed(1)} <span>(${book.rating.count} ratings)</span></div>`
    : `<div class="detail-rating detail-rating-none">No ratings yet</div>`;

  const subjectsHtml = (book.subjects || [])
    .map((s) => `<span class="subject-tag">${escapeHtml(s)}</span>`)
    .join('');

  const authorHtml = book.author
    ? `
      <div class="author-card">
        ${book.author.thumbnailUrl ? `<img src="${book.author.thumbnailUrl}" alt="${escapeHtml(book.author.name)}">` : ''}
        <div>
          <h3>${escapeHtml(book.author.name)}</h3>
          ${book.author.extract ? `<p class="author-extract">${escapeHtml(book.author.extract)}</p>` : ''}
          ${book.author.wikipediaUrl ? `<a href="${book.author.wikipediaUrl}" target="_blank" rel="noopener noreferrer">Read more on Wikipedia</a>` : ''}
        </div>
      </div>
    `
    : '';

  return `
    <div class="detail-header">
      <img src="${book.coverUrl || '/images/book-cover-placeholder.png'}" alt="${escapeHtml(book.title)}" class="detail-cover">
        <div class="detail-header-info">
          <h1>${escapeHtml(book.title)}</h1>
          ${ratingHtml}
          <div class="subject-tags">${subjectsHtml}</div>
          <a href="https://openlibrary.org${book.id}" target="_blank" rel="noopener noreferrer" class="detail-source-link">View on Open Library</a>
        </div>
    </div>

    ${book.description ? `<p class="detail-description">${escapeHtml(book.description)}</p>` : ''}

    ${authorHtml}
  `;
}

loadBookDetails();