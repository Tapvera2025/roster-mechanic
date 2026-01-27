const { body } = require('express-validator');

// Login validation
const loginValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

module.exports = {
  loginValidation
};
