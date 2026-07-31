const OPEN_LIBRARY_AUTHOR_SEARCH_URL = 'https://openlibrary.org/search/authors.json';
const WIKIPEDIA_BASE_URL = 'https://LANG.wikipedia.org/api/rest_v1/page/summary';

async function searchAuthorCandidates(authorName) {
  const params = new URLSearchParams({ q: authorName });
  const response = await fetch(`${OPEN_LIBRARY_AUTHOR_SEARCH_URL}?${params.toString()}`);

  if (!response.ok) {
    const error = new Error(`Open Library author search failed with status ${response.status}`);
    error.statusCode = 502;
    throw error;
  }

  const data = await response.json();
  return data.docs || [];
}

async function getAuthorSummary(authorName, language = 'en') {
  const url = `${WIKIPEDIA_BASE_URL.replace('LANG', language)}/${encodeURIComponent(authorName)}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'ReadingTracker/1.0 (university project; contact: student@example.com)',
    },
  });

  if (response.status === 404) {
    const error = new Error(`No Wikipedia page found for "${authorName}"`);
    error.statusCode = 404;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`Wikipedia request failed with status ${response.status}`);
    error.statusCode = 502;
    throw error;
  }

  return response.json();
}

module.exports = { searchAuthorCandidates, getAuthorSummary };