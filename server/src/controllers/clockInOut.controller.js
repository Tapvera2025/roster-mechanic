/**
 * Clock In/Out Controller
 *
 * HTTP handlers for employee time tracking endpoints
 */

const clockInOutService = require('../services/clockInOut.service');
const socketService = require('../services/socket.service');
const asyncHandler = require('../utils/asyncHandler');
const { validationResult } = require('express-validator');
const { getPhotoUrl } = require('../config/upload');

/**
 * Clock in an employee
 * @route POST /api/v1/clock/in
 */
const clockIn = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { employeeId, siteId, latitude, longitude, shiftId } = req.body;

  // Get photo URL if file was uploaded
  const photoUrl = req.file ? getPhotoUrl(req.file.filename) : null;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role,
  };

  const timeRecord = await clockInOutService.clockIn(context, {
    employeeId,
    siteId,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    photoUrl,
    shiftId,
  });

  // Send real-time notification to managers
  try {
    socketService.notifyClockIn({
      companyId: req.user.companyId,
      employee: {
        id: timeRecord.employee?._id || employeeId,
        name: timeRecord.employee?.name || 'Employee',
      },
      site: {
        id: timeRecord.site?._id || siteId,
        name: timeRecord.site?.siteLocationName || 'Site',
      },
      timestamp: timeRecord.clockIn,
      location: {
        latitude: timeRecord.clockInLocation?.coordinates?.[1],
        longitude: timeRecord.clockInLocation?.coordinates?.[0],
      },
    });
  } catch (error) {
    // Log error but don't fail the request
    console.error('Failed to send clock-in notification:', error);
  }

  res.status(201).json({
    success: true,
    message: 'Clocked in successfully',
    data: timeRecord,
  });
});

/**
 * Clock out an employee
 * @route POST /api/v1/clock/out
 */
const clockOut = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { employeeId, latitude, longitude } = req.body;

  // Get photo URL if file was uploaded
  const photoUrl = req.file ? getPhotoUrl(req.file.filename) : null;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role,
  };

  const timeRecord = await clockInOutService.clockOut(context, {
    employeeId,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    photoUrl,
  });

  // Send real-time notification to managers
  try {
    // Calculate duration in minutes
    const duration = timeRecord.clockOut && timeRecord.clockIn
      ? Math.round((new Date(timeRecord.clockOut) - new Date(timeRecord.clockIn)) / 60000)
      : null;

    socketService.notifyClockOut({
      companyId: req.user.companyId,
      employee: {
        id: timeRecord.employee?._id || employeeId,
        name: timeRecord.employee?.name || 'Employee',
      },
      site: {
        id: timeRecord.site?._id,
        name: timeRecord.site?.siteLocationName || 'Site',
      },
      timestamp: timeRecord.clockOut,
      duration,
      location: {
        latitude: timeRecord.clockOutLocation?.coordinates?.[1],
        longitude: timeRecord.clockOutLocation?.coordinates?.[0],
      },
    });
  } catch (error) {
    // Log error but don't fail the request
    console.error('Failed to send clock-out notification:', error);
  }

  res.json({
    success: true,
    message: 'Clocked out successfully',
    data: timeRecord,
  });
});

/**
 * Get current clock-in status for an employee
 * @route GET /api/v1/clock/status
 */
const getCurrentStatus = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { employeeId } = req.query;

  const context = {
    companyId: req.user.companyId,
  };

  const status = await clockInOutService.getCurrentStatus(context, employeeId);

  res.json({
    success: true,
    data: status,
  });
});

/**
 * Get employee's time record history
 * @route GET /api/v1/clock/history
 */
const getMyHistory = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { employeeId, startDate, endDate, siteId, page, limit } = req.query;

  const context = {
    companyId: req.user.companyId,
  };

  const result = await clockInOutService.getEmployeeHistory(context, employeeId, {
    startDate,
    endDate,
    siteId,
    page,
    limit,
  });

  res.json({
    success: true,
    data: result.records,
    pagination: result.pagination,
  });
});

/**
 * Get time records for manager view (all employees)
 * @route GET /api/v1/clock/records
 */
const getManagerView = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { startDate, endDate, siteId, employeeId, page, limit } = req.query;

  const context = {
    companyId: req.user.companyId,
    role: req.user.role,
  };

  const result = await clockInOutService.getManagerView(context, {
    startDate,
    endDate,
    siteId,
    employeeId,
    page,
    limit,
  });

  res.json({
    success: true,
    data: result.records,
    pagination: result.pagination,
  });
});

/**
 * Export time records to CSV
 * @route GET /api/v1/clock/export
 */
const exportCSV = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { startDate, endDate, siteId, employeeId } = req.query;

  const context = {
    companyId: req.user.companyId,
    role: req.user.role,
  };

  const csvContent = await clockInOutService.exportToCSV(context, {
    startDate,
    endDate,
    siteId,
    employeeId,
  });

  // Set CSV headers
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=time-records.csv');

  res.send(csvContent);
});

module.exports = {
  clockIn,
  clockOut,
  getCurrentStatus,
  getMyHistory,
  getManagerView,
  exportCSV,
};
