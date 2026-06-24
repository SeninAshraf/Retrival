const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add announcement title'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Please add announcement content'],
    trim: true
  },
  target: {
    type: String,
    enum: ['All', 'Department'],
    default: 'All'
  },
  department: {
    type: String,
    trim: true
  },
  createdBy: {
    type: String,
    default: 'Admin'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Announcement', AnnouncementSchema);
