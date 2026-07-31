const OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';
const LANGUAGE_CODE_MAP = {
  en: 'eng',
  ru: 'rus',
  fr: 'fre',
  de: 'ger',
  es: 'spa',
  kk: 'kaz',
};
async function searchBooks(query, language) {
  const params = new URLSearchParams({
    q: query,
    limit: '100',
  });

  if (language && LANGUAGE_CODE_MAP[language]) {
    params.set('language', LANGUAGE_CODE_MAP[language]);
  }

  const url = `${OPEN_LIBRARY_SEARCH_URL}?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = new Error(`Open Library request failed with status ${response.status}`);
    error.statusCode = 502;
    throw error;
  }

  return response.json();
}
async function getWork(workId) {
  const url = `https://openlibrary.org${workId}.json`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = new Error(`Open Library work request failed with status ${response.status}`);
    error.statusCode = response.status === 404 ? 404 : 502;
    throw error;
  }

  return response.json();
}

module.exports = { searchBooks, getWork };