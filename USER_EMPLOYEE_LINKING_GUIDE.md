# Critical Bug Fix: Database Connection Issue

## Problem Summary
The Company and User APIs were returning empty results even though data existed in the database.

## Root Cause
The MongoDB connection in `src/config/database.js` was not specifying the `dbName` parameter, causing the API server to connect to a default database (likely `test`) instead of `roster_mechanic_dev` where the actual data was stored.

## The Bug
**File:** `server/src/config/database.js` (line 32)

**Before (incorrect):**
```javascript
await mongoose.connect(config.database.uri, config.database.options);
```

The `dbName` was defined in `config.database.dbName` but wasn't being passed to the mongoose.connect() call.

## The Fix
**After (correct):**
```javascript
await mongoose.connect(config.database.uri, {
  dbName: config.database.dbName,
  ...config.database.options
});
```

Now the connection explicitly specifies which database to use by spreading the `dbName` along with the other options.

## Verification
After the fix:
- ✅ Company API (`GET /api/v1/companies`) returns Test Company data
- ✅ User API (`GET /api/v1/users/me`) returns admin user data
- ✅ All data with `deletedAt: null` is correctly retrieved
- ✅ Soft delete middleware working correctly

## Additional Issues Discovered and Fixed
1. **Soft Delete Plugin:** Fixed the `findWithDeleted()` method to properly bypass soft delete middleware using the `_bypassSoftDelete` option flag.
2. **Stale Server Processes:** Old node processes were continuing to run even after code changes, requiring manual termination via `taskkill`.

## Files Modified
1. `server/src/config/database.js` - Fixed mongoose connection to include dbName
2. `server/src/models/plugins/softDelete.js` - Fixed findWithDeleted() bypass mechanism
3. `server/scripts/reset-test-data.js` - Created for clean test data reset
4. `server/scripts/generate-jwt.js` - Updated with new test user/company IDs

## Testing
Test data created:
- Company ID: `6973410c88b5d1a11c2874cb` (Test Company)
- Admin User ID: `6973410c88b5d1a11c2874cf` (admin@test.com)
- Manager User ID: `6973410c88b5d1a11c2874d0` (manager@test.com)
- Regular User ID: `6973410c88b5d1a11c2874d1` (user@test.com)

All users have password: `password123`

## Next Steps
- Continue testing remaining CRUD endpoints (Sites, Scheduler, etc.)
- All APIs should now work correctly with proper database connection
