import { useEffect, useRef, useState } from "react";
import { X, MapPin, Maximize2, Navigation, Loader2 } from "lucide-react";
import { Select } from "../ui/Select";
import { Input } from "../ui/Input";
import { AUSTRALIAN_STATES } from "../../constants/locations";
import toast from "react-hot-toast";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function MapModal({
  onClose,
  onSave,
  // initial values passed from site form
  initLatitude,
  initLongitude,
  initAddress,
  initState,
  initTownSuburb,
  initPostalCode,
  initGeoFenceRadius,
}) {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const geocoderRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapView, setMapView] = useState("roadmap"); // "roadmap" | "satellite"
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const [address, setAddress] = useState(initAddress || "");
  const [state, setState] = useState(initState || "");
  const [townSuburb, setTownSuburb] = useState(initTownSuburb || "");
  const [postalCode, setPostalCode] = useState(initPostalCode || "");
  const [geoFenceRadius, setGeoFenceRadius] = useState(
    initGeoFenceRadius || 0.3,
  );
  const [coords, setCoords] = useState({
    lat: initLatitude ? parseFloat(initLatitude) : -33.8688,
    lng: initLongitude ? parseFloat(initLongitude) : 151.2093,
  });

  const radiusMeters = geoFenceRadius * 1000;

  // Helper function to map full state name to abbreviation
  const mapStateToCode = (stateName) => {
    if (!stateName) return "";
    const state = AUSTRALIAN_STATES.find(
      (s) => s.name.toLowerCase() === stateName.toLowerCase()
    );
    if (state) return state.code;
    const stateByCode = AUSTRALIAN_STATES.find(
      (s) => s.code.toLowerCase() === stateName.toLowerCase()
    );
    return stateByCode ? stateByCode.code : stateName;
  };

  // Reverse geocode coordinates to get address
  const reverseGeocode = async (lat, lng) => {
    if (!geocoderRef.current) return;

    setGeocoding(true);
    try {
      const result = await new Promise((resolve, reject) => {
        geocoderRef.current.geocode(
          { location: { lat, lng } },
          (results, status) => {
            if (status === "OK" && results[0]) {
              resolve(results[0]);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          }
        );
      });

      // Parse address components
      const addressComponents = result.address_components;
      let street = "";
      let suburb = "";
      let stateCode = "";
      let postal = "";

      addressComponents.forEach((component) => {
        const types = component.types;
        if (types.includes("street_number")) {
          street = component.long_name + " ";
        }
        if (types.includes("route")) {
          street += component.long_name;
        }
        if (types.includes("locality") || types.includes("postal_town")) {
          suburb = component.long_name;
        }
        if (types.includes("administrative_area_level_1")) {
          stateCode = mapStateToCode(component.short_name);
        }
        if (types.includes("postal_code")) {
          postal = component.long_name;
        }
      });

      // Update address fields
      if (street) setAddress(street.trim());
      if (suburb) setTownSuburb(suburb);
      if (stateCode) setState(stateCode);
      if (postal) setPostalCode(postal);

      toast.success("Address updated from location");
    } catch (error) {
      console.error("Reverse geocoding error:", error);

      // Provide helpful error message
      if (error.message.includes("REQUEST_DENIED")) {
        toast.error("Google Maps API error. Please enable Geocoding API in Google Cloud Console.");
      } else if (error.message.includes("OVER_QUERY_LIMIT")) {
        toast.error("API quota exceeded. Please check your Google Cloud billing.");
      } else {
        console.warn("Auto-fill disabled - you can still manually enter the address");
      }
    } finally {
      setGeocoding(false);
    }
  };

  // Get user's live location
  const handleLiveLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Update map and marker
        setCoords({ lat, lng });
        if (googleMapRef.current) {
          googleMapRef.current.setCenter({ lat, lng });
          googleMapRef.current.setZoom(16);
        }
        if (markerRef.current) {
          markerRef.current.setPosition({ lat, lng });
        }
        if (circleRef.current) {
          circleRef.current.setCenter({ lat, lng });
        }

        // Reverse geocode to get address
        reverseGeocode(lat, lng);
        setGettingLocation(false);
        toast.success("Location updated");
      },
      (error) => {
        setGettingLocation(false);
        let errorMessage = "Failed to get your location";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Location permission denied. Please enable location access.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Location information unavailable";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Location request timed out";
        }
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Load Google Maps script dynamically
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setMapReady(true);
        return;
      }

      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        // Script is already loading, wait for it
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkInterval);
            setMapReady(true);
          }
        }, 100);
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapReady(true);
      script.onerror = () => {
        toast.error("Failed to load Google Maps");
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize map once Google Maps is ready
  useEffect(() => {
    if (!mapReady || !mapRef.current || googleMapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: coords.lat, lng: coords.lng },
      zoom: 15,
      mapTypeId: mapView,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
    });

    const marker = new window.google.maps.Marker({
      position: { lat: coords.lat, lng: coords.lng },
      map: map,
      draggable: true,
      title: "Site Location",
    });

    const circle = new window.google.maps.Circle({
      map: map,
      center: { lat: coords.lat, lng: coords.lng },
      radius: radiusMeters,
      strokeColor: "#dc2626",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#dc2626",
      fillOpacity: 0.15,
    });

    const geocoder = new window.google.maps.Geocoder();

    // Handle marker drag
    marker.addListener("dragend", (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      circle.setCenter({ lat, lng });
      setCoords({ lat, lng });
      reverseGeocode(lat, lng);
    });

    // Handle map click
    map.addListener("click", (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      marker.setPosition({ lat, lng });
      circle.setCenter({ lat, lng });
      setCoords({ lat, lng });
      reverseGeocode(lat, lng);
    });

    googleMapRef.current = map;
    markerRef.current = marker;
    circleRef.current = circle;
    geocoderRef.current = geocoder;

    return () => {
      if (marker) marker.setMap(null);
      if (circle) circle.setMap(null);
    };
  }, [mapReady]);

  // Update map type when mapView changes
  useEffect(() => {
    if (googleMapRef.current) {
      googleMapRef.current.setMapTypeId(mapView);
    }
  }, [mapView]);

  // Update circle radius when slider changes
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(geoFenceRadius * 1000);
    }
  }, [geoFenceRadius]);

  const handleKeepChanges = () => {
    onSave({
      latitude: coords.lat.toFixed(6),
      longitude: coords.lng.toFixed(6),
      address,
      state,
      townSuburb,
      postalCode,
      geoFenceRadius,
    });
    onClose();
  };

  // Invalidate map size when fullscreen toggled
  useEffect(() => {
    if (googleMapRef.current) {
      setTimeout(() => {
        window.google.maps.event.trigger(googleMapRef.current, "resize");
        googleMapRef.current.setCenter(coords);
      }, 100);
    }
  }, [isFullscreen]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-0 sm:p-4">
      <div
        className={`bg-white flex flex-col transition-all ${
          isFullscreen
            ? "w-full h-full rounded-none"
            : "w-full h-full sm:h-auto sm:max-w-4xl sm:rounded-lg"
        } shadow-2xl`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3 bg-[#2e6da4] sm:rounded-t-lg flex-shrink-0">
          <div className="flex items-center gap-2 text-white">
            <MapPin className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="font-semibold text-base sm:text-sm">
              {onSave ? "Site Map" : "View Site Location"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-1 touch-manipulation"
            aria-label="Close"
          >
            <X className="w-6 h-6 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col overflow-y-auto flex-1 p-3 sm:p-5 gap-3 sm:gap-4">
          {/* Action Buttons */}
          <div className="flex justify-end gap-2 sm:gap-3">
            {onSave && (
              <button
                onClick={handleKeepChanges}
                className="px-4 sm:px-5 py-2.5 sm:py-2 bg-[#2e6da4] text-white text-sm sm:text-sm rounded hover:bg-[#245a8a] transition-colors font-medium touch-manipulation flex-1 sm:flex-none"
              >
                Keep Changes
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 sm:px-5 py-2.5 sm:py-2 bg-white text-gray-700 text-sm sm:text-sm rounded border border-gray-300 hover:bg-gray-50 transition-colors font-medium touch-manipulation flex-1 sm:flex-none"
            >
              {onSave ? "Cancel" : "Close"}
            </button>
          </div>

          {/* Address Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-x-6 sm:gap-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <label className="text-sm text-gray-600 sm:w-24 flex-shrink-0 font-medium">
                Address
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter a location"
                className="flex-1"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <label className="text-sm text-gray-600 sm:w-24 flex-shrink-0 font-medium">
                State
              </label>
              <Select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="flex-1"
              >
                <option value="">Select State</option>
                {AUSTRALIAN_STATES.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.code} - {st.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <label className="text-sm text-gray-600 sm:w-24 flex-shrink-0 font-medium">
                Town/Suburb
              </label>
              <Input
                value={townSuburb}
                onChange={(e) => setTownSuburb(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <label className="text-sm text-gray-600 sm:w-24 flex-shrink-0 font-medium">
                Postal Code
              </label>
              <Input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {/* GeoFence Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GeoFence Area
            </label>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-xs bg-gray-700 text-white px-2 py-1 rounded whitespace-nowrap">
                {geoFenceRadius.toFixed(1)} km
              </span>
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={geoFenceRadius}
                  onChange={(e) => setGeoFenceRadius(parseFloat(e.target.value))}
                  className="w-full h-2 sm:h-2 rounded-lg appearance-none cursor-pointer touch-manipulation"
                  style={{
                    background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${((geoFenceRadius - 0.1) / 4.9) * 100}%, #d1d5db ${((geoFenceRadius - 0.1) / 4.9) * 100}%, #d1d5db 100%)`,
                  }}
                />
                {/* Tick marks - hidden on mobile */}
                <div className="hidden sm:flex justify-between text-[10px] text-gray-400 mt-1 px-0.5">
                  <span>0.1</span>
                  <span>1.3</span>
                  <span>2.6</span>
                  <span>3.8</span>
                  <span>5</span>
                </div>
              </div>
              <span className="hidden sm:inline text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200 whitespace-nowrap">
                5 km
              </span>
            </div>
          </div>

          {/* Map */}
          <div className="border border-gray-300 rounded overflow-hidden flex flex-col flex-1 min-h-[300px] sm:min-h-[340px]">
            {/* Map controls */}
            <div className="relative flex-shrink-0">
              {/* Map/Satellite Toggle */}
              <div className="absolute top-3 sm:top-2 left-3 sm:left-2 z-[1000] flex border border-gray-300 rounded overflow-hidden shadow-md bg-white">
                <button
                  onClick={() => setMapView("roadmap")}
                  className={`px-4 py-2 sm:px-3 sm:py-1 text-sm sm:text-xs font-medium transition-colors touch-manipulation ${
                    mapView === "roadmap"
                      ? "bg-white text-gray-900"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Map
                </button>
                <button
                  onClick={() => setMapView("satellite")}
                  className={`px-4 py-2 sm:px-3 sm:py-1 text-sm sm:text-xs font-medium transition-colors border-l border-gray-300 touch-manipulation ${
                    mapView === "satellite"
                      ? "bg-white text-gray-900"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Satellite
                </button>
              </div>

              {/* Live Location Button */}
              <button
                onClick={handleLiveLocation}
                disabled={gettingLocation || geocoding}
                className="absolute top-14 sm:top-2 left-3 sm:left-1/2 sm:-translate-x-1/2 z-[1000] bg-white border border-gray-300 rounded px-4 py-2 sm:px-3 sm:py-1.5 shadow-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 touch-manipulation"
                title="Get my current location"
              >
                {gettingLocation || geocoding ? (
                  <>
                    <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 text-blue-600 animate-spin" />
                    <span className="text-sm sm:text-xs font-medium text-gray-700 whitespace-nowrap">
                      {gettingLocation ? "Getting..." : "Loading..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5 sm:w-4 sm:h-4 text-blue-600" />
                    <span className="text-sm sm:text-xs font-medium text-gray-700 whitespace-nowrap">
                      Use My Location
                    </span>
                  </>
                )}
              </button>

              {/* Fullscreen button - Desktop only */}
              <button
                onClick={() => setIsFullscreen((v) => !v)}
                className="hidden sm:block absolute top-2 right-2 z-[1000] bg-white border border-gray-300 rounded p-1 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <Maximize2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {!mapReady && (
              <div className="flex items-center justify-center h-64 sm:h-80 bg-gray-100 text-gray-500 text-sm">
                Loading map...
              </div>
            )}
            <div
              ref={mapRef}
              style={{
                height: isFullscreen
                  ? "calc(100vh - 320px)"
                  : window.innerWidth < 640
                  ? "300px"
                  : "380px",
                width: "100%",
                display: mapReady ? "block" : "none",
              }}
            />
          </div>

          {/* Coordinates hint */}
          {mapReady && (
            <p className="text-xs sm:text-xs text-gray-400 text-center -mt-2 px-2">
              <span className="hidden sm:inline">Click on the map or drag the marker to set the site location &mdash;{" "}</span>
              <span className="font-mono text-[10px] sm:text-xs">
                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
