# Clock In/Out Feature - Complete Documentation

## 📋 Table of Contents
1. [Feature Overview](#feature-overview)
2. [Technical Architecture](#technical-architecture)
3. [Installation & Setup](#installation--setup)
4. [Testing Guide](#testing-guide)
5. [User Guide](#user-guide)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)
8. [Future Enhancements](#future-enhancements)]

---

## 🎯 Feature Overview

The Clock In/Out system allows employees to track their work hours with GPS-based geofencing validation and optional photo verification.

### Key Features

**For Employees:**
- Clock in/out with GPS location verification
- Geofence validation (must be within site radius)
- Optional photo capture for verification
- View current clock status with elapsed time
- View personal time records history
- Filter records by date and site

**For Managers/Admins:**
- View all employees' time records
- Filter by employee, date, and site
- Export records to CSV for payroll
- Summary statistics (total records, hours)
- View clock in/out photos

### Business Rules

1. **Geofencing**: Employees must be within the site's geofence radius to clock in/out
2. **Photo**: Optional but recommended for verification
3. **No Restrictions**: Can clock in/out anytime (no shift time restrictions)
4. **Single Active Clock**: Only one active clock-in per employee at a time
5. **Blocking**: Outside geofence attempts are completely blocked

---

## 🏗️ Technical Architecture

### Database Models

#### TimeRecord
```javascript
{
  employeeId: ObjectId (ref: Employee),
  shiftId: ObjectId (ref: Shift) - Optional,
  siteId: ObjectId (ref: Site),
  companyId: String,

  clockInTime: Date,
  clockInLocation: GeoJSON Point,
  clockInPhotoUrl: String,

  clockOutTime: Date,
  clockOutLocation: GeoJSON Point,
  clockOutPhotoUrl: String,

  status: 'CLOCKED_IN' | 'CLOCKED_OUT',
  totalHours: Number,

  // Auto-managed
  createdAt, updatedAt, deletedAt,
  createdBy, updatedBy
}
```

#### Site (Enhanced)
```javascript
{
  siteLocationName: String,
  location: {
    type: 'Point',
    coordinates: [longitude, latitude]
  },
  geoFenceRadius: Number (meters, default: 100)
}
```

### Backend Structure

```
server/src/
├── models/
│   └── TimeRecord.js              # Database model
├── services/
│   └── clockInOut.service.js      # Business logic + geofencing
├── controllers/
│   └── clockInOut.controller.js   # HTTP handlers
├── validators/
│   └── clockInOut.validator.js    # Request validation
├── routes/
│   └── clockInOut.routes.js       # API endpoints
├── config/
│   └── upload.js                  # Multer photo upload
└── uploads/
    └── clock-photos/              # Photo storage
```

### Frontend Structure

```
client/src/
├── components/
│   └── attendance/
│       ├── ClockInOut.jsx            # Main clock UI
│       ├── TimeRecordsHistory.jsx    # Employee history
│       └── ManagerTimeRecords.jsx    # Manager view
├── lib/
│   └── api.js                        # API client (clockApi)
└── App.jsx                           # Routes
```

### API Endpoints

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/api/v1/clock/in` | All | Clock in with geofence check |
| POST | `/api/v1/clock/out` | All | Clock out with geofence check |
| GET | `/api/v1/clock/status` | All | Get current clock status |
| GET | `/api/v1/clock/history` | All | Get employee's records |
| GET | `/api/v1/clock/records` | MANAGER+ | Get all records |
| GET | `/api/v1/clock/export` | MANAGER+ | Export CSV |

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18+
- MongoDB 5+
- npm or yarn

### Backend Setup

1. **Install Dependencies**
```bash
cd server
npm install multer  # Photo upload (already installed)
```

2. **Create Upload Directory**
```bash
mkdir -p uploads/clock-photos
```

3. **Configure Environment**
```env
# .env.development
MONGODB_URI=mongodb://localhost:27017
DB_NAME=roster_mechanic_dev
JWT_SECRET=your-secret-key
```

4. **Seed Test Data**
```bash
node src/scripts/seedClockTestData.js
```

This creates:
- 1 Company
- 2 Sites with geofence locations
- 2 Employees
- 4 Users (2 employees, 1 manager, 1 admin)

### Frontend Setup

1. **No Additional Dependencies Required**
   All components use existing libraries.

2. **Configure API URL**
```env
# .env.development
VITE_API_URL=http://localhost:5000/api
```

### Database Indexes

The following indexes are automatically created:

```javascript
// TimeRecord
{ employeeId: 1, clockInTime: -1, companyId: 1 }
{ siteId: 1, clockInTime: -1, companyId: 1 }
{ status: 1, companyId: 1 }
{ clockInLocation: '2dsphere' }
{ clockOutLocation: '2dsphere' }

// Site
{ location: '2dsphere' }
```

---

## 🧪 Testing Guide

### Automated Tests

**Backend Build:**
```bash
cd server
npm run dev  # Should start without errors
```

**Frontend Build:**
```bash
cd client
npm run build  # Should compile successfully
```

### Manual Testing Checklist

#### 1. Clock In Flow ✓

```
Test Case: Successful Clock In
1. Login as: john.doe@test.com / password123
2. Navigate to: /user/clock
3. Select site: "Sydney CBD Office"
4. Click "Get Current Location"
5. Use coordinates: -33.8688, 151.2093 (within fence)
6. Optionally: Take photo
7. Click "Clock In"

Expected: Success message, status shows "Clocked In"
```

```
Test Case: Clock In Outside Geofence (Blocked)
1. Same as above
2. Use coordinates: -33.9000, 151.3000 (outside fence)
3. Click "Clock In"

Expected: Error "You are outside the geofenced area..."
```

```
Test Case: Double Clock In Prevention
1. Clock in successfully
2. Try to clock in again

Expected: Error "You are already clocked in..."
```

#### 2. Clock Out Flow ✓

```
Test Case: Successful Clock Out
1. While clocked in
2. Get location (within geofence)
3. Optionally: Take photo
4. Click "Clock Out"

Expected: Success with total hours displayed
```

```
Test Case: Clock Out Outside Geofence (Blocked)
1. While clocked in
2. Use coordinates outside geofence
3. Click "Clock Out"

Expected: Error "You are outside the geofenced area..."
```

#### 3. History Views ✓

```
Test Case: Employee History
1. Navigate to: /user/history
2. Should see list of time records
3. Test filters (date range, site)
4. Test pagination
5. Click photo icons to view images

Expected: Records displayed, filters work, photos viewable
```

```
Test Case: Manager View
1. Login as: manager@test.com / password123
2. Navigate to: /attendance/records
3. Should see all employees' records
4. Test filters (employee, date, site)
5. View summary statistics

Expected: All records visible, stats calculated
```

#### 4. CSV Export ✓

```
Test Case: Export Time Records
1. As manager, go to /attendance/records
2. Apply filters (optional)
3. Click "Export CSV"

Expected: CSV file downloads with correct data
```

#### 5. Photo Upload ✓

```
Test Case: Photo Capture
1. During clock in/out
2. Click "Take Photo"
3. Select image (< 5MB, JPEG/PNG)
4. Preview should appear
5. Complete clock in/out

Expected: Photo uploaded, viewable in history
```

### Test Data

**Login Credentials:**
- Employee 1: `john.doe@test.com` / `password123`
- Employee 2: `jane.smith@test.com` / `password123`
- Manager: `manager@test.com` / `password123`
- Admin: `admin@test.com` / `password123`

**Test Locations (Sydney CBD Site):**
- Site Center: `-33.8688, 151.2093`
- Geofence Radius: `100m`
- Within Fence: `-33.8688, 151.2093` (exact match)
- Outside Fence: `-33.9000, 151.3000` (will be blocked)

---

## 👤 User Guide

### For Employees

#### How to Clock In

1. **Navigate**: Go to "Clock In/Out" from the sidebar
2. **Select Site**: Choose your work site from dropdown
3. **Get Location**: Click "Get Current Location"
   - Allow location permissions when prompted
   - Ensure you're at the work site (within geofence)
4. **Take Photo** (Optional): Click "Take Photo" for verification
5. **Clock In**: Click the big green "Clock In" button

**Important Notes:**
- You must be within the site's geofenced area
- Location permissions are required
- Only one active clock-in at a time

#### How to Clock Out

1. **Get Location**: Click "Get Current Location"
   - Must still be within geofence
2. **Take Photo** (Optional): Take an end-of-shift photo
3. **Clock Out**: Click the big red "Clock Out" button
4. **View Hours**: Total hours worked will be displayed

#### View Your Time Records

1. **Navigate**: Go to "Time Records" from sidebar
2. **Filter** (Optional):
   - Select date range
   - Filter by site
3. **View Details**:
   - Clock in/out times
   - Total hours
   - Photos (click icons)

### For Managers/Admins

#### View All Employee Records

1. **Navigate**: Go to `/attendance/records`
2. **Review**:
   - All employees' time records
   - Summary statistics at top
3. **Filter**:
   - By employee
   - By date range
   - By site

#### Export to CSV

1. **Apply Filters** (optional)
2. **Click**: "Export CSV" button (top right)
3. **Save**: File downloads automatically
4. **Use**: Import into payroll system

---

## 📡 API Reference

### Clock In

```http
POST /api/v1/clock/in
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
  employeeId: String (required)
  siteId: String (required)
  latitude: Number (required, -90 to 90)
  longitude: Number (required, -180 to 180)
  photo: File (optional)
  shiftId: String (optional)

Response 201:
{
  "success": true,
  "message": "Clocked in successfully",
  "data": {
    "_id": "...",
    "employeeId": {...},
    "siteId": {...},
    "clockInTime": "2026-02-05T10:30:00.000Z",
    "clockInLocation": {
      "type": "Point",
      "coordinates": [151.2093, -33.8688]
    },
    "status": "CLOCKED_IN"
  }
}

Errors:
  400: Validation error
  403: Outside geofence
  404: Employee/Site not found
  409: Already clocked in
```

### Clock Out

```http
POST /api/v1/clock/out
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
  employeeId: String (required)
  latitude: Number (required)
  longitude: Number (required)
  photo: File (optional)

Response 200:
{
  "success": true,
  "message": "Clocked out successfully",
  "data": {
    "clockOutTime": "2026-02-05T18:30:00.000Z",
    "totalHours": 8.0,
    "status": "CLOCKED_OUT"
  }
}

Errors:
  403: Outside geofence
  404: No active clock-in found
```

### Get Current Status

```http
GET /api/v1/clock/status?employeeId={id}
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "status": "CLOCKED_IN",
    "clockInTime": "2026-02-05T10:30:00.000Z",
    "siteId": {...}
  } | null
}
```

### Get Employee History

```http
GET /api/v1/clock/history?employeeId={id}&startDate={iso}&endDate={iso}&siteId={id}&page=1&limit=20
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

### Get Manager View

```http
GET /api/v1/clock/records?startDate={iso}&endDate={iso}&siteId={id}&employeeId={id}&page=1&limit=50
Authorization: Bearer {token}
X-User-Role: MANAGER or ADMIN

Response 200:
{
  "success": true,
  "data": [...],
  "pagination": {...}
}

Error:
  403: Unauthorized (requires MANAGER or ADMIN role)
```

### Export CSV

```http
GET /api/v1/clock/export?startDate={iso}&endDate={iso}&siteId={id}&employeeId={id}
Authorization: Bearer {token}
X-User-Role: MANAGER or ADMIN

Response 200:
Content-Type: text/csv
Content-Disposition: attachment; filename=time-records.csv

Employee Name,Employee Email,Site,Clock In Date,Clock In Time,...
```

---

## 🔧 Troubleshooting

### Common Issues

**Issue: "Geolocation is not supported"**
- **Cause**: Browser doesn't support geolocation
- **Solution**: Use a modern browser (Chrome, Firefox, Safari)

**Issue: "Location permission denied"**
- **Cause**: User blocked location access
- **Solution**: Enable location in browser settings

**Issue: "Outside geofenced area" (but user is at site)**
- **Cause**: GPS accuracy issues or incorrect site coordinates
- **Solutions**:
  1. Refresh location (click "Refresh Location")
  2. Check site coordinates in database
  3. Increase site.geoFenceRadius

**Issue: "No active clock-in found" on clock out**
- **Cause**: Employee not clocked in
- **Solution**: Clock in first

**Issue: Photo upload fails**
- **Causes**: File too large or wrong type
- **Solutions**:
  1. Ensure file < 5MB
  2. Use JPEG, PNG, or WebP format
  3. Check server has write permissions to uploads/

**Issue: CSV export downloads empty file**
- **Cause**: No records match filters
- **Solution**: Adjust filters or check date range

### Debug Mode

**Enable Backend Logging:**
```javascript
// server/src/services/clockInOut.service.js
isWithinGeofence(employeeLat, employeeLon, site) {
  const distance = this.calculateDistance(...);
  console.log('Distance:', distance, 'Radius:', site.geoFenceRadius);
  return distance <= site.geoFenceRadius;
}
```

**Check Browser Console:**
- Open DevTools (F12)
- Look for API errors in Network tab
- Check geolocation errors in Console

---

## 🚀 Future Enhancements

### Potential Features

1. **Offline Support**
   - Cache clock status locally
   - Sync when connection restored

2. **Break Time Tracking**
   - Clock in/out for breaks
   - Deduct from total hours

3. **Shift Integration**
   - Auto-clock-in from schedule
   - Alert if late/early

4. **Notifications**
   - Push notification for missed clock-out
   - Daily summary emails

5. **Advanced Reporting**
   - Weekly/monthly summaries
   - Overtime calculations
   - Charts and graphs

6. **QR Code Check-in**
   - Scan site QR code
   - Additional verification method

7. **Geofence Visualization**
   - Show site geofence on map
   - Visual feedback for employees

8. **Auto Clock-Out**
   - Automatic clock-out at shift end
   - Configurable grace period

9. **Multiple Concurrent Sites**
   - Work at multiple sites
   - Track time per site

10. **Biometric Verification**
    - Fingerprint/Face ID
    - Enhanced security

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review API error messages
3. Check browser console
4. Verify test data is seeded
5. Contact development team

---

## 📄 License

This feature is part of the Roster Management System.
Copyright © 2026 All rights reserved.

---

**Last Updated**: February 5, 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
