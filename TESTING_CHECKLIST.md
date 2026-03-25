# Clock In/Out Feature - Testing Checklist

## Prerequisites
- [ ] Backend server running on http://localhost:5000
- [ ] Frontend running on http://localhost:5173
- [ ] Database seeded with test data (sites, employees, users)
- [ ] User account with employee linked

## Phase 4 Testing - Clock In/Out Component

### Navigation
- [ ] Navigate to `/user/clock` (Employee Portal)
- [ ] "Clock In/Out" link visible in employee sidebar
- [ ] Page loads without errors

### UI Elements
- [ ] Header displays "Clock In/Out" title
- [ ] Site selector displays with available sites
- [ ] "Get Current Location" button visible
- [ ] "Take Photo" button visible
- [ ] Help section displays at bottom
- [ ] Mobile responsive (test on small screen)

### Geolocation
- [ ] Click "Get Current Location" button
- [ ] Browser prompts for location permission
- [ ] After allowing, location displays with coordinates
- [ ] Accuracy shown (±XXm)
- [ ] "Refresh Location" button appears
- [ ] Test refresh button updates location
- [ ] Test denying permission shows error message

### Site Selection
- [ ] Site dropdown populated with sites from API
- [ ] Can select a site
- [ ] Validation: Clock in fails without site selected

### Photo Capture
- [ ] Click "Take Photo" button
- [ ] File picker opens
- [ ] Select image file (JPEG/PNG)
- [ ] Photo preview displays
- [ ] Remove photo button works (X icon)
- [ ] Retake photo option works
- [ ] Test file validation (try uploading non-image)
- [ ] Test size validation (try file > 5MB)

### Clock In Flow
- [ ] Select site
- [ ] Get location
- [ ] Optionally add photo
- [ ] Click "Clock In" button
- [ ] Loading state shows ("Clocking In...")
- [ ] Success message appears
- [ ] UI switches to "Clocked In" mode
- [ ] Green status banner shows:
  - Site name
  - Clock in time
  - Elapsed time (updates every second)

### Clock In - Error Cases
- [ ] Try clock in without site selected → Error
- [ ] Try clock in without location → Error
- [ ] Try clock in outside geofence → Error (403)
- [ ] Try clock in while already clocked in → Error (409)

### Clock Out Flow
- [ ] While clocked in, page shows status
- [ ] Site selector hidden
- [ ] Elapsed time counter running
- [ ] Get location
- [ ] Optionally add photo
- [ ] Click "Clock Out" button
- [ ] Loading state shows ("Clocking Out...")
- [ ] Success message shows total hours
- [ ] UI switches back to "Clock In" mode

### Clock Out - Error Cases
- [ ] Try clock out without location → Error
- [ ] Try clock out outside geofence → Error (403)
- [ ] Try clock out without active clock in → Error (404)

### Status Persistence
- [ ] Clock in
- [ ] Refresh page
- [ ] Status still shows "Clocked In"
- [ ] Elapsed time continues from correct time

### API Integration
- [ ] Check browser Network tab
- [ ] POST /api/v1/clock/in sends FormData
- [ ] POST /api/v1/clock/out sends FormData
- [ ] GET /api/v1/clock/status returns current status
- [ ] Photo uploaded as multipart/form-data
- [ ] Authorization header included

### Mobile Testing
- [ ] Test on mobile device or Chrome DevTools mobile view
- [ ] Camera capture works on mobile
- [ ] Touch targets large enough (48px+)
- [ ] Layout stacks properly
- [ ] Geolocation works on mobile

## Common Issues to Check

### Frontend Issues
- ✅ Build completes without errors
- ✅ Dev server starts without errors
- ✅ No console errors on page load
- ✅ Routes registered correctly

### Backend Issues
- [ ] TimeRecord model exists in database
- [ ] Clock routes registered (/api/v1/clock/*)
- [ ] Multer upload middleware configured
- [ ] Upload directory exists (server/uploads/clock-photos/)
- [ ] Static file serving enabled (/uploads)

### Integration Issues
- [ ] CORS configured for client origin
- [ ] FormData content-type handled correctly
- [ ] Photo URLs accessible (http://localhost:5000/uploads/clock-photos/...)
- [ ] JWT token valid and not expired

## Test Data Needed

### Database Setup
```javascript
// Need at least:
- 1 Company
- 1 Site with:
  - location: { type: "Point", coordinates: [longitude, latitude] }
  - geoFenceRadius: 100
- 1 Employee with:
  - isActive: true
- 1 User with:
  - Linked to Employee
  - Valid JWT token
```

### Test Coordinates (Sydney Example)
```
Site Location: -33.8688, 151.2093
Within Geofence: -33.8688, 151.2093 (exact match)
Outside Geofence: -33.9000, 151.3000 (far away)
```

## Known Limitations (Phase 4)
- No history view yet (Phase 5)
- No manager dashboard yet (Phase 5)
- No CSV export UI yet (Phase 5)
- No offline support
- No automatic clock out at shift end
- No break time tracking

## Next Steps After Testing
- Fix any bugs found
- Proceed to Phase 5: History Views
- Build TimeRecordsHistory component
- Build ManagerTimeRecords component
- Add CSV export button
