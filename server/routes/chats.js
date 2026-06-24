const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const Employee = require('../models/Employee');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// @desc    Get chat messages in a thread
// @route   GET /api/chats/thread/:employeeId
// @access  Private
router.get('/thread/:employeeId', protect, async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (req.user.role === 'employee' && req.user.id !== employeeId) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only access your own chat.' });
    }

    const messages = await ChatMessage.find({ employee: employeeId }).sort({ createdAt: 1 });

    res.json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error retrieving chat history' });
  }
});

// @desc    Send a message
// @route   POST /api/chats/message
// @access  Private
router.post('/message', protect, async (req, res) => {
  try {
    const { employee, content } = req.body;

    if (!employee || !content) {
      return res.status(400).json({ success: false, message: 'Please provide employee ID and content' });
    }

    if (req.user.role === 'employee' && req.user.id !== employee) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only send messages in your own thread.' });
    }

    const message = await ChatMessage.create({
      sender: req.user.role,
      employee,
      content,
      readByAdmin: req.user.role === 'admin',
      readByEmployee: req.user.role === 'employee'
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error sending message' });
  }
});

// @desc    Get all chat threads with unread counts (Admin only)
// @route   GET /api/chats/threads
// @access  Private/Admin
router.get('/threads', protect, adminOnly, async (req, res) => {
  try {
    const employees = await Employee.find({ status: 'Active' }).select('fullName employeeId department designation profilePhoto');

    const threads = [];

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];

      const lastMessage = await ChatMessage.findOne({ employee: emp._id }).sort({ createdAt: -1 });
      const unreadCount = await ChatMessage.countDocuments({ 
        employee: emp._id, 
        sender: 'employee', 
        readByAdmin: false 
      });

      threads.push({
        employee: emp,
        lastMessage,
        unreadCount
      });
    }

    threads.sort((a, b) => {
      if (a.unreadCount !== b.unreadCount) {
        return b.unreadCount - a.unreadCount;
      }
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    res.json({ success: true, data: threads });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error retrieving chat threads' });
  }
});

// @desc    Mark messages in a thread as read
// @route   POST /api/chats/read
// @access  Private
router.post('/read', protect, async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Please provide employeeId' });
    }

    if (req.user.role === 'employee' && req.user.id !== employeeId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (req.user.role === 'admin') {
      await ChatMessage.updateMany(
        { employee: employeeId, sender: 'employee', readByAdmin: false },
        { $set: { readByAdmin: true } }
      );
    } else {
      await ChatMessage.updateMany(
        { employee: employeeId, sender: 'admin', readByEmployee: false },
        { $set: { readByEmployee: true } }
      );
    }

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error marking messages as read' });
  }
});

module.exports = router;
