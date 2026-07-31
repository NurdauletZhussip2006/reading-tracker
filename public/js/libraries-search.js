const libraryForm = document.getElementById('libraryForm');
const libraryInput = document.getElementById('libraryInput');
const libraryResolvedLocation = document.getElementById('libraryResolvedLocation');
const libraryResults = document.getElementById('libraryResults');

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

libraryForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const place = libraryInput.value.trim();
  if (!place) return;

  libraryResolvedLocation.innerHTML = '';
  libraryResults.innerHTML = '';
  setStatus('libraryStatus', 'Searching…', 'loading');

  try {
    const data = await fetchJson(`/api/libraries?place=${encodeURIComponent(place)}`);

    setStatus('libraryStatus', `Found ${data.count} librar${data.count === 1 ? 'y' : 'ies'}`, null);
    libraryResolvedLocation.textContent = `📍 ${data.resolvedLocation}`;
    libraryResults.innerHTML = data.libraries.map(renderLibraryItem).join('');
  } catch (err) {
    if (err.statusCode === 404) {
      setStatus('libraryStatus', err.message, 'empty');
    } else {
      setStatus('libraryStatus', err.message, 'error');
    }
  }
});

function renderLibraryItem(library) {
  const mapsUrl = `https://www.openstreetmap.org/?mlat=${library.latitude}&mlon=${library.longitude}#map=17/${library.latitude}/${library.longitude}`;

  return `
    <div class="library-item">
      <div class="library-name">${escapeHtml(library.name)}</div>
      <div class="library-address">${escapeHtml(library.address)}</div>
      <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="library-map-link">View on map</a>
    </div>
  `;
}