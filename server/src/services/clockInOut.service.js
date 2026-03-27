/**
 * Clock In/Out Service
 *
 * Business logic for employee time tracking with geofencing
 * Handles clock in/out operations, geofence validation, and time records
 */

const TimeRecord = require('../models/TimeRecord');
const Site = require('../models/Site');
const Employee = require('../models/Employee');
const Shift = require('../models/Shift');
const GeofenceViolation = require('../models/GeofenceViolation');
const User = require('../models/User');
const mongoose = require('mongoose');
const { formatDateForCSV, formatTimeForCSV, formatDurationForCSV } = require('../utils/dateFormat');
const emailService = require('./email.service');

class ClockInOutService {
  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {Number} lat1 - Latitude of point 1
   * @param {Number} lon1 - Longitude of point 1
   * @param {Number} lat2 - Latitude of point 2
   * @param {Number} lon2 - Longitude of point 2
   * @returns {Number} - Distance in meters
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check if employee location is within site geofence
   * @param {Number} employeeLat - Employee latitude
   * @param {Number} employeeLon - Employee longitude
   * @param {Object} site - Site object with location and geoFenceRadius
   * @returns {Boolean} - True if within geofence
   */
  isWithinGeofence(employeeLat, employeeLon, site) {
    if (!site.location || !site.location.coordinates) {
      return false;
    }

    const siteLon = site.location.coordinates[0];
    const siteLat = site.location.coordinates[1];
    const radius = site.geoFenceRadius || 100; // Default 100m

    const distance = this.calculateDistance(employeeLat, employeeLon, siteLat, siteLon);

    return distance <= radius;
  }

  /**
   * Clock in an employee
   * @param {Object} context - { companyId, userId }
   * @param {Object} data - { employeeId, siteId, latitude, longitude, photoUrl, shiftId }
   * @returns {Promise<Object>} - Created TimeRecord
   */
  async clockIn(context, data) {
    const { companyId, userId } = context;
    const { employeeId, siteId, latitude, longitude, photoUrl, shiftId } = data;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      const error = new Error('Invalid employee ID');
      error.statusCode = 400;
      throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      const error = new Error('Invalid site ID');
      error.statusCode = 400;
      throw error;
    }

    // Verify employee exists and belongs to company
    const employee = await Employee.findOne({
      _id: employeeId,
      companyId,
      isActive: true,
    });

    if (!employee) {
      const error = new Error('Employee not found or inactive');
      error.statusCode = 404;
      throw error;
    }

    // Verify site exists and belongs to company
    const site = await Site.findOne({
      _id: siteId,
      companyId,
      status: 'ACTIVE',
    });

    if (!site) {
      const error = new Error('Site not found or inactive');
      error.statusCode = 404;
      throw error;
    }

    // Geofence validation - calculate distance
    const siteLon = site.location.coordinates[0];
    const siteLat = site.location.coordinates[1];
    const geofenceRadius = site.geoFenceRadius || 100;
    const distance = this.calculateDistance(latitude, longitude, siteLat, siteLon);
    const withinGeofence = distance <= geofenceRadius;

    if (!withinGeofence) {
      // Log geofence violation for audit trail
      try {
        await GeofenceViolation.create({
          employeeId,
          siteId,
          companyId,
          attemptType: 'CLOCK_IN',
          attemptLocation: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          siteLocation: {
            type: 'Point',
            coordinates: [siteLon, siteLat],
          },
          distanceFromSite: Math.round(distance),
          geofenceRadius,
          attemptTime: new Date(),
        });
      } catch (logError) {
        // Don't fail clock-in if logging fails, just log the error
        console.error('Failed to log geofence violation:', logError);
      }

      const error = new Error(
        `You are outside the geofenced area for ${site.siteLocationName}. You are ${Math.round(distance)}m away (limit: ${geofenceRadius}m). Please move closer to the site to clock in.`
      );
      error.statusCode = 403;
      throw error;
    }

    // Check if employee is already clocked in
    const existingClockIn = await TimeRecord.findOne({
      employeeId,
      companyId,
      status: 'CLOCKED_IN',
    });

    if (existingClockIn) {
      const error = new Error('You are already clocked in. Please clock out first.');
      error.statusCode = 409;
      throw error;
    }

    // Validate shift assignment if shiftId is provided
    if (shiftId && mongoose.Types.ObjectId.isValid(shiftId)) {
      const shift = await Shift.findOne({
        _id: shiftId,
        companyId,
      });

      if (!shift) {
        const error = new Error('Shift not found or does not belong to your company');
        error.statusCode = 404;
        throw error;
      }

      // Verify the shift is assigned to this employee
      if (shift.employeeId && shift.employeeId.toString() !== employeeId.toString()) {
        const error = new Error(
          'This shift is not assigned to you. Please select the correct shift or contact your manager.'
        );
        error.statusCode = 403;
        throw error;
      }

      // Verify the shift is in a valid status for clock-in
      if (shift.status !== 'SCHEDULED' && shift.status !== 'IN_PROGRESS') {
        const error = new Error(
          `Cannot clock in to a ${shift.status.toLowerCase()} shift. Please contact your manager.`
        );
        error.statusCode = 400;
        throw error;
      }
    }

    // Start a transaction session for atomic operations
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create time record within transaction
      const [timeRecord] = await TimeRecord.create(
        [
          {
            employeeId,
            siteId,
            shiftId: shiftId || null,
            companyId,
            clockInTime: new Date(),
            clockInLocation: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            clockInDistance: Math.round(distance), // Store distance for display
            clockInPhotoUrl: photoUrl || null,
            status: 'CLOCKED_IN',
            createdBy: userId,
          },
        ],
        { session }
      );

      // If shift provided, update shift status to IN_PROGRESS within transaction
      if (shiftId && mongoose.Types.ObjectId.isValid(shiftId)) {
        await Shift.findOneAndUpdate(
          {
            _id: shiftId,
            companyId,
          },
          {
            status: 'IN_PROGRESS',
            actualStartTime: new Date(),
            clockInLocation: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
          },
          { session }
        );
      }

      // Commit transaction if all operations succeed
      await session.commitTransaction();

      // Populate and return
      await timeRecord.populate([
        { path: 'employeeId', select: 'firstName lastName email' },
        { path: 'siteId', select: 'siteLocationName shortName' },
        { path: 'shiftId', select: 'shiftType startTime endTime' },
      ]);

      return timeRecord;
    } catch (error) {
      // Abort transaction on any error
      await session.abortTransaction();
      throw error;
    } finally {
      // Always end the session
      session.endSession();
    }
  }

  /**
   * Clock out an employee
   * @param {Object} context - { companyId, userId }
   * @param {Object} data - { employeeId, latitude, longitude, photoUrl }
   * @returns {Promise<Object>} - Updated TimeRecord
   */
  async clockOut(context, data) {
    const { companyId, userId } = context;
    const { employeeId, latitude, longitude, photoUrl } = data;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      const error = new Error('Invalid employee ID');
      error.statusCode = 400;
      throw error;
    }

    // Find active clock-in record
    const timeRecord = await TimeRecord.findOne({
      employeeId,
      companyId,
      status: 'CLOCKED_IN',
    }).populate('siteId');

    if (!timeRecord) {
      const error = new Error('No active clock-in found. Please clock in first.');
      error.statusCode = 404;
      throw error;
    }

    // Get site for geofence validation
    const site = timeRecord.siteId;

    // Geofence validation - calculate distance
    const siteLon = site.location.coordinates[0];
    const siteLat = site.location.coordinates[1];
    const geofenceRadius = site.geoFenceRadius || 100;
    const distance = this.calculateDistance(latitude, longitude, siteLat, siteLon);
    const withinGeofence = distance <= geofenceRadius;

    if (!withinGeofence) {
      // Log geofence violation for audit trail
      try {
        await GeofenceViolation.create({
          employeeId: timeRecord.employeeId,
          siteId: site._id,
          companyId,
          attemptType: 'CLOCK_OUT',
          attemptLocation: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          siteLocation: {
            type: 'Point',
            coordinates: [siteLon, siteLat],
          },
          distanceFromSite: Math.round(distance),
          geofenceRadius,
          attemptTime: new Date(),
        });
      } catch (logError) {
        // Don't fail clock-out if logging fails, just log the error
        console.error('Failed to log geofence violation:', logError);
      }

      const error = new Error(
        `You are outside the geofenced area for ${site.siteLocationName}. You are ${Math.round(distance)}m away (limit: ${geofenceRadius}m). Please move closer to the site to clock out.`
      );
      error.statusCode = 403;
      throw error;
    }

    // Start a transaction session for atomic operations
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update time record within transaction
      const clockOutTime = new Date();
      timeRecord.clockOutTime = clockOutTime;
      timeRecord.clockOutLocation = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };
      timeRecord.clockOutDistance = Math.round(distance); // Store distance for display
      timeRecord.clockOutPhotoUrl = photoUrl || null;
      timeRecord.status = 'CLOCKED_OUT';
      timeRecord.updatedBy = userId;

      // Calculate total hours (pre-save hook will do this, but we can also do it here)
      const diff = clockOutTime - timeRecord.clockInTime;
      timeRecord.totalHours = Math.round((diff / (1000 * 60 * 60)) * 100) / 100;

      await timeRecord.save({ session });

      // If shift exists, update shift status to COMPLETED within transaction
      if (timeRecord.shiftId) {
        await Shift.findOneAndUpdate(
          {
            _id: timeRecord.shiftId,
            companyId,
          },
          {
            status: 'COMPLETED',
            actualEndTime: clockOutTime,
            clockOutLocation: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
          },
          { session }
        );
      }

      // Commit transaction if all operations succeed
      await session.commitTransaction();

      // Populate and return
      await timeRecord.populate([
        { path: 'employeeId', select: 'firstName lastName email' },
        { path: 'siteId', select: 'siteLocationName shortName' },
        { path: 'shiftId', select: 'shiftType startTime endTime' },
      ]);

      return timeRecord;
    } catch (error) {
      // Abort transaction on any error
      await session.abortTransaction();
      throw error;
    } finally {
      // Always end the session
      session.endSession();
    }
  }

  /**
   * Get current clock-in status for an employee
   * @param {Object} context - { companyId }
   * @param {String} employeeId
   * @returns {Promise<Object|null>} - Active TimeRecord or null
   */
  async getCurrentStatus(context, employeeId) {
    const { companyId } = context;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      const error = new Error('Invalid employee ID');
      error.statusCode = 400;
      throw error;
    }

    const timeRecord = await TimeRecord.findOne({
      employeeId,
      companyId,
      status: 'CLOCKED_IN',
    })
      .populate('employeeId', 'firstName lastName email')
      .populate('siteId', 'siteLocationName shortName')
      .populate('shiftId', 'shiftType startTime endTime')
      .lean();

    return timeRecord;
  }

  /**
   * Get employee time record history
   * @param {Object} context - { companyId }
   * @param {String} employeeId
   * @param {Object} filters - { startDate, endDate, siteId, page, limit }
   * @returns {Promise<Object>} - { records, pagination }
   */
  async getEmployeeHistory(context, employeeId, filters = {}) {
    const { companyId } = context;
    const { startDate, endDate, siteId, page = 1, limit = 20 } = filters;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      const error = new Error('Invalid employee ID');
      error.statusCode = 400;
      throw error;
    }

    // Build query
    const query = {
      employeeId,
      companyId,
    };

    // Date range filter
    if (startDate || endDate) {
      query.clockInTime = {};
      if (startDate) query.clockInTime.$gte = new Date(startDate);
      if (endDate) query.clockInTime.$lte = new Date(endDate);
    }

    // Site filter
    if (siteId && mongoose.Types.ObjectId.isValid(siteId)) {
      query.siteId = siteId;
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [records, total] = await Promise.all([
      TimeRecord.find(query)
        .populate('employeeId', 'firstName lastName email')
        .populate('siteId', 'siteLocationName shortName')
        .populate('shiftId', 'shiftType')
        .sort({ clockInTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TimeRecord.countDocuments(query),
    ]);

    return {
      records,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get time records for manager view (all employees)
   * @param {Object} context - { companyId, role }
   * @param {Object} filters - { startDate, endDate, siteId, employeeId, approvalStatus, page, limit }
   * @returns {Promise<Object>} - { records, pagination }
   */
  async getManagerView(context, filters = {}) {
    const { companyId, role } = context;

    // Check authorization
    if (!['ADMIN', 'MANAGER'].includes(role)) {
      const error = new Error('Unauthorized. Manager or Admin role required.');
      error.statusCode = 403;
      throw error;
    }

    const { startDate, endDate, siteId, employeeId, approvalStatus, page = 1, limit = 50 } = filters;

    // Build query
    const query = { companyId };

    // Date range filter
    if (startDate || endDate) {
      query.clockInTime = {};
      if (startDate) query.clockInTime.$gte = new Date(startDate);
      if (endDate) query.clockInTime.$lte = new Date(endDate);
    }

    // Site filter
    if (siteId && mongoose.Types.ObjectId.isValid(siteId)) {
      query.siteId = siteId;
    }

    // Employee filter
    if (employeeId && mongoose.Types.ObjectId.isValid(employeeId)) {
      query.employeeId = employeeId;
    }

    // Approval status filter
    if (approvalStatus && ['PENDING', 'APPROVED', 'REJECTED', 'VOID'].includes(approvalStatus)) {
      query.approvalStatus = approvalStatus;
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [records, total] = await Promise.all([
      TimeRecord.find(query)
        .populate('employeeId', 'firstName lastName email position')
        .populate('siteId', 'siteLocationName shortName geoFenceRadius')
        .populate('shiftId', 'shiftType')
        .sort({ clockInTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TimeRecord.countDocuments(query),
    ]);

    return {
      records,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Export time records to CSV
   * @param {Object} context - { companyId, role }
   * @param {Object} filters - { startDate, endDate, siteId, employeeId }
   * @returns {Promise<String>} - CSV string
   */
  async exportToCSV(context, filters = {}) {
    const { companyId, role } = context;

    // Check authorization
    if (!['ADMIN', 'MANAGER'].includes(role)) {
      const error = new Error('Unauthorized. Manager or Admin role required.');
      error.statusCode = 403;
      throw error;
    }

    const { startDate, endDate, siteId, employeeId } = filters;

    // Build query (no pagination for export)
    const query = { companyId };

    if (startDate || endDate) {
      query.clockInTime = {};
      if (startDate) query.clockInTime.$gte = new Date(startDate);
      if (endDate) query.clockInTime.$lte = new Date(endDate);
    }

    if (siteId && mongoose.Types.ObjectId.isValid(siteId)) {
      query.siteId = siteId;
    }

    if (employeeId && mongoose.Types.ObjectId.isValid(employeeId)) {
      query.employeeId = employeeId;
    }

    // Fetch all records
    const records = await TimeRecord.find(query)
      .populate('employeeId', 'firstName lastName email')
      .populate('siteId', 'siteLocationName shortName')
      .sort({ clockInTime: -1 })
      .lean();

    // Generate CSV
    const headers = [
      'Employee Name',
      'Employee Email',
      'Site',
      'Clock In Date',
      'Clock In Time',
      'Clock Out Date',
      'Clock Out Time',
      'Total Hours',
      'Break Time (minutes)',
      'Worked Hours',
      'Number of Breaks',
      'Status',
      'Approval Status',
    ];

    const rows = records.map((record) => {
      const employeeName = record.employeeId
        ? `${record.employeeId.firstName} ${record.employeeId.lastName}`
        : 'N/A';
      const employeeEmail = record.employeeId?.email || 'N/A';
      const siteName = record.siteId?.siteLocationName || 'N/A';

      // Use standardized date/time formatting for CSV (ISO format for Excel compatibility)
      const clockInDate = record.clockInTime ? formatDateForCSV(record.clockInTime) : '';
      const clockInTime = record.clockInTime ? formatTimeForCSV(record.clockInTime) : '';
      const clockOutDate = record.clockOutTime ? formatDateForCSV(record.clockOutTime) : '';
      const clockOutTime = record.clockOutTime ? formatTimeForCSV(record.clockOutTime) : '';
      const totalHours = record.totalHours ? formatDurationForCSV(record.totalHours) : '0.00';
      const breakMinutes = record.totalBreakMinutes || 0;
      const workedHours = record.totalHours ? formatDurationForCSV(Math.max(0, record.totalHours - (breakMinutes / 60))) : '0.00';
      const numberOfBreaks = record.breaks ? record.breaks.length : 0;
      const status = record.status;
      const approvalStatus = record.approvalStatus || 'PENDING';

      return [
        employeeName,
        employeeEmail,
        siteName,
        clockInDate,
        clockInTime,
        clockOutDate,
        clockOutTime,
        totalHours,
        breakMinutes,
        workedHours,
        numberOfBreaks,
        status,
        approvalStatus,
      ];
    });

    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Approve a time record
   * @param {Object} context - { companyId, userId, role }
   * @param {String} timeRecordId - TimeRecord ID to approve
   * @returns {Promise<Object>} - Updated TimeRecord
   */
  async approveTimeRecord(context, timeRecordId) {
    const { companyId, userId, role } = context;

    // Check authorization - only managers and admins can approve
    if (!['ADMIN', 'MANAGER'].includes(role)) {
      const error = new Error('Unauthorized. Manager or Admin role required.');
      error.statusCode = 403;
      throw error;
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(timeRecordId)) {
      const error = new Error('Invalid time record ID');
      error.statusCode = 400;
      throw error;
    }

    // Find time record
    const timeRecord = await TimeRecord.findOne({
      _id: timeRecordId,
      companyId,
    });

    if (!timeRecord) {
      const error = new Error('Time record not found');
      error.statusCode = 404;
      throw error;
    }

    // Update approval status
    timeRecord.approvalStatus = 'APPROVED';
    timeRecord.approvedBy = userId;
    timeRecord.approvedAt = new Date();
    timeRecord.rejectionReason = null; // Clear any previous rejection reason

    await timeRecord.save();

    // Populate and return
    await timeRecord.populate([
      { path: 'employeeId', select: 'firstName lastName email' },
      { path: 'siteId', select: 'siteLocationName shortName' },
      { path: 'approvedBy', select: 'firstName lastName email' },
    ]);

    return timeRecord;
  }

  /**
   * Reject a time record
   * @param {Object} context - { companyId, userId, role }
   * @param {String} timeRecordId - TimeRecord ID to reject
   * @param {String} reason - Rejection reason
   * @returns {Promise<Object>} - Updated TimeRecord
   */
  async rejectTimeRecord(context, timeRecordId, reason) {
    const { companyId, userId, role } = context;

    // Check authorization - only managers and admins can reject
    if (!['ADMIN', 'MANAGER'].includes(role)) {
      const error = new Error('Unauthorized. Manager or Admin role required.');
      error.statusCode = 403;
      throw error;
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(timeRecordId)) {
      const error = new Error('Invalid time record ID');
      error.statusCode = 400;
      throw error;
    }

    // Validate reason
    if (!reason || reason.trim().length === 0) {
      const error = new Error('Rejection reason is required');
      error.statusCode = 400;
      throw error;
    }

    // Find time record
    const timeRecord = await TimeRecord.findOne({
      _id: timeRecordId,
      companyId,
    });

    if (!timeRecord) {
      const error = new Error('Time record not found');
      error.statusCode = 404;
      throw error;
    }

    // Update approval status
    timeRecord.approvalStatus = 'REJECTED';
    timeRecord.approvedBy = userId;
    timeRecord.approvedAt = new Date();
    timeRecord.rejectionReason = reason.trim();

    await timeRecord.save();

    // Populate and return
    await timeRecord.populate([
      { path: 'employeeId', select: 'firstName lastName email' },
      { path: 'siteId', select: 'siteLocationName shortName' },
      { path: 'approvedBy', select: 'firstName lastName email' },
    ]);

    // Send rejection email notification to employee
    try {
      const employee = timeRecord.employeeId;
      const site = timeRecord.siteId;
      const approver = timeRecord.approvedBy;

      if (employee && employee.email) {
        // Format date and time for email
        const clockInDate = timeRecord.clockInTime
          ? new Date(timeRecord.clockInTime).toLocaleDateString('en-AU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : 'N/A';

        const clockInTime = timeRecord.clockInTime
          ? new Date(timeRecord.clockInTime).toLocaleTimeString('en-AU', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'N/A';

        const clockOutTime = timeRecord.clockOutTime
          ? new Date(timeRecord.clockOutTime).toLocaleTimeString('en-AU', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Not clocked out';

        await emailService.sendTimeRecordRejectionEmail({
          to: employee.email,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          siteName: site?.siteLocationName || 'N/A',
          clockInDate,
          clockInTime,
          clockOutTime,
          rejectionReason: reason.trim(),
          rejectedBy: approver ? `${approver.firstName} ${approver.lastName}` : 'Manager',
        });

        console.log(`Rejection email sent to ${employee.email} for time record ${timeRecordId}`);
      }
    } catch (emailError) {
      // Log error but don't fail the rejection if email fails
      console.error('Failed to send rejection email:', emailError);
    }

    return timeRecord;
  }

  /**
   * Bulk approve time records
   * @param {Object} context - { companyId, userId, role }
   * @param {Array<String>} timeRecordIds - Array of TimeRecord IDs to approve
   * @returns {Promise<Object>} - { approved: count, failed: count }
   */
  async bulkApproveTimeRecords(context, timeRecordIds) {
    const { companyId, userId, role } = context;

    // Check authorization
    if (!['ADMIN', 'MANAGER'].includes(role)) {
      const error = new Error('Unauthorized. Manager or Admin role required.');
      error.statusCode = 403;
      throw error;
    }

    let approved = 0;
    let failed = 0;

    for (const timeRecordId of timeRecordIds) {
      try {
        await this.approveTimeRecord(context, timeRecordId);
        approved++;
      } catch (error) {
        failed++;
        console.error(`Failed to approve time record ${timeRecordId}:`, error.message);
      }
    }

    return { approved, failed, total: timeRecordIds.length };
  }

  /**
   * Bulk reject time records
   * @param {Object} context - { companyId, userId, role }
   * @param {Array<String>} timeRecordIds - Array of TimeRecord IDs to reject
   * @param {String} reason - Rejection reason
   * @returns {Promise<Object>} - { rejected: count, failed: count, emailsSent: count }
   */
  async bulkRejectTimeRecords(context, timeRecordIds, reason) {
    const { companyId, userId, role } = context;

    // Check authorization
    if (!['ADMIN', 'MANAGER'].includes(role)) {
      const error = new Error('Unauthorized. Manager or Admin role required.');
      error.statusCode = 403;
      throw error;
    }

    // Validate reason
    if (!reason || reason.trim().length === 0) {
      const error = new Error('Rejection reason is required');
      error.statusCode = 400;
      throw error;
    }

    let rejected = 0;
    let failed = 0;
    let emailsSent = 0;

    for (const timeRecordId of timeRecordIds) {
      try {
        // Note: rejectTimeRecord now sends emails automatically
        await this.rejectTimeRecord(context, timeRecordId, reason);
        rejected++;
        emailsSent++; // Email is sent in rejectTimeRecord
      } catch (error) {
        failed++;
        console.error(`Failed to reject time record ${timeRecordId}:`, error.message);
      }
    }

    return { rejected, failed, total: timeRecordIds.length, emailsSent };
  }

  /**
   * Start a break for an active time record
   * @param {Object} context - { companyId, userId }
   * @param {String} employeeId - Employee ID
   * @param {String} breakType - Type of break (LUNCH, BREAK, OTHER)
   * @param {String} notes - Optional notes
   * @returns {Promise<Object>} - Updated TimeRecord
   */
  async startBreak(context, employeeId, breakType = 'BREAK', notes = '') {
    const { companyId } = context;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      const error = new Error('Invalid employee ID');
      error.statusCode = 400;
      throw error;
    }

    // Find active clock-in record
    const timeRecord = await TimeRecord.findOne({
      employeeId,
      companyId,
      status: 'CLOCKED_IN',
    }).populate('employeeId siteId');

    if (!timeRecord) {
      const error = new Error('No active clock-in found. Please clock in first.');
      error.statusCode = 404;
      throw error;
    }

    // Check if already on break
    const lastBreak = timeRecord.breaks && timeRecord.breaks.length > 0
      ? timeRecord.breaks[timeRecord.breaks.length - 1]
      : null;

    if (lastBreak && lastBreak.startTime && !lastBreak.endTime) {
      const error = new Error('You are already on a break. Please end the current break first.');
      error.statusCode = 409;
      throw error;
    }

    // Add new break
    timeRecord.breaks.push({
      startTime: new Date(),
      breakType: breakType || 'BREAK',
      notes: notes || '',
    });

    await timeRecord.save();

    await timeRecord.populate([
      { path: 'employeeId', select: 'firstName lastName email' },
      { path: 'siteId', select: 'siteLocationName shortName' },
    ]);

    return timeRecord;
  }

  /**
   * End a break for an active time record
   * @param {Object} context - { companyId, userId }
   * @param {String} employeeId - Employee ID
   * @returns {Promise<Object>} - Updated TimeRecord
   */
  async endBreak(context, employeeId) {
    const { companyId } = context;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      const error = new Error('Invalid employee ID');
      error.statusCode = 400;
      throw error;
    }

    // Find active clock-in record
    const timeRecord = await TimeRecord.findOne({
      employeeId,
      companyId,
      status: 'CLOCKED_IN',
    }).populate('employeeId siteId');

    if (!timeRecord) {
      const error = new Error('No active clock-in found.');
      error.statusCode = 404;
      throw error;
    }

    // Check if on break
    const lastBreak = timeRecord.breaks && timeRecord.breaks.length > 0
      ? timeRecord.breaks[timeRecord.breaks.length - 1]
      : null;

    if (!lastBreak || !lastBreak.startTime || lastBreak.endTime) {
      const error = new Error('You are not currently on a break.');
      error.statusCode = 409;
      throw error;
    }

    // End the break
    lastBreak.endTime = new Date();
    await timeRecord.save();

    await timeRecord.populate([
      { path: 'employeeId', select: 'firstName lastName email' },
      { path: 'siteId', select: 'siteLocationName shortName' },
    ]);

    return timeRecord;
  }
}

module.exports = new ClockInOutService();
