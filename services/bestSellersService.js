const NYT_BASE_URL = 'https://api.nytimes.com/svc/books/v3/lists/current';

async function getBestSellers(listName = 'hardcover-fiction') {
  const apiKey = process.env.NYT_BOOKS_API_KEY;

  if (!apiKey) {
    const error = new Error('NYT API key is not configured on the server.');
    error.statusCode = 500;
    throw error;
  }

  const url = `${NYT_BASE_URL}/${listName}.json?api-key=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = new Error(`NYT Books API request failed with status ${response.status}`);
    error.statusCode = response.status === 429 ? 429 : 502;
    throw error;
  }

  return response.json();
}

async function getAvailableLists() {
  const apiKey = process.env.NYT_BOOKS_API_KEY;

  if (!apiKey) {
    const error = new Error('NYT API key is not configured on the server.');
    error.statusCode = 500;
    throw error;
  }

  const url = `https://api.nytimes.com/svc/books/v3/lists/names.json?api-key=${apiKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = new Error(`NYT Books API request failed with status ${response.status}`);
    error.statusCode = response.status === 429 ? 429 : 502;
    throw error;
  }

  return response.json();
}

module.exports = { getBestSellers, getAvailableLists };