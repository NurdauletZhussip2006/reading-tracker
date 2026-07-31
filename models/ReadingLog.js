const mongoose = require('mongoose');

const readingLogSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReadingLog', readingLogSchema);