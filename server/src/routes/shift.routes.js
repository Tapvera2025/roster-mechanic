const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Shift = require('../models/Shift');
const Employee = require('../models/Employee');
const asyncHandler = require('../utils/asyncHandler');

// All routes require authentication
router.use(auth);

/**
 * Get my shifts (for logged-in employees)
 * @route GET /api/shifts/my-shifts
 */
router.get('/my-shifts', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const { userId, companyId } = req.user;

  if (!startDate || !endDate) {
    const error = new Error('startDate and endDate are required');
    error.statusCode = 400;
    throw error;
  }

  // Find the employee record linked to this user
  const employee = await Employee.findOne({
    userId: userId,
    companyId: companyId,
    isActive: true
  });

  if (!employee) {
    const error = new Error('No employee record found for this user');
    error.statusCode = 404;
    throw error;
  }

  // Get shifts for this employee
  const shifts = await Shift.find({
    employeeId: employee._id,
    companyId: companyId,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  })
    .populate('siteId', 'siteLocationName shortName address')
    .sort({ date: 1, startTime: 1 })
    .lean();

  // Transform shifts
  const transformedShifts = shifts.map(shift => ({
    ...shift,
    id: shift._id.toString(),
    siteId: shift.siteId ? {
      ...shift.siteId,
      id: shift.siteId._id.toString()
    } : null
  }));

  res.json({
    success: true,
    data: transformedShifts
  });
}));

module.exports = router;
