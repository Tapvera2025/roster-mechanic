/**
 * AccessCode Model
 *
 * Represents access codes for sites
 */

const mongoose = require('mongoose');
const softDeletePlugin = require('./plugins/softDelete');
const auditLogPlugin = require('./plugins/auditLog');
const multiTenantPlugin = require('./plugins/multiTenant');

const accessCodeSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: [true, 'Site ID is required'],
      index: true,
    },

    codeName: {
      type: String,
      required: [true, 'Code name is required'],
      trim: true,
      maxlength: [100, 'Code name cannot exceed 100 characters'],
    },

    accessCode: {
      type: String,
      required: [true, 'Access code is required'],
      trim: true,
    },

    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },

    visibleOnMobile: {
      type: Boolean,
      default: false,
    },

    whenRostered: {
      type: Boolean,
      default: false,
    },

    afterClockingIn: {
      type: Boolean,
      default: false,
    },

    expiresAt: {
      type: Date,
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
accessCodeSchema.plugin(softDeletePlugin);
accessCodeSchema.plugin(auditLogPlugin);
accessCodeSchema.plugin(multiTenantPlugin);

// Check if code is expired
accessCodeSchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Indexes
accessCodeSchema.index({ siteId: 1, companyId: 1 });
accessCodeSchema.index({ isActive: 1, expiresAt: 1 });

module.exports = mongoose.model('AccessCode', accessCodeSchema);
