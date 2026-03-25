const sitesService = require('../services/sites.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get all sites
 * @route GET /api/sites
 */
const getAllSites = asyncHandler(async (req, res) => {
  const { status, state, client, search, page, limit, sortBy, order } = req.query;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const result = await sitesService.getAllSites(context, {
    status,
    state,
    client,
    search,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 25,
    sortBy: sortBy || 'createdAt',
    order: order || 'desc'
  });

  res.json({
    success: true,
    data: result
  });
});

/**
 * Get single site by ID
 * @route GET /api/sites/:id
 */
const getSiteById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const site = await sitesService.getSiteById(context, id);

  res.json({
    success: true,
    data: site
  });
});

/**
 * Create a new site
 * @route POST /api/sites
 */
const createSite = asyncHandler(async (req, res) => {
  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const site = await sitesService.createSite(context, req.body);

  res.status(201).json({
    success: true,
    data: site
  });
});

/**
 * Bulk create sites
 * @route POST /api/sites/bulk
 */
const bulkCreateSites = asyncHandler(async (req, res) => {
  const { sites } = req.body;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const result = await sitesService.bulkCreateSites(context, sites);

  res.status(201).json({
    success: true,
    data: result
  });
});

/**
 * Update a site
 * @route PUT /api/sites/:id
 */
const updateSite = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const site = await sitesService.updateSite(context, id, req.body);

  res.json({
    success: true,
    data: site
  });
});

/**
 * Delete a site
 * @route DELETE /api/sites/:id
 */
const deleteSite = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const result = await sitesService.deleteSite(context, id);

  res.json({
    success: true,
    data: result
  });
});

/**
 * Get employees assigned to a site
 * @route GET /api/sites/:id/employees
 */
const getSiteEmployees = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const employees = await sitesService.getSiteEmployees(context, id);

  res.json({
    success: true,
    data: employees
  });
});

/**
 * Assign employees to a site
 * @route POST /api/sites/:id/employees
 */
const assignEmployeesToSite = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { employeeIds } = req.body;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const assignments = await sitesService.assignEmployeesToSite(context, id, employeeIds);

  res.status(201).json({
    success: true,
    data: assignments
  });
});

/**
 * Get access codes for a site
 * @route GET /api/sites/:id/access-codes
 */
const getAccessCodes = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const accessCodes = await sitesService.getAccessCodes(context, id);

  res.json({
    success: true,
    data: accessCodes
  });
});

/**
 * Add access code to a site
 * @route POST /api/sites/:id/access-codes
 */
const addAccessCode = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const accessCode = await sitesService.addAccessCode(context, id, req.body);

  res.status(201).json({
    success: true,
    data: accessCode
  });
});

/**
 * Update an access code
 * @route PUT /api/sites/:id/access-codes/:codeId
 */
const updateAccessCode = asyncHandler(async (req, res) => {
  const { id, codeId } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const accessCode = await sitesService.updateAccessCode(context, id, codeId, req.body);

  res.json({
    success: true,
    data: accessCode
  });
});

/**
 * Delete an access code
 * @route DELETE /api/sites/:id/access-codes/:codeId
 */
const deleteAccessCode = asyncHandler(async (req, res) => {
  const { id, codeId } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const result = await sitesService.deleteAccessCode(context, id, codeId);

  res.json({
    success: true,
    data: result
  });
});

module.exports = {
  getAllSites,
  getSiteById,
  createSite,
  bulkCreateSites,
  updateSite,
  deleteSite,
  getSiteEmployees,
  assignEmployeesToSite,
  getAccessCodes,
  addAccessCode,
  updateAccessCode,
  deleteAccessCode
};
