const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// @desc    Get all announcements (Admin only)
// @route   GET /api/announcements
// @access  Private/Admin
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const announcements = await Announcement.find({}).sort({ createdAt: -1 });
    res.json({ success: true, count: announcements.length, data: announcements });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error retrieving announcements' });
  }
});

// @desc    Get announcements for self (Employee only)
// @route   GET /api/announcements/me
// @access  Private/Employee
router.get('/me', protect, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const dept = req.user.department || '';

    const announcements = await Announcement.find({
      $or: [
        { target: 'All' },
        { target: 'Department', department: { $regex: new RegExp('^' + dept.trim() + '$', 'i') } }
      ]
    }).sort({ createdAt: -1 });

    res.json({ success: true, count: announcements.length, data: announcements });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error retrieving announcements' });
  }
});

// @desc    Post a new announcement (Admin only)
// @route   POST /api/announcements
// @access  Private/Admin
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, content, target, department } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Please add title and content' });
    }

    if (target === 'Department' && !department) {
      return res.status(400).json({ success: false, message: 'Please specify the target department' });
    }

    const announcement = await Announcement.create({
      title,
      content,
      target: target || 'All',
      department: target === 'Department' ? department : undefined
    });

    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: `Server error creating announcement: ${error.message}` });
  }
});

module.exports = router;
