import { useEffect, useRef, useState } from 'react';
import { X, MapPin, Navigation, Clock } from 'lucide-react';
import { formatDistance } from '../../utils/distanceFormat';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function LocationMapModal({ onClose, timeRecord }) {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapView, setMapView] = useState('roadmap');

  // Extract data from time record
  const siteName = timeRecord.siteId?.siteLocationName || 'Unknown Site';
  const siteLocation = timeRecord.siteId?.location?.coordinates || null;
  const clockInLocation = timeRecord.clockInLocation?.coordinates || null;
  const clockOutLocation = timeRecord.clockOutLocation?.coordinates || null;
  const geofenceRadius = (timeRecord.siteId?.geoFenceRadius || 100); // in meters
  const clockInDistance = timeRecord.clockInDistance;
  const clockOutDistance = timeRecord.clockOutDistance;

  // Validate we have required data
  if (!siteLocation || !clockInLocation) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Location Map</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600">Location data not available for this time record.</p>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const siteLat = siteLocation[1];
  const siteLng = siteLocation[0];
  const clockInLat = clockInLocation[1];
  const clockInLng = clockInLocation[0];
  const clockOutLat = clockOutLocation ? clockOutLocation[1] : null;
  const clockOutLng = clockOutLocation ? clockOutLocation[0] : null;

  // Load Google Maps script
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setMapReady(true);
        return;
      }

      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkInterval);
            setMapReady(true);
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapReady(true);
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapReady || !mapRef.current || googleMapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: siteLat, lng: siteLng },
      zoom: 17,
      mapTypeId: mapView,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
    });

    // Site center marker
    new window.google.maps.Marker({
      position: { lat: siteLat, lng: siteLng },
      map: map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#2563eb',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      title: 'Site Center',
    });

    // Geofence circle
    new window.google.maps.Circle({
      map: map,
      center: { lat: siteLat, lng: siteLng },
      radius: geofenceRadius,
      strokeColor: '#2563eb',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#2563eb',
      fillOpacity: 0.15,
    });

    // Clock in marker
    new window.google.maps.Marker({
      position: { lat: clockInLat, lng: clockInLng },
      map: map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#16a34a',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      title: `Clock In (${formatDistance(clockInDistance)})`,
    });

    // Clock in line to site center
    new window.google.maps.Polyline({
      path: [
        { lat: siteLat, lng: siteLng },
        { lat: clockInLat, lng: clockInLng },
      ],
      geodesic: true,
      strokeColor: '#16a34a',
      strokeOpacity: 0.6,
      strokeWeight: 2,
      map: map,
    });

    // Clock out marker and line (if available)
    if (clockOutLat && clockOutLng) {
      new window.google.maps.Marker({
        position: { lat: clockOutLat, lng: clockOutLng },
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#dc2626',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: `Clock Out (${formatDistance(clockOutDistance)})`,
      });

      new window.google.maps.Polyline({
        path: [
          { lat: siteLat, lng: siteLng },
          { lat: clockOutLat, lng: clockOutLng },
        ],
        geodesic: true,
        strokeColor: '#dc2626',
        strokeOpacity: 0.6,
        strokeWeight: 2,
        map: map,
      });
    }

    // Adjust bounds to show all markers
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({ lat: siteLat, lng: siteLng });
    bounds.extend({ lat: clockInLat, lng: clockInLng });
    if (clockOutLat && clockOutLng) {
      bounds.extend({ lat: clockOutLat, lng: clockOutLng });
    }
    map.fitBounds(bounds);

    // Add some padding
    setTimeout(() => {
      const currentZoom = map.getZoom();
      if (currentZoom > 17) {
        map.setZoom(17);
      }
    }, 100);

    googleMapRef.current = map;
  }, [mapReady, siteLat, siteLng, clockInLat, clockInLng, clockOutLat, clockOutLng, geofenceRadius, clockInDistance, clockOutDistance]);

  // Update map type when view changes
  useEffect(() => {
    if (googleMapRef.current) {
      googleMapRef.current.setMapTypeId(mapView);
    }
  }, [mapView]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Clock Location Map</h3>
              <p className="text-sm text-gray-600">{siteName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden p-5 flex flex-col">
          {/* Legend */}
          <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white"></div>
              <span className="text-gray-700">Site Center</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-600 border-2 border-white"></div>
              <span className="text-gray-700">Clock In {clockInDistance !== null && `(${formatDistance(clockInDistance)})`}</span>
            </div>
            {clockOutLat && clockOutLng && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600 border-2 border-white"></div>
                <span className="text-gray-700">Clock Out {clockOutDistance !== null && `(${formatDistance(clockOutDistance)})`}</span>
              </div>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-gray-600">Geofence: {formatDistance(geofenceRadius)}</span>
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden relative">
            {/* Map type toggle */}
            <div className="absolute top-3 left-3 z-10 flex border border-gray-300 rounded overflow-hidden shadow-md bg-white">
              <button
                onClick={() => setMapView('roadmap')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  mapView === 'roadmap'
                    ? 'bg-white text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Map
              </button>
              <button
                onClick={() => setMapView('satellite')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-gray-300 ${
                  mapView === 'satellite'
                    ? 'bg-white text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Satellite
              </button>
            </div>

            {!mapReady && (
              <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500 text-sm">
                Loading map...
              </div>
            )}
            <div
              ref={mapRef}
              style={{
                height: '400px',
                width: '100%',
                display: mapReady ? 'block' : 'none',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
