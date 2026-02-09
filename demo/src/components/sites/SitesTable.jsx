import { ArrowUpDown } from "lucide-react";
import SiteRow from "./SiteRow";

export default function SitesTable({ sites, loading, showInactive }) {
  // If loading, show spinner
  if (loading) {
    return (
      <div className="bg-[hsl(220,15%,14%)] border border-[hsl(220,15%,20%)] rounded-lg sm:rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-4 text-gray-300">Loading sites...</p>
      </div>
    );
  }

  // If no sites, show empty state
  if (!sites || sites.length === 0) {
    return (
      <div className="bg-[hsl(220,15%,14%)] border border-[hsl(220,15%,20%)] rounded-lg sm:rounded-xl shadow-lg p-8 text-center">
        <p className="text-gray-300">No sites found</p>
        <p className="text-sm text-gray-400 mt-2">
          Click "Add New" to create your first site
        </p>
      </div>
    );
  }

  const displayedSites = sites.length;

  return (
    <div className="bg-[hsl(220,15%,14%)] border border-[hsl(220,15%,20%)] rounded-lg sm:rounded-xl shadow-lg">
      {/* Scrollable table container */}
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full text-sm min-w-[1000px]">
          <thead className="bg-[hsl(220,15%,16%)] border-b border-[hsl(220,15%,22%)]">
            <tr className="text-gray-300 text-xs">
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-center w-10 sm:w-12 sticky left-0 bg-[hsl(220,15%,16%)] z-[5]">
                <input
                  type="checkbox"
                  className="rounded border-[hsl(220,15%,30%)] bg-[hsl(220,15%,18%)] text-orange-600 focus:ring-orange-500 focus:ring-offset-0 cursor-pointer"
                />
              </th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left">
                <div className="flex items-center gap-1 whitespace-nowrap hover:text-orange-500 cursor-pointer transition-colors">
                  Site/Location Name
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left whitespace-nowrap">
                Short Name
              </th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left">Client</th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left">State</th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left">Status</th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-center whitespace-nowrap">
                Expiry in
                <br />
                30 Days
              </th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-center w-16"></th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-right w-20 sm:w-24 sticky right-0 bg-[hsl(220,15%,16%)] z-[5]">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[hsl(220,15%,20%)]">
            {sites.map((site) => (
              <SiteRow key={site.id} site={site} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-3 sm:px-4 py-3 bg-[hsl(220,15%,16%)] border-t border-[hsl(220,15%,22%)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs sm:text-sm text-gray-400">
          Showing 1 to {displayedSites} of {displayedSites} entries
        </div>
        <div className="flex items-center gap-2">
          <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-[hsl(220,15%,30%)] bg-[hsl(220,15%,18%)] text-gray-300 rounded hover:bg-[hsl(220,15%,22%)] transition-colors">
            Previous
          </button>
          <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors">
            1
          </button>
          <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-[hsl(220,15%,30%)] bg-[hsl(220,15%,18%)] text-gray-300 rounded hover:bg-[hsl(220,15%,22%)] transition-colors">
            Next
          </button>
        </div>
      </div>

      {/* Scroll indicator for mobile */}
      <div className="md:hidden px-3 py-2 bg-[hsl(220,15%,16%)] border-t border-[hsl(220,15%,22%)] text-center">
        <p className="text-xs text-gray-400">
          Scroll horizontally to view all columns
        </p>
      </div>
    </div>
  );
}
