/**
 * Clock In/Out Validators
 *
 * Request validation for time tracking endpoints
 */

const { body, query, param } = require('express-validator');

// Clock in validation
const clockInValidation = [
  body('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isString()
    .withMessage('Employee ID must be a string'),

  body('siteId')
    .notEmpty()
    .withMessage('Site ID is required')
    .isString()
    .withMessage('Site ID must be a string'),

  body('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a valid number between -90 and 90'),

  body('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a valid number between -180 and 180'),

  body('shiftId')
    .optional({ nullable: true })
    .isString()
    .withMessage('Shift ID must be a string'),

  body('photoUrl')
    .optional({ nullable: true })
    .isString()
    .withMessage('Photo URL must be a string'),
];

// Clock out validation
const clockOutValidation = [
  body('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isString()
    .withMessage('Employee ID must be a string'),

  body('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a valid number between -90 and 90'),

  body('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a valid number between -180 and 180'),

  body('photoUrl')
    .optional({ nullable: true })
    .isString()
    .withMessage('Photo URL must be a string'),
];

// Get status validation
const getStatusValidation = [
  query('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isString()
    .withMessage('Employee ID must be a string'),
];

// Get history validation
const getHistoryValidation = [
  query('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isString()
    .withMessage('Employee ID must be a string'),

  query('startDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  query('siteId')
    .optional({ nullable: true })
    .isString()
    .withMessage('Site ID must be a string'),

  query('page')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// Get manager view validation
const getManagerViewValidation = [
  query('startDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  query('siteId')
    .optional({ nullable: true })
    .isString()
    .withMessage('Site ID must be a string'),

  query('employeeId')
    .optional({ nullable: true })
    .isString()
    .withMessage('Employee ID must be a string'),

  query('page')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 200 })
    .withMessage('Limit must be between 1 and 200'),
];

// Export CSV validation (same as manager view)
const exportCSVValidation = getManagerViewValidation;

module.exports = {
  clockInValidation,
  clockOutValidation,
  getStatusValidation,
  getHistoryValidation,
  getManagerViewValidation,
  exportCSVValidation,
};
