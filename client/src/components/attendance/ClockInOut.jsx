import { useState, useEffect, useRef } from 'react';
import { MapPin, Camera, Clock, CheckCircle, XCircle, Loader2, AlertCircle, Navigation, Calendar } from 'lucide-react';
import { clockApi, shiftApi } from '../../lib/api';

export default function ClockInOut() {
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Location state
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Clock status
  const [clockStatus, setClockStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Shifts for today
  const [todayShifts, setTodayShifts] = useState([]);
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState(null);

  // Photo
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Elapsed time for clock in
  const [elapsedTime, setElapsedTime] = useState('');

  // Get employeeId from localStorage
  const employeeId = localStorage.getItem('userId');

  // Fetch current status and today's shifts on mount
  useEffect(() => {
    fetchCurrentStatus();
    fetchTodayShifts();
  }, []);

  // Update elapsed time every second if clocked in
  useEffect(() => {
    if (clockStatus?.clockInTime) {
      const interval = setInterval(() => {
        const clockInTime = new Date(clockStatus.clockInTime);
        const now = new Date();
        const diff = now - clockInTime;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setElapsedTime(`${hours}h ${minutes}m ${seconds}s`);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [clockStatus]);

  // Fetch current clock status
  const fetchCurrentStatus = async () => {
    try {
      setStatusLoading(true);
      const response = await clockApi.getCurrentStatus(employeeId);
      setClockStatus(response.data.data);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  // Fetch today's shifts for the employee
  const fetchTodayShifts = async () => {
    try {
      setShiftsLoading(true);

      // Get today's date range (start and end of day)
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const response = await shiftApi.getMyShifts(startOfDay, endOfDay);
      const shifts = response.data.data || [];

      // Filter only SCHEDULED shifts (not completed, cancelled, etc.)
      const scheduledShifts = shifts.filter(shift => shift.status === 'SCHEDULED');

      setTodayShifts(scheduledShifts);

      // Auto-select if only one shift
      if (scheduledShifts.length === 1) {
        setSelectedShift(scheduledShifts[0]);
      }
    } catch (err) {
      console.error('Failed to fetch shifts:', err);
      setError('Failed to load your shifts for today');
    } finally {
      setShiftsLoading(false);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationLoading(false);
        setLocationError(null);
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Handle photo capture
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo size must be less than 5MB');
        return;
      }

      setPhoto(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle clock in
  const handleClockIn = async () => {
    setError(null);
    setSuccess(null);

    // Validation
    if (!selectedShift) {
      setError('Please select a shift to clock in');
      return;
    }

    if (!location) {
      setError('Please get your current location first');
      return;
    }

    try {
      setLoading(true);

      const response = await clockApi.clockIn(
        employeeId,
        selectedShift.siteId._id || selectedShift.siteId,
        location.latitude,
        location.longitude,
        photo,
        selectedShift._id
      );

      setSuccess('Clocked in successfully!');
      setClockStatus(response.data.data);

      // Reset form
      setPhoto(null);
      setPhotoPreview(null);

      // Refresh status and shifts
      setTimeout(() => {
        fetchCurrentStatus();
        fetchTodayShifts();
      }, 1000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to clock in';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle clock out
  const handleClockOut = async () => {
    setError(null);
    setSuccess(null);

    if (!location) {
      setError('Please get your current location first');
      return;
    }

    try {
      setLoading(true);

      const response = await clockApi.clockOut(
        employeeId,
        location.latitude,
        location.longitude,
        photo
      );

      setSuccess(`Clocked out successfully! Total time: ${response.data.data.totalHours} hours`);
      setClockStatus(null);

      // Reset form
      setPhoto(null);
      setPhotoPreview(null);

      // Refresh status and shifts
      setTimeout(() => {
        fetchCurrentStatus();
        fetchTodayShifts();
      }, 1000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to clock out';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Format shift time for display
  const formatShiftTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (statusLoading || shiftsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const isClockedIn = clockStatus !== null;
  const hasShiftsToday = todayShifts.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Clock In/Out</h1>
          <p className="text-gray-600">Track your work hours with location verification</p>
        </div>

        {/* Current Status */}
        {isClockedIn && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-green-900 mb-2">Currently Clocked In</h2>
                <div className="space-y-1 text-sm text-green-800">
                  <p><span className="font-medium">Site:</span> {clockStatus.siteId?.siteLocationName || 'N/A'}</p>
                  <p><span className="font-medium">Clock In Time:</span> {new Date(clockStatus.clockInTime).toLocaleString()}</p>
                  <p><span className="font-medium">Elapsed Time:</span> {elapsedTime}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Shifts Message */}
        {!isClockedIn && !hasShiftsToday && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-yellow-900 mb-2">No Shifts Scheduled Today</h2>
                <p className="text-sm text-yellow-800">
                  You don't have any scheduled shifts for today. Please contact your manager if you believe this is an error.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Main Form - Only show if has shifts or is clocked in */}
        {(hasShiftsToday || isClockedIn) && (
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            {/* Shift Selector - Only for clock in with multiple shifts */}
            {!isClockedIn && todayShifts.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Your Shift <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {todayShifts.map((shift) => (
                    <label
                      key={shift._id}
                      className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedShift?._id === shift._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shift"
                        value={shift._id}
                        checked={selectedShift?._id === shift._id}
                        onChange={() => setSelectedShift(shift)}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-medium text-gray-900">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          {shift.siteId?.siteLocationName || 'Unknown Site'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Clock className="w-4 h-4" />
                          {formatShiftTime(shift.startTime)} - {formatShiftTime(shift.endTime)}
                        </div>
                        {shift.shiftType && (
                          <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {shift.shiftType}
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Show shift info if only one shift */}
            {!isClockedIn && todayShifts.length === 1 && selectedShift && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Your Shift Today</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedShift.siteId?.siteLocationName || 'Unknown Site'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {formatShiftTime(selectedShift.startTime)} - {formatShiftTime(selectedShift.endTime)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>

              {!location && (
                <button
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {locationLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Getting Location...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-5 h-5" />
                      Get Current Location
                    </>
                  )}
                </button>
              )}

              {location && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">Location Acquired</p>
                      <p className="text-xs text-gray-600">
                        Lat: {location.latitude.toFixed(6)}, Lon: {location.longitude.toFixed(6)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Accuracy: ±{Math.round(location.accuracy)}m
                      </p>
                      <button
                        onClick={getCurrentLocation}
                        className="text-sm text-blue-600 hover:text-blue-700 mt-2"
                      >
                        Refresh Location
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {locationError && (
                <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {locationError}
                </div>
              )}
            </div>

            {/* Photo Capture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo Verification <span className="text-gray-500">(Optional)</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
              />

              {!photoPreview && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Take Photo
                </button>
              )}

              {photoPreview && (
                <div className="space-y-3">
                  <div className="relative inline-block">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full max-w-xs rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => {
                        setPhoto(null);
                        setPhotoPreview(null);
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Retake Photo
                  </button>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="pt-4">
              {!isClockedIn ? (
                <button
                  onClick={handleClockIn}
                  disabled={loading || !location || !selectedShift || !hasShiftsToday}
                  className="w-full py-4 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Clocking In...
                    </>
                  ) : (
                    <>
                      <Clock className="w-6 h-6" />
                      Clock In
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleClockOut}
                  disabled={loading || !location}
                  className="w-full py-4 bg-red-600 text-white rounded-lg font-semibold text-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Clocking Out...
                    </>
                  ) : (
                    <>
                      <Clock className="w-6 h-6" />
                      Clock Out
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Important:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>You can only clock in for scheduled shifts</li>
                <li>You must be within the site's geofenced area</li>
                <li>Enable location permissions when prompted</li>
                <li>Photo verification is optional but recommended</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
