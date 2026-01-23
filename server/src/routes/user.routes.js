const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const userController = require('../controllers/user.controller');
const validate = require('../middleware/validate');
const {
  createUserValidation,
  updateUserValidation,
  deleteUserValidation,
  getUserByIdValidation,
  changePasswordValidation,
  linkToEmployeeValidation
} = require('../validators/user.validator');

// All routes require authentication
router.use(auth);

// Self-service routes (any authenticated user)
router.get('/me', userController.getCurrentUser);
router.put('/me', userController.updateProfile);

// User management (ADMIN/MANAGER)
router.get('/', authorize('ADMIN', 'MANAGER'), userController.getAllUsers);
router.get('/:id', getUserByIdValidation, validate, userController.getUserById);
router.post('/', authorize('ADMIN', 'MANAGER'), createUserValidation, validate, userController.createUser);
router.put('/:id', updateUserValidation, validate, userController.updateUser);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteUserValidation, validate, userController.deleteUser);
router.put('/:id/password', changePasswordValidation, validate, userController.changePassword);
router.put('/:id/link-employee', authorize('ADMIN', 'MANAGER'), linkToEmployeeValidation, validate, userController.linkToEmployee);

module.exports = router;
