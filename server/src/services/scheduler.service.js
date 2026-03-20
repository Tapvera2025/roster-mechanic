/**
 * Scheduler Service
 *
 * Business logic for shift scheduling with multi-tenant isolation
 */

const Shift = require('../models/Shift');
const Site = require('../models/Site');
const Employee = require('../models/Employee');
const EmployeeSite = require('../models/EmployeeSite');
const Company = require('../models/Company');
const mongoose = require('mongoose');
const emailService = require('./email.service');
const logger = require('../utils/logger');
const { DateTime } = require('luxon');

class SchedulerService {
  /**
   * Get active sites for dropdown
   * @param {Object} context - { companyId }
   * @returns {Promise<Array>} - Active site list
   */
  async getActiveSites(context) {
    const { companyId } = context;

    const sites = await Site.find({
      companyId,
      status: 'ACTIVE',
    })
      .select('siteLocationName shortName jobRefNo address location')
      .sort({ siteLocationName: 1 })
      .lean();

    // Transform _id to id for frontend compatibility and extract coordinates
    return sites.map(site => ({
      ...site,
      id: site._id.toString(),
      latitude: site.location?.coordinates?.[1] || null,
      longitude: site.location?.coordinates?.[0] || null
    }));
  }

  /**
   * Get employees assigned to a site
   * @param {Object} context - { companyId }
   * @param {String} siteId
   * @returns {Promise<Array>} - Employees
   */
  async getSiteEmployees(context, siteId) {
    const { companyId } = context;

    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      const error = new Error('Invalid site ID');
      error.statusCode = 400;
      throw error;
    }

    // Verify site exists and belongs to company
    const site = await Site.findOne({
      _id: siteId,
      companyId,
    });

    if (!site) {
      const error = new Error('Site not found');
      error.statusCode = 404;
      throw error;
    }

    // Get active employee assignments for this site
    const assignments = await EmployeeSite.find({
      siteId,
      companyId,
      isActive: true,
    })
      .populate({
        path: 'employeeId',
        match: { isActive: true },
        select: 'firstName lastName email phone position',
      })
      .lean();

    // Filter out null employees (inactive ones) and transform _id to id
    return assignments
      .filter((a) => a.employeeId)
      .map((a) => ({
        ...a.employeeId,
        id: a.employeeId._id.toString()
      }));
  }

  /**
   * Get shifts for a site within date range
   * @param {Object} context - { companyId }
   * @param {String} siteId
   * @param {String} startDate - ISO date string
   * @param {String} endDate - ISO date string
   * @param {Object} filters - { employeeId, status }
   * @returns {Promise<Array>} - Shifts
   */
  async getSiteShifts(context, siteId, startDate, endDate, filters = {}) {
    const { companyId } = context;
    const { employeeId, status } = filters;

    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      const error = new Error('Invalid site ID');
      error.statusCode = 400;
      throw error;
    }

    // Verify site exists and belongs to company
    const site = await Site.findOne({
      _id: siteId,
      companyId,
    });

    if (!site) {
      const error = new Error('Site not found');
      error.statusCode = 404;
      throw error;
    }

    // Build query
    const query = {
      siteId,
      companyId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    if (employeeId) {
      if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        const error = new Error('Invalid employee ID');
        error.statusCode = 400;
        throw error;
      }
      query.employeeId = employeeId;
    }

    if (status) {
      query.status = status;
    }

    const shifts = await Shift.find(query)
      .populate('employeeId', 'firstName lastName position')
      .populate('siteId', 'siteLocationName shortName')
      .sort({ date: 1, startTime: 1 })
      .lean();

    // Transform _id to id for frontend compatibility
    return shifts.map(shift => ({
      ...shift,
      id: shift._id.toString(),
      employeeId: shift.employeeId ? {
        ...shift.employeeId,
        id: shift.employeeId._id.toString()
      } : null,
      siteId: shift.siteId ? {
        ...shift.siteId,
        id: shift.siteId._id.toString()
      } : shift.siteId
    }));
  }

  /**
   * Get a single shift by ID
   * @param {Object} context - { companyId }
   * @param {String} shiftId
   * @returns {Promise<Object>} - Shift
   */
  async getShiftById(context, shiftId) {
    const { companyId } = context;

    if (!mongoose.Types.ObjectId.isValid(shiftId)) {
      const error = new Error('Invalid shift ID');
      error.statusCode = 400;
      throw error;
    }

    const shift = await Shift.findOne({
      _id: shiftId,
      companyId,
    })
      .populate('employeeId', 'firstName lastName email phone position')
      .populate('siteId', 'siteLocationName shortName address')
      .lean();

    if (!shift) {
      const error = new Error('Shift not found');
      error.statusCode = 404;
      throw error;
    }

    // Transform _id to id for frontend compatibility
    return {
      ...shift,
      id: shift._id.toString(),
      employeeId: shift.employeeId ? {
        ...shift.employeeId,
        id: shift.employeeId._id.toString()
      } : null,
      siteId: shift.siteId ? {
        ...shift.siteId,
        id: shift.siteId._id.toString()
      } : shift.siteId
    };
  }

  /**
   * Create a new shift
   * @param {Object} context - { companyId, userId }
   * @param {Object} data - Shift data
   * @returns {Promise<Object>} - Created shift
   */
  async createShift(context, data) {
    const { companyId, userId } = context;

    // Ensure companyId is present
    if (!companyId) {
      const error = new Error('Company ID is required');
      error.statusCode = 400;
      throw error;
    }

    // Validate employee exists and belongs to company (if provided)
    if (data.employeeId) {
      if (!mongoose.Types.ObjectId.isValid(data.employeeId)) {
        const error = new Error('Invalid employee ID');
        error.statusCode = 400;
        throw error;
      }

      const employee = await Employee.findOne({
        _id: data.employeeId,
        companyId,
      });

      if (!employee) {
        const error = new Error('Employee not found');
        error.statusCode = 404;
        throw error;
      }

      if (!employee.isActive) {
        const error = new Error('Cannot assign shifts to inactive employee');
        error.statusCode = 400;
        throw error;
      }
    }

    // Validate site exists and belongs to company
    if (!mongoose.Types.ObjectId.isValid(data.siteId)) {
      const error = new Error('Invalid site ID');
      error.statusCode = 400;
      throw error;
    }

    const site = await Site.findOne({
      _id: data.siteId,
      companyId,
    });

    if (!site) {
      const error = new Error('Site not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if employee is assigned to this site (if employeeId provided)
    if (data.employeeId) {
      const assignment = await EmployeeSite.findOne({
        employeeId: data.employeeId,
        siteId: data.siteId,
        companyId,
        isActive: true,
      });

      if (!assignment) {
        const error = new Error('Employee is not assigned to this site');
        error.statusCode = 400;
        throw error;
      }
    }

    // Check for shift conflicts (if employeeId provided)
    if (data.employeeId) {
      const conflict = await Shift.findOne({
        employeeId: data.employeeId,
        date: new Date(data.date),
        companyId,
        status: { $nin: ['CANCELLED'] },
        $or: [
          {
            startTime: { $lte: data.startTime },
            endTime: { $gt: data.startTime },
          },
          {
            startTime: { $lt: data.endTime },
            endTime: { $gte: data.endTime },
          },
          {
            startTime: { $gte: data.startTime },
            endTime: { $lte: data.endTime },
          },
        ],
      });

      if (conflict) {
        const error = new Error(
          'Employee already has a shift during this time period'
        );
        error.statusCode = 409;
        throw error;
      }
    }

    // Create shift
    const shift = await Shift.create({
      ...data,
      companyId,
      createdBy: userId,
    });

    // Populate and return
    const populatedShift = await Shift.findById(shift._id)
      .populate('employeeId', 'firstName lastName email position')
      .populate('siteId', 'siteLocationName shortName')
      .lean();

    // Send shift assignment email to employee (if employee is assigned)
    if (populatedShift.employeeId && populatedShift.employeeId.email) {
      try {
        // Get company for timezone
        const company = await Company.findById(companyId);
        const timezone = company?.timezone || 'Australia/Sydney';

        // Format dates using company timezone
        const shiftDateTime = DateTime.fromJSDate(populatedShift.date).setZone(timezone);
        const startDateTime = DateTime.fromJSDate(populatedShift.startTime).setZone(timezone);
        const endDateTime = DateTime.fromJSDate(populatedShift.endTime).setZone(timezone);

        await emailService.sendShiftAssignmentEmail({
          to: populatedShift.employeeId.email,
          employeeName: `${populatedShift.employeeId.firstName} ${populatedShift.employeeId.lastName}`,
          siteName: populatedShift.siteId.siteLocationName,
          shiftDate: shiftDateTime.toFormat('dd/MM/yyyy'),
          startTime: startDateTime.toFormat('HH:mm'),
          endTime: endDateTime.toFormat('HH:mm'),
          shiftType: populatedShift.shiftType,
          notes: populatedShift.notes || '',
        });

        logger.info('Shift assignment email sent successfully', {
          shiftId: shift._id,
          employeeEmail: populatedShift.employeeId.email,
        });
      } catch (emailError) {
        // Log error but don't fail shift creation if email fails
        logger.error('Failed to send shift assignment email', {
          shiftId: shift._id,
          employeeEmail: populatedShift.employeeId.email,
          error: emailError.message,
        });
      }
    }

    // Transform _id to id for frontend compatibility
    return {
      ...populatedShift,
      id: populatedShift._id.toString(),
      employeeId: populatedShift.employeeId ? {
        ...populatedShift.employeeId,
        id: populatedShift.employeeId._id.toString()
      } : null,
      siteId: populatedShift.siteId ? {
        ...populatedShift.siteId,
        id: populatedShift.siteId._id.toString()
      } : populatedShift.siteId
    };
  }

  /**
   * Create an adhoc shift (skips conflict detection)
   * @param {Object} context - { companyId, userId }
   * @param {Object} data - Shift data
   * @returns {Promise<Object>} - Created adhoc shift
   */
  async createAdhocShift(context, data) {
    const { companyId, userId } = context;

    // Ensure companyId is present
    if (!companyId) {
      const error = new Error('Company ID is required');
      error.statusCode = 400;
      throw error;
    }

    // Mark as adhoc shift
    data.isAdhoc = true;

    // Validate employee exists and belongs to company (if provided)
    if (data.employeeId) {
      if (!mongoose.Types.ObjectId.isValid(data.employeeId)) {
        const error = new Error('Invalid employee ID');
        error.statusCode = 400;
        throw error;
      }

      const employee = await Employee.findOne({
        _id: data.employeeId,
        companyId,
      });

      if (!employee) {
        const error = new Error('Employee not found');
        error.statusCode = 404;
        throw error;
      }

      if (!employee.isActive) {
        const error = new Error('Cannot assign shifts to inactive employee');
        error.statusCode = 400;
        throw error;
      }
    }

    // Validate site exists and belongs to company
    if (!mongoose.Types.ObjectId.isValid(data.siteId)) {
      const error = new Error('Invalid site ID');
      error.statusCode = 400;
      throw error;
    }

    const site = await Site.findOne({
      _id: data.siteId,
      companyId,
    });

    if (!site) {
      const error = new Error('Site not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if employee is assigned to this site (if employeeId provided)
    if (data.employeeId) {
      const assignment = await EmployeeSite.findOne({
        employeeId: data.employeeId,
        siteId: data.siteId,
        companyId,
        isActive: true,
      });

      if (!assignment) {
        const error = new Error('Employee is not assigned to this site');
        error.statusCode = 400;
        throw error;
      }
    }

    // SKIP CONFLICT CHECK FOR ADHOC SHIFTS
    logger.info('Creating adhoc shift - skipping conflict detection', {
      employeeId: data.employeeId,
      siteId: data.siteId,
      date: data.date,
    });

    // Create adhoc shift
    const shift = await Shift.create({
      ...data,
      companyId,
      createdBy: userId,
    });

    // Populate and return
    const populatedShift = await Shift.findById(shift._id)
      .populate('employeeId', 'firstName lastName email position')
      .populate('siteId', 'siteLocationName shortName')
      .lean();

    // Send adhoc shift assignment email to employee (if employee is assigned)
    if (populatedShift.employeeId && populatedShift.employeeId.email) {
      try {
        // Get company for timezone
        const company = await Company.findById(companyId);
        const timezone = company?.timezone || 'Australia/Sydney';

        // Format dates using company timezone
        const shiftDateTime = DateTime.fromJSDate(populatedShift.date).setZone(timezone);
        const startDateTime = DateTime.fromJSDate(populatedShift.startTime).setZone(timezone);
        const endDateTime = DateTime.fromJSDate(populatedShift.endTime).setZone(timezone);

        await emailService.sendShiftAssignmentEmail({
          to: populatedShift.employeeId.email,
          employeeName: `${populatedShift.employeeId.firstName} ${populatedShift.employeeId.lastName}`,
          siteName: populatedShift.siteId.siteLocationName,
          shiftDate: shiftDateTime.toFormat('dd/MM/yyyy'),
          startTime: startDateTime.toFormat('HH:mm'),
          endTime: endDateTime.toFormat('HH:mm'),
          shiftType: populatedShift.shiftType,
          notes: populatedShift.notes || '',
          isAdhoc: true,
        });

        logger.info('Adhoc shift assignment email sent successfully', {
          shiftId: shift._id,
          employeeEmail: populatedShift.employeeId.email,
        });
      } catch (emailError) {
        // Log error but don't fail shift creation if email fails
        logger.error('Failed to send adhoc shift assignment email', {
          shiftId: shift._id,
          employeeEmail: populatedShift.employeeId.email,
          error: emailError.message,
        });
      }
    }

    // Transform _id to id for frontend compatibility
    return {
      ...populatedShift,
      id: populatedShift._id.toString(),
      employeeId: populatedShift.employeeId ? {
        ...populatedShift.employeeId,
        id: populatedShift.employeeId._id.toString()
      } : null,
      siteId: populatedShift.siteId ? {
        ...populatedShift.siteId,
        id: populatedShift.siteId._id.toString()
      } : populatedShift.siteId
    };
  }

  /**
   * Update a shift
   * @param {Object} context - { companyId, userId }
   * @param {String} shiftId
   * @param {Object} data - Update data
   * @returns {Promise<Object>} - Updated shift
   */
  async updateShift(context, shiftId, data) {
    const { companyId, userId } = context;

    if (!mongoose.Types.ObjectId.isValid(shiftId)) {
      const error = new Error('Invalid shift ID');
      error.statusCode = 400;
      throw error;
    }

    // Find shift and verify ownership
    const shift = await Shift.findOne({
      _id: shiftId,
      companyId,
    });

    if (!shift) {
      const error = new Error('Shift not found');
      error.statusCode = 404;
      throw error;
    }

    // Track if employee changed for email notification
    const oldEmployeeId = shift.employeeId ? shift.employeeId.toString() : null;
    const employeeChanged = data.employeeId && data.employeeId !== oldEmployeeId;

    // If updating employee, validate
    if (data.employeeId && data.employeeId !== shift.employeeId.toString()) {
      if (!mongoose.Types.ObjectId.isValid(data.employeeId)) {
        const error = new Error('Invalid employee ID');
        error.statusCode = 400;
        throw error;
      }

      const employee = await Employee.findOne({
        _id: data.employeeId,
        companyId,
      });

      if (!employee || !employee.isActive) {
        const error = new Error('Employee not found or inactive');
        error.statusCode = 404;
        throw error;
      }

      // Check assignment to site
      const siteId = data.siteId || shift.siteId;
      const assignment = await EmployeeSite.findOne({
        employeeId: data.employeeId,
        siteId,
        companyId,
        isActive: true,
      });

      if (!assignment) {
        const error = new Error('Employee is not assigned to this site');
        error.statusCode = 400;
        throw error;
      }

      // Check conflicts (skip for adhoc shifts)
      if (!shift.isAdhoc) {
        const conflict = await Shift.findOne({
          _id: { $ne: shiftId },
          employeeId: data.employeeId,
          date: data.date || shift.date,
          companyId,
          status: { $nin: ['CANCELLED'] },
          $or: [
            {
              startTime: { $lte: data.startTime || shift.startTime },
              endTime: { $gt: data.startTime || shift.startTime },
            },
            {
              startTime: { $lt: data.endTime || shift.endTime },
              endTime: { $gte: data.endTime || shift.endTime },
            },
          ],
        });

        if (conflict) {
          const error = new Error(
            'Employee already has a shift during this time period'
          );
          error.statusCode = 409;
          throw error;
        }
      } else {
        logger.info('Updating adhoc shift - skipping conflict detection', {
          shiftId,
          employeeId: data.employeeId,
        });
      }
    }

    // If updating site, validate
    if (data.siteId && data.siteId !== shift.siteId.toString()) {
      if (!mongoose.Types.ObjectId.isValid(data.siteId)) {
        const error = new Error('Invalid site ID');
        error.statusCode = 400;
        throw error;
      }

      const site = await Site.findOne({
        _id: data.siteId,
        companyId,
      });

      if (!site) {
        const error = new Error('Site not found');
        error.statusCode = 404;
        throw error;
      }
    }

    // Don't allow updating companyId
    delete data.companyId;

    // Update shift
    Object.assign(shift, data);
    shift.updatedBy = userId;

    await shift.save();

    // Populate and return
    const populatedShift = await Shift.findById(shift._id)
      .populate('employeeId', 'firstName lastName email position')
      .populate('siteId', 'siteLocationName shortName')
      .lean();

    // Send shift assignment email if employee was changed or assigned
    if (employeeChanged && populatedShift.employeeId && populatedShift.employeeId.email) {
      try {
        // Get company for timezone
        const company = await Company.findById(companyId);
        const timezone = company?.timezone || 'Australia/Sydney';

        // Format dates using company timezone
        const shiftDateTime = DateTime.fromJSDate(populatedShift.date).setZone(timezone);
        const startDateTime = DateTime.fromJSDate(populatedShift.startTime).setZone(timezone);
        const endDateTime = DateTime.fromJSDate(populatedShift.endTime).setZone(timezone);

        await emailService.sendShiftAssignmentEmail({
          to: populatedShift.employeeId.email,
          employeeName: `${populatedShift.employeeId.firstName} ${populatedShift.employeeId.lastName}`,
          siteName: populatedShift.siteId.siteLocationName,
          shiftDate: shiftDateTime.toFormat('dd/MM/yyyy'),
          startTime: startDateTime.toFormat('HH:mm'),
          endTime: endDateTime.toFormat('HH:mm'),
          shiftType: populatedShift.shiftType,
          notes: populatedShift.notes || '',
        });

        logger.info('Shift assignment email sent successfully (updated)', {
          shiftId: shift._id,
          employeeEmail: populatedShift.employeeId.email,
        });
      } catch (emailError) {
        // Log error but don't fail shift update if email fails
        logger.error('Failed to send shift assignment email (updated)', {
          shiftId: shift._id,
          employeeEmail: populatedShift.employeeId.email,
          error: emailError.message,
        });
      }
    }

    // Transform _id to id for frontend compatibility
    return {
      ...populatedShift,
      id: populatedShift._id.toString(),
      employeeId: populatedShift.employeeId ? {
        ...populatedShift.employeeId,
        id: populatedShift.employeeId._id.toString()
      } : null,
      siteId: populatedShift.siteId ? {
        ...populatedShift.siteId,
        id: populatedShift.siteId._id.toString()
      } : populatedShift.siteId
    };
  }

  /**
   * Delete a shift (soft delete)
   * @param {Object} context - { companyId, userId }
   * @param {String} shiftId
   * @returns {Promise<Object>} - Success message
   */
  async deleteShift(context, shiftId) {
    const { companyId, userId } = context;

    if (!mongoose.Types.ObjectId.isValid(shiftId)) {
      const error = new Error('Invalid shift ID');
      error.statusCode = 400;
      throw error;
    }

    const shift = await Shift.findOne({
      _id: shiftId,
      companyId,
    });

    if (!shift) {
      const error = new Error('Shift not found');
      error.statusCode = 404;
      throw error;
    }

    // Set deletedBy before soft delete
    shift.deletedBy = userId;

    // Soft delete if plugin is available
    if (typeof shift.softDelete === 'function') {
      await shift.softDelete();
    } else {
      shift.deletedAt = new Date();
      await shift.save();
    }

    return { success: true, message: 'Shift deleted successfully' };
  }

  /**
   * Get deleted shifts
   * @param {Object} context - { companyId }
   * @param {String} siteId - Optional site filter
   * @returns {Promise<Array>} - Deleted shifts
   */
  async getDeletedShifts(context, siteId = null) {
    const { companyId } = context;

    const query = {
      companyId,
      deletedAt: { $ne: null },
    };

    if (siteId && mongoose.Types.ObjectId.isValid(siteId)) {
      query.siteId = siteId;
    }

    const shifts = await Shift.find(query)
      .populate('siteId', 'siteLocationName shortName')
      .populate('employees', 'firstName lastName')
      .populate('deletedBy', 'firstName lastName')
      .sort({ deletedAt: -1 })
      .lean();

    return shifts.map(shift => ({
      ...shift,
      id: shift._id.toString(),
      site: shift.siteId,
    }));
  }

  /**
   * Restore a deleted shift
   * @param {Object} context - { companyId }
   * @param {String} shiftId
   * @returns {Promise<Object>} - Restored shift
   */
  async restoreShift(context, shiftId) {
    const { companyId } = context;

    if (!mongoose.Types.ObjectId.isValid(shiftId)) {
      const error = new Error('Invalid shift ID');
      error.statusCode = 400;
      throw error;
    }

    const shift = await Shift.findOne({
      _id: shiftId,
      companyId,
      deletedAt: { $ne: null },
    });

    if (!shift) {
      const error = new Error('Deleted shift not found');
      error.statusCode = 404;
      throw error;
    }

    // Restore the shift
    if (typeof shift.restore === 'function') {
      await shift.restore();
    } else {
      shift.deletedAt = null;
      shift.deletedBy = null;
      await shift.save();
    }

    // Reload with populated fields
    const restoredShift = await Shift.findById(shiftId)
      .populate('siteId', 'siteLocationName shortName')
      .populate('employees', 'firstName lastName')
      .lean();

    return {
      ...restoredShift,
      id: restoredShift._id.toString(),
    };
  }

  /**
   * Permanently delete a shift (hard delete)
   * @param {Object} context - { companyId }
   * @param {String} shiftId
   * @returns {Promise<Object>} - Success message
   */
  async permanentDeleteShift(context, shiftId) {
    const { companyId } = context;

    if (!mongoose.Types.ObjectId.isValid(shiftId)) {
      const error = new Error('Invalid shift ID');
      error.statusCode = 400;
      throw error;
    }

    const shift = await Shift.findOne({
      _id: shiftId,
      companyId,
      deletedAt: { $ne: null },
    });

    if (!shift) {
      const error = new Error('Deleted shift not found');
      error.statusCode = 404;
      throw error;
    }

    // Permanently delete from database
    await Shift.deleteOne({ _id: shiftId });

    logger.info('Shift permanently deleted', {
      shiftId,
      companyId,
      date: shift.date,
    });

    return { success: true, message: 'Shift permanently deleted' };
  }
}

module.exports = new SchedulerService();
