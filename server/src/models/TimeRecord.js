/**
 * TimeRecord Model
 *
 * Represents employee clock in/out records with geofencing
 * Tracks actual time worked with GPS location and photo verification
 */

const mongoose = require('mongoose');
const softDeletePlugin = require('./plugins/softDelete');
const auditLogPlugin = require('./plugins/auditLog');
const multiTenantPlugin = require('./plugins/multiTenant');

const timeRecordSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
      index: true,
    },

    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
      index: true,
      // Optional - allows clock-in without scheduled shift
    },

    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: [true, 'Site ID is required'],
      index: true,
    },

    // Clock In Data
    clockInTime: {
      type: Date,
      required: [true, 'Clock in time is required'],
      index: true,
    },

    clockInLocation: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Clock in location is required'],
      },
    },

    clockInPhotoUrl: {
      type: String,
      trim: true,
      // Optional - photo verification on clock in
    },

    // Clock Out Data
    clockOutTime: {
      type: Date,
      index: true,
      // Optional - null when employee is still clocked in
    },

    clockOutLocation: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
      // Optional - populated on clock out
    },

    clockOutPhotoUrl: {
      type: String,
      trim: true,
      // Optional - photo verification on clock out
    },

    // Status
    status: {
      type: String,
      enum: {
        values: ['CLOCKED_IN', 'CLOCKED_OUT'],
        message: '{VALUE} is not a valid status',
      },
      default: 'CLOCKED_IN',
      required: true,
      index: true,
    },

    // Calculated Fields
    totalHours: {
      type: Number,
      min: [0, 'Total hours cannot be negative'],
      // Auto-calculated when clocked out
    },

    // Notes
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Apply plugins
timeRecordSchema.plugin(softDeletePlugin);
timeRecordSchema.plugin(auditLogPlugin);
timeRecordSchema.plugin(multiTenantPlugin);

// Virtual for duration display
timeRecordSchema.virtual('durationDisplay').get(function () {
  if (!this.totalHours) return 'N/A';
  const hours = Math.floor(this.totalHours);
  const minutes = Math.round((this.totalHours - hours) * 60);
  return `${hours}h ${minutes}m`;
});

// Virtual to check if currently clocked in
timeRecordSchema.virtual('isClockedIn').get(function () {
  return this.status === 'CLOCKED_IN';
});

// Static method to find by employee with date range
timeRecordSchema.statics.findByEmployee = function (employeeId, companyId, startDate, endDate, conditions = {}) {
  const query = {
    employeeId,
    companyId,
    ...conditions,
  };

  if (startDate || endDate) {
    query.clockInTime = {};
    if (startDate) query.clockInTime.$gte = startDate;
    if (endDate) query.clockInTime.$lte = endDate;
  }

  return this.find(query)
    .populate('employeeId', 'firstName lastName')
    .populate('siteId', 'siteLocationName shortName')
    .populate('shiftId', 'shiftType')
    .sort({ clockInTime: -1 });
};

// Static method to find by site with date range
timeRecordSchema.statics.findBySite = function (siteId, companyId, startDate, endDate, conditions = {}) {
  const query = {
    siteId,
    companyId,
    ...conditions,
  };

  if (startDate || endDate) {
    query.clockInTime = {};
    if (startDate) query.clockInTime.$gte = startDate;
    if (endDate) query.clockInTime.$lte = endDate;
  }

  return this.find(query)
    .populate('employeeId', 'firstName lastName')
    .populate('siteId', 'siteLocationName shortName')
    .populate('shiftId', 'shiftType')
    .sort({ clockInTime: -1 });
};

// Static method to find currently clocked in employees
timeRecordSchema.statics.findCurrentlyClockedIn = function (companyId, conditions = {}) {
  return this.find({
    companyId,
    status: 'CLOCKED_IN',
    ...conditions,
  })
    .populate('employeeId', 'firstName lastName')
    .populate('siteId', 'siteLocationName shortName');
};

// Compound indexes for performance
timeRecordSchema.index({ employeeId: 1, clockInTime: -1, companyId: 1 });
timeRecordSchema.index({ siteId: 1, clockInTime: -1, companyId: 1 });
timeRecordSchema.index({ status: 1, companyId: 1 });
timeRecordSchema.index({ clockInTime: 1, companyId: 1 });
timeRecordSchema.index({ shiftId: 1, companyId: 1 });

// Geospatial indexes for location-based queries
timeRecordSchema.index({ clockInLocation: '2dsphere' });
timeRecordSchema.index({ clockOutLocation: '2dsphere' });

// Pre-save hook to calculate total hours
timeRecordSchema.pre('save', function (next) {
  // Calculate total hours if clocked out
  if (this.clockOutTime && this.clockInTime) {
    const diff = this.clockOutTime - this.clockInTime;
    this.totalHours = Math.round((diff / (1000 * 60 * 60)) * 100) / 100; // 2 decimal places
  }
  next();
});

// Validation: Can't have clock out before clock in
timeRecordSchema.pre('save', function (next) {
  if (this.clockOutTime && this.clockInTime && this.clockOutTime <= this.clockInTime) {
    return next(new Error('Clock out time must be after clock in time'));
  }
  next();
});

// Validation: Clock out location required if clocked out
timeRecordSchema.pre('save', function (next) {
  if (this.status === 'CLOCKED_OUT' && !this.clockOutTime) {
    return next(new Error('Clock out time is required when status is CLOCKED_OUT'));
  }
  next();
});

module.exports = mongoose.model('TimeRecord', timeRecordSchema);
