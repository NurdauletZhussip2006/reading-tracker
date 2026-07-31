const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'DigitalLibraryReadingTracker/1.0 (WT2 Assignment 2 university project by Nurdaulet Zhussip)';

async function geocodePlace(place, language = 'en') {
  const params = new URLSearchParams({
    q: place,
    format: 'jsonv2',
    limit: '1',
    'accept-language': language,
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params.toString()}`, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!response.ok) {
    const error = new Error(`Nominatim geocoding failed with status ${response.status}`);
    error.statusCode = 502;
    throw error;
  }

  const results = await response.json();
  return results[0] || null;
}

async function findLibrariesNearby(boundingBox, language = 'en') {
  const [south, north, west, east] = boundingBox;

  const params = new URLSearchParams({
    q: 'library',
    format: 'jsonv2',
    limit: '15',
    'accept-language': language,
    viewbox: `${west},${north},${east},${south}`,
    bounded: '1',
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params.toString()}`, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!response.ok) {
    const error = new Error(`Nominatim library search failed with status ${response.status}`);
    error.statusCode = 502;
    throw error;
  }

  return response.json();
}

module.exports = { geocodePlace, findLibrariesNearby };