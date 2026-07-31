const COVERS_BASE_URL = 'https://covers.openlibrary.org/b';

function getCoverUrlById(coverId, size = 'M') {
  if (!coverId) return null;
  return `${COVERS_BASE_URL}/id/${coverId}-${size}.jpg`;
}

function getCoverUrlByIsbn(isbn, size = 'M') {
  if (!isbn) return null;
  return `${COVERS_BASE_URL}/isbn/${isbn}-${size}.jpg`;
}

module.exports = { getCoverUrlById, getCoverUrlByIsbn };