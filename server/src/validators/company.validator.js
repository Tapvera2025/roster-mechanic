const { body, param } = require('express-validator');

// Create company validation
const createCompanyValidation = [
  body('name')
    .notEmpty()
    .withMessage('Company name is required')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Company name must be between 2 and 200 characters'),

  body('legalName')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Legal name cannot exceed 200 characters'),

  body('businessNumber')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^\d{11}$/)
    .withMessage('Business number (ABN) must be 11 digits'),

  body('email')
    .notEmpty()
    .withMessage('Company email is required')
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),

  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .isMobilePhone()
    .withMessage('Phone must be a valid mobile number'),

  body('address.street')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body('address.city')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body('address.state')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body('address.postcode')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body('timezone')
    .optional()
    .isIn([
      'Australia/Perth',
      'Australia/Darwin',
      'Australia/Brisbane',
      'Australia/Adelaide',
      'Australia/Sydney',
      'Australia/Melbourne',
      'Australia/Hobart'
    ])
    .withMessage('Invalid Australian timezone'),

  body('settings.dateFormat')
    .optional()
    .trim(),

  body('settings.timeFormat')
    .optional()
    .isIn(['12h', '24h'])
    .withMessage('Time format must be either 12h or 24h'),

  body('settings.currency')
    .optional()
    .trim(),

  body('subscription.plan')
    .optional()
    .isIn(['trial', 'basic', 'professional', 'enterprise'])
    .withMessage('Invalid subscription plan'),

  body('subscription.status')
    .optional()
    .isIn(['active', 'suspended', 'cancelled'])
    .withMessage('Invalid subscription status'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Update company validation
const updateCompanyValidation = [
  param('id')
    .notEmpty()
    .withMessage('Company ID is required')
    .isMongoId()
    .withMessage('Invalid company ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Company name must be between 2 and 200 characters'),

  body('legalName')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Legal name cannot exceed 200 characters'),

  body('businessNumber')
    .optional({ nullable: true })
    .matches(/^\d{11}$/)
    .withMessage('Business number (ABN) must be 11 digits'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),

  body('phone')
    .optional({ nullable: true })
    .isMobilePhone()
    .withMessage('Phone must be a valid mobile number'),

  body('address.street')
    .optional({ nullable: true })
    .trim(),

  body('address.city')
    .optional({ nullable: true })
    .trim(),

  body('address.state')
    .optional({ nullable: true })
    .trim(),

  body('address.postcode')
    .optional({ nullable: true })
    .trim(),

  body('timezone')
    .optional()
    .isIn([
      'Australia/Perth',
      'Australia/Darwin',
      'Australia/Brisbane',
      'Australia/Adelaide',
      'Australia/Sydney',
      'Australia/Melbourne',
      'Australia/Hobart'
    ])
    .withMessage('Invalid Australian timezone'),

  body('settings.dateFormat')
    .optional()
    .trim(),

  body('settings.timeFormat')
    .optional()
    .isIn(['12h', '24h'])
    .withMessage('Time format must be either 12h or 24h'),

  body('settings.currency')
    .optional()
    .trim(),

  body('subscription.plan')
    .optional()
    .isIn(['trial', 'basic', 'professional', 'enterprise'])
    .withMessage('Invalid subscription plan'),

  body('subscription.status')
    .optional()
    .isIn(['active', 'suspended', 'cancelled'])
    .withMessage('Invalid subscription status'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Delete company validation
const deleteCompanyValidation = [
  param('id')
    .notEmpty()
    .withMessage('Company ID is required')
    .isMongoId()
    .withMessage('Invalid company ID')
];

// Get company by ID validation
const getCompanyByIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Company ID is required')
    .isMongoId()
    .withMessage('Invalid company ID')
];

module.exports = {
  createCompanyValidation,
  updateCompanyValidation,
  deleteCompanyValidation,
  getCompanyByIdValidation
};
