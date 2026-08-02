const ReadingLog = require('../models/ReadingLog');
const Book = require('../models/Book');

async function validateBookReference(bookId, pagesRead) {
  const book = await Book.findById(bookId);

  if (!book) {
    const error = new Error(`No book found with id ${bookId}`);
    error.statusCode = 400;
    throw error;
  }

  if (pagesRead > book.pages) {
    const error = new Error(
      `pagesRead (${pagesRead}) cannot exceed this book's total pages (${book.pages})`
    );
    error.statusCode = 400;
    throw error;
  }

  return book;
}

async function createReadingLog(req, res, next) {
  try {
    const { bookId, pagesRead } = req.body || {};

    await validateBookReference(bookId, pagesRead);

    const log = await ReadingLog.create(req.body);
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
}

async function getReadingLogs(req, res, next) {
  try {
    const logs = await ReadingLog.find().populate('bookId', 'title authors');
    res.json({ count: logs.length, logs });
  } catch (err) {
    next(err);
  }
}

async function getReadingLogById(req, res, next) {
  try {
    const log = await ReadingLog.findById(req.params.id).populate('bookId', 'title authors');

    if (!log) {
      return res.status(404).json({ error: 'Reading log not found' });
    }

    res.json(log);
  } catch (err) {
    next(err);
  }
}

async function updateReadingLog(req, res, next) {
  try {
    const existing = await ReadingLog.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Reading log not found' });
    }

    const bookId = req.body.bookId || existing.bookId;
    const pagesRead = req.body.pagesRead !== undefined ? req.body.pagesRead : existing.pagesRead;

    await validateBookReference(bookId, pagesRead);

    const log = await ReadingLog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(log);
  } catch (err) {
    next(err);
  }
}

async function deleteReadingLog(req, res, next) {
  try {
    const log = await ReadingLog.findByIdAndDelete(req.params.id);

    if (!log) {
      return res.status(404).json({ error: 'Reading log not found' });
    }

    res.json({ message: 'Reading log deleted', log });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReadingLog,
  getReadingLogs,
  getReadingLogById,
  updateReadingLog,
  deleteReadingLog,
};