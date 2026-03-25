import { useState } from "react";
import { FileText, Settings, Maximize, RotateCw, Download, Filter, X } from "lucide-react";
import ComplianceFilters from "../components/reports/ComplianceFilters";
import ComplianceTable from "../components/reports/ComplianceTable";

export default function Reports() {
  const [filters, setFilters] = useState({
    status: "all",
    licenseType: "all",
    state: "all",
    deptWorkGroup: "all",
    expiresWithin: "all",
    selectedEmployees: [],
  });
  const [showFilters, setShowFilters] = useState(true);

  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
      {/* Reports Header */}
      <div className="bg-[hsl(var(--color-surface-elevated))] border-b border-[hsl(var(--color-border))]">
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="bg-orange-900/30 p-2 sm:p-2.5 lg:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-orange-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg lg:text-xl font-bold text-[hsl(var(--color-foreground))] truncate">
                  Compliance Reports
                </h1>
                <p className="hidden sm:block text-xs sm:text-sm text-[hsl(var(--color-foreground-secondary))] mt-0.5 truncate">
                  Monitor licenses and certifications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-1.5 sm:p-2 lg:p-2.5 hover:bg-[hsl(var(--color-surface))] rounded-lg transition-colors border border-[hsl(var(--color-border))]"
                title={showFilters ? "Hide Filters" : "Show Filters"}
              >
                <Filter className={`w-4 h-4 sm:w-5 sm:h-5 ${showFilters ? 'text-[hsl(var(--color-primary))]' : 'text-[hsl(var(--color-foreground-muted))]'}`} />
              </button>
              <button
                className="hidden sm:flex p-1.5 sm:p-2 lg:p-2.5 hover:bg-[hsl(var(--color-surface))] rounded-lg transition-colors border border-[hsl(var(--color-border))]"
                title="Export Report"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5 text-[hsl(var(--color-foreground-muted))]" />
              </button>
              <button
                className="hidden md:flex p-1.5 sm:p-2 lg:p-2.5 hover:bg-[hsl(var(--color-surface))] rounded-lg transition-colors border border-[hsl(var(--color-border))]"
                title="Settings"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-[hsl(var(--color-foreground-muted))]" />
              </button>
              <button
                className="p-1.5 sm:p-2 lg:p-2.5 hover:bg-[hsl(var(--color-surface))] rounded-lg transition-colors border border-[hsl(var(--color-border))]"
                title="Refresh"
              >
                <RotateCw className="w-4 h-4 sm:w-5 sm:h-5 text-[hsl(var(--color-foreground-muted))]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)] sm:h-[calc(100vh-89px)]">
        {/* Left Sidebar - Filters */}
        {showFilters && (
          <>
            {/* Mobile Overlay */}
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setShowFilters(false)}
            />

            {/* Filter Sidebar */}
            <div className="fixed lg:relative inset-y-0 left-0 z-50 w-[280px] sm:w-80 lg:w-72 xl:w-80 bg-[hsl(var(--color-surface))] border-r border-[hsl(var(--color-border))] overflow-y-auto lg:block">
              {/* Mobile Close Button */}
              <div className="lg:hidden sticky top-0 bg-[hsl(var(--color-surface))] border-b border-[hsl(var(--color-border))] px-4 py-3 flex items-center justify-between z-10">
                <h3 className="text-sm font-semibold text-[hsl(var(--color-foreground))]">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1.5 hover:bg-[hsl(var(--color-surface-elevated))] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[hsl(var(--color-foreground-muted))]" />
                </button>
              </div>
              <ComplianceFilters filters={filters} setFilters={setFilters} />
            </div>
          </>
        )}

        {/* Right Content - Table */}
        <div className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
          <ComplianceTable filters={filters} />
        </div>
      </div>
    </div>
  );
}
