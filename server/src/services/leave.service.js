const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const User = require('../models/User');
const emailService = require('./email.service');
const logger = require('../utils/logger');

class LeaveService {
  /**
   * Calculate working days between two dates (inclusive, Mon-Fri)
   */
  _calcDays(start, end) {
    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count || 1;
  }

  /**
   * Get all leave requests for the company (admin view)
   */
  async getAllLeaves(companyId, filters = {}) {
    const { status, employeeId, leaveType, page = 1, limit = 25 } = filters;

    const query = { companyId };
    if (status && status !== 'all') query.status = status;
    if (employeeId) query.employeeId = employeeId;
    if (leaveType && leaveType !== 'all') query.leaveType = leaveType;

    const skip = (page - 1) * limit;

    const [leaves, total] = await Promise.all([
      Leave.find(query)
        .populate('employeeId', 'firstName lastName email')
        .populate('actionedBy', 'name email')
        .populate('submittedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Leave.countDocuments(query),
    ]);

    return {
      leaves,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get leave stats for the company
   */
  async getLeaveStats(companyId) {
    const stats = await Leave.aggregate([
      { $match: { companyId: require('mongoose').Types.ObjectId.createFromHexString(companyId.toString()) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const result = { total: 0, pending: 0, approved: 0, declined: 0, cancelled: 0 };
    stats.forEach(({ _id, count }) => {
      result[_id] = count;
      result.total += count;
    });
    return result;
  }

  /**
   * Get leave requests for a specific employee (employee view)
   */
  async getMyLeaves(employeeId, companyId, filters = {}) {
    const { status, page = 1, limit = 25 } = filters;

    const query = { employeeId, companyId };
    if (status && status !== 'all') query.status = status;

    const skip = (page - 1) * limit;

    const [leaves, total] = await Promise.all([
      Leave.find(query)
        .populate('actionedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Leave.countDocuments(query),
    ]);

    return {
      leaves,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Create a leave request (admin or employee)
   */
  async createLeave(companyId, submittedByUserId, data) {
    const { employeeId, leaveType, startDate, endDate, fullDay = true, notes = '' } = data;

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) throw new Error('End date must be on or after start date');

    const periodDays = this._calcDays(start, end);

    const leave = await Leave.create({
      companyId,
      employeeId,
      leaveType,
      startDate: start,
      endDate: end,
      fullDay,
      periodDays,
      notes,
      status: 'pending',
      submittedBy: submittedByUserId,
    });

    // Send notification email to admin(s) if an employee submitted it
    // (fire-and-forget, don't block)
    this._notifyAdminNewRequest(leave, companyId).catch((e) =>
      logger.warn('Admin leave notification email failed:', e.message)
    );

    return leave;
  }

  /**
   * Approve a leave request
   */
  async approveLeave(leaveId, companyId, actionedByUserId, actionNote = '') {
    const leave = await Leave.findOne({ _id: leaveId, companyId });
    if (!leave) throw new Error('Leave request not found');
    if (leave.status !== 'pending') throw new Error('Only pending requests can be approved');

    leave.status = 'approved';
    leave.actionedBy = actionedByUserId;
    leave.actionedAt = new Date();
    leave.actionNote = actionNote;
    await leave.save();

    await this._notifyEmployee(leave, 'approved', actionNote);
    return leave;
  }

  /**
   * Decline a leave request
   */
  async declineLeave(leaveId, companyId, actionedByUserId, actionNote = '') {
    const leave = await Leave.findOne({ _id: leaveId, companyId });
    if (!leave) throw new Error('Leave request not found');
    if (leave.status !== 'pending') throw new Error('Only pending requests can be declined');

    leave.status = 'declined';
    leave.actionedBy = actionedByUserId;
    leave.actionedAt = new Date();
    leave.actionNote = actionNote;
    await leave.save();

    await this._notifyEmployee(leave, 'declined', actionNote);
    return leave;
  }

  /**
   * Cancel a leave request (can be done by the employee themselves or admin)
   */
  async cancelLeave(leaveId, companyId, userId) {
    const leave = await Leave.findOne({ _id: leaveId, companyId });
    if (!leave) throw new Error('Leave request not found');
    if (!['pending', 'approved'].includes(leave.status))
      throw new Error('Only pending or approved requests can be cancelled');

    leave.status = 'cancelled';
    leave.actionedBy = userId;
    leave.actionedAt = new Date();
    await leave.save();
    return leave;
  }

  // ─── Email helpers ───────────────────────────────────────────────────────────

  async _notifyEmployee(leave, newStatus, actionNote) {
    try {
      const employee = await Employee.findById(leave.employeeId).lean();
      if (!employee?.email) return;

      const typeLabel = {
        annual: 'Annual Leave',
        sick: 'Sick Leave',
        personal: 'Personal Leave',
        unpaid: 'Unpaid Leave',
      }[leave.leaveType] || leave.leaveType;

      const fmt = (d) =>
        new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });

      const statusLabel = newStatus === 'approved' ? 'Approved ✅' : 'Declined ❌';
      const statusColor = newStatus === 'approved' ? '#16a34a' : '#dc2626';
      const statusBg = newStatus === 'approved' ? '#f0fdf4' : '#fef2f2';
      const statusBorder = newStatus === 'approved' ? '#16a34a' : '#dc2626';

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
  <table style="width:100%;border-collapse:collapse;">
    <tr><td align="center" style="padding:40px 0;">
      <table style="width:600px;background:#fff;box-shadow:0 4px 6px rgba(0,0,0,.1);border-collapse:collapse;">
        <tr><td style="padding:30px;background:${statusColor};text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;">Leave Request ${statusLabel}</h1>
        </td></tr>
        <tr><td style="padding:30px;">
          <p style="color:#333;font-size:16px;">Hi <strong>${employee.firstName}</strong>,</p>
          <p style="color:#555;font-size:15px;line-height:1.6;">
            Your leave request has been <strong>${newStatus}</strong>.
          </p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr><td style="padding:15px;background:${statusBg};border-left:4px solid ${statusBorder};border-radius:4px;">
              <p style="margin:0 0 8px;color:#555;font-size:14px;"><strong>Leave Type:</strong> ${typeLabel}</p>
              <p style="margin:0 0 8px;color:#555;font-size:14px;"><strong>Period:</strong> ${fmt(leave.startDate)} → ${fmt(leave.endDate)} (${leave.periodDays} day${leave.periodDays !== 1 ? 's' : ''})</p>
              <p style="margin:0 0 8px;color:#555;font-size:14px;"><strong>Status:</strong> <span style="color:${statusColor};font-weight:bold;">${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</span></p>
              ${actionNote ? `<p style="margin:0;color:#555;font-size:14px;"><strong>Note from manager:</strong> ${actionNote}</p>` : ''}
            </td></tr>
          </table>
          <p style="color:#999;font-size:13px;">If you have questions, please contact your manager.</p>
        </td></tr>
        <tr><td style="padding:20px;background:#f8fafc;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#999;font-size:12px;">This is an automated message from RosterMechanic. Please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

      await emailService.sendEmail({
        to: employee.email,
        subject: `Your leave request has been ${newStatus}`,
        html,
      });
    } catch (err) {
      logger.warn('Failed to send leave status email to employee:', err.message);
    }
  }

  async _notifyAdminNewRequest(leave, companyId) {
    try {
      // Find admin(s) for the company
      const admins = await User.find({ companyId, role: { $in: ['ADMIN', 'MANAGER'] }, isActive: true })
        .select('email name')
        .lean();
      if (!admins.length) return;

      const employee = await Employee.findById(leave.employeeId).lean();
      if (!employee) return;

      const typeLabel = {
        annual: 'Annual Leave',
        sick: 'Sick Leave',
        personal: 'Personal Leave',
        unpaid: 'Unpaid Leave',
      }[leave.leaveType] || leave.leaveType;

      const fmt = (d) =>
        new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
  <table style="width:100%;border-collapse:collapse;">
    <tr><td align="center" style="padding:40px 0;">
      <table style="width:600px;background:#fff;box-shadow:0 4px 6px rgba(0,0,0,.1);border-collapse:collapse;">
        <tr><td style="padding:30px;background:#2563eb;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;">New Leave Request</h1>
        </td></tr>
        <tr><td style="padding:30px;">
          <p style="color:#333;font-size:16px;">A new leave request has been submitted and requires your attention.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr><td style="padding:15px;background:#f0f9ff;border-left:4px solid #2563eb;border-radius:4px;">
              <p style="margin:0 0 8px;color:#555;font-size:14px;"><strong>Employee:</strong> ${employee.firstName} ${employee.lastName}</p>
              <p style="margin:0 0 8px;color:#555;font-size:14px;"><strong>Leave Type:</strong> ${typeLabel}</p>
              <p style="margin:0 0 8px;color:#555;font-size:14px;"><strong>Period:</strong> ${fmt(leave.startDate)} → ${fmt(leave.endDate)} (${leave.periodDays} day${leave.periodDays !== 1 ? 's' : ''})</p>
              ${leave.notes ? `<p style="margin:0;color:#555;font-size:14px;"><strong>Notes:</strong> ${leave.notes}</p>` : ''}
            </td></tr>
          </table>
          <p style="color:#999;font-size:13px;">Please log in to RosterMechanic to approve or decline this request.</p>
        </td></tr>
        <tr><td style="padding:20px;background:#f8fafc;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#999;font-size:12px;">This is an automated message from RosterMechanic.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

      for (const admin of admins) {
        await emailService.sendEmail({
          to: admin.email,
          subject: `New leave request from ${employee.firstName} ${employee.lastName}`,
          html,
        });
      }
    } catch (err) {
      logger.warn('Failed to send admin leave notification:', err.message);
    }
  }
}

module.exports = new LeaveService();
