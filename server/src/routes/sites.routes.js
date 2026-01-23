const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const sitesController = require('../controllers/sites.controller');
const validate = require('../middleware/validate');
const {
  createSiteValidation,
  updateSiteValidation,
  bulkCreateValidation,
  getSiteByIdValidation,
  deleteSiteValidation,
  assignEmployeesValidation,
  addAccessCodeValidation,
  updateAccessCodeValidation,
  deleteAccessCodeValidation
} = require('../validators/sites.validator');

// All routes require authentication
router.use(auth);

// Sites CRUD routes
router.get('/', sitesController.getAllSites);
router.get('/:id', getSiteByIdValidation, validate, sitesController.getSiteById);
router.post('/', authorize('ADMIN', 'MANAGER'), createSiteValidation, validate, sitesController.createSite);
router.post('/bulk', authorize('ADMIN', 'MANAGER'), bulkCreateValidation, validate, sitesController.bulkCreateSites);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateSiteValidation, validate, sitesController.updateSite);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteSiteValidation, validate, sitesController.deleteSite);

// Employee assignment routes
router.get('/:id/employees', getSiteByIdValidation, validate, sitesController.getSiteEmployees);
router.post('/:id/employees', authorize('ADMIN', 'MANAGER'), assignEmployeesValidation, validate, sitesController.assignEmployeesToSite);

// Access code routes
router.get('/:id/access-codes', getSiteByIdValidation, validate, sitesController.getAccessCodes);
router.post('/:id/access-codes', authorize('ADMIN', 'MANAGER'), addAccessCodeValidation, validate, sitesController.addAccessCode);
router.put('/:id/access-codes/:codeId', authorize('ADMIN', 'MANAGER'), updateAccessCodeValidation, validate, sitesController.updateAccessCode);
router.delete('/:id/access-codes/:codeId', authorize('ADMIN', 'MANAGER'), deleteAccessCodeValidation, validate, sitesController.deleteAccessCode);

module.exports = router;
