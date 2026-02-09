import { Search, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function SiteFilters({ showInactive, setShowInactive }) {
  const [searchField, setSearchField] = useState("Site Name");

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
      {/* Search Bar */}
      <div className="w-full sm:flex-1 sm:max-w-md">
        <div className="relative flex items-center border border-[hsl(var(--color-border))] rounded-md bg-[hsl(var(--color-card))]">
          <Search className="w-4 h-4 text-[hsl(var(--color-foreground-secondary))] ml-3 flex-shrink-0" />

          {/* Search Field Dropdown */}
          <div className="relative flex-shrink-0">
            <button className="flex items-center gap-1 px-2 sm:px-3 py-2 text-xs sm:text-sm text-[hsl(var(--color-foreground))] border-r border-[hsl(var(--color-border))] hover:bg-[hsl(var(--color-surface-elevated))] whitespace-nowrap">
              {searchField}
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-[hsl(var(--color-foreground-muted))]" />
            </button>
          </div>

          {/* Search Input */}
          <input
            type="text"
            placeholder=""
            className="flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm text-[hsl(var(--color-foreground))] bg-[hsl(var(--color-card))] outline-none min-w-0 placeholder:text-[hsl(var(--color-foreground-muted))]"
          />
        </div>
      </div>

      {/* Display Inactive Sites Toggle */}
      <div className="flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap">
        <span className="text-[hsl(var(--color-foreground))] hidden lg:inline">
          Display Inactive Sites
        </span>
        <span className="text-[hsl(var(--color-foreground))] lg:hidden">
          Inactive
        </span>
        <button
          onClick={() => setShowInactive(!showInactive)}
          className={`relative inline-flex items-center h-5 w-10 sm:h-6 sm:w-12 rounded-full transition-colors flex-shrink-0 ${
            showInactive ? "bg-blue-600" : "bg-red-500"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
              showInactive ? "translate-x-5 sm:translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
        <span
          className={`font-medium ${showInactive ? "text-blue-600" : "text-red-500"}`}
        >
          {showInactive ? "ON" : "OFF"}
        </span>
      </div>
    </div>
  );
}
