/**
 * User Model (Authentication)
 *
 * Represents system users (admins, managers, employees with login access)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');
const softDeletePlugin = require('./plugins/softDelete');
const auditLogPlugin = require('./plugins/auditLog');
const multiTenantPlugin = require('./plugins/multiTenant');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password in queries by default
    },

    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    role: {
      type: String,
      enum: {
        values: ['ADMIN', 'MANAGER', 'USER'],
        message: '{VALUE} is not a valid role',
      },
      default: 'USER',
      index: true,
    },

    refreshToken: {
      type: String,
      select: false,
    },

    lastLoginAt: {
      type: Date,
    },

    passwordChangedAt: {
      type: Date,
    },

    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Apply plugins
userSchema.plugin(softDeletePlugin);
userSchema.plugin(auditLogPlugin);
userSchema.plugin(multiTenantPlugin);

// Hash password before saving
// TEMPORARILY DISABLED FOR DEVELOPMENT - UNCOMMENT FOR PRODUCTION
// userSchema.pre('save', async function () {
//   // Only hash if password is modified
//   if (!this.isModified('password')) return;

//   // Hash password
//   const salt = await bcrypt.genSalt(config.auth.bcryptSaltRounds);
//   this.password = await bcrypt.hash(this.password, salt);

//   // Set passwordChangedAt
//   if (!this.isNew) {
//     this.passwordChangedAt = Date.now() - 1000; // Subtract 1s to ensure token is created after password change
//   }
// });

// Compare password method
// TEMPORARILY DISABLED FOR DEVELOPMENT - UNCOMMENT FOR PRODUCTION
// userSchema.methods.comparePassword = async function (candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// DEVELOPMENT ONLY: Plain text password comparison (REMOVE IN PRODUCTION!)
userSchema.methods.comparePassword = async function (candidatePassword) {
  return candidatePassword === this.password;
};

// Check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Indexes
userSchema.index({ email: 1, companyId: 1 }, { unique: true });
userSchema.index({ role: 1, companyId: 1 });
userSchema.index({ isActive: 1, deletedAt: 1 });

module.exports = mongoose.model('User', userSchema);
