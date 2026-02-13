const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    leaveType: {
      type: String,
      enum: ['annual', 'sick', 'personal', 'unpaid'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    fullDay: {
      type: Boolean,
      default: true,
    },
    periodDays: {
      type: Number,
      default: 1,
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'declined', 'cancelled'],
      default: 'pending',
      index: true,
    },
    // Who approved/declined the request (admin/manager userId)
    actionedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actionedAt: {
      type: Date,
      default: null,
    },
    actionNote: {
      type: String,
      default: '',
    },
    // Who submitted the request (userId — could be the employee or an admin on behalf)
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
leaveSchema.index({ companyId: 1, status: 1 });
leaveSchema.index({ companyId: 1, employeeId: 1 });

module.exports = mongoose.model('Leave', leaveSchema);
