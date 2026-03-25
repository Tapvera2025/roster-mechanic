const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const schedulerController = require('../controllers/scheduler.controller');
const validate = require('../middleware/validate');
const {
  createShiftValidation,
  createAdhocShiftValidation,
  updateShiftValidation,
  deleteShiftValidation,
  getShiftByIdValidation
} = require('../validators/shift.validator');

// All routes require authentication
router.use(auth);

// Site-related scheduler routes
router.get('/sites', schedulerController.getActiveSites);
router.get('/sites/:id/employees', schedulerController.getSiteEmployees);
router.get('/sites/:id/shifts', schedulerController.getSiteShifts);

// Deleted shifts management (must come before /:id routes)
router.get('/shifts/deleted', authorize('ADMIN', 'MANAGER'), schedulerController.getDeletedShifts);

// Shift CRUD routes
router.get('/shifts/:id', ...getShiftByIdValidation, validate, schedulerController.getShiftById);
router.post('/shifts', authorize('ADMIN', 'MANAGER'), ...createShiftValidation, validate, schedulerController.createShift);
router.post('/shifts/adhoc', authorize('ADMIN', 'MANAGER'), ...createAdhocShiftValidation, validate, schedulerController.createAdhocShift);
router.put('/shifts/:id', authorize('ADMIN', 'MANAGER'), ...updateShiftValidation, validate, schedulerController.updateShift);
router.put('/shifts/:id/restore', authorize('ADMIN', 'MANAGER'), schedulerController.restoreShift);
router.delete('/shifts/:id', authorize('ADMIN', 'MANAGER'), ...deleteShiftValidation, validate, schedulerController.deleteShift);
router.delete('/shifts/:id/permanent', authorize('ADMIN'), schedulerController.permanentDeleteShift);

module.exports = router;
