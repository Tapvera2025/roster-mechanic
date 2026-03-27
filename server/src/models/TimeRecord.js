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

    clockInDistance: {
      type: Number,
      // Distance in meters from site location at clock in
      min: 0,
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

    clockOutDistance: {
      type: Number,
      // Distance in meters from site location at clock out
      min: 0,
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
      // Auto-calculated when clocked out (includes break time)
    },

    // Break Time Tracking
    breaks: [
      {
        startTime: {
          type: Date,
          required: true,
        },
        endTime: {
          type: Date,
        },
        breakType: {
          type: String,
          enum: ['LUNCH', 'BREAK', 'OTHER'],
          default: 'BREAK',
        },
        notes: {
          type: String,
          maxlength: 200,
        },
      },
    ],

    totalBreakMinutes: {
      type: Number,
      min: [0, 'Total break minutes cannot be negative'],
      default: 0,
      // Auto-calculated from completed breaks
    },

    // Approval Workflow
    approvalStatus: {
      type: String,
      enum: {
        values: ['PENDING', 'APPROVED', 'REJECTED', 'VOID'],
        message: '{VALUE} is not a valid approval status',
      },
      default: 'PENDING',
      index: true,
    },

    approvedBy: {
      type: String,
      ref: 'User',
      // User ID who approved/rejected the record
    },

    approvedAt: {
      type: Date,
      // Timestamp when approved/rejected
    },

    rejectionReason: {
      type: String,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
      // Required when approvalStatus is REJECTED
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

// Virtual for worked hours (total hours minus breaks)
timeRecordSchema.virtual('workedHours').get(function () {
  if (!this.totalHours) return 0;
  const breakHours = (this.totalBreakMinutes || 0) / 60;
  return Math.max(0, this.totalHours - breakHours);
});

// Virtual for worked hours display
timeRecordSchema.virtual('workedHoursDisplay').get(function () {
  const worked = this.workedHours;
  const hours = Math.floor(worked);
  const minutes = Math.round((worked - hours) * 60);
  return `${hours}h ${minutes}m`;
});

// Virtual for break time display
timeRecordSchema.virtual('breakTimeDisplay').get(function () {
  if (!this.totalBreakMinutes) return '0m';
  if (this.totalBreakMinutes < 60) return `${this.totalBreakMinutes}m`;
  const hours = Math.floor(this.totalBreakMinutes / 60);
  const minutes = this.totalBreakMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
});

// Virtual to check if currently clocked in
timeRecordSchema.virtual('isClockedIn').get(function () {
  return this.status === 'CLOCKED_IN';
});

// Virtual to check if currently on break
timeRecordSchema.virtual('isOnBreak').get(function () {
  if (!this.breaks || this.breaks.length === 0) return false;
  const lastBreak = this.breaks[this.breaks.length - 1];
  return lastBreak && lastBreak.startTime && !lastBreak.endTime;
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

// Static method to find records by approval status
timeRecordSchema.statics.findByApprovalStatus = function (companyId, approvalStatus, startDate, endDate, conditions = {}) {
  const query = {
    companyId,
    approvalStatus,
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
    .populate('approvedBy', 'firstName lastName email')
    .sort({ clockInTime: -1 });
};

// Static method to get approval statistics
timeRecordSchema.statics.getApprovalStats = async function (companyId, startDate, endDate) {
  const query = { companyId };

  if (startDate || endDate) {
    query.clockInTime = {};
    if (startDate) query.clockInTime.$gte = startDate;
    if (endDate) query.clockInTime.$lte = endDate;
  }

  const stats = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$approvalStatus',
        count: { $sum: 1 },
        totalHours: { $sum: '$totalHours' },
      },
    },
  ]);

  // Convert array to object for easier access
  const result = {
    PENDING: { count: 0, totalHours: 0 },
    APPROVED: { count: 0, totalHours: 0 },
    REJECTED: { count: 0, totalHours: 0 },
    VOID: { count: 0, totalHours: 0 },
  };

  stats.forEach((stat) => {
    if (result[stat._id]) {
      result[stat._id] = {
        count: stat.count,
        totalHours: Math.round(stat.totalHours * 100) / 100,
      };
    }
  });

  return result;
};

// Compound indexes for performance
timeRecordSchema.index({ employeeId: 1, clockInTime: -1, companyId: 1 });
timeRecordSchema.index({ siteId: 1, clockInTime: -1, companyId: 1 });
timeRecordSchema.index({ status: 1, companyId: 1 });
timeRecordSchema.index({ clockInTime: 1, companyId: 1 });
timeRecordSchema.index({ shiftId: 1, companyId: 1 });
timeRecordSchema.index({ approvalStatus: 1, companyId: 1 });
timeRecordSchema.index({ approvalStatus: 1, clockInTime: -1, companyId: 1 });

// Geospatial indexes for location-based queries
timeRecordSchema.index({ clockInLocation: '2dsphere' });
timeRecordSchema.index({ clockOutLocation: '2dsphere' });

// Pre-save hook to calculate total hours and break time
timeRecordSchema.pre('save', async function () {
  // Calculate total break minutes from completed breaks
  if (this.breaks && this.breaks.length > 0) {
    let totalBreak = 0;
    this.breaks.forEach((breakPeriod) => {
      if (breakPeriod.startTime && breakPeriod.endTime) {
        const diff = breakPeriod.endTime - breakPeriod.startTime;
        totalBreak += Math.round(diff / (1000 * 60)); // Convert to minutes
      }
    });
    this.totalBreakMinutes = totalBreak;
  }

  // Calculate total hours if clocked out
  if (this.clockOutTime && this.clockInTime) {
    const diff = this.clockOutTime - this.clockInTime;
    this.totalHours = Math.round((diff / (1000 * 60 * 60)) * 100) / 100; // 2 decimal places
  }
});

// Validation: Can't have clock out before clock in
timeRecordSchema.pre('save', async function () {
  if (this.clockOutTime && this.clockInTime && this.clockOutTime <= this.clockInTime) {
    throw new Error('Clock out time must be after clock in time');
  }
});

// Validation: Clock out location required if clocked out
timeRecordSchema.pre('save', async function () {
  if (this.status === 'CLOCKED_OUT' && !this.clockOutTime) {
    throw new Error('Clock out time is required when status is CLOCKED_OUT');
  }
});

// Validation: Rejection reason required if rejected
timeRecordSchema.pre('save', async function () {
  if (this.approvalStatus === 'REJECTED' && !this.rejectionReason) {
    throw new Error('Rejection reason is required when approval status is REJECTED');
  }
});

module.exports = mongoose.model('TimeRecord', timeRecordSchema);
