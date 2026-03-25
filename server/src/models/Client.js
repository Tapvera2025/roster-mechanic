/**
 * Client Model
 *
 * Represents clients/customers of the company using the roster system
 */

const mongoose = require('mongoose');
const softDeletePlugin = require('./plugins/softDelete');
const auditLogPlugin = require('./plugins/auditLog');
const multiTenantPlugin = require('./plugins/multiTenant');

const clientSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
      maxlength: [200, 'Client name cannot exceed 200 characters'],
      index: true,
    },

    state: {
      type: String,
      trim: true,
      enum: ['QLD', 'NSW', 'VIC', 'SA', 'WA', 'TAS', 'NT', 'ACT', ''],
    },

    invoicingCompany: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'INACTIVE'],
        message: '{VALUE} is not a valid status',
      },
      default: 'ACTIVE',
      index: true,
    },

    invoiceSubject: {
      type: String,
      trim: true,
    },

    invoiceTemplate: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Apply plugins
clientSchema.plugin(softDeletePlugin);
clientSchema.plugin(auditLogPlugin);
clientSchema.plugin(multiTenantPlugin);

// Virtual for sites
clientSchema.virtual('sites', {
  ref: 'Site',
  localField: 'clientName',
  foreignField: 'client',
});

// Indexes
clientSchema.index({ clientName: 1, companyId: 1 });
clientSchema.index({ status: 1, companyId: 1 });

module.exports = mongoose.model('Client', clientSchema);
