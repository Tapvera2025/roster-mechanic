const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginValidation } = require('../validators/auth.validator');

// Public routes (no auth required)
router.post('/login', loginValidation, validate, authController.login);

// Protected routes (auth required)
router.get('/me', auth, authController.getMe);
router.post('/logout', auth, authController.logout);

module.exports = router;
