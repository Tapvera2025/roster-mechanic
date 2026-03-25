/**
 * Clock In/Out Routes
 *
 * API routes for employee time tracking
 */

const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const clockInOutController = require('../controllers/clockInOut.controller');
const validate = require('../middleware/validate');
const { uploadSinglePhoto, handleUploadError } = require('../config/upload');
const {
  clockInValidation,
  clockOutValidation,
  getStatusValidation,
  getHistoryValidation,
  getManagerViewValidation,
  exportCSVValidation,
} = require('../validators/clockInOut.validator');

// All routes require authentication
router.use(auth);

/**
 * Clock In
 * @route POST /api/v1/clock/in
 * @access Private (Authenticated employees)
 */
router.post(
  '/in',
  uploadSinglePhoto,
  handleUploadError,
  ...clockInValidation,
  validate,
  clockInOutController.clockIn
);

/**
 * Clock Out
 * @route POST /api/v1/clock/out
 * @access Private (Authenticated employees)
 */
router.post(
  '/out',
  uploadSinglePhoto,
  handleUploadError,
  ...clockOutValidation,
  validate,
  clockInOutController.clockOut
);

/**
 * Get Current Clock-In Status
 * @route GET /api/v1/clock/status
 * @access Private (Authenticated employees)
 */
router.get('/status', ...getStatusValidation, validate, clockInOutController.getCurrentStatus);

/**
 * Get Employee Time Record History
 * @route GET /api/v1/clock/history
 * @access Private (Authenticated employees)
 */
router.get('/history', ...getHistoryValidation, validate, clockInOutController.getMyHistory);

/**
 * Get Manager View (All Employees)
 * @route GET /api/v1/clock/records
 * @access Private (ADMIN, MANAGER only)
 */
router.get(
  '/records',
  authorize('ADMIN', 'MANAGER'),
  ...getManagerViewValidation,
  validate,
  clockInOutController.getManagerView
);

/**
 * Export Time Records to CSV
 * @route GET /api/v1/clock/export
 * @access Private (ADMIN, MANAGER only)
 */
router.get(
  '/export',
  authorize('ADMIN', 'MANAGER'),
  ...exportCSVValidation,
  validate,
  clockInOutController.exportCSV
);

module.exports = router;
