/**
 * Employee Model
 *
 * Represents employees who can be assigned to shifts
 */

const mongoose = require('mongoose');
const softDeletePlugin = require('./plugins/softDelete');
const auditLogPlugin = require('./plugins/auditLog');
const multiTenantPlugin = require('./plugins/multiTenant');

const employeeSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },

    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },

    phone: {
      type: String,
      trim: true,
      match: [/^[\d\s\-\+\(\)]+$/, 'Please provide a valid phone number'],
    },

    position: {
      type: String,
      required: [true, 'Position is required'],
      trim: true,
    },

    department: {
      type: String,
      trim: true,
    },

    employeeNumber: {
      type: String,
      unique: true,
      sparse: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
      index: true,
    },

    dateOfBirth: {
      type: Date,
    },

    hireDate: {
      type: Date,
      default: Date.now,
    },

    terminationDate: {
      type: Date,
    },

    // Australian-specific fields
    tfn: {
      // Tax File Number (encrypted in production)
      type: String,
      select: false, // Never return by default
    },

    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
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
employeeSchema.plugin(softDeletePlugin);
employeeSchema.plugin(auditLogPlugin);
employeeSchema.plugin(multiTenantPlugin);

// Virtual for full name
employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for shifts (populate from Shift model)
employeeSchema.virtual('shifts', {
  ref: 'Shift',
  localField: '_id',
  foreignField: 'employeeId',
});

// Virtual for assigned sites
employeeSchema.virtual('assignedSites', {
  ref: 'EmployeeSite',
  localField: '_id',
  foreignField: 'employeeId',
});

// Indexes
employeeSchema.index({ email: 1, companyId: 1 }, { unique: true });
employeeSchema.index({ userId: 1, companyId: 1 }, { unique: true, sparse: true });
employeeSchema.index({ firstName: 1, lastName: 1, companyId: 1 });
employeeSchema.index({ position: 1, companyId: 1 });
employeeSchema.index({ isActive: 1, deletedAt: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
