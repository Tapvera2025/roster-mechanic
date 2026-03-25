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
const mongoose = require('mongoose');

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

    // Geofence validation
    const withinGeofence = this.isWithinGeofence(latitude, longitude, site);

    if (!withinGeofence) {
      const error = new Error(
        `You are outside the geofenced area for ${site.siteLocationName}. Please move closer to the site to clock in.`
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

    // Create time record
    const timeRecord = await TimeRecord.create({
      employeeId,
      siteId,
      shiftId: shiftId || null,
      companyId,
      clockInTime: new Date(),
      clockInLocation: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      clockInPhotoUrl: photoUrl || null,
      status: 'CLOCKED_IN',
      createdBy: userId,
    });

    // If shift provided, update shift status to IN_PROGRESS
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
        }
      );
    }

    // Populate and return
    await timeRecord.populate([
      { path: 'employeeId', select: 'firstName lastName email' },
      { path: 'siteId', select: 'siteLocationName shortName' },
      { path: 'shiftId', select: 'shiftType startTime endTime' },
    ]);

    return timeRecord;
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

    // Geofence validation
    const withinGeofence = this.isWithinGeofence(latitude, longitude, site);

    if (!withinGeofence) {
      const error = new Error(
        `You are outside the geofenced area for ${site.siteLocationName}. Please move closer to the site to clock out.`
      );
      error.statusCode = 403;
      throw error;
    }

    // Update time record
    const clockOutTime = new Date();
    timeRecord.clockOutTime = clockOutTime;
    timeRecord.clockOutLocation = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };
    timeRecord.clockOutPhotoUrl = photoUrl || null;
    timeRecord.status = 'CLOCKED_OUT';
    timeRecord.updatedBy = userId;

    // Calculate total hours (pre-save hook will do this, but we can also do it here)
    const diff = clockOutTime - timeRecord.clockInTime;
    timeRecord.totalHours = Math.round((diff / (1000 * 60 * 60)) * 100) / 100;

    await timeRecord.save();

    // If shift exists, update shift status to COMPLETED
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
        }
      );
    }

    // Populate and return
    await timeRecord.populate([
      { path: 'employeeId', select: 'firstName lastName email' },
      { path: 'siteId', select: 'siteLocationName shortName' },
      { path: 'shiftId', select: 'shiftType startTime endTime' },
    ]);

    return timeRecord;
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
   * @param {Object} filters - { startDate, endDate, siteId, employeeId, page, limit }
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

    const { startDate, endDate, siteId, employeeId, page = 1, limit = 50 } = filters;

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

    // Pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [records, total] = await Promise.all([
      TimeRecord.find(query)
        .populate('employeeId', 'firstName lastName email position')
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
      'Status',
    ];

    const rows = records.map((record) => {
      const employeeName = record.employeeId
        ? `${record.employeeId.firstName} ${record.employeeId.lastName}`
        : 'N/A';
      const employeeEmail = record.employeeId?.email || 'N/A';
      const siteName = record.siteId?.siteLocationName || 'N/A';

      const clockInDate = record.clockInTime
        ? new Date(record.clockInTime).toLocaleDateString()
        : 'N/A';
      const clockInTime = record.clockInTime
        ? new Date(record.clockInTime).toLocaleTimeString()
        : 'N/A';
      const clockOutDate = record.clockOutTime
        ? new Date(record.clockOutTime).toLocaleDateString()
        : 'N/A';
      const clockOutTime = record.clockOutTime
        ? new Date(record.clockOutTime).toLocaleTimeString()
        : 'N/A';
      const totalHours = record.totalHours || '0';
      const status = record.status;

      return [
        employeeName,
        employeeEmail,
        siteName,
        clockInDate,
        clockInTime,
        clockOutDate,
        clockOutTime,
        totalHours,
        status,
      ];
    });

    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }
}

module.exports = new ClockInOutService();
