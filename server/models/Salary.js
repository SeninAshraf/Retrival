const mongoose = require('mongoose');

const SalarySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  month: {
    type: String, // format YYYY-MM (e.g. 2026-06)
    required: true
  },
  baseSalary: {
    type: Number,
    required: true
  },
  bonus: {
    type: Number,
    default: 0
  },
  deductions: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Paid'],
    default: 'Unpaid'
  },
  paymentDate: {
    type: Date
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Ensure a single salary record per employee per month
SalarySchema.index({ employee: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Salary', SalarySchema);
