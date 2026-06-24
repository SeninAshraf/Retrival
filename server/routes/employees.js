const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// @desc    Get all employees (Admin only)
// @route   GET /api/employees
// @access  Private/Admin
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { search, department, status } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }
    if (department) {
      filter.department = department;
    }
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await Employee.find(filter).sort({ employeeId: -1 });
    res.json({ success: true, count: employees.length, data: employees });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error retrieving employees' });
  }
});

// @desc    Get self profile (Employee only)
// @route   GET /api/employees/me
// @access  Private/Employee
router.get('/me', protect, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({ success: false, message: 'Access denied. For employees only.' });
    }
    const employee = await Employee.findById(req.user.id).select('-password');
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: employee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error retrieving your profile' });
  }
});

// @desc    Register a new employee (Admin only)
// @route   POST /api/employees
// @access  Private/Admin
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { 
      fullName, email, mobileNumber, department, designation, 
      monthlySalary, password, status, joiningDate, profilePhoto, companyNotes 
    } = req.body;

    if (!fullName || !mobileNumber || !department || !designation || !monthlySalary || !password || !joiningDate) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Auto-generate employee ID
    const lastEmployee = await Employee.findOne().sort({ employeeId: -1 });
    let newId = 'EMP-10001';
    if (lastEmployee && lastEmployee.employeeId) {
      const match = lastEmployee.employeeId.match(/EMP-(\d+)/);
      if (match) {
        const lastNum = parseInt(match[1]);
        newId = `EMP-${lastNum + 1}`;
      }
    }

    const employee = await Employee.create({
      employeeId: newId,
      fullName,
      email,
      mobileNumber,
      department,
      designation,
      monthlySalary,
      password,
      status: status || 'Active',
      joiningDate,
      profilePhoto,
      companyNotes
    });

    // Remove password from response
    const responseData = employee.toObject();
    delete responseData.password;

    res.status(201).json({ success: true, data: responseData });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ success: false, message: `Server error creating employee: ${error.message}` });
  }
});

// @desc    Update employee self details (Employee only)
// @route   PUT /api/employees/me
// @access  Private/Employee
router.put('/me', protect, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { email, mobileNumber, profilePhoto } = req.body;
    const updateData = {};
    if (email !== undefined) updateData.email = email;
    if (mobileNumber !== undefined) updateData.mobileNumber = mobileNumber;
    if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;

    const employee = await Employee.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
});

// @desc    Update employee details (Admin only)
// @route   PUT /api/employees/:id
// @access  Private/Admin
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { 
      fullName, email, mobileNumber, department, designation, 
      monthlySalary, status, joiningDate, profilePhoto, companyNotes, password 
    } = req.body;

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (fullName !== undefined) employee.fullName = fullName;
    if (email !== undefined) employee.email = email;
    if (mobileNumber !== undefined) employee.mobileNumber = mobileNumber;
    if (department !== undefined) employee.department = department;
    if (designation !== undefined) employee.designation = designation;
    if (monthlySalary !== undefined) employee.monthlySalary = monthlySalary;
    if (status !== undefined) employee.status = status;
    if (joiningDate !== undefined) employee.joiningDate = joiningDate;
    if (profilePhoto !== undefined) employee.profilePhoto = profilePhoto;
    if (companyNotes !== undefined) employee.companyNotes = companyNotes;
    if (password) employee.password = password; // pre-save hook will hash it

    await employee.save();

    const responseData = employee.toObject();
    delete responseData.password;

    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: `Server error updating employee: ${error.message}` });
  }
});

module.exports = router;
