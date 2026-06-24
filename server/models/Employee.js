const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const EmployeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fullName: {
    type: String,
    required: [true, 'Please add employee name'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  mobileNumber: {
    type: String,
    required: [true, 'Please add employee mobile number'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Please add department'],
    trim: true
  },
  designation: {
    type: String,
    required: [true, 'Please add designation'],
    trim: true
  },
  monthlySalary: {
    type: Number,
    required: [true, 'Please add monthly salary']
  },
  password: {
    type: String,
    required: [true, 'Please add password']
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  joiningDate: {
    type: Date,
    required: [true, 'Please add joining date']
  },
  profilePhoto: {
    type: String // base64 representation or URL
  },
  companyNotes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Encrypt password using bcrypt before saving
EmployeeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
EmployeeSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Employee', EmployeeSchema);
