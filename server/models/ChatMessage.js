const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['admin', 'employee'],
    required: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  readByAdmin: {
    type: Boolean,
    default: function() {
      return this.sender === 'admin';
    }
  },
  readByEmployee: {
    type: Boolean,
    default: function() {
      return this.sender === 'employee';
    }
  }
}, {
  timestamps: true
});

ChatMessageSchema.index({ employee: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
