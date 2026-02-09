import { Building2, Plus, ChevronDown, Settings, Maximize, RotateCw } from "lucide-react";
import ClientsTable from "../components/clients/ClientsTable";
import ClientFilters from "../components/clients/ClientFilters";

export default function Clients() {
  return (
    <div className="min-h-screen">
      {/* Clients Submenu Bar */}
      <div className="bg-orange-600 text-white px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            <h1 className="text-base sm:text-lg font-semibold">Clients</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button className="p-1.5 sm:p-2 hover:bg-orange-700 rounded transition-colors" title="Settings">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button className="p-1.5 sm:p-2 hover:bg-orange-700 rounded transition-colors" title="Expand">
              <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button className="p-1.5 sm:p-2 hover:bg-orange-700 rounded transition-colors" title="Refresh">
              <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3 sm:p-6">
        {/* Filter Section */}
        <div className="mb-4 sm:mb-6">
          <ClientFilters />
        </div>

        {/* Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 sm:mb-6">
          {/* Primary Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button className="px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center gap-2 text-sm font-medium">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add New</span>
              <span className="sm:hidden">Add</span>
            </button>
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
        <ClientsTable />
      </div>
    </div>
  );
}
