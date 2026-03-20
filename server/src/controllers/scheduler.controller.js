const schedulerService = require('../services/scheduler.service');
const socketService = require('../services/socket.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get active sites for scheduler dropdown
 * @route GET /api/scheduler/sites
 */
const getActiveSites = asyncHandler(async (req, res) => {
  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const sites = await schedulerService.getActiveSites(context);

  res.json({
    success: true,
    data: sites
  });
});

/**
 * Get employees assigned to a site
 * @route GET /api/scheduler/sites/:id/employees
 */
const getSiteEmployees = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const employees = await schedulerService.getSiteEmployees(context, id);

  res.json({
    success: true,
    data: employees
  });
});

/**
 * Get shifts for a site within a date range
 * @route GET /api/scheduler/sites/:id/shifts
 */
const getSiteShifts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, employeeId, status } = req.query;

  if (!startDate || !endDate) {
    const error = new Error('startDate and endDate are required');
    error.statusCode = 400;
    throw error;
  }

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const shifts = await schedulerService.getSiteShifts(context, id, startDate, endDate, {
    employeeId,
    status
  });

  res.json({
    success: true,
    data: shifts
  });
});

/**
 * Get a single shift by ID
 * @route GET /api/scheduler/shifts/:id
 */
const getShiftById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const shift = await schedulerService.getShiftById(context, id);

  res.json({
    success: true,
    data: shift
  });
});

/**
 * Create a new shift
 * @route POST /api/scheduler/shifts
 */
const createShift = asyncHandler(async (req, res) => {
  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const shift = await schedulerService.createShift(context, req.body);

  // Send real-time notification
  try {
    socketService.notifyShiftCreated({
      id: shift._id,
      companyId: req.user.companyId,
      assignedTo: shift.employees || [],
      site: shift.site,
      ...shift.toObject(),
    });
  } catch (error) {
    console.error('Failed to send shift created notification:', error);
  }

  res.status(201).json({
    success: true,
    data: shift,
    message: 'Shift created successfully'
  });
});

/**
 * Create an adhoc shift (skips conflict detection)
 * @route POST /api/scheduler/shifts/adhoc
 */
const createAdhocShift = asyncHandler(async (req, res) => {
  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const shift = await schedulerService.createAdhocShift(context, req.body);

  // Send real-time notification
  try {
    socketService.notifyShiftCreated({
      id: shift._id,
      companyId: req.user.companyId,
      assignedTo: shift.employees || [],
      site: shift.site,
      ...shift.toObject(),
    });
  } catch (error) {
    console.error('Failed to send adhoc shift created notification:', error);
  }

  res.status(201).json({
    success: true,
    data: shift,
    message: 'Adhoc shift created successfully'
  });
});

/**
 * Update a shift
 * @route PUT /api/scheduler/shifts/:id
 */
const updateShift = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const shift = await schedulerService.updateShift(context, id, req.body);

  // Send real-time notification
  try {
    socketService.notifyShiftUpdated({
      id: shift._id,
      companyId: req.user.companyId,
      assignedTo: shift.employees || [],
      site: shift.site,
      ...shift.toObject(),
    });
  } catch (error) {
    console.error('Failed to send shift updated notification:', error);
  }

  res.json({
    success: true,
    data: shift,
    message: 'Shift updated successfully'
  });
});

/**
 * Delete a shift
 * @route DELETE /api/scheduler/shifts/:id
 */
const deleteShift = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const result = await schedulerService.deleteShift(context, id);

  // Send real-time notification
  try {
    socketService.notifyShiftDeleted({
      companyId: req.user.companyId,
      shiftId: id,
      assignedTo: result.assignedTo || [],
      siteName: result.siteName,
    });
  } catch (error) {
    console.error('Failed to send shift deleted notification:', error);
  }

  res.json({
    success: true,
    data: result
  });
});

/**
 * Get deleted shifts
 * @route GET /api/scheduler/shifts/deleted
 */
const getDeletedShifts = asyncHandler(async (req, res) => {
  const { siteId } = req.query;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const shifts = await schedulerService.getDeletedShifts(context, siteId);

  res.json({
    success: true,
    data: shifts
  });
});

/**
 * Restore a deleted shift
 * @route PUT /api/scheduler/shifts/:id/restore
 */
const restoreShift = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const shift = await schedulerService.restoreShift(context, id);

  // Send real-time notification
  try {
    socketService.notifyShiftCreated({
      id: shift._id,
      companyId: req.user.companyId,
      assignedTo: shift.employees || [],
      site: shift.siteId,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
    });
  } catch (error) {
    console.error('Failed to send shift restored notification:', error);
  }

  res.json({
    success: true,
    message: 'Shift restored successfully',
    data: shift
  });
});

/**
 * Permanently delete a shift
 * @route DELETE /api/scheduler/shifts/:id/permanent
 */
const permanentDeleteShift = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  await schedulerService.permanentDeleteShift(context, id);

  res.json({
    success: true,
    message: 'Shift permanently deleted'
  });
});

module.exports = {
  getActiveSites,
  getSiteEmployees,
  getSiteShifts,
  getShiftById,
  createShift,
  createAdhocShift,
  updateShift,
  deleteShift,
  getDeletedShifts,
  restoreShift,
  permanentDeleteShift
};
