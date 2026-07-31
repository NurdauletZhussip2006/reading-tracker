const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    isbn: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    authors: {
      type: [String],
      required: [true, 'At least one author is required'],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'At least one author is required',
      },
    },
    genres: {
      type: [String],
      default: [],
    },
    pages: {
      type: Number,
      required: [true, 'Page count is required'],
      min: [1, 'Pages must be at least 1'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);