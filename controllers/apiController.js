const bookService = require('../services/bookService');
const coverService = require('../services/coverService');
const authorService = require('../services/authorService');
const dictionaryService = require('../services/dictionaryService');
const libraryService = require('../services/libraryService');
const ratingsService = require('../services/ratingsService');
const bestSellersService = require('../services/bestSellersService');
const { SUPPORTED_LANGUAGES } = require('../config/constants');

async function searchBooks(req, res, next) {
  const { q, lang } = req.query;

  if (!q || q.trim() === '') {
    return res.status(400).json({
      error: 'A search query is required. Use ?q=your+search+term',
    });
  }

  try {
    const rawResults = await bookService.searchBooks(q.trim(), lang);

    const books = rawResults.docs.map(normalizeBook);

    res.json({
      query: q,
      count: books.length,
      books,
    });
  } catch (err) {
    next(err);
  }
}
function normalizeBook(doc) {
  return {
    id: doc.key,
    title: doc.title || 'Untitled',
    authors: doc.author_name || ['Unknown author'],
    firstPublishYear: doc.first_publish_year || null,
    isbn: doc.isbn ? doc.isbn[0] : null,
    coverUrl: coverService.getCoverUrlById(doc.cover_i, 'M'),
    editionCount: doc.edition_count || 0,
  };
}

async function searchAuthors(req, res, next) {
  const { name } = req.query;

  if (!name || name.trim() === '') {
    return res.status(400).json({
      error: 'An author name is required. Use ?name=Author+Name',
    });
  }

  try {
    const candidates = await authorService.searchAuthorCandidates(name.trim());

    if (candidates.length === 0) {
      return res.status(404).json({
        error: `"${name}" doesn't match any known author.`,
        name,
      });
    }

    const normalized = candidates.slice(0, 8).map((c) => ({
      name: c.name,
      birthDate: c.birth_date || null,
      topWork: c.top_work || null,
      workCount: c.work_count || 0,
    }));

    res.json({ query: name, count: normalized.length, authors: normalized });
  } catch (err) {
    next(err);
  }
}
async function getAuthorBio(req, res, next) {
  const { name, lang } = req.query;
  const language = lang || 'en';

  if (!name || name.trim() === '') {
    return res.status(400).json({
      error: 'An author name is required. Use ?name=Author+Name',
    });
  }

  const isSupportedLanguage = SUPPORTED_LANGUAGES.some((l) => l.code === language);
  if (!isSupportedLanguage) {
    return res.status(400).json({
      error: `Unsupported language code "${language}". Supported: ${SUPPORTED_LANGUAGES.map((l) => l.code).join(', ')}`,
    });
  }

  try {
    const summary = await authorService.getAuthorSummary(name.trim(), language);
    res.json(normalizeAuthor(summary, language));
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({
        error: `No biography found for "${name}" in this language.`,
        name,
        language,
      });
    }
    next(err);
  }
}
function normalizeAuthor(summary, language) {
  return {
    name: summary.title,
    extract: summary.extract || 'No summary available.',
    thumbnailUrl: summary.thumbnail ? summary.thumbnail.source : null,
    wikipediaUrl: summary.content_urls ? summary.content_urls.desktop.page : null,
    language,
  };
}

async function lookupWord(req, res, next) {
  const { word, lang } = req.query;
  const language = lang || 'en';

  if (!word || word.trim() === '') {
    return res.status(400).json({
      error: 'A word is required. Use ?word=example',
    });
  }

  const isSupportedLanguage = SUPPORTED_LANGUAGES.some((l) => l.code === language);
  if (!isSupportedLanguage) {
    return res.status(400).json({
      error: `Unsupported language code "${language}". Supported: ${SUPPORTED_LANGUAGES.map((l) => l.code).join(', ')}`,
    });
  }

  try {
    const rawData = await dictionaryService.lookupWord(word.trim(), language);
    const normalized = normalizeDictionaryEntries(rawData, language);

    if (normalized.meanings.length === 0) {
      return res.status(404).json({
        error: `No definition found for "${word}" in this language.`,
        word,
        language,
      });
    }

    res.json(normalized);
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({
        error: `No definition found for "${word}" in this language.`,
        word,
        language,
      });
    }
    next(err);
  }
}
function normalizeDictionaryEntries(rawData, language) {
  const word = rawData.word;

  const phonetic = rawData.entries
    .flatMap((entry) => entry.pronunciations || [])
    .find((p) => p.text)?.text || null;

  const meanings = rawData.entries.map((entry) => ({
    partOfSpeech: entry.partOfSpeech || 'unknown',
    definitions: (entry.senses || []).slice(0, 3).map((sense) => ({
      definition: sense.definition,
      example: getCleanExample(sense.examples),
    })),
  }));

  return { word, language, phonetic, meanings };
}

function getCleanExample(examples) {
  if (!examples || examples.length === 0) return null;

  const looksLikeRelationLabel = (text) => /^[A-ZА-Яa-zа-я]+:\s/.test(text);

  const validExample = examples.find((ex) => !looksLikeRelationLabel(ex));
  return validExample || null;
}

async function findLibraries(req, res, next) {
  const { place, lang } = req.query;
  const language = lang || 'en';

  if (!place || place.trim() === '') {
    return res.status(400).json({
      error: 'A place name is required. Use ?place=Astana',
    });
  }

  const isSupportedLanguage = SUPPORTED_LANGUAGES.some((l) => l.code === language);
  if (!isSupportedLanguage) {
    return res.status(400).json({
      error: `Unsupported language code "${language}". Supported: ${SUPPORTED_LANGUAGES.map((l) => l.code).join(', ')}`,
    });
  }

  try {
    const geocoded = await libraryService.geocodePlace(place.trim(), language);

    if (!geocoded) {
      return res.status(404).json({
        error: `Could not find a location matching "${place}".`,
        place,
      });
    }

    const boundingBox = geocoded.boundingbox.map(Number);
    const rawResults = await libraryService.findLibrariesNearby(boundingBox, language);
    const libraries = rawResults.map(normalizeLibrary);

    if (libraries.length === 0) {
      return res.status(404).json({
        error: `No libraries found near "${place}".`,
        place,
      });
    }

    res.json({
      place,
      resolvedLocation: geocoded.display_name,
      language,
      count: libraries.length,
      libraries,
    });
  } catch (err) {
    next(err);
  }
}
function normalizeLibrary(result) {
  return {
    name: result.name || result.display_name.split(',')[0],
    address: result.display_name,
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon),
  };
}

async function getBookDetails(req, res, next) {
  const { id } = req.params;
  const { lang } = req.query;
  const language = lang || 'en';
  const workId = `/works/${id}`;

  try {
    const [workData, ratingsData] = await Promise.all([
      bookService.getWork(workId),
      ratingsService.getWorkRatings(workId).catch(() => null),
    ]);

    const authorName = workData.authors && workData.authors[0] && workData.authors[0].author
      ? await resolveAuthorName(workData.authors[0].author.key)
      : null;

    const authorBio = authorName
      ? await authorService.getAuthorSummary(authorName, language).catch(() => null)
      : null;

    res.json({
      id: workId,
      title: workData.title,
      description: normalizeDescription(workData.description),
      coverUrl: coverService.getCoverUrlById(workData.covers ? workData.covers[0] : null, 'L'),
      subjects: (workData.subjects || []).slice(0, 8),
      rating: ratingsData
        ? {
            average: ratingsData.summary.average,
            count: ratingsData.summary.count,
          }
        : null,
      author: authorBio
        ? {
            name: authorBio.title,
            extract: authorBio.extract,
            thumbnailUrl: authorBio.thumbnail ? authorBio.thumbnail.source : null,
            wikipediaUrl: authorBio.content_urls ? authorBio.content_urls.desktop.page : null,
          }
        : (authorName ? { name: authorName, extract: null, thumbnailUrl: null, wikipediaUrl: null } : null),
    });
  } catch (err) {
    next(err);
  }
}

async function resolveAuthorName(authorKey) {
  try {
    const response = await fetch(`https://openlibrary.org${authorKey}.json`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.name || null;
  } catch {
    return null;
  }
}

function normalizeDescription(description) {
  if (!description) return null;
  return typeof description === 'string' ? description : description.value;
}

async function getBestSellers(req, res, next) {
  const { list } = req.query;
  const listName = list || 'hardcover-fiction';

  try {
    const rawData = await bestSellersService.getBestSellers(listName);

    if (!rawData.results || !rawData.results.books) {
      return res.status(400).json({
        error: `"${listName}" is not a recognized NYT list name.`,
        listName,
      });
    }

    const books = rawData.results.books.map(normalizeBestSeller);

    res.json({
      listName: rawData.results.list_name,
      updated: rawData.results.updated,
      count: books.length,
      books,
    });
  } catch (err) {
    next(err);
  }
}
function normalizeBestSeller(book) {
  return {
    rank: book.rank,
    title: book.title,
    author: book.author,
    description: book.description || null,
    coverUrl: book.book_image || null,
    amazonUrl: book.amazon_product_url || null,
    weeksOnList: book.weeks_on_list,
  };
}
module.exports = { searchBooks, searchAuthors, getAuthorBio, lookupWord, findLibraries, getBookDetails, getBestSellers };