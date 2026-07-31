const listSelect = document.getElementById('listSelect');
const loadListBtn = document.getElementById('loadListBtn');
const bestSellersUpdated = document.getElementById('bestSellersUpdated');
const podium = document.getElementById('podium');
const bestSellersResults = document.getElementById('bestSellersResults');

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

async function loadBestSellers() {
  const listName = listSelect.value;

  bestSellersUpdated.textContent = '';
  podium.innerHTML = '';
  bestSellersResults.innerHTML = '';
  setStatus('bestSellersStatus', 'Loading…', 'loading');

  try {
    const data = await fetchJson(`/api/books/best-sellers?list=${encodeURIComponent(listName)}`);

    setStatus('bestSellersStatus', `${data.listName} · ${data.count} books`, null);
    bestSellersUpdated.textContent = `Updated: ${data.updated}`;

    const topThree = data.books.slice(0, 3);
    const rest = data.books.slice(3);

    podium.innerHTML = renderPodium(topThree);
    bestSellersResults.innerHTML = rest.map(renderRankRow).join('');
  } catch (err) {
    setStatus('bestSellersStatus', err.message, 'error');
  }
}

loadListBtn.addEventListener('click', loadBestSellers);

function coverOrPlaceholder(book) {
  return book.coverUrl
    ? `<img src="${book.coverUrl}" alt="${escapeHtml(book.title)}">`
    : `<img src="/images/book-cover-placeholder.png" alt="No cover available">`;
}

function renderPodium(books) {
  if (books.length === 0) return '';

  const order = [books[1], books[0], books[2]].filter(Boolean);
  const rankClasses = { 1: 'podium-first', 2: 'podium-second', 3: 'podium-third' };
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return order.map((book) => `
    <div class="podium-item ${rankClasses[book.rank] || ''}">
      <div class="podium-medal">${medals[book.rank] || ''}</div>
      <div class="podium-cover">${coverOrPlaceholder(book)}</div>
      <div class="podium-title">${escapeHtml(book.title)}</div>
      <div class="podium-author">${escapeHtml(book.author)}</div>
    </div>
  `).join('');
}

function renderRankRow(book) {
  return `
    <div class="rank-row">
      <div class="rank-number">${book.rank}</div>
      ${coverOrPlaceholder(book)}
      <div class="rank-info">
        <div class="rank-title">${escapeHtml(book.title)}</div>
        <div class="rank-author">${escapeHtml(book.author)}</div>
        <div class="rank-meta">
          ${book.weeksOnList ? `${book.weeksOnList} week(s) on list` : ''}
          ${book.amazonUrl ? ` · <a href="${book.amazonUrl}" target="_blank" rel="noopener noreferrer">More info</a>` : ''}
        </div>
      </div>
    </div>
  `;
}

loadBestSellers();