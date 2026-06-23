const mongoose = require('mongoose');

const ShiftLogSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Please add a log date'],
  },
  shift: {
    type: String,
    required: [true, 'Please add a shift code (A, B, or C)'],
    enum: ['A', 'B', 'C'],
  },
  name: {
    type: String,
    required: [true, 'Please add employee name'],
    trim: true,
  },
  id: {
    type: String,
    required: [true, 'Please add staff reference ID'],
    trim: true,
  },
  work_description: {
    type: String,
    required: [true, 'Please add work description'],
    trim: true,
  }
}, {
  timestamps: true
});

// Indexes for faster lookups on name (case-insensitive search)
ShiftLogSchema.index({ name: 1 });

module.exports = mongoose.model('ShiftLog', ShiftLogSchema);
