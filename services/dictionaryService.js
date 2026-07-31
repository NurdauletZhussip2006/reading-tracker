const DICTIONARY_BASE_URL = 'https://freedictionaryapi.com/api/v1/entries';

async function lookupWord(word, language = 'en') {
  const url = `${DICTIONARY_BASE_URL}/${language}/${encodeURIComponent(word)}`;

  const response = await fetch(url);

  if (response.status === 404) {
    const error = new Error(`No definition found for "${word}"`);
    error.statusCode = 404;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`Dictionary request failed with status ${response.status}`);
    error.statusCode = 502;
    throw error;
  }

  return response.json();
}

module.exports = { lookupWord };