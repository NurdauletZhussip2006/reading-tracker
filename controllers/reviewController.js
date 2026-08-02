const Review = require('../models/Review');
const Book = require('../models/Book');

async function verifyBookExists(bookId) {
  const book = await Book.findById(bookId);

  if (!book) {
    const error = new Error(`No book found with id ${bookId}`);
    error.statusCode = 400;
    throw error;
  }

  return book;
}

async function createReview(req, res, next) {
  try {
    const { bookId } = req.body || {};

    await verifyBookExists(bookId);

    const review = await Review.create(req.body);
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
}

async function getReviews(req, res, next) {
  try {
    const reviews = await Review.find().populate('bookId', 'title authors');
    res.json({ count: reviews.length, reviews });
  } catch (err) {
    next(err);
  }
}

async function getReviewById(req, res, next) {
  try {
    const review = await Review.findById(req.params.id).populate('bookId', 'title authors');

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(review);
  } catch (err) {
    next(err);
  }
}

async function updateReview(req, res, next) {
  try {
    const existing = await Review.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (req.body.bookId) {
      await verifyBookExists(req.body.bookId);
    }

    const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(review);
  } catch (err) {
    next(err);
  }
}

async function deleteReview(req, res, next) {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ message: 'Review deleted', review });
  } catch (err) {
    next(err);
  }
}

module.exports = { createReview, getReviews, getReviewById, updateReview, deleteReview };