import { useState, useRef, useEffect } from "react";
import {
  MapPin,
  Plus,
  ChevronDown,
  Settings,
  Maximize,
  Minimize,
  RotateCw,
} from "lucide-react";
import toast from "react-hot-toast";
import SitesTable from "../components/sites/SitesTable";
import SiteFilters from "../components/sites/SiteFilters";
import AddSiteModal from "../components/sites/AddSiteModal";
import AddMultipleSitesModal from "../components/sites/AddMultipleSitesModal";
import MapModal from "../components/sites/MapModal";
import { siteApi } from "../lib/api";
import { useFullscreen } from "../hooks/useFullscreen";

export default function Sites() {
  const pageRef = useRef(null);
  const { isFullscreen, toggleFullscreen, isSupported } = useFullscreen(pageRef);

  const [showInactive, setShowInactive] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [showMultipleSitesModal, setShowMultipleSitesModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const addMenuRef = useRef(null);

  // API state
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });

  // Fetch sites function
  const fetchSites = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await siteApi.getAll({
        status: showInactive ? undefined : "ACTIVE",
        page: pagination.page,
        limit: pagination.limit,
      });
      setSites(response.data.data.sites);
      setPagination(response.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch sites");
      toast.error("Failed to load sites");
    } finally {
      setLoading(false);
    }
  };

  // Fetch sites on mount and when filters change
  useEffect(() => {
    fetchSites();
  }, [showInactive, pagination.page, pagination.limit]);

  // Handle refresh button
  const handleRefresh = () => {
    fetchSites();
    toast.success("Sites refreshed");
  };

  // Handle site click to open edit modal
  const handleSiteClick = (site) => {
    setSelectedSite(site);
    setShowAddSiteModal(true);
  };

  // Handle map icon click to view site location
  const handleMapClick = (site) => {
    setSelectedSite(site);
    setShowMapModal(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowAddSiteModal(false);
    setShowMultipleSitesModal(false);
    setShowMapModal(false);
    setSelectedSite(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setAddMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen bg-[hsl(var(--color-surface-elevated))]">
      {/* Sites Submenu Bar */}
      <div className="bg-blue-600 text-white px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <h1 className="text-base sm:text-lg font-semibold">Sites</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              className="p-1.5 sm:p-2 hover:bg-blue-700 rounded transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            {isSupported && (
              <button
                onClick={toggleFullscreen}
                className="p-1.5 sm:p-2 hover:bg-blue-700 rounded transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            )}
            <button
              onClick={handleRefresh}
              className="p-1.5 sm:p-2 hover:bg-blue-700 rounded transition-colors"
              title="Refresh"
            >
              <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3 sm:p-6">
        {/* Filter Section */}
        <div className="mb-4 sm:mb-6">
          <SiteFilters
            showInactive={showInactive}
            setShowInactive={setShowInactive}
          />
        </div>

        {/* Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 sm:mb-6">
          {/* Primary Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative" ref={addMenuRef}>
              <button
                onClick={() => setAddMenuOpen(!addMenuOpen)}
                className="px-3 sm:px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add New</span>
                <span className="sm:hidden">Add</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Add New Dropdown */}
              {addMenuOpen && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-md shadow-lg z-50">
                  <button
                    onClick={() => {
                      setShowAddSiteModal(true);
                      setAddMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-surface-elevated))] transition-colors"
                  >
                    Site
                  </button>
                  <button
                    onClick={() => {
                      setShowMultipleSitesModal(true);
                      setAddMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-surface-elevated))] transition-colors"
                  >
                    Multiple Sites
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button className="px-3 sm:px-4 py-2 bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] rounded-md hover:bg-[hsl(var(--color-surface-elevated))] transition-colors flex items-center gap-2 text-sm">
              Actions
              <ChevronDown className="w-4 h-4" />
            </button>
            <button className="px-3 sm:px-4 py-2 bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] rounded-md hover:bg-[hsl(var(--color-surface-elevated))] transition-colors flex items-center gap-2 text-sm">
              Columns
              <ChevronDown className="w-4 h-4" />
            </button>
            <select className="px-3 sm:px-4 py-2 bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] rounded-md text-sm cursor-pointer">
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <SitesTable
          sites={sites}
          loading={loading}
          showInactive={showInactive}
          onSiteClick={handleSiteClick}
          onMapClick={handleMapClick}
        />
      </div>

      {/* Add Site Modal */}
      {showAddSiteModal && (
        <AddSiteModal
          site={selectedSite}
          onClose={handleCloseModal}
          onSuccess={() => {
            fetchSites();
            toast.success(
              selectedSite
                ? "Site updated successfully"
                : "Site created successfully",
            );
          }}
        />
      )}

      {/* Add Multiple Sites Modal */}
      {showMultipleSitesModal && (
        <AddMultipleSitesModal
          onClose={handleCloseModal}
          onSuccess={() => {
            fetchSites();
            toast.success("Sites created successfully");
          }}
        />
      )}

      {/* View Site Location Modal */}
      {showMapModal && selectedSite && (
        <MapModal
          onClose={handleCloseModal}
          initLatitude={selectedSite.latitude}
          initLongitude={selectedSite.longitude}
          initAddress={selectedSite.address}
          initState={selectedSite.state}
          initTownSuburb={selectedSite.townSuburb}
          initPostalCode={selectedSite.postalCode}
          initGeoFenceRadius={selectedSite.geoFenceRadius}
        />
      )}
    </div>
  );
}
