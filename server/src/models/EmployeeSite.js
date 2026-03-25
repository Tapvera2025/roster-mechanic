/**
 * EmployeeSite Model
 *
 * Junction table for many-to-many relationship between employees and sites
 */

const mongoose = require('mongoose');
const softDeletePlugin = require('./plugins/softDelete');
const auditLogPlugin = require('./plugins/auditLog');
const multiTenantPlugin = require('./plugins/multiTenant');

const employeeSiteSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
      index: true,
    },

    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: [true, 'Site ID is required'],
      index: true,
    },

    assignedAt: {
      type: Date,
      default: Date.now,
    },

    unassignedAt: {
      type: Date,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Assignment details
    primarySite: {
      type: Boolean,
      default: false,
    },

    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Apply plugins
employeeSiteSchema.plugin(softDeletePlugin);
employeeSiteSchema.plugin(auditLogPlugin);
employeeSiteSchema.plugin(multiTenantPlugin);

// Unique constraint: one employee can be assigned to a site only once (within same company)
employeeSiteSchema.index(
  { employeeId: 1, siteId: 1, companyId: 1 },
  { unique: true }
);

// Compound indexes
employeeSiteSchema.index({ employeeId: 1, isActive: 1, companyId: 1 });
employeeSiteSchema.index({ siteId: 1, isActive: 1, companyId: 1 });

module.exports = mongoose.model('EmployeeSite', employeeSiteSchema);
