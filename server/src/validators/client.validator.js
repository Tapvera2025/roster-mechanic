const { body, param, query } = require('express-validator');

/**
 * Validation rules for creating a client
 */
const createClientValidation = [
  body('clientName')
    .trim()
    .notEmpty().withMessage('Client name is required')
    .isLength({ max: 200 }).withMessage('Client name must not exceed 200 characters'),

  body('state')
    .optional()
    .trim()
    .isIn(['QLD', 'NSW', 'VIC', 'SA', 'WA', 'TAS', 'NT', 'ACT', '']).withMessage('Invalid state'),

  body('invoicingCompany')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Invoicing company must not exceed 255 characters'),

  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE']).withMessage('Status must be either ACTIVE or INACTIVE'),

  body('invoiceSubject')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Invoice subject must not exceed 255 characters'),

  body('invoiceTemplate')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Invoice template must not exceed 255 characters')
];

/**
 * Validation rules for updating a client
 */
const updateClientValidation = [
  param('id')
    .notEmpty().withMessage('Client ID is required'),

  body('clientName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage('Client name must be between 1 and 200 characters'),

  body('state')
    .optional()
    .trim()
    .isIn(['QLD', 'NSW', 'VIC', 'SA', 'WA', 'TAS', 'NT', 'ACT', '']).withMessage('Invalid state'),

  body('invoicingCompany')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Invoicing company must not exceed 255 characters'),

  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE']).withMessage('Status must be either ACTIVE or INACTIVE'),

  body('invoiceSubject')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Invoice subject must not exceed 255 characters'),

  body('invoiceTemplate')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Invoice template must not exceed 255 characters')
];

/**
 * Validation rules for bulk creating clients
 */
const bulkCreateValidation = [
  body('clients')
    .isArray({ min: 1 }).withMessage('Clients must be a non-empty array'),

  body('clients.*.clientName')
    .trim()
    .notEmpty().withMessage('Client name is required for all clients'),

  body('clients.*.status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE']).withMessage('Status must be either ACTIVE or INACTIVE')
];

/**
 * Validation rules for getting client by ID
 */
const getClientByIdValidation = [
  param('id')
    .notEmpty().withMessage('Client ID is required')
];

/**
 * Validation rules for deleting a client
 */
const deleteClientValidation = [
  param('id')
    .notEmpty().withMessage('Client ID is required')
];

module.exports = {
  createClientValidation,
  updateClientValidation,
  bulkCreateValidation,
  getClientByIdValidation,
  deleteClientValidation
};
