const express = require('express');
const router = express.Router();
const Salary = require('../models/Salary');
const Employee = require('../models/Employee');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// @desc    Add or record a monthly salary entry (Admin only)
// @route   POST /api/salary
// @access  Private/Admin
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { employee, month, baseSalary, bonus, deductions, paymentStatus, remarks } = req.body;

    if (!employee || !month || baseSalary === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide employee, month, and baseSalary' });
    }

    const empExists = await Employee.findById(employee);
    if (!empExists) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const b = Number(bonus) || 0;
    const d = Number(deductions) || 0;
    const netSalary = Number(baseSalary) + b - d;

    const existing = await Salary.findOne({ employee, month });
    if (existing) {
      return res.status(400).json({ success: false, message: `Salary record already exists for this employee for ${month}` });
    }

    const salary = await Salary.create({
      employee,
      month,
      baseSalary: Number(baseSalary),
      bonus: b,
      deductions: d,
      netSalary,
      paymentStatus: paymentStatus || 'Unpaid',
      paymentDate: paymentStatus === 'Paid' ? new Date() : null,
      remarks
    });

    res.status(201).json({ success: true, data: salary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: `Server error creating salary record: ${error.message}` });
  }
});

// @desc    Mark salary payment status (Admin only)
// @route   PUT /api/salary/:id
// @access  Private/Admin
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { paymentStatus, bonus, deductions, remarks } = req.body;
    
    const salary = await Salary.findById(req.params.id);
    if (!salary) {
      return res.status(404).json({ success: false, message: 'Salary record not found' });
    }

    if (paymentStatus !== undefined) {
      salary.paymentStatus = paymentStatus;
      if (paymentStatus === 'Paid') {
        salary.paymentDate = new Date();
      } else {
        salary.paymentDate = null;
      }
    }

    if (bonus !== undefined) salary.bonus = Number(bonus) || 0;
    if (deductions !== undefined) salary.deductions = Number(deductions) || 0;
    if (remarks !== undefined) salary.remarks = remarks;

    // Recalculate net
    salary.netSalary = salary.baseSalary + salary.bonus - salary.deductions;

    await salary.save();
    res.json({ success: true, data: salary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: `Server error updating salary: ${error.message}` });
  }
});

// @desc    Generate monthly salary reports (Admin only)
// @route   GET /api/salary/reports
// @access  Private/Admin
router.get('/reports', protect, adminOnly, async (req, res) => {
  try {
    const { month } = req.query; // format YYYY-MM
    if (!month) {
      return res.status(400).json({ success: false, message: 'Please specify month (YYYY-MM)' });
    }

    const records = await Salary.find({ month }).populate('employee', 'fullName employeeId department designation');

    let totalPayroll = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    const departmentBreakdown = {};

    records.forEach(rec => {
      totalPayroll += rec.netSalary;
      if (rec.paymentStatus === 'Paid') {
        totalPaid += rec.netSalary;
      } else {
        totalUnpaid += rec.netSalary;
      }

      if (rec.employee) {
        const dept = rec.employee.department || 'Other';
        if (!departmentBreakdown[dept]) {
          departmentBreakdown[dept] = { total: 0, count: 0 };
        }
        departmentBreakdown[dept].total += rec.netSalary;
        departmentBreakdown[dept].count += 1;
      }
    });

    res.json({
      success: true,
      data: {
        month,
        count: records.length,
        totalPayroll,
        totalPaid,
        totalUnpaid,
        departmentBreakdown,
        records
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error generating payroll report' });
  }
});

// @desc    Get self salary history (Employee only)
// @route   GET /api/salary/me
// @access  Private/Employee
router.get('/me', protect, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const history = await Salary.find({ employee: req.user.id })
      .populate('employee', 'fullName employeeId department designation joiningDate')
      .sort({ month: -1 });

    res.json({ success: true, count: history.length, data: history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error retrieving salary history' });
  }
});

// @desc    Get salary history for a specific employee (Admin only)
// @route   GET /api/salary/employee/:employeeId
// @access  Private/Admin
router.get('/employee/:employeeId', protect, adminOnly, async (req, res) => {
  try {
    const history = await Salary.find({ employee: req.params.employeeId }).sort({ month: -1 });
    res.json({ success: true, count: history.length, data: history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error retrieving employee salary history' });
  }
});

module.exports = router;
