const languageSelect = document.getElementById('languageSelect');
const dictionaryForm = document.getElementById('dictionaryForm');
const dictionaryInput = document.getElementById('dictionaryInput');
const dictionaryResult = document.getElementById('dictionaryResult');

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

dictionaryForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const word = dictionaryInput.value.trim();
  if (!word) return;

  dictionaryResult.innerHTML = '';
  setStatus('dictionaryStatus', 'Looking up…', 'loading');

  try {
    const lang = getSelectedLanguage();
    const data = await fetchJson(`/api/dictionary?word=${encodeURIComponent(word)}&lang=${lang}`);
    setStatus('dictionaryStatus', '', null);
    dictionaryResult.innerHTML = renderDictionaryEntry(data);
  } catch (err) {
    if (err.statusCode === 404) {
      setStatus('dictionaryStatus', `No definition found for "${word}" in this language.`, 'empty');
    } else {
      setStatus('dictionaryStatus', err.message, 'error');
    }
  }
});

function renderDictionaryEntry(entry) {
  const phoneticHtml = entry.phonetic
    ? `<span class="word-phonetic">${escapeHtml(entry.phonetic)}</span>`
    : '';

  const meaningsHtml = entry.meanings.map((meaning) => `
    <div class="dictionary-entry">
      <span class="part-of-speech">${escapeHtml(meaning.partOfSpeech)}</span>
      ${meaning.definitions.map((def) => `
        <div class="definition-item">
          ${escapeHtml(def.definition)}
          ${def.example ? `<div class="definition-example">"${escapeHtml(def.example)}"</div>` : ''}
        </div>
      `).join('')}
    </div>
  `).join('');

  return `
    <div class="dictionary-card">
      <h3>${escapeHtml(entry.word)} ${phoneticHtml}</h3>
      ${meaningsHtml}
    </div>
  `;
}