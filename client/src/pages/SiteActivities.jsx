import { useState } from "react";
import {
  FileText,
  AlertCircle,
  Shield,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Search,
} from "lucide-react";
import { Select } from "../components/ui/Select";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import SortableHeader from "../components/ui/SortableHeader";
import { useTableSort } from "../hooks/useTableSort";

export default function SiteActivities() {
  const [activeTab, setActiveTab] = useState("daily");
  const [selectedSite, setSelectedSite] = useState("all");
  const [dateRange, setDateRange] = useState("current_month");
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activities, setActivities] = useState([]); // Data will be fetched from API

  const tabs = [
    { id: "daily", label: "Daily Activity Report", icon: FileText },
    { id: "incident", label: "Incident Reports", icon: AlertCircle },
    { id: "patrolling", label: "Patrolling & Static Tours", icon: Shield },
  ];

  const columns = [
    { label: "Day", sortable: true, sortKey: "day" },
    { label: "Date", sortable: true, sortKey: "date" },
    { label: "Site", sortable: true, sortKey: "site" },
    { label: "Report", sortable: true, sortKey: "report" },
    { label: "Reported By", sortable: true, sortKey: "reportedBy" },
    { label: "Attachments", sortable: true, sortKey: "attachments" },
  ];

  // Table sorting
  const { sortedData: sortedActivities, requestSort, getSortIndicator } = useTableSort(activities, {
    defaultColumn: 'date',
    defaultDirection: 'desc',
  });

  return (
    <div className="min-h-screen bg-[hsl(var(--color-surface-elevated))]">
      {/* Header */}
      <div className="bg-[hsl(var(--color-card))] border-b border-[hsl(var(--color-border))] px-4 py-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          <h1 className="text-lg font-semibold text-[hsl(var(--color-foreground))]">
            Site Activities
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[hsl(var(--color-card))] border-b border-[hsl(var(--color-border))]">
        <div className="flex items-center gap-6 px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-[hsl(var(--color-foreground-secondary))] hover:text-[hsl(var(--color-foreground))]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[hsl(var(--color-card))] border-b border-[hsl(var(--color-border))] px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Site Selector */}
          <Select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="w-48"
          >
            <option value="all">All Sites</option>
            <option value="site1">Site 1</option>
            <option value="site2">Site 2</option>
          </Select>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-[hsl(var(--color-surface-elevated))] rounded">
              <ChevronLeft className="w-4 h-4 text-[hsl(var(--color-foreground-secondary))]" />
            </button>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-48"
            >
              <option value="current_month">Current Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="custom">Custom Range</option>
            </Select>
            <button className="p-1.5 hover:bg-[hsl(var(--color-surface-elevated))] rounded">
              <ChevronRight className="w-4 h-4 text-[hsl(var(--color-foreground-secondary))]" />
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[hsl(var(--color-foreground-secondary))]" />
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Refresh Button */}
          <button className="p-2 hover:bg-[hsl(var(--color-surface-elevated))] rounded transition-colors">
            <RotateCw className="w-4 h-4 text-purple-600" />
          </button>

          {/* Items Per Page */}
          <Select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="w-20"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[hsl(var(--color-card))] m-4 rounded-lg border border-[hsl(var(--color-border))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[hsl(var(--color-surface-elevated))] border-b border-[hsl(var(--color-border))]">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase tracking-wider"
                  >
                    {column.sortable ? (
                      <SortableHeader
                        label={column.label}
                        sortKey={column.sortKey}
                        onSort={requestSort}
                        sortDirection={getSortIndicator(column.sortKey)}
                        className="uppercase text-xs"
                      />
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <FileText className="w-12 h-12 text-purple-300" />
                    <div>
                      <p className="text-base font-medium text-[hsl(var(--color-foreground))] mb-1">
                        We couldn't find any DAR records.
                      </p>
                      <p className="text-sm text-[hsl(var(--color-foreground-secondary))]">
                        No Daily Attendance Records (DAR) were found for this
                        timeframe. Try searching for a different date range
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-[hsl(var(--color-border))] px-4 py-3 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
