/**
 * Auth Controller
 *
 * Handles authentication operations (login, logout, token refresh)
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Generate JWT token
 */
const generateToken = (userId, companyId, role) => {
  return jwt.sign(
    { userId, companyId, role },
    config.auth.jwtSecret,
    { expiresIn: config.auth.jwtExpiresIn }
  );
};

/**
 * Login user
 * @route POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Find user by email (include password field)
  const user = await User.findOne({ email, isActive: true }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // 2. Check password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // 3. Generate token
  const token = generateToken(user._id, user.companyId, user.role);

  // 4. Update last login
  user.lastLoginAt = new Date();
  await user.save();

  // 5. Return user data and token
  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId
      }
    }
  });
});

/**
 * Get current user (from token)
 * @route GET /api/v1/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      lastLoginAt: user.lastLoginAt
    }
  });
});

/**
 * Logout user (client-side token removal, optional server-side cleanup)
 * @route POST /api/v1/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  // In a stateless JWT system, logout is primarily client-side
  // But we can clear refresh token if using refresh tokens
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = {
  login,
  getMe,
  logout
};
