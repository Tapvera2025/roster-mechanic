import { useEffect, useRef, useState } from "react";
import { X, MapPin, Maximize2 } from "lucide-react";
import { Select } from "../ui/Select";
import { Input } from "../ui/Input";
import { AUSTRALIAN_STATES } from "../../constants/locations";

let L = null;

const TILE_LAYERS = {
  map: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  },
};

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
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const tileLayerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapView, setMapView] = useState("map"); // "map" | "satellite"
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Load Leaflet dynamically
  useEffect(() => {
    const load = async () => {
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      L = (await import("leaflet")).default;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setMapReady(true);
    };
    load();
  }, []);

  // Initialise map once Leaflet is ready
  useEffect(() => {
    if (!mapReady || !mapRef.current || leafletMapRef.current) return;

    const map = L.map(mapRef.current, { zoomControl: true }).setView(
      [coords.lat, coords.lng],
      15,
    );

    const tileLayer = L.tileLayer(TILE_LAYERS.map.url, {
      attribution: TILE_LAYERS.map.attribution,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    const marker = L.marker([coords.lat, coords.lng], {
      draggable: true,
    }).addTo(map);

    const circle = L.circle([coords.lat, coords.lng], {
      radius: radiusMeters,
      color: "#dc2626",
      fillColor: "#dc2626",
      fillOpacity: 0.15,
      weight: 2,
    }).addTo(map);

    marker.on("dragend", (e) => {
      const { lat, lng } = e.target.getLatLng();
      circle.setLatLng([lat, lng]);
      setCoords({ lat, lng });
    });

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      circle.setLatLng([lat, lng]);
      setCoords({ lat, lng });
    });

    leafletMapRef.current = map;
    markerRef.current = marker;
    circleRef.current = circle;

    return () => {
      map.remove();
      leafletMapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
      tileLayerRef.current = null;
    };
  }, [mapReady]);

  // Update tile layer when mapView changes
  useEffect(() => {
    if (!leafletMapRef.current || !tileLayerRef.current || !L) return;
    leafletMapRef.current.removeLayer(tileLayerRef.current);
    const layer = TILE_LAYERS[mapView];
    tileLayerRef.current = L.tileLayer(layer.url, {
      attribution: layer.attribution,
    }).addTo(leafletMapRef.current);
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
    if (leafletMapRef.current) {
      setTimeout(() => leafletMapRef.current.invalidateSize(), 100);
    }
  }, [isFullscreen]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-lg shadow-2xl flex flex-col transition-all ${
          isFullscreen ? "w-full h-full" : "w-full max-w-4xl"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#2e6da4] rounded-t-lg flex-shrink-0">
          <div className="flex items-center gap-2 text-white">
            <MapPin className="w-4 h-4" />
            <span className="font-semibold text-sm">Site Map</span>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col overflow-y-auto flex-1 p-5 gap-4">
          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleKeepChanges}
              className="px-5 py-2 bg-[#2e6da4] text-white text-sm rounded hover:bg-[#245a8a] transition-colors font-medium"
            >
              Keep Changes
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-white text-gray-700 text-sm rounded border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>

          {/* Address Fields */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 w-24 flex-shrink-0">
                Address
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter a location"
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 w-24 flex-shrink-0">
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
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 w-24 flex-shrink-0">
                Town/Suburb
              </label>
              <Input
                value={townSuburb}
                onChange={(e) => setTownSuburb(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 w-24 flex-shrink-0">
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
            <div className="flex items-center gap-3">
              <span className="text-xs bg-gray-700 text-white px-2 py-0.5 rounded">
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
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${((geoFenceRadius - 0.1) / 4.9) * 100}%, #d1d5db ${((geoFenceRadius - 0.1) / 4.9) * 100}%, #d1d5db 100%)`,
                  }}
                />
                {/* Tick marks */}
                <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-0.5">
                  <span>0.1</span>
                  <span>1.3</span>
                  <span>2.6</span>
                  <span>3.8</span>
                  <span>5</span>
                </div>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                5 km
              </span>
            </div>
          </div>

          {/* Map */}
          <div className="border border-gray-300 rounded overflow-hidden flex flex-col flex-1 min-h-[340px]">
            {/* Map/Satellite Toggle + Fullscreen */}
            <div className="relative flex-shrink-0">
              {/* Tabs positioned over the map top-left */}
              <div className="absolute top-2 left-2 z-[1000] flex border border-gray-300 rounded overflow-hidden shadow-sm">
                <button
                  onClick={() => setMapView("map")}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    mapView === "map"
                      ? "bg-white text-gray-900"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Map
                </button>
                <button
                  onClick={() => setMapView("satellite")}
                  className={`px-3 py-1 text-xs font-medium transition-colors border-l border-gray-300 ${
                    mapView === "satellite"
                      ? "bg-white text-gray-900"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Satellite
                </button>
              </div>
              {/* Fullscreen button top-right */}
              <button
                onClick={() => setIsFullscreen((v) => !v)}
                className="absolute top-2 right-2 z-[1000] bg-white border border-gray-300 rounded p-1 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <Maximize2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {!mapReady && (
              <div className="flex items-center justify-center h-80 bg-gray-100 text-gray-500 text-sm">
                Loading map...
              </div>
            )}
            <div
              ref={mapRef}
              style={{
                height: isFullscreen ? "calc(100vh - 320px)" : "380px",
                width: "100%",
                display: mapReady ? "block" : "none",
              }}
            />
          </div>

          {/* Coordinates hint */}
          {mapReady && (
            <p className="text-xs text-gray-400 text-center -mt-2">
              Click on the map or drag the marker to set the site location &mdash;{" "}
              <span className="font-mono">
                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
