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

    const log = await ReadingLog.create({ ...req.body, userId: req.user.id });
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
}

async function getReadingLogs(req, res, next) {
  try {
    const { completion, sort, page, limit, fields, startDate, endDate, genre, userId } = req.query;

    const filter = {};
    if (genre) filter.genre = genre;
    if (userId) filter.userId = userId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    let query = ReadingLog.find(filter).populate('bookId', 'title authors pages');

    if (fields) {
      const selectedFields = fields.split(',').map((f) => f.trim()).join(' ');
      query = query.select(selectedFields);
    }

    if (sort) {
      const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
      const sortOrder = sort.startsWith('-') ? -1 : 1;
      query = query.sort({ [sortField]: sortOrder });
    }

    let logs = await query;

    if (completion !== undefined) {
      const wantCompleted = completion === 'true';
      logs = logs.filter((log) => {
        if (!log.bookId) return false;
        const isCompleted = log.pagesRead >= log.bookId.pages;
        return isCompleted === wantCompleted;
      });
    }

    const total = logs.length;
    const paginated = logs.slice(skip, skip + limitNum);

    res.json({
      count: paginated.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      logs: paginated,
    });
  } catch (err) {
    next(err);
  }
}

async function getMyReadingLogs(req, res, next) {
  try {
    const logs = await ReadingLog.find({ userId: req.user.id })
      .populate('bookId', 'title authors pages')
      .sort('-date');
    res.json({ count: logs.length, logs });
  } catch (err) {
    next(err);
  }
}
async function exportMyData(req, res, next) {
  try {
    const logs = await ReadingLog.find({ userId: req.user.id }).populate('bookId', 'title authors');
    const format = req.query.format === 'csv' ? 'csv' : 'json';

    if (format === 'json') {
      return res.json({ exportedAt: new Date(), count: logs.length, logs });
    }

    const header = 'date,book,pagesRead,minutes,genre,rating,completionPercent\n';
    const rows = logs.map((l) =>
      [
        l.date.toISOString().slice(0, 10),
        l.bookId ? `"${l.bookId.title.replace(/"/g, '""')}"` : '',
        l.pagesRead,
        l.minutes,
        l.genre || '',
        l.rating ?? '',
        l.completionPercent ?? '',
      ].join(',')
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="my-reading-data.csv"');
    res.send(header + rows.join('\n'));
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

    if (existing.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own reading logs.' });
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
    const existing = await ReadingLog.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Reading log not found' });
    }

    if (existing.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own reading logs.' });
    }

    await ReadingLog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Reading log deleted', log: existing });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReadingLog,
  getReadingLogs,
  getMyReadingLogs,
  exportMyData,
  getReadingLogById,
  updateReadingLog,
  deleteReadingLog,
};
