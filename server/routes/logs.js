const express = require('express');
const router = express.Router();
const ShiftLog = require('../models/ShiftLog');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// @desc    Get shift logs (filtered by search query or name query if provided)
// @route   GET /api/logs
// @access  Private (Admin & Employee)
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    
    if (req.query.search) {
      // Fuzzy contains match (used by Admin)
      filter.name = { $regex: req.query.search, $options: 'i' };
    } else if (req.query.name) {
      // Prefix/Exact match (used by Employee)
      filter.name = { $regex: '^' + req.query.name, $options: 'i' };
    }

    // Sort by date descending, then created date
    const logs = await ShiftLog.find(filter).sort({ date: -1, createdAt: -1 });
    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error retrieving logs' });
  }
});

// @desc    Get unique employee names (for search tags)
// @route   GET /api/logs/names
// @access  Private (Admin & Employee)
router.get('/names', protect, async (req, res) => {
  try {
    const names = await ShiftLog.distinct('name');
    res.json({ success: true, data: names.sort() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error retrieving employee names' });
  }
});

// @desc    Create a new shift log entry
// @route   POST /api/logs
// @access  Private (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { date, shift, name, id, work_description } = req.body;

    if (!date || !shift || !name || !id || !work_description) {
      return res.status(400).json({ success: false, message: 'Please add all required fields' });
    }

    const newLog = await ShiftLog.create({
      date,
      shift,
      name,
      id,
      work_description
    });

    res.status(201).json({ success: true, data: newLog });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error creating shift log' });
  }
});

// @desc    Batch insert multiple shift log entries
// @route   POST /api/logs/batch
// @access  Private (Admin only)
router.post('/batch', protect, adminOnly, async (req, res) => {
  try {
    const logs = req.body;

    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of shift logs' });
    }

    // Validate that each item has required fields
    for (let i = 0; i < logs.length; i++) {
      const { date, shift, name, id, work_description } = logs[i];
      if (!date || !shift || !name || !id || !work_description) {
        return res.status(400).json({ 
          success: false, 
          message: `Log at index ${i} is missing required fields (date, shift, name, id, work_description)` 
        });
      }
    }

    const insertedLogs = await ShiftLog.insertMany(logs);
    res.status(201).json({ success: true, count: insertedLogs.length, data: insertedLogs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error during batch creation of shift logs' });
  }
});

module.exports = router;
