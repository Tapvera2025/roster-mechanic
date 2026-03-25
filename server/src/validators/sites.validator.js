const { body, param, query } = require('express-validator');

/**
 * Validation rules for creating a site
 */
const createSiteValidation = [
  body('siteLocationName')
    .trim()
    .notEmpty().withMessage('Site location name is required')
    .isLength({ max: 255 }).withMessage('Site location name must not exceed 255 characters'),

  body('shortName')
    .trim()
    .notEmpty().withMessage('Short name is required')
    .isLength({ max: 50 }).withMessage('Short name must not exceed 50 characters'),

  body('jobRefNo')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Job reference number must not exceed 100 characters'),

  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE']).withMessage('Status must be either ACTIVE or INACTIVE'),

  body('client')
    .trim()
    .notEmpty().withMessage('Client is required')
    .isLength({ max: 255 }).withMessage('Client must not exceed 255 characters'),

  body('flatBillingRate')
    .optional()
    .isDecimal().withMessage('Flat billing rate must be a valid decimal number')
    .custom(value => parseFloat(value) >= 0).withMessage('Flat billing rate must be non-negative'),

  body('alertRecipient')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Alert recipient must not exceed 255 characters'),

  body('exportId')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Export ID must not exceed 100 characters'),

  body('region')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Region must not exceed 255 characters'),

  body('remindEmployees')
    .optional()
    .trim(),

  body('defaultStartTime')
    .optional()
    .trim()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Default start time must be in HH:MM format'),

  body('defaultEndTime')
    .optional()
    .trim()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Default end time must be in HH:MM format'),

  body('defaultShiftDuration')
    .optional()
    .isInt({ min: 1, max: 24 }).withMessage('Default shift duration must be between 1 and 24 hours'),

  body('address')
    .optional()
    .trim(),

  body('state')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('State must not exceed 50 characters'),

  body('townSuburb')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Town/Suburb must not exceed 255 characters'),

  body('postalCode')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Postal code must not exceed 20 characters'),

  body('timezone')
    .optional()
    .trim(),

  body('latitude')
    .optional()
    .isDecimal().withMessage('Latitude must be a valid decimal number')
    .custom(value => parseFloat(value) >= -90 && parseFloat(value) <= 90)
    .withMessage('Latitude must be between -90 and 90'),

  body('longitude')
    .optional()
    .isDecimal().withMessage('Longitude must be a valid decimal number')
    .custom(value => parseFloat(value) >= -180 && parseFloat(value) <= 180)
    .withMessage('Longitude must be between -180 and 180'),

  body('geoFenceRadius')
    .optional()
    .isDecimal().withMessage('GeoFence radius must be a valid decimal number')
    .custom(value => parseFloat(value) >= 0).withMessage('GeoFence radius must be non-negative'),

  body('contactPerson')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Contact person must not exceed 255 characters'),

  body('contactPosition')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Contact position must not exceed 255 characters'),

  body('contactPhone')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Contact phone must not exceed 50 characters'),

  body('contactMobile')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Contact mobile must not exceed 50 characters'),

  body('contactEmail')
    .optional()
    .trim()
    .isEmail().withMessage('Contact email must be a valid email address'),

  body('contactNotes')
    .optional()
    .trim()
];

/**
 * Validation rules for updating a site
 */
const updateSiteValidation = [
  param('id')
    .notEmpty().withMessage('Site ID is required'),

  body('siteLocationName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 }).withMessage('Site location name must be between 1 and 255 characters'),

  body('shortName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Short name must be between 1 and 50 characters'),

  // Reuse most validations from create, but make them all optional
  ...createSiteValidation.filter(validation =>
    validation.builder.fields[0] !== 'siteLocationName' &&
    validation.builder.fields[0] !== 'shortName' &&
    validation.builder.fields[0] !== 'client'
  ),

  body('client')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 }).withMessage('Client must be between 1 and 255 characters')
];

/**
 * Validation rules for bulk creating sites
 */
const bulkCreateValidation = [
  body('sites')
    .isArray({ min: 1 }).withMessage('Sites must be a non-empty array'),

  body('sites.*.siteLocationName')
    .trim()
    .notEmpty().withMessage('Site location name is required for all sites'),

  body('sites.*.shortName')
    .trim()
    .notEmpty().withMessage('Short name is required for all sites'),

  body('sites.*.client')
    .optional()
    .trim(),

  body('sites.*.status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE']).withMessage('Status must be either ACTIVE or INACTIVE')
];

/**
 * Validation rules for getting site by ID
 */
const getSiteByIdValidation = [
  param('id')
    .notEmpty().withMessage('Site ID is required')
];

/**
 * Validation rules for deleting a site
 */
const deleteSiteValidation = [
  param('id')
    .notEmpty().withMessage('Site ID is required')
];

/**
 * Validation rules for assigning employees to site
 */
const assignEmployeesValidation = [
  param('id')
    .notEmpty().withMessage('Site ID is required'),

  body('employeeIds')
    .isArray({ min: 1 }).withMessage('Employee IDs must be a non-empty array')
];

/**
 * Validation rules for adding access code
 */
const addAccessCodeValidation = [
  param('id')
    .notEmpty().withMessage('Site ID is required'),

  body('codeName')
    .trim()
    .notEmpty().withMessage('Code name is required'),

  body('accessCode')
    .trim()
    .notEmpty().withMessage('Access code is required'),

  body('notes')
    .optional()
    .trim(),

  body('visibleOnMobile')
    .optional()
    .isBoolean().withMessage('Visible on mobile must be a boolean'),

  body('whenRostered')
    .optional()
    .isBoolean().withMessage('When rostered must be a boolean'),

  body('afterClockingIn')
    .optional()
    .isBoolean().withMessage('After clocking in must be a boolean')
];

/**
 * Validation rules for updating access code
 */
const updateAccessCodeValidation = [
  param('id')
    .notEmpty().withMessage('Site ID is required'),

  param('codeId')
    .notEmpty().withMessage('Access code ID is required'),

  body('codeName')
    .optional()
    .trim()
    .notEmpty().withMessage('Code name cannot be empty'),

  body('accessCode')
    .optional()
    .trim()
    .notEmpty().withMessage('Access code cannot be empty'),

  body('notes')
    .optional()
    .trim(),

  body('visibleOnMobile')
    .optional()
    .isBoolean().withMessage('Visible on mobile must be a boolean'),

  body('whenRostered')
    .optional()
    .isBoolean().withMessage('When rostered must be a boolean'),

  body('afterClockingIn')
    .optional()
    .isBoolean().withMessage('After clocking in must be a boolean')
];

/**
 * Validation rules for deleting access code
 */
const deleteAccessCodeValidation = [
  param('id')
    .notEmpty().withMessage('Site ID is required'),

  param('codeId')
    .notEmpty().withMessage('Access code ID is required')
];

module.exports = {
  createSiteValidation,
  updateSiteValidation,
  bulkCreateValidation,
  getSiteByIdValidation,
  deleteSiteValidation,
  assignEmployeesValidation,
  addAccessCodeValidation,
  updateAccessCodeValidation,
  deleteAccessCodeValidation
};
