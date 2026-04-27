# Adhoc Shift Feature Documentation

## Overview

The Adhoc Shift feature allows registered employees to initiate and record unscheduled work shifts when they arrive at a site outside their regular scheduled shifts. This feature provides flexibility for emergency work, voluntary overtime, or unexpected operational needs while maintaining complete tracking and monitoring.

---

## Table of Contents

1. [Feature Description](#feature-description)
2. [Current Implementation](#current-implementation)
3. [Employee-Initiated Adhoc Shift Flow](#employee-initiated-adhoc-shift-flow)
4. [Technical Architecture](#technical-architecture)
5. [User Interface Components](#user-interface-components)
6. [API Endpoints](#api-endpoints)
7. [Database Schema](#database-schema)
8. [Admin Portal Tracking](#admin-portal-tracking)
9. [Admin Portal Display](#admin-portal-display)
10. [Implementation Checklist](#implementation-checklist)

---

## Feature Description

### What is an Adhoc Shift?

An **adhoc shift** is an unscheduled work session initiated by an employee when they arrive at a work site outside their regular scheduled shifts. Unlike regular shifts that are pre-planned and assigned by administrators, adhoc shifts are:

- **Employee-initiated**: Started by the employee, not pre-scheduled
- **Reason-based**: Requires mandatory explanation/justification
- **Fully tracked**: Records clock-in, clock-out, location, and duration
- **Automatically approved**: No manager approval needed, automatically recorded
- **Clearly marked**: Visually distinguished from regular shifts in admin portal

### Use Cases

1. **Emergency Response**: Critical site issues requiring immediate attention
2. **Voluntary Overtime**: Employee willing to work extra hours
3. **Coverage Gaps**: Filling in for absent colleagues
4. **Maintenance**: Unexpected equipment failures or urgent repairs
5. **Special Projects**: Time-sensitive deliverables outside normal schedule

---

## Current Implementation

### Admin-Created Adhoc Shifts

The system currently supports adhoc shifts created by administrators through:

**Endpoint:** `POST /api/scheduler/shifts/adhoc`

**Key Features:**
- Admins/managers create adhoc shifts and assign to employees
- Marked with `isAdhoc: true` flag in Shift model
- Skips conflict detection (unlike regular shifts)
- Sends email notification to assigned employee
- Follows same clock-in/out workflow as regular shifts

**Limitations:**
- Only admin-initiated (not employee self-service)
- No reason tracking for why shift was created adhoc
- Requires pre-assignment before employee can clock in

---

## Employee-Initiated Adhoc Shift Flow

### User Journey

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Employee arrives at site outside scheduled shift         │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Opens mobile app / employee portal                       │
│    - App detects no active shift scheduled                  │
│    - Shows "Start Adhoc Shift" button                       │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Clicks "Start Adhoc Shift" button                        │
│    - Adhoc shift reason modal appears                       │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. System captures GPS location and detects site:           │
│    ✓ GPS location automatically captured                    │
│    ✓ System checks all assigned sites                       │
│    ✓ Auto-selects site if within geofence radius            │
│    ✓ If near multiple sites, asks employee to select        │
│    ✓ If not near any site, shows error message              │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Employee enters adhoc shift details:                     │
│    ✓ Reason for adhoc shift (text field, required)          │
│    ✓ Position/role (optional)                               │
│    ✓ Photo (optional)                                       │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. System validates:                                         │
│    ✓ No other active clock-in exists                        │
│    ✓ Reason text is provided (min 10 characters)            │
│    ✓ Employee is registered to detected site                │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. System creates:                                           │
│    ✓ New Shift record (isAdhoc: true, adhocReason: text)    │
│    ✓ TimeRecord with CLOCKED_IN status                      │
│    ✓ Links TimeRecord to new adhoc Shift                    │
│    ✓ Sets shift status to IN_PROGRESS                       │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Real-time notifications sent:                            │
│    ✓ Socket.io broadcast to managers/admins                 │
│    ✓ Email notification with reason and details             │
│    ✓ Dashboard alert with "ADHOC" badge                     │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Employee works and clocks out normally:                  │
│    ✓ Uses standard clock-out process                        │
│    ✓ Can take breaks during adhoc shift                     │
│    ✓ GPS location captured at clock-out                     │
│    ✓ Total hours auto-calculated                            │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. Admin monitors in Time Attendance portal:               │
│     ✓ Record shows "ADHOC SHIFT" badge/indicator            │
│     ✓ Reason displayed prominently                          │
│     ✓ All standard details (times, location, hours)         │
│     ✓ Hours automatically counted toward payroll            │
│     ✓ Available for viewing and reporting                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Architecture

### Data Model Changes

#### 1. Shift Model Enhancement

**File:** `server/src/models/Shift.js`

**New Fields Required:**

```javascript
{
  // Existing fields...
  isAdhoc: {
    type: Boolean,
    default: false,
    index: true
  },

  // NEW FIELD
  adhocReason: {
    type: String,
    required: function() {
      return this.isAdhoc === true;
    },
    trim: true,
    minlength: [10, 'Adhoc reason must be at least 10 characters'],
    maxlength: [500, 'Adhoc reason cannot exceed 500 characters']
  },

  // NEW FIELD
  adhocInitiatedBy: {
    type: String,
    enum: ['EMPLOYEE', 'ADMIN', 'MANAGER'],
    default: 'ADMIN',
    required: function() {
      return this.isAdhoc === true;
    }
  },

  // NEW FIELD
  adhocCreatedAt: {
    type: Date,
    default: function() {
      return this.isAdhoc ? new Date() : null;
    }
  }
}
```

**Validation Rules:**
- If `isAdhoc: true`, then `adhocReason` is **required**
- `adhocReason` must be 10-500 characters
- `adhocInitiatedBy` tracks who created the adhoc shift
- `adhocCreatedAt` timestamp for audit trail

#### 2. TimeRecord Model (No Changes Required)

The existing TimeRecord model already supports all necessary fields:
- `shiftId` - Links to the adhoc shift
- `notes` - Additional employee notes
- All clock-in/out tracking
- Adhoc shifts are automatically approved (no approval workflow needed)

---

### Service Layer

#### New Service Method

**File:** `server/src/services/clockInOut.service.js`

**Method:** `clockInAdhoc(employeeId, location, adhocReason, position, photo)`

**Note:** Site is automatically detected based on GPS location, not passed as parameter

**Workflow:**

```javascript
async clockInAdhoc(employeeId, location, adhocReason, position = null, photo = null) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Validate employee
    const employee = await Employee.findOne({
      _id: employeeId,
      status: 'ACTIVE',
      companyId: req.user.companyId
    }).populate('sites');
    if (!employee) throw new Error('Employee not found or inactive');

    // 2. Auto-detect site based on GPS location
    const assignedSites = await Site.find({
      _id: { $in: employee.sites },
      status: 'ACTIVE',
      companyId: req.user.companyId
    });

    // Calculate distance to each assigned site
    const sitesWithDistance = assignedSites.map(site => {
      const distance = calculateDistance(
        location.coordinates[1], // latitude
        location.coordinates[0], // longitude
        site.location.coordinates[1],
        site.location.coordinates[0]
      );
      return { site, distance };
    });

    // Find sites within geofence radius
    const sitesInRange = sitesWithDistance.filter(
      ({ distance, site }) => distance <= site.geoFenceRadius
    );

    if (sitesInRange.length === 0) {
      throw new Error('You are not within range of any assigned site. Please move closer to your work site.');
    }

    // Use the closest site if multiple sites in range
    const { site, distance } = sitesInRange.sort((a, b) => a.distance - b.distance)[0];
    const siteId = site._id;

    // 3. Log if distance is significant (for monitoring)
    if (distance > site.geoFenceRadius * 0.8) {
      // Log when employee is near edge of geofence
      await GeofenceViolation.create({
        employeeId,
        siteId,
        attemptType: 'ADHOC_CLOCK_IN',
        distanceFromSite: distance,
        attemptLocation: location
      });
    }

    // 4. Check for existing active clock-in
    const existingClockIn = await TimeRecord.findOne({
      employeeId,
      status: 'CLOCKED_IN',
      companyId: req.user.companyId
    });
    if (existingClockIn) {
      throw new Error('Employee already has an active clock-in');
    }

    // 5. Validate adhoc reason
    if (!adhocReason || adhocReason.trim().length < 10) {
      throw new Error('Adhoc reason must be at least 10 characters');
    }

    // 6. Create adhoc shift
    const now = new Date();
    const adhocShift = await Shift.create([{
      employeeId,
      siteId,
      companyId: req.user.companyId,
      date: now,
      startTime: now,
      endTime: null, // Will be set on clock-out
      isAdhoc: true,
      adhocReason: adhocReason.trim(),
      adhocInitiatedBy: 'EMPLOYEE',
      adhocCreatedAt: now,
      status: 'IN_PROGRESS',
      shiftType: 'REGULAR',
      position: position || employee.position,
      actualStartTime: now
    }], { session });

    // 7. Create time record
    const timeRecord = await TimeRecord.create([{
      employeeId,
      shiftId: adhocShift[0]._id,
      siteId,
      companyId: req.user.companyId,
      clockInTime: now,
      clockInLocation: location,
      clockInDistance: distance,
      clockInPhotoUrl: photo,
      status: 'CLOCKED_IN'
      // Note: No approvalStatus needed - adhoc shifts are automatically approved
    }], { session });

    // 8. Commit transaction
    await session.commitTransaction();

    // 9. Send notifications
    await this.notifyAdhocShiftCreated(employee, site, adhocShift[0], adhocReason);

    // 10. Broadcast real-time event
    socketService.broadcast('adhoc-shift-started', {
      employee: { id: employee._id, name: employee.name },
      site: { id: site._id, name: site.siteLocationName },
      shift: adhocShift[0],
      timeRecord: timeRecord[0],
      timestamp: now
    });

    return {
      shift: adhocShift[0],
      timeRecord: timeRecord[0],
      message: 'Adhoc shift started successfully'
    };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

---

### Controller Layer

**File:** `server/src/controllers/clockInOut.controller.js`

**New Endpoint Handler:**

```javascript
exports.clockInAdhoc = async (req, res) => {
  try {
    const { latitude, longitude, adhocReason, position } = req.body;
    const employeeId = req.user.employeeId; // From JWT token
    const photo = req.file ? req.file.path : null;

    // Validate required fields
    if (!latitude || !longitude || !adhocReason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: location (latitude, longitude), adhocReason'
      });
    }

    const location = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };

    const result = await clockInOutService.clockInAdhoc(
      employeeId,
      location,
      adhocReason,
      position,
      photo
    );

    res.status(201).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Adhoc clock-in error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
```

---

### Validation Layer

**File:** `server/src/validators/clockInOut.validator.js`

**New Validation Schema:**

```javascript
exports.clockInAdhocSchema = Joi.object({
  latitude: Joi.number()
    .required()
    .min(-90)
    .max(90)
    .messages({
      'number.min': 'Latitude must be between -90 and 90',
      'number.max': 'Latitude must be between -90 and 90',
      'any.required': 'Latitude is required'
    }),

  longitude: Joi.number()
    .required()
    .min(-180)
    .max(180)
    .messages({
      'number.min': 'Longitude must be between -180 and 180',
      'number.max': 'Longitude must be between -180 and 180',
      'any.required': 'Longitude is required'
    }),

  adhocReason: Joi.string()
    .required()
    .trim()
    .min(10)
    .max(500)
    .messages({
      'string.min': 'Adhoc reason must be at least 10 characters',
      'string.max': 'Adhoc reason cannot exceed 500 characters',
      'any.required': 'Adhoc reason is required'
    }),

  position: Joi.string()
    .optional()
    .trim()
    .max(100)
    .messages({
      'string.max': 'Position cannot exceed 100 characters'
    })
});
```

---

## User Interface Components

### Mobile App / Employee Portal

#### 1. Adhoc Shift Button

**Location:** Employee Dashboard / Clock-In Screen

**Display Logic:**
```javascript
// Show adhoc shift button when:
const showAdhocButton =
  !currentShift &&           // No scheduled shift right now
  !isCurrentlyClockedIn;     // Not already clocked in
  // Note: Site detection happens automatically when button is clicked
```

**Component Structure:**
```jsx
<Button
  variant="outlined"
  color="warning"
  startIcon={<WarningIcon />}
  onClick={handleAdhocShiftClick}
  disabled={!showAdhocButton}
>
  Start Adhoc Shift
</Button>
```

#### 2. Adhoc Reason Modal

**File:** `client/src/components/clock/AdhocShiftModal.jsx`

**Implementation Note:** When the modal opens, it should:
1. Get current GPS location using browser's Geolocation API
2. Send location to backend endpoint to detect nearby site (or do client-side calculation)
3. Display detected site or error if no site within range
4. Only enable submit if site is detected

```jsx
<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
  <DialogTitle>
    Start Adhoc Shift
    <Typography variant="caption" color="textSecondary">
      You are starting a shift outside your scheduled hours
    </Typography>
  </DialogTitle>

  <DialogContent>
    {/* Auto-detected Site Display */}
    {detectedSite ? (
      <Alert severity="success" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Detected Site:</strong> {detectedSite.siteLocationName}
        </Typography>
        <Typography variant="caption">
          You are {distanceFromSite}m from this site
        </Typography>
      </Alert>
    ) : (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="body2">
          Unable to detect nearby site. Please ensure you are within range of an assigned work site.
        </Typography>
      </Alert>
    )}

    {/* Reason Text Field */}
    <TextField
      fullWidth
      margin="normal"
      label="Reason for Adhoc Shift"
      placeholder="e.g., Emergency equipment repair, covering for sick colleague..."
      multiline
      rows={4}
      value={adhocReason}
      onChange={(e) => setAdhocReason(e.target.value)}
      required
      error={adhocReason.length > 0 && adhocReason.length < 10}
      helperText={
        adhocReason.length > 0 && adhocReason.length < 10
          ? `Minimum 10 characters required (${adhocReason.length}/10)`
          : `${adhocReason.length}/500 characters`
      }
    />

    {/* Position (Optional) */}
    <TextField
      fullWidth
      margin="normal"
      label="Position/Role (Optional)"
      value={position}
      onChange={(e) => setPosition(e.target.value)}
    />

    {/* Photo Upload (Optional) */}
    <Button
      component="label"
      startIcon={<PhotoCameraIcon />}
      variant="outlined"
      fullWidth
      sx={{ mt: 2 }}
    >
      Add Photo (Optional)
      <input
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handlePhotoSelect}
      />
    </Button>
    {photo && (
      <Typography variant="caption" color="success.main">
        ✓ Photo selected
      </Typography>
    )}
  </DialogContent>

  <DialogActions>
    <Button onClick={onClose}>Cancel</Button>
    <Button
      onClick={handleSubmit}
      variant="contained"
      color="primary"
      disabled={adhocReason.length < 10 || !detectedSite}
      startIcon={<AccessTimeIcon />}
    >
      Clock In & Start Adhoc Shift
    </Button>
  </DialogActions>
</Dialog>
```

#### 3. API Integration

**File:** `client/src/lib/api.js`

```javascript
export const clockApi = {
  // ... existing methods

  /**
   * Clock in for adhoc shift (employee-initiated)
   * Site is automatically detected based on GPS location
   */
  clockInAdhoc: async (employeeId, latitude, longitude, adhocReason, position = null, photo = null) => {
    const formData = new FormData();
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    formData.append('adhocReason', adhocReason);
    if (position) formData.append('position', position);
    if (photo) formData.append('photo', photo);

    const response = await api.post('/clock/adhoc', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};
```

---

## API Endpoints

### New Endpoint

**Route:** `POST /api/clock/adhoc`

**Authentication:** Required (JWT token)

**Authorization:** EMPLOYEE role

**How it works:** System automatically detects which site the employee is near based on GPS location

**Request Body (multipart/form-data):**
```json
{
  "latitude": 43.6532,
  "longitude": -79.3832,
  "adhocReason": "Emergency equipment failure requiring immediate repair",
  "position": "Maintenance Technician",
  "photo": <file> (optional)
}
```

**Note:** `siteId` is NOT required - the backend automatically detects the nearest site within geofence radius

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "shift": {
      "id": "507f1f77bcf86cd799439012",
      "employeeId": "507f1f77bcf86cd799439010",
      "siteId": "507f1f77bcf86cd799439011",
      "siteName": "Downtown Office",
      "detectedDistance": 45,
      "isAdhoc": true,
      "adhocReason": "Emergency equipment failure requiring immediate repair",
      "adhocInitiatedBy": "EMPLOYEE",
      "adhocCreatedAt": "2024-01-15T14:30:00.000Z",
      "status": "IN_PROGRESS",
      "startTime": "2024-01-15T14:30:00.000Z",
      "actualStartTime": "2024-01-15T14:30:00.000Z"
    },
    "detectedSite": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Downtown Office",
      "distance": 45
    },
    "timeRecord": {
      "id": "507f1f77bcf86cd799439013",
      "employeeId": "507f1f77bcf86cd799439010",
      "shiftId": "507f1f77bcf86cd799439012",
      "clockInTime": "2024-01-15T14:30:00.000Z",
      "status": "CLOCKED_IN"
    },
    "message": "Adhoc shift started successfully"
  }
}
```

**Error Responses:**

**400 - Validation Error:**
```json
{
  "success": false,
  "message": "Adhoc reason must be at least 10 characters"
}
```

**400 - Already Clocked In:**
```json
{
  "success": false,
  "message": "Employee already has an active clock-in"
}
```

**400 - No Site Within Range:**
```json
{
  "success": false,
  "message": "You are not within range of any assigned site. Please move closer to your work site."
}
```

**404 - Employee Not Found:**
```json
{
  "success": false,
  "message": "Employee not found or inactive"
}
```

### Route Registration

**File:** `server/src/routes/clockInOut.routes.js`

```javascript
const router = require('express').Router();
const clockInOutController = require('../controllers/clockInOut.controller');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../config/upload');
const { validate } = require('../middleware/validator');
const { clockInAdhocSchema } = require('../validators/clockInOut.validator');

// Existing routes...

// Adhoc shift clock-in
router.post(
  '/adhoc',
  authenticate,
  authorize('EMPLOYEE'),
  upload.single('photo'),
  validate(clockInAdhocSchema),
  clockInOutController.clockInAdhoc
);

module.exports = router;
```

---

## Database Schema

### Shift Collection Update

**MongoDB Query to Add New Fields to Existing Documents:**

```javascript
db.shifts.updateMany(
  { isAdhoc: true },
  {
    $set: {
      adhocInitiatedBy: "ADMIN", // Default for existing adhoc shifts
      adhocCreatedAt: "$createdAt" // Use existing creation timestamp
    }
  }
);
```

**Index Creation:**

```javascript
db.shifts.createIndex({
  "isAdhoc": 1,
  "adhocInitiatedBy": 1,
  "companyId": 1
});

// No additional indexes needed for adhoc shifts beyond the existing isAdhoc index
```

### Example Document Structure

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "employeeId": ObjectId("507f1f77bcf86cd799439010"),
  "siteId": ObjectId("507f1f77bcf86cd799439011"),
  "companyId": "company_123",
  "date": ISODate("2024-01-15T00:00:00.000Z"),
  "startTime": ISODate("2024-01-15T14:30:00.000Z"),
  "endTime": ISODate("2024-01-15T18:45:00.000Z"),
  "actualStartTime": ISODate("2024-01-15T14:30:00.000Z"),
  "actualEndTime": ISODate("2024-01-15T18:45:00.000Z"),
  "shiftType": "REGULAR",
  "status": "COMPLETED",
  "isAdhoc": true,
  "adhocReason": "Emergency equipment failure requiring immediate repair",
  "adhocInitiatedBy": "EMPLOYEE",
  "adhocCreatedAt": ISODate("2024-01-15T14:30:00.000Z"),
  "position": "Maintenance Technician",
  "notes": "",
  "clockInLocation": {
    "type": "Point",
    "coordinates": [-79.3832, 43.6532]
  },
  "clockOutLocation": {
    "type": "Point",
    "coordinates": [-79.3830, 43.6534]
  },
  "createdAt": ISODate("2024-01-15T14:30:00.000Z"),
  "updatedAt": ISODate("2024-01-15T18:45:00.000Z")
}
```

---

## Admin Portal Tracking

### Shift Status

All adhoc shifts created by employees are automatically approved and tracked with:
- **Shift Status:** `IN_PROGRESS` (during work), then `COMPLETED` (after clock-out)
- **Hours:** Automatically counted toward payroll
- **Tracking:** Full audit trail maintained for reporting

### Manager Monitoring

**File:** `client/src/pages/TimeAttendance.jsx`

**Adhoc Shift Indicators:**

```jsx
{/* In time records table */}
<TableCell>
  {record.shiftId?.isAdhoc && (
    <Chip
      label="ADHOC"
      size="small"
      color="warning"
      icon={<WarningIcon />}
      sx={{ mr: 1 }}
    />
  )}
  {record.employee.name}
</TableCell>

{/* Adhoc reason column */}
<TableCell>
  {record.shiftId?.isAdhoc ? (
    <Tooltip title={record.shiftId.adhocReason}>
      <Box>
        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
          {record.shiftId.adhocReason}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Initiated by: {record.shiftId.adhocInitiatedBy}
        </Typography>
      </Box>
    </Tooltip>
  ) : (
    <Typography variant="body2" color="textSecondary">
      Regular shift
    </Typography>
  )}
</TableCell>
```

### Monitoring Features

Managers can monitor adhoc shifts through:
- **Real-time Notifications:** Instant alerts when adhoc shifts start
- **Reason Visibility:** Full adhoc reason displayed in time records
- **Filtering:** Filter time records to show only adhoc shifts
- **Reporting:** Export adhoc shift data for analysis
- **Audit Trail:** Track who initiated and when

---

## Admin Portal Display

### Time Attendance Table Enhancements

**File:** `client/src/pages/TimeAttendance.jsx`

**New Table Columns:**

| Column | Display | For Adhoc Shifts |
|--------|---------|------------------|
| Employee | Name + ADHOC badge | Orange "ADHOC" chip |
| Shift Type | Regular/Overtime/etc | "Adhoc - Employee Initiated" |
| Adhoc Reason | - | Full reason text with tooltip |
| Clock In | Time + Date | Standard |
| Clock Out | Time + Date | Standard |
| Total Hours | Calculated | Standard |
| Status | CLOCKED_IN/CLOCKED_OUT | Standard |

**Filtering Options:**

```jsx
{/* Add adhoc shift filter */}
<FormControl>
  <InputLabel>Shift Type</InputLabel>
  <Select value={shiftTypeFilter} onChange={handleShiftTypeChange}>
    <MenuItem value="all">All Shifts</MenuItem>
    <MenuItem value="regular">Regular Shifts Only</MenuItem>
    <MenuItem value="adhoc">Adhoc Shifts Only</MenuItem>
    <MenuItem value="adhoc-employee">Employee-Initiated Adhoc</MenuItem>
    <MenuItem value="adhoc-admin">Admin-Created Adhoc</MenuItem>
  </Select>
</FormControl>
```

**Export CSV Enhancement:**

Add columns:
- "Is Adhoc" (Yes/No)
- "Adhoc Reason"
- "Adhoc Initiated By"

---

## Email Notifications

### Email Service Updates

**File:** `server/src/services/email.service.js`

**New Email Template:**

```javascript
async notifyAdhocShiftCreated(employee, site, shift, reason) {
  const template = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ff9800; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">⚠️ Adhoc Shift Started</h2>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
          <p><strong>Employee:</strong> ${employee.name}</p>
          <p><strong>Site:</strong> ${site.siteLocationName}</p>
          <p><strong>Started:</strong> ${new Date(shift.startTime).toLocaleString()}</p>
          <p><strong>Position:</strong> ${shift.position || 'N/A'}</p>

          <div style="background-color: white; padding: 15px; margin-top: 15px; border-left: 4px solid #ff9800;">
            <p style="margin: 0; font-weight: bold;">Reason:</p>
            <p style="margin: 5px 0 0 0;">${reason}</p>
          </div>

          <p style="margin-top: 20px; color: #666;">
            This adhoc shift has been automatically recorded. View details in the Time Attendance portal.
          </p>

          <a href="${process.env.CLIENT_URL}/admin/time-attendance"
             style="display: inline-block; margin-top: 15px; padding: 12px 30px; background-color: #ff9800; color: white; text-decoration: none; border-radius: 5px;">
            View Adhoc Shift Details
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send to all managers/admins
  const managers = await User.find({
    companyId: employee.companyId,
    role: { $in: ['ADMIN', 'MANAGER'] }
  });

  for (const manager of managers) {
    await this.sendEmail({
      to: manager.email,
      subject: `⚠️ Adhoc Shift Started by ${employee.name}`,
      html: template
    });
  }
}
```

---

## Implementation Checklist

### Backend Tasks

- [ ] **Update Shift Model**
  - [ ] Add `adhocReason` field (String, required if isAdhoc)
  - [ ] Add `adhocInitiatedBy` field (enum: EMPLOYEE/ADMIN/MANAGER)
  - [ ] Add `adhocCreatedAt` field (Date)
  - [ ] Update validation rules
  - [ ] Create new indexes

- [ ] **Create Service Method**
  - [ ] Implement `clockInAdhoc()` in `clockInOut.service.js`
  - [ ] Add transaction handling
  - [ ] Add geofence validation
  - [ ] Add duplicate clock-in check
  - [ ] Create adhoc shift record
  - [ ] Create time record
  - [ ] Send notifications

- [ ] **Create Controller**
  - [ ] Add `clockInAdhoc()` handler in `clockInOut.controller.js`
  - [ ] Handle file upload (photo)
  - [ ] Parse location data
  - [ ] Return proper error responses

- [ ] **Create Validation Schema**
  - [ ] Add `clockInAdhocSchema` in `clockInOut.validator.js`
  - [ ] Validate siteId, lat/lng, adhocReason
  - [ ] Validate reason length (10-500 chars)

- [ ] **Update Routes**
  - [ ] Add `POST /api/clock/adhoc` route
  - [ ] Apply authentication middleware
  - [ ] Apply authorization (EMPLOYEE role)
  - [ ] Apply validation middleware
  - [ ] Apply multer photo upload

- [ ] **Email Notifications**
  - [ ] Create adhoc shift notification template
  - [ ] Send to all managers/admins
  - [ ] Include reason, employee, site, timestamp
  - [ ] Add "Review" button linking to portal

- [ ] **Socket.io Events**
  - [ ] Broadcast `adhoc-shift-started` event
  - [ ] Include shift and employee details
  - [ ] Update admin dashboard in real-time

### Frontend Tasks

- [ ] **Employee Portal UI**
  - [ ] Create "Start Adhoc Shift" button component
  - [ ] Show/hide based on shift status and location
  - [ ] Add visual indicators (warning color)

- [ ] **Adhoc Reason Modal**
  - [ ] Create `AdhocShiftModal.jsx` component
  - [ ] Site selection dropdown (if multiple sites)
  - [ ] Reason text field (10-500 chars)
  - [ ] Position field (optional)
  - [ ] Photo upload (optional)
  - [ ] Geofence status indicator
  - [ ] Form validation
  - [ ] Submit handler

- [ ] **API Integration**
  - [ ] Add `clockInAdhoc()` method to `clockApi`
  - [ ] Handle FormData submission
  - [ ] Handle success/error responses
  - [ ] Update local state after successful clock-in

- [ ] **Admin Portal Enhancements**
  - [ ] Add "ADHOC" badge/chip to time records
  - [ ] Add "Adhoc Reason" column to table
  - [ ] Add "Initiated By" indicator
  - [ ] Add filter for adhoc shifts
  - [ ] Add filter for employee-initiated vs admin-created
  - [ ] Update CSV export to include adhoc fields
  - [ ] Style adhoc records differently (highlight/color)

- [ ] **Real-time Updates**
  - [ ] Listen for `adhoc-shift-started` socket event
  - [ ] Show notification/alert to managers
  - [ ] Refresh time records table
  - [ ] Update dashboard statistics

### Testing Tasks

- [ ] **Unit Tests**
  - [ ] Test `clockInAdhoc()` service method
  - [ ] Test validation schemas
  - [ ] Test model validation rules
  - [ ] Test geofence calculations

- [ ] **Integration Tests**
  - [ ] Test adhoc clock-in endpoint
  - [ ] Test with/without photo
  - [ ] Test geofence violations
  - [ ] Test duplicate clock-in prevention
  - [ ] Test site assignment validation

- [ ] **E2E Tests**
  - [ ] Employee initiates adhoc shift
  - [ ] Manager receives notification
  - [ ] Admin views adhoc shift in portal
  - [ ] Clock-out process
  - [ ] Hours automatically counted in reporting

### Documentation Tasks

- [ ] **API Documentation**
  - [ ] Document POST /api/clock/adhoc endpoint
  - [ ] Add request/response examples
  - [ ] Document error codes

- [ ] **User Guides**
  - [ ] Employee guide: How to start adhoc shift
  - [ ] Manager guide: How to monitor adhoc shifts
  - [ ] Admin guide: Adhoc shift policies

### Deployment Tasks

- [ ] **Database Migration**
  - [ ] Run migration to add new fields to Shift model
  - [ ] Set defaults for existing adhoc shifts
  - [ ] Create new indexes

- [ ] **Environment Variables**
  - [ ] Verify CLIENT_URL is set correctly
  - [ ] Verify email service is configured

- [ ] **Monitoring**
  - [ ] Set up alerts for adhoc shift creation
  - [ ] Monitor geofence violation rates
  - [ ] Track adhoc shift frequency statistics

---

## Security Considerations

1. **Authorization**
   - Only employees can initiate adhoc shifts
   - Only managers/admins can monitor and view reports
   - Employees can only create adhoc shifts for sites they're assigned to

2. **Geofence Validation**
   - Violations are logged but don't block adhoc shifts
   - Managers are alerted to geofence violations
   - Helps detect fraudulent clock-ins

3. **Rate Limiting**
   - Prevent abuse by limiting adhoc shift creation
   - Max 3 adhoc shifts per employee per day
   - Configurable per company

4. **Audit Trail**
   - All adhoc shifts logged with timestamp
   - Track who created (employee ID)
   - Track reason provided by employee
   - Immutable audit log for compliance

---

## Business Rules

1. **Automatic Approval**
   - All employee-initiated adhoc shifts are automatically approved
   - Hours immediately count toward payroll
   - Managers receive notifications for monitoring purposes

2. **Time Limits**
   - Adhoc shifts automatically clock out after 12 hours
   - Alert sent to employee and manager
   - Requires manual review if exceeded

3. **Reason Quality**
   - Minimum 10 characters enforced
   - Clear explanation required for audit trail
   - Patterns monitored for reporting purposes

4. **Frequency Limits**
   - Configurable per company
   - Default: Max 3 adhoc shifts per week per employee
   - Exceeded limit triggers manager notification

---

## Future Enhancements

1. **Reason Templates**
   - Common adhoc reasons pre-populated
   - Faster data entry
   - Standardized reporting

2. **Analytics Dashboard**
   - Track adhoc shift patterns by employee
   - Identify frequent adhoc workers
   - Forecast staffing needs

3. **Budget Controls**
   - Set adhoc shift budget per site/department
   - Alert when budget threshold reached
   - Automatic notifications for over-budget tracking

4. **Mobile Push Notifications**
   - Real-time alerts to managers
   - Instant adhoc shift notifications
   - One-tap view details

---

## Support & Troubleshooting

### Common Issues

**Issue:** "Employee already has an active clock-in"
- **Cause:** Employee didn't clock out from previous shift
- **Solution:** Admin manually clocks out employee from previous shift

**Issue:** "Employee is not assigned to this site"
- **Cause:** Employee trying to start adhoc at unassigned site
- **Solution:** Admin assigns employee to site first

**Issue:** "Adhoc reason must be at least 10 characters"
- **Cause:** Employee entered vague/short reason
- **Solution:** Employee provides detailed explanation

**Issue:** Geofence violation but clock-in allowed
- **Cause:** GPS inaccuracy or employee outside radius
- **Solution:** Manager reviews location data and investigates if necessary

---

## Conclusion

The Adhoc Shift feature provides a balanced approach to handling unscheduled work:

✅ **Flexibility** - Employees can respond to emergencies
✅ **Accountability** - Mandatory reasons and complete documentation
✅ **Transparency** - Complete tracking and audit trail
✅ **Efficiency** - Automatic approval with manager monitoring

This system maintains operational flexibility while ensuring proper documentation and monitoring of all work hours.
