const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const Shift = require('../models/Shift');
const Employee = require('../models/Employee');
const TimeRecord = require('../models/TimeRecord');
const Site = require('../models/Site');
const Leave = require('../models/Leave');

// All routes require authentication
router.use(auth);

/**
 * GET /api/dashboard/stats
 * Returns summary counts for the admin dashboard stats bar.
 * All counts are scoped to today (local server date) unless noted.
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const { companyId } = req.user;

  // Build today's UTC range
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const [
    tentativeShifts,
    openShifts,
    unpublishedShifts,
    noShowShifts,
    activeEmployees,
    activeSites,
    clockedInNow,
    todayShifts,
    todayTimeRecords,
    pendingLeaveRequests,
  ] = await Promise.all([
    // Tentative = IN_PROGRESS shifts today
    Shift.countDocuments({
      companyId,
      status: 'IN_PROGRESS',
      date: { $gte: startOfToday, $lte: endOfToday },
    }),
    // Open shifts = shifts with no employee assigned today
    Shift.countDocuments({
      companyId,
      employeeId: null,
      date: { $gte: startOfToday, $lte: endOfToday },
    }),
    // Unpublished = SCHEDULED shifts today (not yet started)
    Shift.countDocuments({
      companyId,
      status: 'SCHEDULED',
      date: { $gte: startOfToday, $lte: endOfToday },
    }),
    // No Show = CANCELLED or NO_SHOW shifts today
    Shift.countDocuments({
      companyId,
      status: { $in: ['CANCELLED', 'NO_SHOW'] },
      date: { $gte: startOfToday, $lte: endOfToday },
    }),
    // Active employees total
    Employee.countDocuments({ companyId, isActive: true }),
    // Active sites total
    Site.countDocuments({ companyId, status: 'ACTIVE' }),
    // Currently clocked in (any day)
    TimeRecord.countDocuments({ companyId, status: 'CLOCKED_IN' }),
    // All scheduled shifts today
    Shift.countDocuments({
      companyId,
      date: { $gte: startOfToday, $lte: endOfToday },
    }),
    // Time records today
    TimeRecord.countDocuments({
      companyId,
      clockInTime: { $gte: startOfToday, $lte: endOfToday },
    }),
    // Pending leave requests (all time — awaiting action)
    Leave.countDocuments({ companyId, status: 'pending' }),
  ]);

  res.json({
    success: true,
    data: {
      tentativeShifts,
      openShifts,
      unpublishedShifts,
      noShowAbsent: noShowShifts,
      leaveRequests: pendingLeaveRequests,
      availabilityRequests: 0,  // placeholder – no availability model yet
      licensesExpiry: 0,        // placeholder – no licence model yet
      activeEmployees,
      activeSites,
      clockedInNow,
      todayShifts,
      todayTimeRecords,
    },
  });
}));

/**
 * GET /api/dashboard/attendance
 * Returns today's clock-in records PLUS assigned shifts with no clock-in (no-shows).
 */
router.get('/attendance', asyncHandler(async (req, res) => {
  const { companyId } = req.user;

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  // 1. All clock-in records for today
  const records = await TimeRecord.find({
    companyId,
    clockInTime: { $gte: startOfToday, $lte: endOfToday },
  })
    .populate('employeeId', 'firstName lastName phone')
    .populate('siteId', 'siteLocationName shortName')
    .populate('shiftId', 'startTime endTime')
    .sort({ clockInTime: -1 })
    .lean();

  // 2. All assigned, non-cancelled shifts today
  const todayShifts = await Shift.find({
    companyId,
    employeeId: { $ne: null },
    date: { $gte: startOfToday, $lte: endOfToday },
    status: { $nin: ['CANCELLED'] },
  })
    .populate('employeeId', 'firstName lastName phone')
    .populate('siteId', 'siteLocationName shortName')
    .lean();

  // Build a set of employeeIds that have clocked in today
  const clockedInEmployees = new Set(
    records.map((r) => r.employeeId?._id?.toString()).filter(Boolean)
  );

  // No-show = assigned shift with no clock-in record today for that employee
  const noShowShifts = todayShifts.filter(
    (s) => !clockedInEmployees.has(s.employeeId?._id?.toString())
  );

  // Format clocked records
  const clockedRows = records.map((r) => {
    const shiftHrs = r.shiftId
      ? ((new Date(r.shiftId.endTime) - new Date(r.shiftId.startTime)) / 3600000).toFixed(2)
      : null;
    const totalHrs = r.totalHours != null ? r.totalHours.toFixed(2) : null;

    return {
      id: r._id.toString(),
      date: r.clockInTime,
      employee: r.employeeId ? `${r.employeeId.firstName} ${r.employeeId.lastName}` : 'Unknown',
      mobile: r.employeeId?.phone || '—',
      site: r.siteId?.shortName || r.siteId?.siteLocationName || '—',
      shiftTime: r.shiftId
        ? `${new Date(r.shiftId.startTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${new Date(r.shiftId.endTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })}`
        : '—',
      shiftHrs,
      clockIn: r.clockInTime,
      clockOut: r.clockOutTime || null,
      breakMins: r.breakDuration || 0,
      totalHrs,
      status: r.status, // CLOCKED_IN | CLOCKED_OUT
    };
  });

  // Format no-show rows
  const noShowRows = noShowShifts.map((s) => {
    const shiftHrs = s.startTime && s.endTime
      ? ((new Date(s.endTime) - new Date(s.startTime)) / 3600000).toFixed(2)
      : null;

    return {
      id: s._id.toString(),
      date: s.date,
      employee: s.employeeId ? `${s.employeeId.firstName} ${s.employeeId.lastName}` : 'Unknown',
      mobile: s.employeeId?.phone || '—',
      site: s.siteId?.shortName || s.siteId?.siteLocationName || '—',
      shiftTime: s.startTime && s.endTime
        ? `${new Date(s.startTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${new Date(s.endTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })}`
        : '—',
      shiftHrs,
      clockIn: null,
      clockOut: null,
      breakMins: 0,
      totalHrs: null,
      status: 'NO_SHOW',
    };
  });

  res.json({ success: true, data: [...clockedRows, ...noShowRows] });
}));

module.exports = router;
