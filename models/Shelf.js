const mongoose = require('mongoose');

const shelfSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shelf name is required'],
      trim: true,
    },
    bookIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Book',
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shelf', shelfSchema);