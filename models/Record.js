const mongoose = require('mongoose');

const RecordSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      enum: { values: ['Income', 'Expense'], message: 'Type must be Income or Expense' },
      required: [true, 'Type is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      maxlength: [250, 'Description cannot exceed 250 characters'],
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

//Compound index for faster dashboard queries
RecordSchema.index({ type: 1, date: -1 });
RecordSchema.index({ isDeleted: 1, date: -1 });
RecordSchema.index({ category: 1, isDeleted: 1 });

module.exports = mongoose.model('Record', RecordSchema);