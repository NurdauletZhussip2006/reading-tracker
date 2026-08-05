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

    const review = await Review.create({ ...req.body, userId: req.user.id });
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
}

async function getReviews(req, res, next) {
  try {
    const { rating, sort, page, limit } = req.query;
    const filter = {};

    if (rating !== undefined) {
      filter.rating = Number(rating);
    }

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    let query = Review.find(filter).populate('bookId', 'title authors');

    if (sort) {
      const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
      const sortOrder = sort.startsWith('-') ? -1 : 1;
      query = query.sort({ [sortField]: sortOrder });
    }

    const [reviews, total] = await Promise.all([
      query.skip(skip).limit(limitNum),
      Review.countDocuments(filter),
    ]);

    res.json({
      count: reviews.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      reviews,
    });
  } catch (err) {
    next(err);
  }
}

async function getMyReviews(req, res, next) {
  try {
    const reviews = await Review.find({ userId: req.user.id })
      .populate('bookId', 'title authors')
      .sort('-createdAt');
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

    if (existing.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own reviews.' });
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
    const existing = await Review.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const isOwner = existing.userId.toString() === req.user.id;
    const isLibrarian = req.user.role === 'librarian';

    if (!isOwner && !isLibrarian) {
      return res.status(403).json({ error: 'You can only delete your own reviews.' });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted', review: existing });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReview,
  getReviews,
  getMyReviews,
  getReviewById,
  updateReview,
  deleteReview,
};
