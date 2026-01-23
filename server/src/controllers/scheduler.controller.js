const schedulerService = require('../services/scheduler.service');
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

  res.status(201).json({
    success: true,
    data: shift,
    message: 'Shift created successfully'
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

  res.json({
    success: true,
    data: result
  });
});

module.exports = {
  getActiveSites,
  getSiteEmployees,
  getSiteShifts,
  getShiftById,
  createShift,
  updateShift,
  deleteShift
};
