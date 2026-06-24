const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');

// @desc    Authenticate role & return JWT
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { role, password, employeeId } = req.body;

  if (!role || !password) {
    return res.status(400).json({ success: false, message: 'Please provide credentials' });
  }

  // Admin access validation (hardcoded)
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

  // Employee access validation (database-driven)
  if (role === 'employee') {
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Please provide Employee ID' });
    }

    try {
      // Find employee by ID (case-insensitive)
      const employee = await Employee.findOne({ 
        employeeId: { $regex: new RegExp('^' + employeeId.trim() + '$', 'i') } 
      });

      if (!employee) {
        return res.status(401).json({ success: false, message: 'Employee ID not found' });
      }

      // Check account status
      if (employee.status === 'Inactive') {
        return res.status(403).json({ 
          success: false, 
          message: 'Your account is inactive. Please contact the administrator.' 
        });
      }

      // Verify password
      const isMatch = await employee.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid portal security password' });
      }

      // Sign JWT
      const token = jwt.sign(
        { 
          id: employee._id, 
          role: 'employee', 
          employeeId: employee.employeeId, 
          fullName: employee.fullName,
          department: employee.department
        },
        process.env.JWT_SECRET || 'shiftsync_jwt_secret_token_key_2026_xyz',
        { expiresIn: '30d' }
      );

      return res.json({ 
        success: true, 
        token, 
        role: 'employee',
        name: employee.fullName,
        employeeId: employee.employeeId
      });
    } catch (error) {
      console.error('Employee authentication error:', error);
      return res.status(500).json({ success: false, message: 'Server error during employee authorization' });
    }
  }

  return res.status(400).json({ success: false, message: 'Invalid role selection' });
});

module.exports = router;
