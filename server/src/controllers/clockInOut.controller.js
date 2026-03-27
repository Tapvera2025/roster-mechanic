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

/**
 * Approve a time record
 * @route PUT /api/v1/clock/approve/:id
 */
const approveTimeRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role,
  };

  const timeRecord = await clockInOutService.approveTimeRecord(context, id);

  res.status(200).json({
    success: true,
    message: 'Time record approved successfully',
    data: timeRecord,
  });
});

/**
 * Reject a time record
 * @route PUT /api/v1/clock/reject/:id
 */
const rejectTimeRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Rejection reason is required',
    });
  }

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role,
  };

  const timeRecord = await clockInOutService.rejectTimeRecord(context, id, reason);

  res.status(200).json({
    success: true,
    message: 'Time record rejected successfully',
    data: timeRecord,
  });
});

/**
 * Bulk approve time records
 * @route POST /api/v1/clock/approve/bulk
 */
const bulkApproveTimeRecords = asyncHandler(async (req, res) => {
  const { timeRecordIds } = req.body;

  if (!Array.isArray(timeRecordIds) || timeRecordIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Time record IDs array is required',
    });
  }

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role,
  };

  const result = await clockInOutService.bulkApproveTimeRecords(context, timeRecordIds);

  res.status(200).json({
    success: true,
    message: `Bulk approval completed: ${result.approved} approved, ${result.failed} failed`,
    data: result,
  });
});

/**
 * Bulk reject time records
 * @route POST /api/v1/clock/reject/bulk
 */
const bulkRejectTimeRecords = asyncHandler(async (req, res) => {
  const { timeRecordIds, reason } = req.body;

  if (!Array.isArray(timeRecordIds) || timeRecordIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Time record IDs array is required',
    });
  }

  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Rejection reason is required',
    });
  }

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role,
  };

  const result = await clockInOutService.bulkRejectTimeRecords(context, timeRecordIds, reason);

  res.status(200).json({
    success: true,
    message: `Bulk rejection completed: ${result.rejected} rejected, ${result.failed} failed`,
    data: result,
  });
});

/**
 * Start a break
 * @route POST /api/v1/clock/break/start
 */
const startBreak = asyncHandler(async (req, res) => {
  const { employeeId, breakType, notes } = req.body;

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      message: 'Employee ID is required',
    });
  }

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
  };

  const timeRecord = await clockInOutService.startBreak(context, employeeId, breakType, notes);

  res.status(200).json({
    success: true,
    message: 'Break started successfully',
    data: timeRecord,
  });
});

/**
 * End a break
 * @route POST /api/v1/clock/break/end
 */
const endBreak = asyncHandler(async (req, res) => {
  const { employeeId } = req.body;

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      message: 'Employee ID is required',
    });
  }

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
  };

  const timeRecord = await clockInOutService.endBreak(context, employeeId);

  res.status(200).json({
    success: true,
    message: 'Break ended successfully',
    data: timeRecord,
  });
});

module.exports = {
  clockIn,
  clockOut,
  getCurrentStatus,
  getMyHistory,
  getManagerView,
  exportCSV,
  approveTimeRecord,
  rejectTimeRecord,
  bulkApproveTimeRecords,
  bulkRejectTimeRecords,
  startBreak,
  endBreak,
};
