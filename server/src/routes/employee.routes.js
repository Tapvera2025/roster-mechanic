const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const employeeController = require('../controllers/employee.controller');
const validate = require('../middleware/validate');
const {
  createEmployeeValidation,
  updateEmployeeValidation,
  deleteEmployeeValidation,
  getEmployeeByIdValidation
} = require('../validators/employee.validator');

// All routes require authentication
router.use(auth);

// Employee CRUD routes
router.get('/', employeeController.getAllEmployees);
router.get('/:id', ...getEmployeeByIdValidation, validate, employeeController.getEmployeeById);
router.post('/', authorize('ADMIN', 'MANAGER'), ...createEmployeeValidation, validate, employeeController.createEmployee);
router.put('/:id', authorize('ADMIN', 'MANAGER'), ...updateEmployeeValidation, validate, employeeController.updateEmployee);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), ...deleteEmployeeValidation, validate, employeeController.deleteEmployee);

// Employee site assignment
router.post('/:id/sites', authorize('ADMIN', 'MANAGER'), employeeController.assignToSites);

module.exports = router;
