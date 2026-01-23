/**
 * Scheduler Service
 *
 * Business logic for shift scheduling with multi-tenant isolation
 */

const Shift = require('../models/Shift');
const Site = require('../models/Site');
const Employee = require('../models/Employee');
const EmployeeSite = require('../models/EmployeeSite');
const mongoose = require('mongoose');

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
      .select('siteLocationName shortName jobRefNo address')
      .sort({ siteLocationName: 1 })
      .lean();

    return sites;
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

    // Filter out null employees (inactive ones)
    return assignments
      .filter((a) => a.employeeId)
      .map((a) => a.employeeId);
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

    return shifts;
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

    return shift;
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
      .populate('employeeId', 'firstName lastName position')
      .populate('siteId', 'siteLocationName shortName')
      .lean();

    return populatedShift;
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

      // Check conflicts
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
      .populate('employeeId', 'firstName lastName position')
      .populate('siteId', 'siteLocationName shortName')
      .lean();

    return populatedShift;
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
}

module.exports = new SchedulerService();
