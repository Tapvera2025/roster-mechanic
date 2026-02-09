import { Search, Filter } from "lucide-react";

export default function SiteFilters({ showInactive, setShowInactive }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
      {/* Search */}
      <div className="relative flex-1 w-full sm:w-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search sites..."
          className="w-full pl-9 pr-3 py-2 bg-[hsl(220,15%,14%)] border border-[hsl(220,15%,22%)] rounded-md text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors"
        />
      </div>

      {/* Show Inactive Toggle */}
      <label className="flex items-center gap-2 cursor-pointer select-none whitespace-nowrap">
        <input
          type="checkbox"
          checked={showInactive}
          onChange={(e) => setShowInactive(e.target.checked)}
          className="rounded border-[hsl(220,15%,30%)] bg-[hsl(220,15%,18%)] text-orange-600 focus:ring-orange-500 focus:ring-offset-0 cursor-pointer"
        />
        <span className="text-sm text-gray-300">Show Inactive</span>
      </label>
    </div>
  );
}
