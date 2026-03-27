/**
 * GeofenceViolation Model
 *
 * Tracks failed clock in/out attempts due to geofence violations
 * Helps managers understand why employees can't clock in and detect patterns
 */

const mongoose = require('mongoose');
const multiTenantPlugin = require('./plugins/multiTenant');

const geofenceViolationSchema = new mongoose.Schema(
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

    attemptType: {
      type: String,
      enum: ['CLOCK_IN', 'CLOCK_OUT'],
      required: true,
      index: true,
    },

    attemptLocation: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Attempt location is required'],
      },
    },

    siteLocation: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Site location is required'],
      },
    },

    distanceFromSite: {
      type: Number,
      required: [true, 'Distance is required'],
      // Distance in meters
    },

    geofenceRadius: {
      type: Number,
      required: [true, 'Geofence radius is required'],
      // Radius in meters
    },

    attemptTime: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
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

// Apply multi-tenant plugin
geofenceViolationSchema.plugin(multiTenantPlugin);

// Geospatial indexes for location-based queries
geofenceViolationSchema.index({ attemptLocation: '2dsphere' });
geofenceViolationSchema.index({ siteLocation: '2dsphere' });

// Compound indexes for performance
geofenceViolationSchema.index({ employeeId: 1, attemptTime: -1, companyId: 1 });
geofenceViolationSchema.index({ siteId: 1, attemptTime: -1, companyId: 1 });
geofenceViolationSchema.index({ attemptType: 1, companyId: 1 });

// Virtual for distance display in user-friendly format
geofenceViolationSchema.virtual('distanceDisplay').get(function () {
  if (!this.distanceFromSite) return 'N/A';

  // Show in meters if < 1000m, otherwise in km
  if (this.distanceFromSite < 1000) {
    return `${Math.round(this.distanceFromSite)}m`;
  }

  return `${(this.distanceFromSite / 1000).toFixed(2)}km`;
});

// Virtual for how far outside the geofence
geofenceViolationSchema.virtual('exceededBy').get(function () {
  if (!this.distanceFromSite || !this.geofenceRadius) return 0;
  return Math.max(0, this.distanceFromSite - this.geofenceRadius);
});

geofenceViolationSchema.virtual('exceededByDisplay').get(function () {
  const exceeded = this.exceededBy;
  if (exceeded === 0) return 'Within geofence';

  if (exceeded < 1000) {
    return `${Math.round(exceeded)}m outside`;
  }

  return `${(exceeded / 1000).toFixed(2)}km outside`;
});

// Static method to find violations by employee
geofenceViolationSchema.statics.findByEmployee = function (employeeId, companyId, startDate, endDate, options = {}) {
  const query = { employeeId, companyId };

  if (startDate || endDate) {
    query.attemptTime = {};
    if (startDate) query.attemptTime.$gte = startDate;
    if (endDate) query.attemptTime.$lte = endDate;
  }

  return this.find(query)
    .populate('employeeId', 'firstName lastName')
    .populate('siteId', 'siteLocationName shortName')
    .sort({ attemptTime: -1 })
    .limit(options.limit || 100);
};

// Static method to find violations by site
geofenceViolationSchema.statics.findBySite = function (siteId, companyId, startDate, endDate, options = {}) {
  const query = { siteId, companyId };

  if (startDate || endDate) {
    query.attemptTime = {};
    if (startDate) query.attemptTime.$gte = startDate;
    if (endDate) query.attemptTime.$lte = endDate;
  }

  return this.find(query)
    .populate('employeeId', 'firstName lastName')
    .populate('siteId', 'siteLocationName shortName')
    .sort({ attemptTime: -1 })
    .limit(options.limit || 100);
};

// Static method to get violation statistics
geofenceViolationSchema.statics.getStatistics = async function (companyId, startDate, endDate) {
  const query = { companyId };

  if (startDate || endDate) {
    query.attemptTime = {};
    if (startDate) query.attemptTime.$gte = startDate;
    if (endDate) query.attemptTime.$lte = endDate;
  }

  const stats = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalViolations: { $sum: 1 },
        avgDistance: { $avg: '$distanceFromSite' },
        maxDistance: { $max: '$distanceFromSite' },
        minDistance: { $min: '$distanceFromSite' },
        clockInAttempts: {
          $sum: { $cond: [{ $eq: ['$attemptType', 'CLOCK_IN'] }, 1, 0] },
        },
        clockOutAttempts: {
          $sum: { $cond: [{ $eq: ['$attemptType', 'CLOCK_OUT'] }, 1, 0] },
        },
      },
    },
  ]);

  return stats[0] || {
    totalViolations: 0,
    avgDistance: 0,
    maxDistance: 0,
    minDistance: 0,
    clockInAttempts: 0,
    clockOutAttempts: 0,
  };
};

module.exports = mongoose.model('GeofenceViolation', geofenceViolationSchema);
