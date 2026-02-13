const asyncHandler = require('../utils/asyncHandler');
const leaveService = require('../services/leave.service');
const Employee = require('../models/Employee');

// ── Admin / Manager ──────────────────────────────────────────────────────────

/** GET /leave  — all leave requests for the company */
const getAllLeaves = asyncHandler(async (req, res) => {
  const { status, employeeId, leaveType, page, limit } = req.query;
  const result = await leaveService.getAllLeaves(req.user.companyId, {
    status, employeeId, leaveType,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 25,
  });
  res.json({ success: true, data: result });
});

/** GET /leave/stats  — summary counts */
const getLeaveStats = asyncHandler(async (req, res) => {
  const stats = await leaveService.getLeaveStats(req.user.companyId);
  res.json({ success: true, data: stats });
});

/** POST /leave  — admin manually creates a leave request */
const createLeave = asyncHandler(async (req, res) => {
  const leave = await leaveService.createLeave(
    req.user.companyId,
    req.user.userId,
    req.body,
  );
  res.status(201).json({ success: true, data: leave });
});

/** PUT /leave/:id/approve */
const approveLeave = asyncHandler(async (req, res) => {
  const leave = await leaveService.approveLeave(
    req.params.id,
    req.user.companyId,
    req.user.userId,
    req.body.actionNote || '',
  );
  res.json({ success: true, data: leave });
});

/** PUT /leave/:id/decline */
const declineLeave = asyncHandler(async (req, res) => {
  const leave = await leaveService.declineLeave(
    req.params.id,
    req.user.companyId,
    req.user.userId,
    req.body.actionNote || '',
  );
  res.json({ success: true, data: leave });
});

/** PUT /leave/:id/cancel */
const cancelLeave = asyncHandler(async (req, res) => {
  const leave = await leaveService.cancelLeave(
    req.params.id,
    req.user.companyId,
    req.user.userId,
  );
  res.json({ success: true, data: leave });
});

// ── Employee (self) ──────────────────────────────────────────────────────────

/** GET /leave/my  — employee's own leaves */
const getMyLeaves = asyncHandler(async (req, res) => {
  // Resolve this user's employee record
  const employee = await Employee.findOne({
    userId: req.user.userId,
    companyId: req.user.companyId,
  }).lean();

  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee record not found for this user' });
  }

  const { status, page, limit } = req.query;
  const result = await leaveService.getMyLeaves(employee._id, req.user.companyId, {
    status,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 25,
  });
  res.json({ success: true, data: result });
});

/** POST /leave/my  — employee submits a leave request */
const submitMyLeave = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({
    userId: req.user.userId,
    companyId: req.user.companyId,
  }).lean();

  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee record not found for this user' });
  }

  const leave = await leaveService.createLeave(
    req.user.companyId,
    req.user.userId,
    { ...req.body, employeeId: employee._id },
  );
  res.status(201).json({ success: true, data: leave });
});

/** PUT /leave/my/:id/cancel  — employee cancels their own leave */
const cancelMyLeave = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({
    userId: req.user.userId,
    companyId: req.user.companyId,
  }).lean();

  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee record not found for this user' });
  }

  // Verify this leave belongs to the employee
  const Leave = require('../models/Leave');
  const leave = await Leave.findOne({
    _id: req.params.id,
    companyId: req.user.companyId,
    employeeId: employee._id,
  });
  if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

  const updated = await leaveService.cancelLeave(req.params.id, req.user.companyId, req.user.userId);
  res.json({ success: true, data: updated });
});

module.exports = {
  getAllLeaves,
  getLeaveStats,
  createLeave,
  approveLeave,
  declineLeave,
  cancelLeave,
  getMyLeaves,
  submitMyLeave,
  cancelMyLeave,
};
