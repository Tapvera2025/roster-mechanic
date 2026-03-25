/**
 * Company Model (Multi-Tenant Support)
 *
 * Represents a company/organization using the roster system
 * Each company's data is completely isolated
 */

const mongoose = require('mongoose');
const softDeletePlugin = require('./plugins/softDelete');
const auditLogPlugin = require('./plugins/auditLog');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
    },

    legalName: {
      type: String,
      trim: true,
    },

    businessNumber: {
      type: String, // Australian Business Number (ABN)
      unique: true,
      sparse: true,
    },

    email: {
      type: String,
      required: [true, 'Company email is required'],
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    address: {
      street: String,
      city: String,
      state: String, // Australian states/territories
      postcode: String,
      country: { type: String, default: 'Australia' },
    },

    timezone: {
      type: String,
      enum: [
        'Australia/Perth', // AWST (UTC+8)
        'Australia/Darwin', // ACST (UTC+9:30)
        'Australia/Brisbane', // AEST (UTC+10)
        'Australia/Adelaide', // ACST/ACDT (UTC+9:30/+10:30)
        'Australia/Sydney', // AEST/AEDT (UTC+10/+11)
        'Australia/Melbourne', // AEST/AEDT (UTC+10/+11)
        'Australia/Hobart', // AEST/AEDT (UTC+10/+11)
      ],
      default: 'Australia/Sydney',
    },

    settings: {
      dateFormat: { type: String, default: 'DD/MM/YYYY' },
      timeFormat: { type: String, enum: ['12h', '24h'], default: '12h' },
      currency: { type: String, default: 'AUD' },
      language: { type: String, enum: ['en'], default: 'en' },
    },

    subscription: {
      plan: {
        type: String,
        enum: ['trial', 'basic', 'professional', 'enterprise'],
        default: 'trial',
      },
      status: {
        type: String,
        enum: ['active', 'suspended', 'cancelled'],
        default: 'active',
      },
      startDate: Date,
      endDate: Date,
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
companySchema.plugin(softDeletePlugin);
companySchema.plugin(auditLogPlugin);

// Indexes
companySchema.index({ name: 1 });
companySchema.index({ isActive: 1, deletedAt: 1 });

module.exports = mongoose.model('Company', companySchema);
