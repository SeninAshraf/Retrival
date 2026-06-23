const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// @desc    Authenticate role & return JWT
// @route   POST /api/auth/login
// @access  Public
router.post('/login', (req, res) => {
  const { role, password } = req.body;

  if (!role || !password) {
    return res.status(400).json({ success: false, message: 'Please provide role and password' });
  }

  // Admin access validation
  if (role === 'admin') {
    if (password === '123') {
      const token = jwt.sign(
        { role: 'admin' },
        process.env.JWT_SECRET || 'shiftsync_jwt_secret_token_key_2026_xyz',
        { expiresIn: '30d' }
      );
      return res.json({ success: true, token, role });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid administrator security password' });
    }
  }

  // Employee access validation
  if (role === 'employee') {
    if (password === '321') {
      const token = jwt.sign(
        { role: 'employee' },
        process.env.JWT_SECRET || 'shiftsync_jwt_secret_token_key_2026_xyz',
        { expiresIn: '30d' }
      );
      return res.json({ success: true, token, role });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid employee portal security password' });
    }
  }

  return res.status(400).json({ success: false, message: 'Invalid role selection' });
});

module.exports = router;
