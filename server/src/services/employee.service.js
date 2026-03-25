/**
 * Employee Service
 *
 * Business logic for employee management with multi-tenant isolation
 */

const Employee = require('../models/Employee');
const EmployeeSite = require('../models/EmployeeSite');
const User = require('../models/User');
const Company = require('../models/Company');
const mongoose = require('mongoose');
const emailService = require('./email.service');
const logger = require('../utils/logger');

class EmployeeService {
  /**
   * Generate a random temporary password
   * @returns {String} - Random password
   */
  generateTempPassword() {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

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

    // Transform _id to id for frontend compatibility
    const transformedEmployees = employees.map(emp => ({
      ...emp,
      id: emp._id.toString()
    }));

    return {
      employees: transformedEmployees,
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
      id: employee._id.toString(),
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

    // Auto-create User account for employee login (if password provided)
    let createdUserId = data.userId;
    let plainPassword = data.password; // Store for email
    let shouldSendEmail = false;

    logger.info('Employee creation - checking email conditions', {
      hasUserId: !!data.userId,
      hasPassword: !!data.password,
      sendInvitation: data.sendInvitation,
      email: data.email,
    });

    if (!data.userId && data.password) {
      // Check if user with this email already exists
      const existingUser = await User.findOne({
        email: data.email,
        companyId,
      });

      if (!existingUser) {
        // Create user account for the employee
        logger.info('Creating new user account for employee', { email: data.email });
        const newUser = await User.create({
          email: data.email,
          password: data.password,
          name: `${data.firstName} ${data.lastName}`,
          role: 'USER', // Employees get USER role by default
          companyId,
          createdBy: userId,
        });
        createdUserId = newUser._id;
        shouldSendEmail = true; // Send email for newly created user
        logger.info('User created - will send email', { userId: newUser._id, sendInvitation: data.sendInvitation });
      } else {
        // Use existing user account but send email if sendInvitation is true
        logger.info('User already exists - linking to employee', { email: data.email, userId: existingUser._id });
        createdUserId = existingUser._id;
        // If sendInvitation is enabled, send email even for existing users
        if (data.sendInvitation !== false) {
          shouldSendEmail = true;
          logger.info('Will send email for existing user (sendInvitation=true)');
        }
      }
    } else {
      logger.info('Skipping user creation - no password or userId provided', {
        hasUserId: !!data.userId,
        hasPassword: !!data.password,
      });
    }

    // Create employee with context
    const employee = await Employee.create({
      ...data,
      userId: createdUserId, // Link to user account
      companyId,
      createdBy: userId,
    });

    // Send welcome email if a new user account was created AND sendInvitation is true
    if (shouldSendEmail && plainPassword && data.sendInvitation !== false) {
      try {
        // Get company name for email
        const company = await Company.findById(companyId);
        const companyName = company?.name || 'Your Company';

        await emailService.sendWelcomeEmail({
          to: data.email,
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          password: plainPassword,
          role: 'USER',
          companyName,
        });

        logger.info('Welcome email sent successfully to employee', {
          employeeId: employee._id,
          email: data.email,
        });
      } catch (emailError) {
        // Log error but don't fail employee creation if email fails
        logger.error('Failed to send welcome email to employee', {
          employeeId: employee._id,
          email: data.email,
          error: emailError.message,
        });
      }
    } else if (shouldSendEmail && plainPassword && data.sendInvitation === false) {
      logger.info('Welcome email skipped - sendInvitation is false', {
        employeeId: employee._id,
        email: data.email,
      });
    }

    // Remove TFN from response
    const employeeObj = employee.toObject();
    delete employeeObj.tfn;
    delete employeeObj.password; // Don't return password

    return {
      ...employeeObj,
      id: employeeObj._id.toString()
    };
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

    // Check if email is being changed
    const emailChanged = data.email && data.email !== employee.email;
    const oldEmail = employee.email;

    // Update employee
    Object.assign(employee, data);
    employee.updatedBy = userId;

    await employee.save();

    // If email changed and employee has a linked user account, update user and send credentials
    if (emailChanged && employee.userId) {
      try {
        // Find the linked user account
        const user = await User.findOne({
          _id: employee.userId,
          companyId,
        });

        if (user) {
          // Generate new temporary password
          const newPassword = this.generateTempPassword();

          // Update user's email and password
          user.email = data.email;
          user.password = newPassword;
          user.passwordChangedAt = new Date();
          user.updatedBy = userId;

          await user.save();

          // Get company name for email
          const company = await Company.findById(companyId);
          const companyName = company?.name || 'Your Company';

          // Send credentials to new email
          await emailService.sendWelcomeEmail({
            to: data.email,
            name: `${employee.firstName} ${employee.lastName}`,
            email: data.email,
            password: newPassword,
            role: user.role,
            companyName,
          });

          logger.info('Email changed - credentials sent to new email', {
            employeeId: employee._id,
            oldEmail,
            newEmail: data.email,
          });
        }
      } catch (emailError) {
        // Log error but don't fail employee update if email fails
        logger.error('Failed to send credentials after email change', {
          employeeId: employee._id,
          newEmail: data.email,
          error: emailError.message,
        });
      }
    }

    // Remove TFN from response
    const employeeObj = employee.toObject();
    delete employeeObj.tfn;

    return {
      ...employeeObj,
      id: employeeObj._id.toString()
    };
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
