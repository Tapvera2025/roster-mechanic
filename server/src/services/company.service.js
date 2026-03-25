/**
 * Company Service
 *
 * Business logic for company/tenant management
 * Note: Company model does NOT have companyId (it's the tenant root)
 */

const Company = require('../models/Company');
const Employee = require('../models/Employee');
const Site = require('../models/Site');
const Shift = require('../models/Shift');
const User = require('../models/User');
const mongoose = require('mongoose');

class CompanyService {
  /**
   * Get all companies with filters and pagination
   * @param {Object} context - { role }
   * @param {Object} filters - { search, isActive, page, limit, sortBy, order }
   * @returns {Promise<Object>} - { companies, pagination }
   */
  async getAllCompanies(context, filters = {}) {
    const { role } = context;

    // Only ADMIN can list all companies
    if (role !== 'ADMIN') {
      const error = new Error('Access denied. Admin access required.');
      error.statusCode = 403;
      throw error;
    }

    const {
      search,
      isActive,
      page = 1,
      limit = 25,
      sortBy = 'createdAt',
      order = 'desc',
    } = filters;

    // Build query
    const query = {};

    // Apply filters
    if (isActive !== undefined) {
      query.isActive = isActive === 'true' || isActive === true;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { legalName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { businessNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;

    const [companies, total] = await Promise.all([
      Company.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Company.countDocuments(query),
    ]);

    return {
      companies,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single company by ID
   * @param {Object} context - { companyId, role }
   * @param {String} companyId
   * @returns {Promise<Object>} - Company document
   */
  async getCompanyById(context, companyId) {
    const { companyId: userCompanyId, role } = context;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      const error = new Error('Invalid company ID');
      error.statusCode = 400;
      throw error;
    }

    // ADMIN can view any company, others can only view their own
    if (role !== 'ADMIN' && companyId !== userCompanyId) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }

    const company = await Company.findById(companyId).lean();

    if (!company) {
      const error = new Error('Company not found');
      error.statusCode = 404;
      throw error;
    }

    return company;
  }

  /**
   * Create a new company
   * @param {Object} context - { userId, role }
   * @param {Object} data - Company data
   * @returns {Promise<Object>} - Created company
   */
  async createCompany(context, data) {
    const { userId, role } = context;

    // Only ADMIN can create companies
    if (role !== 'ADMIN') {
      const error = new Error('Access denied. Admin access required.');
      error.statusCode = 403;
      throw error;
    }

    // Check for duplicate business number (ABN)
    if (data.businessNumber) {
      const existingCompany = await Company.findOne({
        businessNumber: data.businessNumber,
      });

      if (existingCompany) {
        const error = new Error(
          'Company with this business number already exists'
        );
        error.statusCode = 409;
        throw error;
      }
    }

    // Check for duplicate email
    const existingByEmail = await Company.findOne({
      email: data.email,
    });

    if (existingByEmail) {
      const error = new Error('Company with this email already exists');
      error.statusCode = 409;
      throw error;
    }

    // Create company with audit fields
    const company = await Company.create({
      ...data,
      createdBy: userId,
    });

    return company.toObject();
  }

  /**
   * Update a company
   * @param {Object} context - { companyId, userId, role }
   * @param {String} companyId
   * @param {Object} data - Update data
   * @returns {Promise<Object>} - Updated company
   */
  async updateCompany(context, companyId, data) {
    const { companyId: userCompanyId, userId, role } = context;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      const error = new Error('Invalid company ID');
      error.statusCode = 400;
      throw error;
    }

    // ADMIN can update any company
    // MANAGER can only update their own company
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }

    if (role !== 'ADMIN' && companyId !== userCompanyId) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }

    // Find company
    const company = await Company.findById(companyId);

    if (!company) {
      const error = new Error('Company not found');
      error.statusCode = 404;
      throw error;
    }

    // Check for duplicate business number (excluding current company)
    if (data.businessNumber && data.businessNumber !== company.businessNumber) {
      const existingCompany = await Company.findOne({
        businessNumber: data.businessNumber,
        _id: { $ne: companyId },
      });

      if (existingCompany) {
        const error = new Error(
          'Company with this business number already exists'
        );
        error.statusCode = 409;
        throw error;
      }
    }

    // Check for duplicate email (excluding current company)
    if (data.email && data.email !== company.email) {
      const existingByEmail = await Company.findOne({
        email: data.email,
        _id: { $ne: companyId },
      });

      if (existingByEmail) {
        const error = new Error('Company with this email already exists');
        error.statusCode = 409;
        throw error;
      }
    }

    // Update company
    Object.assign(company, data);
    company.updatedBy = userId;

    await company.save();

    return company.toObject();
  }

  /**
   * Delete a company (soft delete)
   * @param {Object} context - { userId, role }
   * @param {String} companyId
   * @returns {Promise<Object>} - Success message
   */
  async deleteCompany(context, companyId) {
    const { userId, role } = context;

    // Only ADMIN can delete companies
    if (role !== 'ADMIN') {
      const error = new Error('Access denied. Admin access required.');
      error.statusCode = 403;
      throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      const error = new Error('Invalid company ID');
      error.statusCode = 400;
      throw error;
    }

    const company = await Company.findById(companyId);

    if (!company) {
      const error = new Error('Company not found');
      error.statusCode = 404;
      throw error;
    }

    // Set deletedBy before soft delete
    company.deletedBy = userId;

    // Soft delete
    if (typeof company.softDelete === 'function') {
      await company.softDelete();
    } else {
      company.deletedAt = new Date();
      await company.save();
    }

    // Note: We don't cascade delete users, employees, sites, etc.
    // They remain in the database for audit purposes with their companyId

    return { success: true, message: 'Company deleted successfully' };
  }

  /**
   * Get company statistics
   * @param {Object} context - { companyId, role }
   * @param {String} companyId
   * @returns {Promise<Object>} - Statistics
   */
  async getCompanyStats(context, companyId) {
    const { companyId: userCompanyId, role } = context;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      const error = new Error('Invalid company ID');
      error.statusCode = 400;
      throw error;
    }

    // ADMIN can view any company stats
    // MANAGER can only view their own company stats
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }

    if (role !== 'ADMIN' && companyId !== userCompanyId) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }

    // Verify company exists
    const company = await Company.findById(companyId);

    if (!company) {
      const error = new Error('Company not found');
      error.statusCode = 404;
      throw error;
    }

    // Get counts
    const [
      totalEmployees,
      activeEmployees,
      totalSites,
      activeSites,
      totalUsers,
      activeUsers,
      totalShifts,
      upcomingShifts,
    ] = await Promise.all([
      Employee.countDocuments({ companyId }),
      Employee.countDocuments({ companyId, isActive: true }),
      Site.countDocuments({ companyId }),
      Site.countDocuments({ companyId, status: 'ACTIVE' }),
      User.countDocuments({ companyId }),
      User.countDocuments({ companyId, isActive: true }),
      Shift.countDocuments({ companyId }),
      Shift.countDocuments({
        companyId,
        date: { $gte: new Date() },
        status: { $in: ['SCHEDULED', 'IN_PROGRESS'] },
      }),
    ]);

    return {
      companyId,
      companyName: company.name,
      employees: {
        total: totalEmployees,
        active: activeEmployees,
      },
      sites: {
        total: totalSites,
        active: activeSites,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      shifts: {
        total: totalShifts,
        upcoming: upcomingShifts,
      },
      subscription: company.subscription,
    };
  }
}

module.exports = new CompanyService();
