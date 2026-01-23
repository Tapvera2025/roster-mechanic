/**
 * Sites Service
 *
 * Business logic for site/location management with multi-tenant isolation
 */

const Site = require('../models/Site');
const EmployeeSite = require('../models/EmployeeSite');
const AccessCode = require('../models/AccessCode');
const mongoose = require('mongoose');

class SitesService {
  /**
   * Get all sites with filters and pagination
   * @param {Object} context - { companyId, userId, role }
   * @param {Object} filters - { status, state, client, search, page, limit, sortBy, order }
   * @returns {Promise<Object>} - { sites, pagination }
   */
  async getAllSites(context, filters = {}) {
    const { companyId } = context;
    const {
      status,
      state,
      client,
      search,
      page = 1,
      limit = 25,
      sortBy = 'createdAt',
      order = 'desc',
    } = filters;

    // Build query with multi-tenant filter
    const query = { companyId };

    // Apply filters
    if (status) {
      query.status = status;
    }

    if (state) {
      query.state = state;
    }

    if (client) {
      query.client = { $regex: client, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { siteLocationName: { $regex: search, $options: 'i' } },
        { shortName: { $regex: search, $options: 'i' } },
        { jobRefNo: { $regex: search, $options: 'i' } },
        { client: { $regex: search, $options: 'i' } },
        { 'address.townSuburb': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;

    const [sites, total] = await Promise.all([
      Site.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Site.countDocuments(query),
    ]);

    return {
      sites,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single site by ID
   * @param {Object} context - { companyId }
   * @param {String} siteId
   * @returns {Promise<Object>} - Site document
   */
  async getSiteById(context, siteId) {
    const { companyId } = context;

    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      const error = new Error('Invalid site ID');
      error.statusCode = 400;
      throw error;
    }

    const site = await Site.findOne({
      _id: siteId,
      companyId,
    }).lean();

    if (!site) {
      const error = new Error('Site not found');
      error.statusCode = 404;
      throw error;
    }

    return site;
  }

  /**
   * Create a new site
   * @param {Object} context - { companyId, userId }
   * @param {Object} data - Site data
   * @returns {Promise<Object>} - Created site
   */
  async createSite(context, data) {
    const { companyId, userId } = context;

    // Ensure companyId is present
    if (!companyId) {
      const error = new Error('Company ID is required');
      error.statusCode = 400;
      throw error;
    }

    // Handle geolocation - convert to GeoJSON Point
    if (data.latitude && data.longitude) {
      data.location = {
        type: 'Point',
        coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
      };
      // Remove flat fields
      delete data.latitude;
      delete data.longitude;
    }

    // Check for duplicate shortName within company
    if (data.shortName) {
      const existingSite = await Site.findOne({
        shortName: data.shortName,
        companyId,
      });

      if (existingSite) {
        const error = new Error('Site with this short name already exists');
        error.statusCode = 409;
        throw error;
      }
    }

    // Create site with context
    const site = await Site.create({
      ...data,
      companyId,
      createdBy: userId,
    });

    return site.toObject();
  }

  /**
   * Bulk create sites
   * @param {Object} context - { companyId, userId }
   * @param {Array} sites - Array of site data
   * @returns {Promise<Object>} - { created, failed, errors }
   */
  async bulkCreateSites(context, sites) {
    const { companyId, userId } = context;

    if (!Array.isArray(sites) || sites.length === 0) {
      const error = new Error('Sites array is required');
      error.statusCode = 400;
      throw error;
    }

    const results = {
      created: [],
      failed: [],
      errors: [],
    };

    // Use session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      for (const siteData of sites) {
        try {
          // Handle geolocation
          if (siteData.latitude && siteData.longitude) {
            siteData.location = {
              type: 'Point',
              coordinates: [
                parseFloat(siteData.longitude),
                parseFloat(siteData.latitude),
              ],
            };
            delete siteData.latitude;
            delete siteData.longitude;
          }

          // Check for duplicate shortName
          if (siteData.shortName) {
            const existing = await Site.findOne({
              shortName: siteData.shortName,
              companyId,
            }).session(session);

            if (existing) {
              results.failed.push(siteData);
              results.errors.push({
                site: siteData.shortName,
                error: 'Duplicate short name',
              });
              continue;
            }
          }

          // Create site
          const site = await Site.create(
            [
              {
                ...siteData,
                companyId,
                createdBy: userId,
              },
            ],
            { session }
          );

          results.created.push(site[0].toObject());
        } catch (err) {
          results.failed.push(siteData);
          results.errors.push({
            site: siteData.shortName || 'unknown',
            error: err.message,
          });
        }
      }

      // If all failed, abort transaction
      if (results.created.length === 0) {
        await session.abortTransaction();
        const error = new Error('Failed to create any sites');
        error.statusCode = 400;
        error.details = results.errors;
        throw error;
      }

      await session.commitTransaction();
      return results;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Update a site
   * @param {Object} context - { companyId, userId }
   * @param {String} siteId
   * @param {Object} data - Update data
   * @returns {Promise<Object>} - Updated site
   */
  async updateSite(context, siteId, data) {
    const { companyId, userId } = context;

    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      const error = new Error('Invalid site ID');
      error.statusCode = 400;
      throw error;
    }

    // Find site and verify ownership
    const site = await Site.findOne({
      _id: siteId,
      companyId,
    });

    if (!site) {
      const error = new Error('Site not found');
      error.statusCode = 404;
      throw error;
    }

    // Handle geolocation updates
    if (data.latitude && data.longitude) {
      data.location = {
        type: 'Point',
        coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
      };
      delete data.latitude;
      delete data.longitude;
    }

    // Check for duplicate shortName (excluding current site)
    if (data.shortName && data.shortName !== site.shortName) {
      const existingSite = await Site.findOne({
        shortName: data.shortName,
        companyId,
        _id: { $ne: siteId },
      });

      if (existingSite) {
        const error = new Error('Site with this short name already exists');
        error.statusCode = 409;
        throw error;
      }
    }

    // Don't allow updating companyId
    delete data.companyId;

    // Update site
    Object.assign(site, data);
    site.updatedBy = userId;

    await site.save();

    return site.toObject();
  }

  /**
   * Delete a site (soft delete)
   * @param {Object} context - { companyId, userId }
   * @param {String} siteId
   * @returns {Promise<Object>} - Success message
   */
  async deleteSite(context, siteId) {
    const { companyId, userId } = context;

    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      const error = new Error('Invalid site ID');
      error.statusCode = 400;
      throw error;
    }

    const site = await Site.findOne({
      _id: siteId,
      companyId,
    });

    if (!site) {
      const error = new Error('Site not found');
      error.statusCode = 404;
      throw error;
    }

    // Set deletedBy before soft delete
    site.deletedBy = userId;

    // Soft delete if plugin is available
    if (typeof site.softDelete === 'function') {
      await site.softDelete();
    } else {
      site.deletedAt = new Date();
      await site.save();
    }

    // Deactivate all employee assignments
    await EmployeeSite.updateMany(
      { siteId, companyId },
      { isActive: false, unassignedAt: new Date() }
    );

    // Soft delete all access codes for this site
    await AccessCode.updateMany(
      { siteId, companyId },
      { deletedAt: new Date(), deletedBy: userId }
    );

    return { success: true, message: 'Site deleted successfully' };
  }

  /**
   * Get employees assigned to a site
   * @param {Object} context - { companyId }
   * @param {String} siteId
   * @returns {Promise<Array>} - Employee documents
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

    // Get active employee assignments
    const assignments = await EmployeeSite.find({
      siteId,
      companyId,
      isActive: true,
    })
      .populate({
        path: 'employeeId',
        select: 'firstName lastName email phone position department isActive',
      })
      .lean();

    return assignments.map((a) => ({
      ...a.employeeId,
      assignmentId: a._id,
      assignedAt: a.assignedAt,
      primarySite: a.primarySite,
    }));
  }

  /**
   * Assign employees to a site
   * @param {Object} context - { companyId, userId }
   * @param {String} siteId
   * @param {Array<String>} employeeIds
   * @returns {Promise<Array>} - EmployeeSite assignments
   */
  async assignEmployeesToSite(context, siteId, employeeIds) {
    const { companyId, userId } = context;

    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      const error = new Error('Invalid site ID');
      error.statusCode = 400;
      throw error;
    }

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      const error = new Error('Employee IDs array is required');
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

    if (site.status !== 'ACTIVE') {
      const error = new Error('Cannot assign employees to inactive site');
      error.statusCode = 400;
      throw error;
    }

    const assignments = await Promise.all(
      employeeIds.map(async (employeeId) => {
        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
          const error = new Error(`Invalid employee ID: ${employeeId}`);
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

  /**
   * Get access codes for a site
   * @param {Object} context - { companyId }
   * @param {String} siteId
   * @returns {Promise<Array>} - Access codes
   */
  async getAccessCodes(context, siteId) {
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

    const accessCodes = await AccessCode.find({
      siteId,
      companyId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return accessCodes;
  }

  /**
   * Add access code to a site
   * @param {Object} context - { companyId, userId }
   * @param {String} siteId
   * @param {Object} data - Access code data
   * @returns {Promise<Object>} - Created access code
   */
  async addAccessCode(context, siteId, data) {
    const { companyId, userId } = context;

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

    // Create access code
    const accessCode = await AccessCode.create({
      ...data,
      siteId,
      companyId,
      createdBy: userId,
    });

    return accessCode.toObject();
  }

  /**
   * Update an access code
   * @param {Object} context - { companyId, userId }
   * @param {String} siteId
   * @param {String} codeId
   * @param {Object} data - Update data
   * @returns {Promise<Object>} - Updated access code
   */
  async updateAccessCode(context, siteId, codeId, data) {
    const { companyId, userId } = context;

    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      const error = new Error('Invalid site ID');
      error.statusCode = 400;
      throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(codeId)) {
      const error = new Error('Invalid access code ID');
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

    // Find access code and verify ownership
    const accessCode = await AccessCode.findOne({
      _id: codeId,
      siteId,
      companyId,
    });

    if (!accessCode) {
      const error = new Error('Access code not found');
      error.statusCode = 404;
      throw error;
    }

    // Don't allow updating siteId or companyId
    delete data.siteId;
    delete data.companyId;

    // Update access code
    Object.assign(accessCode, data);
    accessCode.updatedBy = userId;

    await accessCode.save();

    return accessCode.toObject();
  }

  /**
   * Delete an access code (soft delete)
   * @param {Object} context - { companyId, userId }
   * @param {String} siteId
   * @param {String} codeId
   * @returns {Promise<Object>} - Success message
   */
  async deleteAccessCode(context, siteId, codeId) {
    const { companyId, userId } = context;

    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      const error = new Error('Invalid site ID');
      error.statusCode = 400;
      throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(codeId)) {
      const error = new Error('Invalid access code ID');
      error.statusCode = 400;
      throw error;
    }

    // Find access code and verify ownership
    const accessCode = await AccessCode.findOne({
      _id: codeId,
      siteId,
      companyId,
    });

    if (!accessCode) {
      const error = new Error('Access code not found');
      error.statusCode = 404;
      throw error;
    }

    // Set deletedBy before soft delete
    accessCode.deletedBy = userId;

    // Soft delete if plugin is available
    if (typeof accessCode.softDelete === 'function') {
      await accessCode.softDelete();
    } else {
      accessCode.deletedAt = new Date();
      await accessCode.save();
    }

    return { success: true, message: 'Access code deleted successfully' };
  }
}

module.exports = new SitesService();
