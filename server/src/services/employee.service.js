/**
 * Employee Service
 *
 * Business logic for employee management with multi-tenant isolation
 */

const Employee = require('../models/Employee');
const EmployeeSite = require('../models/EmployeeSite');
const User = require('../models/User');
const mongoose = require('mongoose');

class EmployeeService {
  /**
   * Get all employees with filters and pagination
   * @param {Object} context - { companyId, userId, role }
   * @param {Object} filters - { search, isActive, department, position, page, limit, sortBy, order }
   * @returns {Promise<Object>} - { employees, pagination }
   */
  async getAllEmployees(context, filters = {}) {
    const { companyId } = context;
    const {
      search,
      isActive,
      department,
      position,
      page = 1,
      limit = 25,
      sortBy = 'createdAt',
      order = 'desc',
    } = filters;

    // Build query with multi-tenant filter
    const query = { companyId };

    // Apply filters
    if (isActive !== undefined) {
      query.isActive = isActive === 'true' || isActive === true;
    }

    if (department) {
      query.department = department;
    }

    if (position) {
      query.position = position;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;

    const [employees, total] = await Promise.all([
      Employee.find(query)
        .select('-tfn') // Never return TFN
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Employee.countDocuments(query),
    ]);

    return {
      employees,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single employee by ID
   * @param {Object} context - { companyId, userId, role }
   * @param {String} employeeId
   * @returns {Promise<Object>} - Employee document
   */
  async getEmployeeById(context, employeeId) {
    const { companyId } = context;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      const error = new Error('Invalid employee ID');
      error.statusCode = 400;
      throw error;
    }

    const employee = await Employee.findOne({
      _id: employeeId,
      companyId,
    })
      .select('-tfn') // Never return TFN
      .populate('userId', 'name email role isActive lastLoginAt') // Populate user details
      .lean();

    if (!employee) {
      const error = new Error('Employee not found');
      error.statusCode = 404;
      throw error;
    }

    // Get assigned sites
    const siteAssignments = await EmployeeSite.find({
      employeeId,
      isActive: true,
    })
      .populate('siteId', 'siteLocationName shortName address')
      .lean();

    return {
      ...employee,
      assignedSites: siteAssignments,
    };
  }

  /**
   * Create a new employee
   * @param {Object} context - { companyId, userId }
   * @param {Object} data - Employee data
   * @returns {Promise<Object>} - Created employee
   */
  async createEmployee(context, data) {
    const { companyId, userId } = context;

    // Ensure companyId is present
    if (!companyId) {
      const error = new Error('Company ID is required');
      error.statusCode = 400;
      throw error;
    }

    // If userId is provided, validate it
    if (data.userId) {
      if (!mongoose.Types.ObjectId.isValid(data.userId)) {
        const error = new Error('Invalid user ID');
        error.statusCode = 400;
        throw error;
      }

      // Check if user exists and belongs to same company
      const user = await User.findOne({
        _id: data.userId,
        companyId,
      });

      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      // Validate that email matches user's email
      if (user.email.toLowerCase() !== data.email.toLowerCase()) {
        const error = new Error(
          'Employee email must match the linked user account email'
        );
        error.statusCode = 400;
        throw error;
      }

      // Check if userId is already linked to another employee in this company
      const existingEmployeeWithUser = await Employee.findOne({
        userId: data.userId,
        companyId,
      });

      if (existingEmployeeWithUser) {
        const error = new Error('This user is already linked to an employee');
        error.statusCode = 409;
        throw error;
      }
    }

    // Check for duplicate email within the company
    const existingEmployee = await Employee.findOne({
      email: data.email,
      companyId,
    });

    if (existingEmployee) {
      const error = new Error('Employee with this email already exists');
      error.statusCode = 409;
      throw error;
    }

    // Check for duplicate employee number if provided (within the company)
    if (data.employeeNumber) {
      const existingByNumber = await Employee.findOne({
        employeeNumber: data.employeeNumber,
        companyId,
      });

      if (existingByNumber) {
        const error = new Error(
          'Employee with this employee number already exists'
        );
        error.statusCode = 409;
        throw error;
      }
    }

    // Create employee with context
    const employee = await Employee.create({
      ...data,
      companyId,
      createdBy: userId,
    });

    // Remove TFN from response
    const employeeObj = employee.toObject();
    delete employeeObj.tfn;

    return employeeObj;
  }

  /**
   * Update an employee
   * @param {Object} context - { companyId, userId }
   * @param {String} employeeId
   * @param {Object} data - Update data
   * @returns {Promise<Object>} - Updated employee
   */
  async updateEmployee(context, employeeId, data) {
    const { companyId, userId } = context;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      const error = new Error('Invalid employee ID');
      error.statusCode = 400;
      throw error;
    }

    // Find employee and verify ownership
    const employee = await Employee.findOne({
      _id: employeeId,
      companyId,
    });

    if (!employee) {
      const error = new Error('Employee not found');
      error.statusCode = 404;
      throw error;
    }

    // If updating userId, validate it
    if (data.userId) {
      if (!mongoose.Types.ObjectId.isValid(data.userId)) {
        const error = new Error('Invalid user ID');
        error.statusCode = 400;
        throw error;
      }

      // Check if user exists and belongs to same company
      const user = await User.findOne({
        _id: data.userId,
        companyId,
      });

      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      // Get the email to validate (either from data or existing employee)
      const emailToValidate = data.email || employee.email;

      // Validate that email matches user's email
      if (user.email.toLowerCase() !== emailToValidate.toLowerCase()) {
        const error = new Error(
          'Employee email must match the linked user account email'
        );
        error.statusCode = 400;
        throw error;
      }

      // Check if userId is already linked to another employee in this company
      const existingEmployeeWithUser = await Employee.findOne({
        userId: data.userId,
        companyId,
        _id: { $ne: employeeId },
      });

      if (existingEmployeeWithUser) {
        const error = new Error(
          'This user is already linked to another employee'
        );
        error.statusCode = 409;
        throw error;
      }
    }

    // Check if updating email, ensure no duplicates within company
    if (data.email) {
      const existingEmployee = await Employee.findOne({
        email: data.email,
        companyId,
        _id: { $ne: employeeId },
      });

      if (existingEmployee) {
        const error = new Error('Employee with this email already exists');
        error.statusCode = 409;
        throw error;
      }
    }

    // Check if updating employee number, ensure no duplicates within company
    if (data.employeeNumber) {
      const existingByNumber = await Employee.findOne({
        employeeNumber: data.employeeNumber,
        companyId,
        _id: { $ne: employeeId },
      });

      if (existingByNumber) {
        const error = new Error(
          'Employee with this employee number already exists'
        );
        error.statusCode = 409;
        throw error;
      }
    }

    // Don't allow updating TFN or companyId through this endpoint
    delete data.tfn;
    delete data.companyId;

    // Update employee
    Object.assign(employee, data);
    employee.updatedBy = userId;

    await employee.save();

    // Remove TFN from response
    const employeeObj = employee.toObject();
    delete employeeObj.tfn;

    return employeeObj;
  }

  /**
   * Delete an employee (soft delete)
   * @param {Object} context - { companyId, userId }
   * @param {String} employeeId
   * @returns {Promise<Object>} - Success message
   */
  async deleteEmployee(context, employeeId) {
    const { companyId, userId } = context;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      const error = new Error('Invalid employee ID');
      error.statusCode = 400;
      throw error;
    }

    const employee = await Employee.findOne({
      _id: employeeId,
      companyId,
    });

    if (!employee) {
      const error = new Error('Employee not found');
      error.statusCode = 404;
      throw error;
    }

    // Set deletedBy before soft delete
    employee.deletedBy = userId;

    // Soft delete if plugin is available
    if (typeof employee.softDelete === 'function') {
      await employee.softDelete();
    } else {
      employee.deletedAt = new Date();
      await employee.save();
    }

    // Deactivate all site assignments
    await EmployeeSite.updateMany(
      { employeeId, companyId },
      { isActive: false, unassignedAt: new Date() }
    );

    return { success: true, message: 'Employee deleted successfully' };
  }

  /**
   * Assign employee to multiple sites
   * @param {Object} context - { companyId, userId }
   * @param {String} employeeId
   * @param {Array<String>} siteIds
   * @returns {Promise<Array>} - EmployeeSite assignments
   */
  async assignToSites(context, employeeId, siteIds) {
    const { companyId, userId } = context;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      const error = new Error('Invalid employee ID');
      error.statusCode = 400;
      throw error;
    }

    if (!Array.isArray(siteIds) || siteIds.length === 0) {
      const error = new Error('Site IDs array is required');
      error.statusCode = 400;
      throw error;
    }

    const employee = await Employee.findOne({
      _id: employeeId,
      companyId,
    });

    if (!employee) {
      const error = new Error('Employee not found');
      error.statusCode = 404;
      throw error;
    }

    if (!employee.isActive) {
      const error = new Error('Cannot assign sites to inactive employees');
      error.statusCode = 400;
      throw error;
    }

    const assignments = await Promise.all(
      siteIds.map(async (siteId) => {
        if (!mongoose.Types.ObjectId.isValid(siteId)) {
          const error = new Error(`Invalid site ID: ${siteId}`);
          error.statusCode = 400;
          throw error;
        }

        // Check if already assigned
        const existing = await EmployeeSite.findOne({
          employeeId,
          siteId,
          companyId,
        });

        if (existing) {
          // Reactivate if inactive
          if (!existing.isActive) {
            existing.isActive = true;
            existing.assignedAt = new Date();
            existing.unassignedAt = null;
            await existing.save();
          }
          return existing.toObject();
        }

        // Create new assignment
        const assignment = await EmployeeSite.create({
          employeeId,
          siteId,
          companyId,
          createdBy: userId,
        });

        return assignment.toObject();
      })
    );

    return assignments;
  }
}

module.exports = new EmployeeService();
