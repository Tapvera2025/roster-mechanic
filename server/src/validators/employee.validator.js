const { body, param, query } = require('express-validator');

// Create employee validation
const createEmployeeValidation = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),

  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),

  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .isMobilePhone()
    .withMessage('Phone must be a valid mobile number'),

  body('position')
    .notEmpty()
    .withMessage('Position is required')
    .trim(),

  body('department')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Update employee validation
const updateEmployeeValidation = [
  param('id')
    .notEmpty()
    .withMessage('Employee ID is required'),

  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),

  body('phone')
    .optional({ nullable: true })
    .isMobilePhone()
    .withMessage('Phone must be a valid mobile number'),

  body('position')
    .optional()
    .trim(),

  body('department')
    .optional({ nullable: true })
    .trim(),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Delete employee validation
const deleteEmployeeValidation = [
  param('id')
    .notEmpty()
    .withMessage('Employee ID is required')
];

// Get employee by ID validation
const getEmployeeByIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Employee ID is required')
];

module.exports = {
  createEmployeeValidation,
  updateEmployeeValidation,
  deleteEmployeeValidation,
  getEmployeeByIdValidation
};
