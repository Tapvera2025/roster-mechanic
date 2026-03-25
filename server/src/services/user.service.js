/**
 * User Service
 *
 * Business logic for user account management with multi-tenant isolation
 */

const User = require('../models/User');
const Employee = require('../models/Employee');
const Company = require('../models/Company');
const mongoose = require('mongoose');
const emailService = require('./email.service');
const logger = require('../utils/logger');

class UserService {
  /**
   * Get all users with filters and pagination
   * @param {Object} context - { companyId, role }
   * @param {Object} filters - { search, isActive, role, page, limit, sortBy, order }
   * @returns {Promise<Object>} - { users, pagination }
   */
  async getAllUsers(context, filters = {}) {
    const { companyId, role } = context;

    // Only ADMIN and MANAGER can list users
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }

    const {
      search,
      isActive,
      role: userRole,
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

    if (userRole) {
      query.role = userRole;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -refreshToken -passwordResetToken')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    return {
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single user by ID
   * @param {Object} context - { companyId, userId, role }
   * @param {String} userId
   * @returns {Promise<Object>} - User document
   */
  async getUserById(context, userId) {
    const { companyId, userId: currentUserId, role } = context;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error('Invalid user ID');
      error.statusCode = 400;
      throw error;
    }

    // Users can view their own profile
    // ADMIN/MANAGER can view users in their company
    const query = { _id: userId };

    if (role !== 'ADMIN' && userId !== currentUserId) {
      query.companyId = companyId;
    }

    const user = await User.findOne(query)
      .select('-password -refreshToken -passwordResetToken')
      .lean();

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Get linked employee if exists
    const employee = await Employee.findOne({
      userId: user._id,
      companyId: user.companyId,
    })
      .select('firstName lastName position department')
      .lean();

    return {
      ...user,
      linkedEmployee: employee || null,
    };
  }

  /**
   * Create a new user
   * @param {Object} context - { companyId, userId, role }
   * @param {Object} data - User data
   * @returns {Promise<Object>} - Created user
   */
  async createUser(context, data) {
    const { companyId, userId, role } = context;

    // Only ADMIN and MANAGER can create users
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }

    // Ensure companyId is present
    if (!companyId) {
      const error = new Error('Company ID is required');
      error.statusCode = 400;
      throw error;
    }

    // Check for duplicate email within company
    const existingUser = await User.findOne({
      email: data.email,
      companyId,
    });

    if (existingUser) {
      const error = new Error('User with this email already exists');
      error.statusCode = 409;
      throw error;
    }

    // MANAGER cannot create ADMIN users
    if (role === 'MANAGER' && data.role === 'ADMIN') {
      const error = new Error('Managers cannot create admin users');
      error.statusCode = 403;
      throw error;
    }

    // Store the plain password before creating user (for email)
    const plainPassword = data.password;

    // Create user with context
    // Password will be hashed automatically by User model pre-save hook
    const user = await User.create({
      ...data,
      companyId,
      createdBy: userId,
    });

    // Remove sensitive fields from response
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;
    delete userObj.passwordResetToken;

    // Send welcome email with login credentials
    try {
      // Get company name for email
      const company = await Company.findById(companyId);
      const companyName = company?.name || 'Your Company';

      await emailService.sendWelcomeEmail({
        to: user.email,
        name: user.name,
        email: user.email,
        password: plainPassword,
        role: user.role,
        companyName,
      });

      logger.info('Welcome email sent successfully', {
        userId: user._id,
        email: user.email,
      });
    } catch (emailError) {
      // Log error but don't fail user creation if email fails
      logger.error('Failed to send welcome email', {
        userId: user._id,
        email: user.email,
        error: emailError.message,
      });
    }

    return userObj;
  }

  /**
   * Update a user
   * @param {Object} context - { companyId, userId, role }
   * @param {String} userId
   * @param {Object} data - Update data
   * @returns {Promise<Object>} - Updated user
   */
  async updateUser(context, userId, data) {
    const { companyId, userId: currentUserId, role } = context;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error('Invalid user ID');
      error.statusCode = 400;
      throw error;
    }

    // Build query based on permissions
    const query = { _id: userId };

    // ADMIN can update any user
    // MANAGER can update users in their company (except ADMIN users)
    // USER can only update themselves
    if (role === 'USER' && userId !== currentUserId) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }

    if (role === 'MANAGER') {
      query.companyId = companyId;
    }

    // Find user
    const user = await User.findOne(query);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // MANAGER cannot update ADMIN users
    if (role === 'MANAGER' && user.role === 'ADMIN') {
      const error = new Error('Managers cannot update admin users');
      error.statusCode = 403;
      throw error;
    }

    // MANAGER cannot promote users to ADMIN
    if (role === 'MANAGER' && data.role === 'ADMIN') {
      const error = new Error('Managers cannot promote users to admin');
      error.statusCode = 403;
      throw error;
    }

    // USER cannot change their own role
    if (role === 'USER' && data.role && data.role !== user.role) {
      const error = new Error('Users cannot change their own role');
      error.statusCode = 403;
      throw error;
    }

    // Check for duplicate email (excluding current user)
    if (data.email && data.email !== user.email) {
      const existingUser = await User.findOne({
        email: data.email,
        companyId: user.companyId,
        _id: { $ne: userId },
      });

      if (existingUser) {
        const error = new Error('User with this email already exists');
        error.statusCode = 409;
        throw error;
      }
    }

    // Don't allow updating sensitive fields through this method
    delete data.password;
    delete data.refreshToken;
    delete data.passwordResetToken;
    delete data.companyId;

    // Update user
    Object.assign(user, data);
    user.updatedBy = currentUserId;

    await user.save();

    // Remove sensitive fields from response
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;
    delete userObj.passwordResetToken;

    return userObj;
  }

  /**
   * Delete a user (soft delete)
   * @param {Object} context - { companyId, userId, role }
   * @param {String} userId
   * @returns {Promise<Object>} - Success message
   */
  async deleteUser(context, userId) {
    const { companyId, userId: currentUserId, role } = context;

    // Only ADMIN and MANAGER can delete users
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error('Invalid user ID');
      error.statusCode = 400;
      throw error;
    }

    // Users cannot delete themselves
    if (userId === currentUserId) {
      const error = new Error('Cannot delete your own account');
      error.statusCode = 400;
      throw error;
    }

    // Build query
    const query = { _id: userId };

    if (role === 'MANAGER') {
      query.companyId = companyId;
    }

    const user = await User.findOne(query);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // MANAGER cannot delete ADMIN users
    if (role === 'MANAGER' && user.role === 'ADMIN') {
      const error = new Error('Managers cannot delete admin users');
      error.statusCode = 403;
      throw error;
    }

    // Set deletedBy before soft delete
    user.deletedBy = currentUserId;

    // Soft delete
    if (typeof user.softDelete === 'function') {
      await user.softDelete();
    } else {
      user.deletedAt = new Date();
      await user.save();
    }

    return { success: true, message: 'User deleted successfully' };
  }

  /**
   * Change user password
   * @param {Object} context - { companyId, userId, role }
   * @param {String} userId
   * @param {String} oldPassword
   * @param {String} newPassword
   * @returns {Promise<Object>} - Success message
   */
  async changePassword(context, userId, oldPassword, newPassword) {
    const { userId: currentUserId, role } = context;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error('Invalid user ID');
      error.statusCode = 400;
      throw error;
    }

    // Users can change their own password
    // ADMIN can reset any password
    if (role !== 'ADMIN' && userId !== currentUserId) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }

    // Find user with password field (normally excluded)
    const user = await User.findById(userId).select('+password');

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify old password (unless ADMIN is resetting)
    if (role !== 'ADMIN' || userId === currentUserId) {
      const isValid = await user.comparePassword(oldPassword);

      if (!isValid) {
        const error = new Error('Current password is incorrect');
        error.statusCode = 400;
        throw error;
      }
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    user.updatedBy = currentUserId;

    await user.save();

    return { success: true, message: 'Password changed successfully' };
  }

  /**
   * Link user to employee record
   * @param {Object} context - { companyId, userId, role }
   * @param {String} userId
   * @param {String} employeeId
   * @returns {Promise<Object>} - Success message
   */
  async linkToEmployee(context, userId, employeeId) {
    const { companyId, userId: currentUserId, role } = context;

    // Only ADMIN and MANAGER can link users to employees
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error('Invalid user ID');
      error.statusCode = 400;
      throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      const error = new Error('Invalid employee ID');
      error.statusCode = 400;
      throw error;
    }

    // Verify user exists and belongs to company
    const user = await User.findOne({
      _id: userId,
      companyId,
    });

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify employee exists and belongs to same company
    const employee = await Employee.findOne({
      _id: employeeId,
      companyId,
    });

    if (!employee) {
      const error = new Error('Employee not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify email match
    if (user.email.toLowerCase() !== employee.email.toLowerCase()) {
      const error = new Error('User and employee email addresses must match');
      error.statusCode = 400;
      throw error;
    }

    // Check if employee is already linked to another user
    const existingLink = await Employee.findOne({
      userId: { $exists: true, $ne: null },
      _id: employeeId,
    });

    if (existingLink && existingLink.userId.toString() !== userId) {
      const error = new Error('Employee is already linked to another user');
      error.statusCode = 409;
      throw error;
    }

    // Update employee with userId
    employee.userId = userId;
    employee.updatedBy = currentUserId;
    await employee.save();

    return {
      success: true,
      message: 'User linked to employee successfully',
    };
  }
}

module.exports = new UserService();
