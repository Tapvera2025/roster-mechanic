/**
 * Site Model
 *
 * Represents work sites/locations where employees work
 */

const mongoose = require('mongoose');
const softDeletePlugin = require('./plugins/softDelete');
const auditLogPlugin = require('./plugins/auditLog');
const multiTenantPlugin = require('./plugins/multiTenant');

const siteSchema = new mongoose.Schema(
  {
    // Basic Information
    siteLocationName: {
      type: String,
      required: [true, 'Site location name is required'],
      trim: true,
      maxlength: [200, 'Site name cannot exceed 200 characters'],
    },

    shortName: {
      type: String,
      required: [true, 'Short name is required'],
      trim: true,
      maxlength: [50, 'Short name cannot exceed 50 characters'],
      index: true,
    },

    jobRefNo: {
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

    client: {
      type: String,
      required: [true, 'Client is required'],
      trim: true,
    },

    flatBillingRate: {
      type: Number,
      min: [0, 'Billing rate cannot be negative'],
    },

    alertRecipient: {
      type: String,
      lowercase: true,
      trim: true,
    },

    exportId: {
      type: String,
      trim: true,
    },

    region: {
      type: String,
      trim: true,
    },

    // Scheduling Settings
    remindEmployees: {
      type: String,
    },

    defaultStartTime: {
      type: String, // Format: "HH:mm"
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'],
    },

    defaultEndTime: {
      type: String, // Format: "HH:mm"
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'],
    },

    defaultShiftDuration: {
      type: Number, // in minutes
      min: [0, 'Duration cannot be negative'],
    },

    // Address Information
    address: {
      type: String,
      trim: true,
    },

    state: {
      type: String,
      trim: true,
    },

    townSuburb: {
      type: String,
      trim: true,
    },

    postalCode: {
      type: String,
      trim: true,
    },

    // Australian timezone
    timezone: {
      type: String,
      enum: [
        'Australia/Perth',
        'Australia/Darwin',
        'Australia/Brisbane',
        'Australia/Adelaide',
        'Australia/Sydney',
        'Australia/Melbourne',
        'Australia/Hobart',
      ],
      default: 'Australia/Sydney',
    },

    // GeoLocation
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere',
      },
    },

    geoFenceRadius: {
      type: Number, // in meters
      min: [0, 'Radius cannot be negative'],
      default: 100,
    },

    // Contact Information
    contactPerson: {
      type: String,
      trim: true,
    },

    contactPosition: {
      type: String,
      trim: true,
    },

    contactPhone: {
      type: String,
      trim: true,
    },

    contactMobile: {
      type: String,
      trim: true,
    },

    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },

    contactNotes: {
      type: String,
      maxlength: [2000, 'Contact notes cannot exceed 2000 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Apply plugins
siteSchema.plugin(softDeletePlugin);
siteSchema.plugin(auditLogPlugin);
siteSchema.plugin(multiTenantPlugin);

// Virtual for access codes
siteSchema.virtual('accessCodes', {
  ref: 'AccessCode',
  localField: '_id',
  foreignField: 'siteId',
});

// Virtual for shifts
siteSchema.virtual('shifts', {
  ref: 'Shift',
  localField: '_id',
  foreignField: 'siteId',
});

// Virtual for assigned employees
siteSchema.virtual('assignedEmployees', {
  ref: 'EmployeeSite',
  localField: '_id',
  foreignField: 'siteId',
});

// Indexes
siteSchema.index({ shortName: 1, companyId: 1 });
siteSchema.index({ status: 1, companyId: 1 });
siteSchema.index({ client: 1, companyId: 1 });
siteSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Site', siteSchema);
