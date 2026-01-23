const userService = require('../services/user.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get all users
 * @route GET /api/v1/users
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { search, isActive, role, page, limit, sortBy, order } = req.query;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const result = await userService.getAllUsers(context, {
    search,
    isActive,
    role,
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
 * Get current user profile
 * @route GET /api/v1/users/me
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const user = await userService.getUserById(context, req.user.userId);

  res.json({
    success: true,
    data: user
  });
});

/**
 * Update current user profile
 * @route PUT /api/v1/users/me
 */
const updateProfile = asyncHandler(async (req, res) => {
  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const user = await userService.updateUser(context, req.user.userId, req.body);

  res.json({
    success: true,
    data: user,
    message: 'Profile updated successfully'
  });
});

/**
 * Get single user by ID
 * @route GET /api/v1/users/:id
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const user = await userService.getUserById(context, id);

  res.json({
    success: true,
    data: user
  });
});

/**
 * Create a new user
 * @route POST /api/v1/users
 */
const createUser = asyncHandler(async (req, res) => {
  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const user = await userService.createUser(context, req.body);

  res.status(201).json({
    success: true,
    data: user,
    message: 'User created successfully'
  });
});

/**
 * Update a user
 * @route PUT /api/v1/users/:id
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const user = await userService.updateUser(context, id, req.body);

  res.json({
    success: true,
    data: user,
    message: 'User updated successfully'
  });
});

/**
 * Delete a user
 * @route DELETE /api/v1/users/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const result = await userService.deleteUser(context, id);

  res.json({
    success: true,
    data: result
  });
});

/**
 * Change user password
 * @route PUT /api/v1/users/:id/password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const result = await userService.changePassword(context, id, oldPassword, newPassword);

  res.json({
    success: true,
    data: result
  });
});

/**
 * Link user to employee
 * @route PUT /api/v1/users/:id/link-employee
 */
const linkToEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { employeeId } = req.body;

  const context = {
    companyId: req.user.companyId,
    userId: req.user.userId,
    role: req.user.role
  };

  const result = await userService.linkToEmployee(context, id, employeeId);

  res.json({
    success: true,
    data: result
  });
});

module.exports = {
  getAllUsers,
  getCurrentUser,
  updateProfile,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  linkToEmployee
};
