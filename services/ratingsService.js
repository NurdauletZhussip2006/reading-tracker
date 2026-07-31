const OPEN_LIBRARY_BASE_URL = 'https://openlibrary.org';
const USER_AGENT = 'DigitalLibraryReadingTracker/1.0 (WT2 Assignment 2 university project by Nurdaulet Zhussip)';

async function getWorkRatings(workId) {
  const url = `${OPEN_LIBRARY_BASE_URL}${workId}/ratings.json`;

  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!response.ok) {
    const error = new Error(`Open Library ratings request failed with status ${response.status}`);
    error.statusCode = 502;
    throw error;
  }

  return response.json();
}

module.exports = { getWorkRatings };
