const mongoose = require('mongoose');

const readingLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A user reference is required'],
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'A book reference is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    pagesRead: {
      type: Number,
      required: [true, 'Pages read is required'],
      min: [0, 'Pages read cannot be negative'],
    },
    minutes: {
      type: Number,
      required: [true, 'Minutes is required'],
      min: [1, 'Minutes must be at least 1'],
    },
    genre: {
      type: String,
      default: null,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: null,
    },
    completionPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
  },
  { timestamps: true }
);

readingLogSchema.index({ userId: 1 });
readingLogSchema.index({ date: 1 });
readingLogSchema.index({ bookId: 1 });
readingLogSchema.index({ genre: 1 });

module.exports = mongoose.model('ReadingLog', readingLogSchema);