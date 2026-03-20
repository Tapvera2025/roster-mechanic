const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const companyController = require('../controllers/company.controller');
const validate = require('../middleware/validate');
const {
  createCompanyValidation,
  updateCompanyValidation,
  deleteCompanyValidation,
  getCompanyByIdValidation
} = require('../validators/company.validator');

// All routes require authentication
router.use(auth);

// Company CRUD routes
router.get('/', authorize('ADMIN'), companyController.getAllCompanies);
router.get('/:id', ...getCompanyByIdValidation, validate, companyController.getCompanyById);
router.post('/', authorize('ADMIN'), ...createCompanyValidation, validate, companyController.createCompany);
router.put('/:id', authorize('ADMIN', 'MANAGER'), ...updateCompanyValidation, validate, companyController.updateCompany);
router.delete('/:id', authorize('ADMIN'), ...deleteCompanyValidation, validate, companyController.deleteCompany);
router.get('/:id/stats', authorize('ADMIN', 'MANAGER'), ...getCompanyByIdValidation, validate, companyController.getCompanyStats);

module.exports = router;
