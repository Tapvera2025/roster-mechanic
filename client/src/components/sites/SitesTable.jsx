import { ArrowUpDown } from "lucide-react";
import SiteRow from "./SiteRow";

export default function SitesTable({
  sites,
  loading,
  showInactive,
  onSiteClick,
}) {
  // If loading, show spinner
  if (loading) {
    return (
      <div className="bg-[hsl(var(--color-card))] rounded-lg sm:rounded-xl shadow-sm p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-[hsl(var(--color-foreground-secondary))]">
          Loading sites...
        </p>
      </div>
    );
  }

  // If no sites, show empty state
  if (!sites || sites.length === 0) {
    return (
      <div className="bg-[hsl(var(--color-card))] rounded-lg sm:rounded-xl shadow-sm p-8 text-center">
        <p className="text-[hsl(var(--color-foreground-secondary))]">
          No sites found
        </p>
        <p className="text-sm text-[hsl(var(--color-foreground-muted))] mt-2">
          Click "Add New" to create your first site
        </p>
      </div>
    );
  }

  const displayedSites = sites.length;

  return (
    <div className="bg-[hsl(var(--color-card))] rounded-lg sm:rounded-xl shadow-sm">
      {/* Scrollable table container */}
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full text-sm min-w-[1000px]">
          <thead className="bg-[hsl(var(--color-surface-elevated))] border-b border-[hsl(var(--color-border))]">
            <tr className="text-[hsl(var(--color-foreground-secondary))] text-xs">
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-center w-10 sm:w-12 sticky left-0 bg-[hsl(var(--color-surface-elevated))] z-[5]">
                <input
                  type="checkbox"
                  className="rounded border-[hsl(var(--color-border))]"
                />
              </th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left">
                <div className="flex items-center gap-1 whitespace-nowrap">
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
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-right w-20 sm:w-24 sticky right-0 bg-[hsl(var(--color-surface-elevated))] z-[5]">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[hsl(var(--color-border))]">
            {sites.map((site) => (
              <SiteRow key={site.id} site={site} onSiteClick={onSiteClick} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-3 sm:px-4 py-3 bg-[hsl(var(--color-surface-elevated))] border-t border-[hsl(var(--color-border))] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs sm:text-sm text-[hsl(var(--color-foreground-secondary))]">
          Showing 1 to {displayedSites} of {displayedSites} entries
        </div>
        <div className="flex items-center gap-2">
          <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-[hsl(var(--color-border))] rounded hover:bg-[hsl(var(--color-card))] transition-colors text-[hsl(var(--color-foreground))]">
            Previous
          </button>
          <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-600 text-white rounded">
            1
          </button>
          <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-[hsl(var(--color-border))] rounded hover:bg-[hsl(var(--color-card))] transition-colors text-[hsl(var(--color-foreground))]">
            Next
          </button>
        </div>
      </div>

      {/* Scroll indicator for mobile */}
      <div className="md:hidden px-3 py-2 bg-[hsl(var(--color-surface-elevated))] border-t border-[hsl(var(--color-border))] text-center">
        <p className="text-xs text-[hsl(var(--color-foreground-muted))]">
          Scroll horizontally to view all columns
        </p>
      </div>
    </div>
  );
}
