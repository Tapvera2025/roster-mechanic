/**
 * Shift Model
 *
 * Represents scheduled shifts for employees at sites
 * Includes Australian timezone handling
 */

const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const softDeletePlugin = require('./plugins/softDelete');
const auditLogPlugin = require('./plugins/auditLog');
const multiTenantPlugin = require('./plugins/multiTenant');

const shiftSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      index: true,
    },

    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      index: true,
    },

    // All dates/times stored in UTC
    date: {
      type: Date,
      required: [true, 'Shift date is required'],
      index: true,
    },

    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
      index: true,
    },

    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },

    shiftType: {
      type: String,
      enum: {
        values: ['REGULAR', 'OVERTIME', 'ON_CALL', 'NIGHT'],
        message: '{VALUE} is not a valid shift type',
      },
      default: 'REGULAR',
      index: true,
    },

    status: {
      type: String,
      enum: {
        values: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
        message: '{VALUE} is not a valid status',
      },
      default: 'SCHEDULED',
      index: true,
    },

    // Adhoc shift flag (for emergency/unplanned shifts)
    isAdhoc: {
      type: Boolean,
      default: false,
      index: true,
    },

    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },

    actualStartTime: {
      type: Date,
    },

    actualEndTime: {
      type: Date,
    },

    breakDuration: {
      type: Number, // in minutes
      default: 0,
    },

    // Clock-in/out location (for geofencing)
    clockInLocation: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },

    clockOutLocation: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      },
    },

    // Track who deleted the shift (for soft delete)
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Employees assigned to this shift (for multi-employee shifts)
    employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
      },
    ],

    // Position/role for the shift
    position: {
      type: String,
      maxlength: [200, 'Position cannot exceed 200 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Apply plugins
shiftSchema.plugin(softDeletePlugin);
shiftSchema.plugin(auditLogPlugin);
shiftSchema.plugin(multiTenantPlugin);

// Virtual for duration in hours
shiftSchema.virtual('durationHours').get(function () {
  if (!this.startTime || !this.endTime) return 0;
  const diff = this.endTime - this.startTime;
  return Math.round((diff / (1000 * 60 * 60)) * 100) / 100; // 2 decimal places
});

// Virtual for actual duration
shiftSchema.virtual('actualDurationHours').get(function () {
  if (!this.actualStartTime || !this.actualEndTime) return 0;
  const diff = this.actualEndTime - this.actualStartTime;
  const hours = diff / (1000 * 60 * 60);
  const breakHours = this.breakDuration / 60;
  return Math.round((hours - breakHours) * 100) / 100;
});

// Method to convert UTC to company timezone
shiftSchema.methods.toCompanyTimezone = function (timezone) {
  return {
    date: DateTime.fromJSDate(this.date).setZone(timezone).toISO(),
    startTime: DateTime.fromJSDate(this.startTime).setZone(timezone).toISO(),
    endTime: DateTime.fromJSDate(this.endTime).setZone(timezone).toISO(),
  };
};

// Static method to find shifts by date range
shiftSchema.statics.findByDateRange = function (companyId, startDate, endDate, conditions = {}) {
  return this.find({
    companyId,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
    ...conditions,
  }).populate('employeeId siteId');
};

// Indexes for performance
shiftSchema.index({ employeeId: 1, date: 1, companyId: 1 });
shiftSchema.index({ siteId: 1, date: 1, companyId: 1 });
shiftSchema.index({ date: 1, startTime: 1, companyId: 1 });
shiftSchema.index({ status: 1, companyId: 1 });
shiftSchema.index({ shiftType: 1, companyId: 1 });
shiftSchema.index({ isAdhoc: 1, companyId: 1 });

// Geospatial index for location-based queries
shiftSchema.index({ 'clockInLocation': '2dsphere' });

// Validation: endTime must be after startTime
shiftSchema.pre('save', async function () {
  if (this.endTime <= this.startTime) {
    throw new Error('End time must be after start time');
  }
});

module.exports = mongoose.model('Shift', shiftSchema);
