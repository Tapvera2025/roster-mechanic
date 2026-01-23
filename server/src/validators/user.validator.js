const { body, param } = require('express-validator');

// Create user validation
const createUserValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('role')
    .optional()
    .isIn(['ADMIN', 'MANAGER', 'USER'])
    .withMessage('Role must be ADMIN, MANAGER, or USER'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Update user validation
const updateUserValidation = [
  param('id')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('role')
    .optional()
    .isIn(['ADMIN', 'MANAGER', 'USER'])
    .withMessage('Role must be ADMIN, MANAGER, or USER'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Delete user validation
const deleteUserValidation = [
  param('id')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID')
];

// Get user by ID validation
const getUserByIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID')
];

// Change password validation
const changePasswordValidation = [
  param('id')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID'),

  body('oldPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
];

// Link to employee validation
const linkToEmployeeValidation = [
  param('id')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID'),

  body('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isMongoId()
    .withMessage('Invalid employee ID')
];

module.exports = {
  createUserValidation,
  updateUserValidation,
  deleteUserValidation,
  getUserByIdValidation,
  changePasswordValidation,
  linkToEmployeeValidation
};
