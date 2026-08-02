const Shelf = require('../models/Shelf');
const Book = require('../models/Book');

async function verifyBooksExist(bookIds) {
  if (!bookIds || bookIds.length === 0) return;

  const books = await Book.find({ _id: { $in: bookIds } });

  if (books.length !== bookIds.length) {
    const foundIds = books.map((b) => b._id.toString());
    const missingIds = bookIds.filter((id) => !foundIds.includes(id));

    const error = new Error(`No book(s) found with id(s): ${missingIds.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
}

async function createShelf(req, res, next) {
  try {
    const { bookIds } = req.body || {};

    await verifyBooksExist(bookIds);

    const shelf = await Shelf.create(req.body);
    res.status(201).json(shelf);
  } catch (err) {
    next(err);
  }
}

async function getShelves(req, res, next) {
  try {
    const shelves = await Shelf.find().populate('bookIds', 'title authors');
    res.json({ count: shelves.length, shelves });
  } catch (err) {
    next(err);
  }
}

async function getShelfById(req, res, next) {
  try {
    const shelf = await Shelf.findById(req.params.id).populate('bookIds', 'title authors');

    if (!shelf) {
      return res.status(404).json({ error: 'Shelf not found' });
    }

    res.json(shelf);
  } catch (err) {
    next(err);
  }
}

async function updateShelf(req, res, next) {
  try {
    const existing = await Shelf.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Shelf not found' });
    }

    if (req.body.bookIds) {
      await verifyBooksExist(req.body.bookIds);
    }

    const shelf = await Shelf.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(shelf);
  } catch (err) {
    next(err);
  }
}

async function deleteShelf(req, res, next) {
  try {
    const shelf = await Shelf.findByIdAndDelete(req.params.id);

    if (!shelf) {
      return res.status(404).json({ error: 'Shelf not found' });
    }

    res.json({ message: 'Shelf deleted', shelf });
  } catch (err) {
    next(err);
  }
}

module.exports = { createShelf, getShelves, getShelfById, updateShelf, deleteShelf };