import { useState, useRef, useEffect } from "react";
import {
  Building2,
  Plus,
  ChevronDown,
  Settings,
  Maximize,
  RotateCw,
} from "lucide-react";
import toast from "react-hot-toast";
import ClientsTable from "../components/clients/ClientsTable";
import ClientFilters from "../components/clients/ClientFilters";
import AddClientModal from "../components/clients/AddClientModal";
import AddMultipleClientsModal from "../components/clients/AddMultipleClientsModal";
import { clientApi } from "../lib/api";
import staticClients from "../data/clients";

export default function Clients() {
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showMultipleClientsModal, setShowMultipleClientsModal] =
    useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const addMenuRef = useRef(null);

  // Filter state
  const [showInactive, setShowInactive] = useState(false);

  // API state
  const [clients, setClients] = useState(staticClients); // Start with static data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(25);

  // Fetch clients function
  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await clientApi.getAll({
        page: currentPage,
        limit: currentLimit,
        status: showInactive ? undefined : "ACTIVE",
      });

      // Try different response structures
      const clientsData =
        response.data.data?.clients || response.data.data || response.data;

      // Only update if we got valid data
      if (Array.isArray(clientsData) && clientsData.length > 0) {
        setClients(clientsData);
      } else {
        // Keep existing data if API returns empty
        console.warn("API returned empty data, keeping current clients");
      }
    } catch (err) {
      console.error("Failed to fetch clients:", err);
      setError(err.response?.data?.message || "Failed to fetch clients");
      // Keep static data on error - don't show error toast if we have data
      if (clients.length === 0) {
        toast.error("Using local data - API not available");
      }
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch whenever filter or page changes
  useEffect(() => {
    fetchClients();
  }, [showInactive, currentPage, currentLimit]);

  // Handle refresh button
  const handleRefresh = () => {
    fetchClients();
    // Only show success if we're not using static data
    if (clients.length > 0) {
      toast.success("Refreshing clients...");
    }
  };

  // Handle client click to open edit modal
  const handleClientClick = (client) => {
    setSelectedClient(client);
    setShowAddClientModal(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowAddClientModal(false);
    setShowMultipleClientsModal(false);
    setSelectedClient(null);
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
    <div className="min-h-screen bg-[hsl(var(--color-surface-elevated))]">
      {/* Clients Submenu Bar */}
      <div className="bg-blue-600 text-white px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            <h1 className="text-base sm:text-lg font-semibold">Clients</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              className="p-1.5 sm:p-2 hover:bg-blue-700 rounded transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              className="p-1.5 sm:p-2 hover:bg-blue-700 rounded transition-colors"
              title="Expand"
            >
              <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
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
          <ClientFilters showInactive={showInactive} setShowInactive={setShowInactive} />
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
                      setShowAddClientModal(true);
                      setAddMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-surface-elevated))] transition-colors"
                  >
                    Client
                  </button>
                  <button
                    onClick={() => {
                      setShowMultipleClientsModal(true);
                      setAddMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-surface-elevated))] transition-colors"
                  >
                    Multiple Clients
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
        <ClientsTable
          clients={clients}
          loading={loading}
          onClientClick={handleClientClick}
        />
      </div>

      {/* Add Client Modal */}
      {showAddClientModal && (
        <AddClientModal
          client={selectedClient}
          onClose={handleCloseModal}
          onSuccess={() => {
            // Modal already shows success message and closes
            // Optionally fetch clients to refresh data (only if backend is ready)
            // fetchClients();
          }}
        />
      )}

      {/* Add Multiple Clients Modal */}
      {showMultipleClientsModal && (
        <AddMultipleClientsModal
          onClose={handleCloseModal}
          onSuccess={() => {
            // Modal already shows success message and closes
            // Optionally fetch clients to refresh data (only if backend is ready)
            // fetchClients();
          }}
        />
      )}
    </div>
  );
}
