const languageSelect = document.getElementById('languageSelect');
const authorSearchForm = document.getElementById('authorSearchForm');
const authorSearchInput = document.getElementById('authorSearchInput');
const authorCandidates = document.getElementById('authorCandidates');
const authorBio = document.getElementById('authorBio');

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

authorSearchForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = authorSearchInput.value.trim();
  if (!name) return;

  authorCandidates.innerHTML = '';
  authorBio.innerHTML = '';
  setStatus('authorBioStatus', '', null);
  setStatus('authorSearchStatus', 'Searching…', 'loading');

  try {
    const data = await fetchJson(`/api/authors/search?name=${encodeURIComponent(name)}`);
    setStatus('authorSearchStatus', `Found ${data.count} match(es) — pick one:`, null);
    authorCandidates.innerHTML = data.authors.map(renderCandidate).join('');
  } catch (err) {
    if (err.statusCode === 404) {
      setStatus('authorSearchStatus', `"${name}" doesn't match any known author.`, 'empty');
    } else {
      setStatus('authorSearchStatus', err.message, 'error');
    }
  }
});

function renderCandidate(author) {
  const meta = [
    author.birthDate ? `Born ${author.birthDate}` : null,
    author.topWork ? `Known for "${author.topWork}"` : null,
    author.workCount ? `${author.workCount} work(s)` : null,
  ].filter(Boolean).join(' · ');

  return `
    <button class="candidate-item" data-author-name="${escapeHtml(author.name)}">
      <div class="candidate-name">${escapeHtml(author.name)}</div>
      ${meta ? `<div class="candidate-meta">${escapeHtml(meta)}</div>` : ''}
    </button>
  `;
}

authorCandidates.addEventListener('click', async (event) => {
  const button = event.target.closest('.candidate-item');
  if (!button) return;

  const name = button.dataset.authorName;
  authorBio.innerHTML = '';
  setStatus('authorBioStatus', 'Loading biography…', 'loading');

  try {
    const lang = getSelectedLanguage();
    const data = await fetchJson(`/api/authors/bio?name=${encodeURIComponent(name)}&lang=${lang}`);
    setStatus('authorBioStatus', '', null);
    authorBio.innerHTML = renderBio(data);
  } catch (err) {
    if (err.statusCode === 404) {
      setStatus('authorBioStatus', `No biography found for "${name}" in this language.`, 'empty');
    } else {
      setStatus('authorBioStatus', err.message, 'error');
    }
  }
});

function renderBio(author) {
  const imageHtml = author.thumbnailUrl
    ? `<img src="${author.thumbnailUrl}" alt="${escapeHtml(author.name)}">`
    : '';

  return `
    <div class="author-card">
      ${imageHtml}
      <div>
        <h3>${escapeHtml(author.name)}</h3>
        <p class="author-extract">${escapeHtml(author.extract)}</p>
        ${author.wikipediaUrl ? `<a href="${author.wikipediaUrl}" target="_blank" rel="noopener noreferrer">Read more on Wikipedia</a>` : ''}
      </div>
    </div>
  `;
}