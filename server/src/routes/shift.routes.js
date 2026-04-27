const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Shift = require('../models/Shift');
const Employee = require('../models/Employee');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Helper: find an employee record for a logged-in user.
 * First tries by userId (fast path), then falls back to matching by email
 * (handles employees created before their User account was linked).
 */
async function findEmployeeForUser(userId, companyId) {
  // Fast path: employee linked directly to user account
  let employee = await Employee.findOne({ userId, companyId, isActive: true }).lean();
  if (employee) return employee;

  // Fallback: look up User by id, then find Employee by matching email
  const user = await User.findById(userId).select('email').lean();
  if (!user?.email) return null;

  employee = await Employee.findOne({ email: user.email, companyId, isActive: true }).lean();

  // If found via email, opportunistically link userId so the fast path works next time
  if (employee && !employee.userId) {
    await Employee.findByIdAndUpdate(employee._id, { userId });
    employee.userId = userId; // reflect in returned object
  }

  return employee;
}

// All routes require authentication
router.use(auth);

/**
 * Get the employee record linked to the logged-in user
 * @route GET /api/shifts/my-employee
 */
router.get('/my-employee', asyncHandler(async (req, res) => {
  const { userId, companyId } = req.user;

  const employee = await findEmployeeForUser(userId, companyId);

  if (!employee) {
    const error = new Error('No employee record found for this user. Please ask your manager to link your account.');
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    data: { ...employee, id: employee._id.toString() }
  });
}));

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

  // Find the employee record linked to this user (with email fallback)
  const employee = await findEmployeeForUser(userId, companyId);

  if (!employee) {
    const error = new Error('No employee record found for this user. Please ask your manager to link your account.');
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
    .populate('siteId', 'siteLocationName shortName address location')
    .sort({ date: 1, startTime: 1 })
    .lean();

  // Transform shifts
  const transformedShifts = shifts.map(shift => ({
    ...shift,
    id: shift._id.toString(),
    siteId: shift.siteId ? {
      ...shift.siteId,
      id: shift.siteId._id.toString(),
      latitude: shift.siteId.location?.coordinates?.[1] ?? null,
      longitude: shift.siteId.location?.coordinates?.[0] ?? null,
    } : null
  }));

  res.json({
    success: true,
    data: transformedShifts
  });
}));

module.exports = router;
