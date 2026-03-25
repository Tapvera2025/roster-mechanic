const clientService = require('../services/client.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get all clients
 * @route GET /api/clients
 */
const getAllClients = asyncHandler(async (req, res) => {
  const { status, state, search, page, limit, sortBy, order } = req.query;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const result = await clientService.getAllClients(context, {
    status,
    state,
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
 * Get single client by ID
 * @route GET /api/clients/:id
 */
const getClientById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const client = await clientService.getClientById(context, id);

  res.json({
    success: true,
    data: client
  });
});

/**
 * Create a new client
 * @route POST /api/clients
 */
const createClient = asyncHandler(async (req, res) => {
  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const client = await clientService.createClient(context, req.body);

  res.status(201).json({
    success: true,
    data: client
  });
});

/**
 * Bulk create clients
 * @route POST /api/clients/bulk
 */
const bulkCreateClients = asyncHandler(async (req, res) => {
  const { clients } = req.body;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const result = await clientService.bulkCreateClients(context, clients);

  res.status(201).json({
    success: true,
    data: result
  });
});

/**
 * Update a client
 * @route PUT /api/clients/:id
 */
const updateClient = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const client = await clientService.updateClient(context, id, req.body);

  res.json({
    success: true,
    data: client
  });
});

/**
 * Delete a client
 * @route DELETE /api/clients/:id
 */
const deleteClient = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const result = await clientService.deleteClient(context, id);

  res.json({
    success: true,
    data: result
  });
});

module.exports = {
  getAllClients,
  getClientById,
  createClient,
  bulkCreateClients,
  updateClient,
  deleteClient
};
