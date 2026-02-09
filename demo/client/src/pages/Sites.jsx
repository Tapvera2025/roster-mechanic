import { useState, useRef, useEffect } from "react";
import { MapPin, Plus, ChevronDown, Settings, Maximize, RotateCw } from "lucide-react";
import toast from "react-hot-toast";
import SitesTable from "../components/sites/SitesTable";
import SiteFilters from "../components/sites/SiteFilters";
import AddSiteModal from "../components/sites/AddSiteModal";
import AddMultipleSitesModal from "../components/sites/AddMultipleSitesModal";
import { siteApi } from "../lib/api";

export default function Sites() {
  const [showInactive, setShowInactive] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [showMultipleSitesModal, setShowMultipleSitesModal] = useState(false);
  const addMenuRef = useRef(null);

  // API state
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0
  });

  // Fetch sites function
  const fetchSites = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await siteApi.getAll({
        status: showInactive ? undefined : 'ACTIVE',
        page: pagination.page,
        limit: pagination.limit
      });
      setSites(response.data.data.sites);
      setPagination(response.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch sites');
      toast.error('Failed to load sites');
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
    toast.success('Sites refreshed');
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
    <div className="min-h-screen">
      {/* Sites Submenu Bar */}
      <div className="bg-orange-600 text-white px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <h1 className="text-base sm:text-lg font-semibold">Sites</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button className="p-1.5 sm:p-2 hover:bg-orange-700 rounded transition-colors" title="Settings">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button className="p-1.5 sm:p-2 hover:bg-orange-700 rounded transition-colors" title="Expand">
              <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={handleRefresh}
              className="p-1.5 sm:p-2 hover:bg-orange-700 rounded transition-colors"
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
                className="px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add New</span>
                <span className="sm:hidden">Add</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Add New Dropdown */}
              {addMenuOpen && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-[hsl(220,15%,16%)] border border-[hsl(220,15%,22%)] rounded-md shadow-lg z-50">
                  <button
                    onClick={() => {
                      setShowAddSiteModal(true);
                      setAddMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-[hsl(220,15%,20%)] transition-colors"
                  >
                    Site
                  </button>
                  <button
                    onClick={() => {
                      setShowMultipleSitesModal(true);
                      setAddMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-[hsl(220,15%,20%)] transition-colors"
                  >
                    Multiple Sites
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button className="px-3 sm:px-4 py-2 bg-[hsl(220,15%,14%)] border border-[hsl(220,15%,22%)] text-gray-300 rounded-md hover:bg-[hsl(220,15%,18%)] transition-colors flex items-center gap-2 text-sm">
              Actions
              <ChevronDown className="w-4 h-4" />
            </button>
            <button className="px-3 sm:px-4 py-2 bg-[hsl(220,15%,14%)] border border-[hsl(220,15%,22%)] text-gray-300 rounded-md hover:bg-[hsl(220,15%,18%)] transition-colors flex items-center gap-2 text-sm">
              Columns
              <ChevronDown className="w-4 h-4" />
            </button>
            <select className="px-3 sm:px-4 py-2 bg-[hsl(220,15%,14%)] border border-[hsl(220,15%,22%)] text-gray-300 rounded-md text-sm cursor-pointer">
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
        />
      </div>

      {/* Add Site Modal */}
      {showAddSiteModal && (
        <AddSiteModal
          onClose={() => setShowAddSiteModal(false)}
          onSuccess={() => {
            fetchSites();
            toast.success('Site created successfully');
          }}
        />
      )}

      {/* Add Multiple Sites Modal */}
      {showMultipleSitesModal && (
        <AddMultipleSitesModal
          onClose={() => setShowMultipleSitesModal(false)}
          onSuccess={() => {
            fetchSites();
            toast.success('Sites created successfully');
          }}
        />
      )}
    </div>
  );
}