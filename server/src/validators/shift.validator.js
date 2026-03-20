const { body, param } = require('express-validator');

// Create shift validation
const createShiftValidation = [
  body('employeeId')
    .optional({ nullable: true })
    .isString()
    .withMessage('Employee ID must be a string'),

  body('siteId')
    .notEmpty()
    .withMessage('Site ID is required')
    .isString()
    .withMessage('Site ID must be a string'),

  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),

  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 datetime'),

  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 datetime')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),

  body('shiftType')
    .optional()
    .isIn(['REGULAR', 'OVERTIME', 'ON_CALL', 'NIGHT'])
    .withMessage('Invalid shift type'),

  body('status')
    .optional()
    .isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
    .withMessage('Invalid status'),

  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('Notes must be a string'),

  body('breakDuration')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('Break duration must be a non-negative integer'),

  body('chargedToClient')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('Charged to client must be a boolean'),

  body('specialShift')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('Special shift must be a boolean'),

  body('publishAndNotify')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('Publish and notify must be a boolean'),

  body('task')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('Task must be a string'),

  body('jobRefNo')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('Job reference number must be a string')
];

// Create adhoc shift validation (same as createShiftValidation + isAdhoc)
const createAdhocShiftValidation = [
  body('employeeId')
    .optional({ nullable: true })
    .isString()
    .withMessage('Employee ID must be a string'),

  body('siteId')
    .notEmpty()
    .withMessage('Site ID is required')
    .isString()
    .withMessage('Site ID must be a string'),

  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),

  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 datetime'),

  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 datetime')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),

  body('shiftType')
    .optional()
    .isIn(['REGULAR', 'OVERTIME', 'ON_CALL', 'NIGHT'])
    .withMessage('Invalid shift type'),

  body('status')
    .optional()
    .isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
    .withMessage('Invalid status'),

  body('isAdhoc')
    .optional()
    .isBoolean()
    .withMessage('isAdhoc must be a boolean'),

  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('Notes must be a string'),

  body('breakDuration')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('Break duration must be a non-negative integer'),

  body('chargedToClient')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('Charged to client must be a boolean'),

  body('specialShift')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('Special shift must be a boolean'),

  body('publishAndNotify')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('Publish and notify must be a boolean'),

  body('task')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('Task must be a string'),

  body('jobRefNo')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('Job reference number must be a string')
];

// Update shift validation
const updateShiftValidation = [
  param('id')
    .notEmpty()
    .withMessage('Shift ID is required')
    .isString()
    .withMessage('Shift ID must be a string'),

  body('employeeId')
    .optional({ nullable: true })
    .isString()
    .withMessage('Employee ID must be a string'),

  body('siteId')
    .optional()
    .isString()
    .withMessage('Site ID must be a string'),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),

  body('startTime')
    .optional()
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 datetime'),

  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 datetime'),

  body('shiftType')
    .optional()
    .isIn(['REGULAR', 'OVERTIME', 'ON_CALL', 'NIGHT'])
    .withMessage('Invalid shift type'),

  body('status')
    .optional()
    .isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
    .withMessage('Invalid status'),

  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('Notes must be a string'),

  body('breakDuration')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('Break duration must be a non-negative integer'),

  body('chargedToClient')
    .optional()
    .isBoolean()
    .withMessage('Charged to client must be a boolean'),

  body('specialShift')
    .optional()
    .isBoolean()
    .withMessage('Special shift must be a boolean'),

  body('task')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('Task must be a string'),

  body('jobRefNo')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('Job reference number must be a string')
];

// Delete shift validation
const deleteShiftValidation = [
  param('id')
    .notEmpty()
    .withMessage('Shift ID is required')
    .isString()
    .withMessage('Shift ID must be a string')
];

// Get shift by ID validation
const getShiftByIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Shift ID is required')
    .isString()
    .withMessage('Shift ID must be a string')
];

module.exports = {
  createShiftValidation,
  createAdhocShiftValidation,
  updateShiftValidation,
  deleteShiftValidation,
  getShiftByIdValidation
};
