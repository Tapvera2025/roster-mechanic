import { Search, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function ClientFilters() {
  const [showInactive, setShowInactive] = useState(false);
  const [searchField, setSearchField] = useState("Client Name");

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
      {/* Search Bar */}
      <div className="w-full sm:flex-1 sm:max-w-md">
        <div className="relative flex items-center border border-[hsl(220,15%,20%)] rounded-md bg-[hsl(220,15%,14%)]">
          <Search className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />

          {/* Search Field Dropdown */}
          <div className="relative flex-shrink-0">
            <button className="flex items-center gap-1 px-2 sm:px-3 py-2 text-xs sm:text-sm border-r border-[hsl(220,15%,20%)] hover:bg-[hsl(220,15%,18%)] text-gray-300 whitespace-nowrap transition-colors">
              {searchField}
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            </button>
          </div>

          {/* Search Input */}
          <input
            type="text"
            placeholder=""
            className="flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm outline-none min-w-0 bg-transparent text-gray-200 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Display Inactive Clients Toggle */}
      <div className="flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap">
        <span className="text-gray-300 hidden lg:inline">
          Display Inactive Clients
        </span>
        <span className="text-gray-300 lg:hidden">Inactive</span>
        <button
          onClick={() => setShowInactive(!showInactive)}
          className={`relative inline-flex items-center h-5 w-10 sm:h-6 sm:w-12 rounded-full transition-colors flex-shrink-0 ${
            showInactive ? "bg-orange-600" : "bg-red-500"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
              showInactive ? "translate-x-5 sm:translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
        <span
          className={`font-medium ${showInactive ? "text-orange-600" : "text-red-500"}`}
        >
          {showInactive ? "ON" : "OFF"}
        </span>
      </div>
    </div>
  );
}
