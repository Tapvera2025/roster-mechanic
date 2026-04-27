/**
 * AdhocShiftModal
 *
 * Employee-facing modal for starting an unscheduled (adhoc) shift.
 * Tries to auto-detect GPS location. If the browser denies access,
 * falls back to a manual lat/lng entry so the flow can still proceed.
 * Site detection always happens server-side via the submitted coordinates.
 */

import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle, MapPin, Loader2, X, Camera, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdhocShiftModal({ isOpen, onClose, onSubmit, isSubmitting = false }) {
  const [adhocReason, setAdhocReason] = useState('');
  const [position, setPosition] = useState('');
  const [photo, setPhoto] = useState(null);

  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // Manual coordinate fallback (shown when GPS is denied)
  const [showManual, setShowManual] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [manualError, setManualError] = useState('');

  const photoInputRef = useRef(null);

  // Reset + auto-request GPS whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setAdhocReason('');
      setPosition('');
      setPhoto(null);
      setGpsLocation(null);
      setGpsError(null);
      setShowManual(false);
      setManualLat('');
      setManualLng('');
      setManualError('');
      getGPSLocation();
    }
  }, [isOpen]);

  const getGPSLocation = () => {
    console.log('🔍 [Adhoc Modal] getGPSLocation called - requesting GPS location...');
    setGpsLoading(true);
    setGpsError(null);
    setGpsLocation(null);

    if (!navigator.geolocation) {
      console.error('❌ [Adhoc Modal] Geolocation API not supported by browser');
      setGpsError('Geolocation is not supported by your browser.');
      setGpsLoading(false);
      return;
    }

    console.log('📍 [Adhoc Modal] Calling navigator.geolocation.getCurrentPosition()...');

    // `resolved` prevents both callbacks firing and producing two states
    let resolved = false;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (resolved) return;
        resolved = true;

        const accuracy = Math.round(pos.coords.accuracy);
        console.log('✅ [Adhoc Modal] GPS location received:', {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: accuracy + 'm'
        });

        // Reject wildly inaccurate IP-based fallback (>2000 m)
        if (accuracy > 2000) {
          console.warn('⚠️ [Adhoc Modal] Location accuracy too low:', accuracy + 'm (threshold: 2000m)');
          setGpsError(
            `Only a rough location was returned (±${accuracy}m) — not precise enough for site detection. ` +
            `Enable GPS / precise location in your browser then try again, or enter coordinates manually.`
          );
          setGpsLoading(false);
          return;
        }

        console.log('✅ [Adhoc Modal] GPS location accepted (accuracy OK)');
        setGpsError(null);
        setGpsLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy });
        setGpsLoading(false);
      },
      (err) => {
        if (resolved) return;
        resolved = true;

        let msg = 'Unable to get your location.';
        if (err.code === 1) {
          msg = 'Location access was denied by your browser.';
        } else if (err.code === 2) {
          msg = 'Location unavailable. Check that GPS is enabled on your device.';
        } else if (err.code === 3) {
          msg = 'Location request timed out. Move to an open area and try again.';
        }

        console.error('❌ [Adhoc Modal] GPS error:', {
          code: err.code,
          message: err.message,
          userMessage: msg
        });

        setGpsLocation(null);
        setGpsError(msg);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const applyManualCoords = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setManualError('Latitude must be a number between -90 and 90.');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setManualError('Longitude must be a number between -180 and 180.');
      return;
    }

    setManualError('');
    setGpsError(null);
    setGpsLocation({ latitude: lat, longitude: lng, accuracy: null, manual: true });
    setShowManual(false);
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!gpsLocation) {
      toast.error('Location is required. Allow GPS access or enter coordinates manually.');
      return;
    }
    if (adhocReason.trim().length < 10) {
      toast.error('Please provide a reason of at least 10 characters.');
      return;
    }
    onSubmit({
      latitude: gpsLocation.latitude,
      longitude: gpsLocation.longitude,
      adhocReason: adhocReason.trim(),
      position: position.trim() || null,
      photo,
    });
  };

  if (!isOpen) return null;

  const canSubmit = gpsLocation && adhocReason.trim().length >= 10 && !isSubmitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-[hsl(var(--color-card))] rounded-xl shadow-2xl border border-[hsl(var(--color-border))] flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[hsl(var(--color-border))]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[hsl(var(--color-foreground))]">
                Start Adhoc Shift
              </h2>
              <p className="text-xs text-[hsl(var(--color-muted-foreground))] mt-0.5">
                Starting a shift outside your scheduled hours
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-[hsl(var(--color-muted-foreground))] hover:bg-[hsl(var(--color-surface-elevated))] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* GPS: loading */}
          {gpsLoading && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
              <span className="text-sm text-blue-700">Detecting your location…</span>
            </div>
          )}

          {/* GPS: error + actions */}
          {gpsError && !gpsLoading && !gpsLocation && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 space-y-2">
              <p className="text-sm font-medium text-red-800">Location unavailable</p>
              <p className="text-xs text-red-700">{gpsError}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={getGPSLocation}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
                >
                  <Navigation className="w-3 h-3" />
                  Try GPS again
                </button>
                <button
                  onClick={() => setShowManual(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
                >
                  <MapPin className="w-3 h-3" />
                  Enter coordinates manually
                </button>
              </div>
            </div>
          )}

          {/* Manual coordinate entry */}
          {showManual && !gpsLocation && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-3">
              <p className="text-sm font-medium text-amber-800">Enter your coordinates</p>
              <p className="text-xs text-amber-700">
                You can find your coordinates in Google Maps by long-pressing your location.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-amber-800 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. -33.8688"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm rounded border border-amber-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-800 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 151.2093"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm rounded border border-amber-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>
              {manualError && (
                <p className="text-xs text-red-600">{manualError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={applyManualCoords}
                  className="flex-1 py-1.5 text-xs font-semibold rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                >
                  Use these coordinates
                </button>
                <button
                  onClick={() => setShowManual(false)}
                  className="px-3 py-1.5 text-xs rounded-md border border-amber-300 text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* GPS: success */}
          {gpsLocation && !gpsLoading && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  {gpsLocation.manual ? 'Manual coordinates set' : 'Location detected'}
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {gpsLocation.latitude.toFixed(5)}, {gpsLocation.longitude.toFixed(5)}
                  {gpsLocation.accuracy !== null && ` (±${gpsLocation.accuracy}m)`}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Your site will be auto-detected when you clock in.
                </p>
                <button
                  onClick={() => { setGpsLocation(null); getGPSLocation(); }}
                  className="text-xs text-green-700 underline mt-1 hover:no-underline"
                >
                  Refresh location
                </button>
              </div>
            </div>
          )}

          {/* Adhoc Reason */}
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-1.5">
              Reason for Adhoc Shift <span className="text-red-500">*</span>
            </label>
            <textarea
              value={adhocReason}
              onChange={(e) => setAdhocReason(e.target.value)}
              placeholder="e.g., Emergency equipment repair required, covering for absent colleague…"
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] text-[hsl(var(--color-foreground))] placeholder-[hsl(var(--color-muted-foreground))] focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
            <p className="text-xs text-[hsl(var(--color-muted-foreground))] mt-1">
              {adhocReason.length > 0 && adhocReason.length < 10
                ? <span className="text-amber-600">Minimum 10 characters ({adhocReason.length}/10)</span>
                : adhocReason.length > 0 ? `${adhocReason.length}/500` : 'Min. 10 characters required'}
            </p>
          </div>

          {/* Position (optional) */}
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-1.5">
              Position / Role
              <span className="ml-1 text-[hsl(var(--color-muted-foreground))] font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g., Maintenance Technician"
              maxLength={100}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] text-[hsl(var(--color-foreground))] placeholder-[hsl(var(--color-muted-foreground))] focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Photo upload (optional) */}
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-1.5">
              Photo
              <span className="ml-1 text-[hsl(var(--color-muted-foreground))] font-normal">(optional)</span>
            </label>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-dashed border-[hsl(var(--color-border))] text-[hsl(var(--color-muted-foreground))] hover:border-amber-400 hover:text-amber-600 transition-colors w-full justify-center"
            >
              <Camera className="w-4 h-4" />
              {photo ? photo.name : 'Tap to add a photo'}
            </button>
            {photo && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> {photo.name}
                <button onClick={() => setPhoto(null)} className="ml-1 text-red-500 underline">
                  Remove
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-[hsl(var(--color-border))]">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-surface-elevated))] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Starting…</>
            ) : (
              'Clock In & Start Adhoc Shift'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
