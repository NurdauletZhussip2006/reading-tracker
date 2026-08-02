const Book = require('../models/Book');

async function createBook(req, res, next) {
  try {
    const book = await Book.create(req.body);
    res.status(201).json(book);
  } catch (err) {
    next(err);
  }
}

async function getBooks(req, res, next) {
  try {
    const { author, genre, sort, page, limit } = req.query;
    const filter = {};

    if (author) {
      filter.authors = { $regex: author, $options: 'i' };
    }

    if (genre) {
      filter.genres = { $regex: genre, $options: 'i' };
    }

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    let query = Book.find(filter);

    if (sort) {
      const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
      const sortOrder = sort.startsWith('-') ? -1 : 1;
      query = query.sort({ [sortField]: sortOrder });
    }

    const [books, total] = await Promise.all([
      query.skip(skip).limit(limitNum),
      Book.countDocuments(filter),
    ]);

    res.json({
      count: books.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      books,
    });
  } catch (err) {
    next(err);
  }
}

async function getBookById(req, res, next) {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(book);
  } catch (err) {
    next(err);
  }
}

async function updateBook(req, res, next) {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(book);
  } catch (err) {
    next(err);
  }
}

async function deleteBook(req, res, next) {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ message: 'Book deleted', book });
  } catch (err) {
    next(err);
  }
}

module.exports = { createBook, getBooks, getBookById, updateBook, deleteBook };