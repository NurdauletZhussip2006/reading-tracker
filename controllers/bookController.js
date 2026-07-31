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
    const books = await Book.find();
    res.json({ count: books.length, books });
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