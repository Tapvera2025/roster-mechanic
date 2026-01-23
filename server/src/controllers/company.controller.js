const companyService = require('../services/company.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get all companies
 * @route GET /api/v1/companies
 */
const getAllCompanies = asyncHandler(async (req, res) => {
  const { search, isActive, page, limit, sortBy, order} = req.query;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const result = await companyService.getAllCompanies(context, {
    search,
    isActive,
    page,
    limit,
    sortBy,
    order
  });

  res.json({
    success: true,
    data: result
  });
});

/**
 * Get single company by ID
 * @route GET /api/v1/companies/:id
 */
const getCompanyById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const company = await companyService.getCompanyById(context, id);

  res.json({
    success: true,
    data: company
  });
});

/**
 * Create a new company
 * @route POST /api/v1/companies
 */
const createCompany = asyncHandler(async (req, res) => {
  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const company = await companyService.createCompany(context, req.body);

  res.status(201).json({
    success: true,
    data: company,
    message: 'Company created successfully'
  });
});

/**
 * Update a company
 * @route PUT /api/v1/companies/:id
 */
const updateCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const company = await companyService.updateCompany(context, id, req.body);

  res.json({
    success: true,
    data: company,
    message: 'Company updated successfully'
  });
});

/**
 * Delete a company
 * @route DELETE /api/v1/companies/:id
 */
const deleteCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const result = await companyService.deleteCompany(context, id);

  res.json({
    success: true,
    data: result
  });
});

/**
 * Get company statistics
 * @route GET /api/v1/companies/:id/stats
 */
const getCompanyStats = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const stats = await companyService.getCompanyStats(context, id);

  res.json({
    success: true,
    data: stats
  });
});

module.exports = {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyStats
};
