import { useState, useEffect, useRef } from 'react';
import { MapPin, Camera, Clock, CheckCircle, XCircle, Loader2, AlertCircle, Navigation, Calendar } from 'lucide-react';
import { clockApi, shiftApi } from '../../lib/api';

export default function ClockInOut() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const [clockStatus, setClockStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const [todayShifts, setTodayShifts] = useState([]);
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState(null);

  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [elapsedTime, setElapsedTime] = useState('');
  const [employeeId, setEmployeeId] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await shiftApi.getMyEmployee();
        const id = res.data.data._id?.toString() || res.data.data.id;
        setEmployeeId(id);
        fetchCurrentStatus(id);
        fetchTodayShifts();
        fetchUpcomingShifts();
      } catch (err) {
        setError('Could not load your employee profile. Please contact your manager.');
        setStatusLoading(false);
        setShiftsLoading(false);
      }
    };
    init();
  }, []);

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

  const fetchCurrentStatus = async (id) => {
    const resolvedId = id || employeeId;
    if (!resolvedId) return;
    try {
      setStatusLoading(true);
      const response = await clockApi.getCurrentStatus(resolvedId);
      setClockStatus(response.data.data);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchTodayShifts = async () => {
    try {
      setShiftsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await shiftApi.getMyShifts(today, today);
      const shifts = response.data.data || [];
      const scheduledShifts = shifts.filter(shift => shift.status === 'SCHEDULED');
      setTodayShifts(scheduledShifts);
      if (scheduledShifts.length === 1) setSelectedShift(scheduledShifts[0]);
    } catch (err) {
      console.error('Failed to fetch shifts:', err);
      setError('Failed to load your shifts for today');
    } finally {
      setShiftsLoading(false);
    }
  };

  const fetchUpcomingShifts = async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const response = await shiftApi.getMyShifts(
        tomorrow.toISOString().split('T')[0],
        nextWeek.toISOString().split('T')[0]
      );
      const shifts = response.data.data || [];
      const scheduledShifts = shifts.filter(shift => shift.status === 'SCHEDULED');
      setUpcomingShifts(scheduledShifts);
    } catch (err) {
      console.error('Failed to fetch upcoming shifts:', err);
    }
  };

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
          case error.PERMISSION_DENIED: errorMessage = 'Location permission denied. Please enable location access.'; break;
          case error.POSITION_UNAVAILABLE: errorMessage = 'Location information unavailable'; break;
          case error.TIMEOUT: errorMessage = 'Location request timed out'; break;
        }
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) { setError('Please select an image file'); return; }
      if (file.size > 5 * 1024 * 1024) { setError('Photo size must be less than 5MB'); return; }
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleClockIn = async () => {
    setError(null); setSuccess(null);
    if (!selectedShift) { setError('Please select a shift to clock in'); return; }
    if (!location) { setError('Please get your current location first'); return; }
    try {
      setLoading(true);
      const response = await clockApi.clockIn(
        employeeId, selectedShift.siteId?.id || selectedShift.siteId,
        location.latitude, location.longitude, photo, selectedShift.id
      );
      setSuccess('Clocked in successfully!');
      setClockStatus(response.data.data);
      setPhoto(null); setPhotoPreview(null);
      setTimeout(() => { fetchCurrentStatus(); fetchTodayShifts(); fetchUpcomingShifts(); }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to clock in');
    } finally { setLoading(false); }
  };

  const handleClockOut = async () => {
    setError(null); setSuccess(null);
    if (!location) { setError('Please get your current location first'); return; }
    try {
      setLoading(true);
      const response = await clockApi.clockOut(employeeId, location.latitude, location.longitude, photo);
      setSuccess(`Clocked out successfully! Total time: ${response.data.data.totalHours} hours`);
      setClockStatus(null);
      setPhoto(null); setPhotoPreview(null);
      setTimeout(() => { fetchCurrentStatus(); fetchTodayShifts(); fetchUpcomingShifts(); }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to clock out');
    } finally { setLoading(false); }
  };

  const formatShiftTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatShiftDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateShiftDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = (end - start) / (1000 * 60 * 60);
    return `${hours.toFixed(1)} hrs`;
  };

  if (statusLoading || shiftsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[hsl(var(--color-background))]">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--color-primary))]" />
      </div>
    );
  }

  const isClockedIn = clockStatus !== null;
  const hasShiftsToday = todayShifts.length > 0;

  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))] py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-[hsl(var(--color-foreground))] mb-1">Clock In/Out</h1>
          <p className="text-[hsl(var(--color-foreground-secondary))]">Track your work hours with location verification</p>
        </div>

        {/* Currently Clocked In */}
        {isClockedIn && (
          <div className="border border-green-500/30 bg-green-500/10 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-[hsl(var(--color-foreground))] mb-2">Currently Clocked In</h2>
                <div className="space-y-1 text-sm text-[hsl(var(--color-foreground-secondary))]">
                  <p><span className="font-medium text-[hsl(var(--color-foreground))]">Site:</span> {clockStatus.siteId?.siteLocationName || 'N/A'}</p>
                  <p><span className="font-medium text-[hsl(var(--color-foreground))]">Clock In Time:</span> {new Date(clockStatus.clockInTime).toLocaleString()}</p>
                  <p><span className="font-medium text-[hsl(var(--color-foreground))]">Elapsed Time:</span> {elapsedTime}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Shifts */}
        {!isClockedIn && !hasShiftsToday && (
          <div className="border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-elevated))] rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-[hsl(var(--color-primary))] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-[hsl(var(--color-foreground))] mb-2">No Shifts Scheduled Today</h2>
                <p className="text-sm text-[hsl(var(--color-foreground-secondary))]">
                  You don't have any scheduled shifts for today. Please contact your manager if you believe this is an error.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error alert */}
        {error && (
          <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-4 mb-6 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-[hsl(var(--color-foreground))]">{error}</p>
          </div>
        )}

        {/* Success alert */}
        {success && (
          <div className="border border-green-500/30 bg-green-500/10 rounded-lg p-4 mb-6 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-[hsl(var(--color-foreground))]">{success}</p>
          </div>
        )}

        {/* Main Form */}
        {(hasShiftsToday || isClockedIn) && (
          <div className="bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-lg p-6 space-y-6">

            {/* Shift Selector - multiple shifts */}
            {!isClockedIn && todayShifts.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-2">
                  Select Your Shift <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {todayShifts.map((shift) => (
                    <label
                      key={shift.id}
                      className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedShift?.id === shift.id
                          ? 'border-[hsl(var(--color-primary))] bg-[hsl(var(--color-primary))]/10'
                          : 'border-[hsl(var(--color-border))] hover:border-[hsl(var(--color-border-strong))]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shift"
                        value={shift.id}
                        checked={selectedShift?.id === shift.id}
                        onChange={() => setSelectedShift(shift)}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-medium text-[hsl(var(--color-foreground))]">
                          <MapPin className="w-4 h-4 text-[hsl(var(--color-foreground-secondary))]" />
                          {shift.siteId?.siteLocationName || 'Unknown Site'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-secondary))] mt-1">
                          <Clock className="w-4 h-4" />
                          {formatShiftTime(shift.startTime)} - {formatShiftTime(shift.endTime)}
                        </div>
                        {shift.shiftType && (
                          <span className="inline-block mt-2 px-2 py-1 bg-[hsl(var(--color-surface-elevated))] text-[hsl(var(--color-foreground-secondary))] text-xs rounded border border-[hsl(var(--color-border))]">
                            {shift.shiftType}
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Single shift info */}
            {!isClockedIn && todayShifts.length === 1 && selectedShift && (
              <div className="border border-[hsl(var(--color-primary))]/30 bg-[hsl(var(--color-primary))]/10 rounded-lg p-4">
                <h3 className="font-medium text-[hsl(var(--color-foreground))] mb-2">Your Shift Today</h3>
                <div className="space-y-1 text-sm text-[hsl(var(--color-foreground-secondary))]">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[hsl(var(--color-primary))]" />
                    <span>{selectedShift.siteId?.siteLocationName || 'Unknown Site'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[hsl(var(--color-primary))]" />
                    <span>{formatShiftTime(selectedShift.startTime)} - {formatShiftTime(selectedShift.endTime)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-2">
                Location <span className="text-red-500">*</span>
              </label>

              {!location && (
                <button
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="w-full sm:w-auto px-6 py-3 bg-[hsl(var(--color-primary))] text-white rounded-lg font-medium hover:bg-[hsl(var(--color-primary-hover))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {locationLoading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />Getting Location...</>
                  ) : (
                    <><Navigation className="w-5 h-5" />Get Current Location</>
                  )}
                </button>
              )}

              {location && (
                <div className="bg-[hsl(var(--color-surface-elevated))] border border-[hsl(var(--color-border))] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[hsl(var(--color-foreground))] mb-1">Location Acquired</p>
                      <p className="text-xs text-[hsl(var(--color-foreground-secondary))]">
                        Lat: {location.latitude.toFixed(6)}, Lon: {location.longitude.toFixed(6)}
                      </p>
                      <p className="text-xs text-[hsl(var(--color-foreground-muted))] mt-1">
                        Accuracy: ±{Math.round(location.accuracy)}m
                      </p>
                      <button
                        onClick={getCurrentLocation}
                        className="text-sm text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary-hover))] mt-2"
                      >
                        Refresh Location
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {locationError && (
                <div className="mt-2 text-sm text-red-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {locationError}
                </div>
              )}
            </div>

            {/* Photo Capture */}
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-2">
                Photo Verification <span className="text-[hsl(var(--color-foreground-muted))]">(Optional)</span>
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
                  className="w-full sm:w-auto px-6 py-3 bg-[hsl(var(--color-surface-elevated))] text-[hsl(var(--color-foreground))] border border-[hsl(var(--color-border))] rounded-lg font-medium hover:bg-[hsl(var(--color-card))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Take Photo
                </button>
              )}

              {photoPreview && (
                <div className="space-y-3">
                  <div className="relative inline-block">
                    <img src={photoPreview} alt="Preview" className="w-full max-w-xs rounded-lg border border-[hsl(var(--color-border))]" />
                    <button
                      onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary-hover))]"
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
                    <><Loader2 className="w-6 h-6 animate-spin" />Clocking In...</>
                  ) : (
                    <><Clock className="w-6 h-6" />Clock In</>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleClockOut}
                  disabled={loading || !location}
                  className="w-full py-4 bg-red-600 text-white rounded-lg font-semibold text-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <><Loader2 className="w-6 h-6 animate-spin" />Clocking Out...</>
                  ) : (
                    <><Clock className="w-6 h-6" />Clock Out</>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 bg-[hsl(var(--color-surface-elevated))] border border-[hsl(var(--color-border))] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[hsl(var(--color-primary))] mt-0.5 flex-shrink-0" />
            <div className="text-sm text-[hsl(var(--color-foreground-secondary))]">
              <p className="font-medium text-[hsl(var(--color-foreground))] mb-1">Important:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>You can only clock in for scheduled shifts</li>
                <li>You must be within the site's geofenced area</li>
                <li>Enable location permissions when prompted</li>
                <li>Photo verification is optional but recommended</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Upcoming Shifts */}
        {upcomingShifts.length > 0 && (
          <div className="mt-6 bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-[hsl(var(--color-primary))]" />
              <h2 className="text-lg font-semibold text-[hsl(var(--color-foreground))]">Upcoming Shifts</h2>
              <span className="ml-auto text-sm text-[hsl(var(--color-foreground-secondary))]">
                Next 7 days
              </span>
            </div>

            <div className="space-y-3">
              {upcomingShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="border border-[hsl(var(--color-border))] rounded-lg p-4 hover:border-[hsl(var(--color-primary))]/50 hover:bg-[hsl(var(--color-surface-elevated))] transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[hsl(var(--color-primary))]" />
                        <span className="font-medium text-[hsl(var(--color-foreground))]">
                          {formatShiftDate(shift.date)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-secondary))]">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatShiftTime(shift.startTime)} - {formatShiftTime(shift.endTime)}
                        </span>
                        <span className="text-[hsl(var(--color-foreground-muted))]">•</span>
                        <span>{calculateShiftDuration(shift.startTime, shift.endTime)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-[hsl(var(--color-foreground-secondary))]">
                        <MapPin className="w-4 h-4 text-[hsl(var(--color-primary))]" />
                        <span>{shift.siteId?.siteLocationName || 'Unknown Site'}</span>
                      </div>

                      {shift.siteId?.address && (
                        <div className="text-xs text-[hsl(var(--color-foreground-muted))] ml-6">
                          {shift.siteId.address}, {shift.siteId.townSuburb} {shift.siteId.state} {shift.siteId.postalCode}
                        </div>
                      )}

                      {shift.shiftType && (
                        <div className="mt-2">
                          <span className="inline-block px-2 py-1 bg-[hsl(var(--color-primary))]/10 text-[hsl(var(--color-primary))] text-xs rounded border border-[hsl(var(--color-primary))]/20 font-medium">
                            {shift.shiftType}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200 font-medium">
                        Scheduled
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
