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

export default function SiteActivities() {
  const [activeTab, setActiveTab] = useState("daily");
  const [selectedSite, setSelectedSite] = useState("all");
  const [dateRange, setDateRange] = useState("current_month");
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const tabs = [
    { id: "daily", label: "Daily Activity Report", icon: FileText },
    { id: "incident", label: "Incident Reports", icon: AlertCircle },
    { id: "patrolling", label: "Patrolling & Static Tours", icon: Shield },
  ];

  const columns = [
    { label: "Day", sortable: true },
    { label: "Date", sortable: true },
    { label: "Site", sortable: true },
    { label: "Report", sortable: true },
    { label: "Reported By", sortable: true },
    { label: "Attachments", sortable: true },
  ];

  return (
    <div className="min-h-screen bg-[hsl(220,15%,12%)]">
      {/* Header */}
      <div className="bg-[hsl(220,15%,14%)] border-b border-[hsl(220,15%,20%)] px-4 py-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-500" />
          <h1 className="text-lg font-semibold text-gray-100">
            Site Activities
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[hsl(220,15%,14%)] border-b border-[hsl(220,15%,20%)]">
        <div className="flex items-center gap-6 px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-orange-600 text-orange-500"
                    : "border-transparent text-gray-400 hover:text-gray-200"
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
      <div className="bg-[hsl(220,15%,14%)] border-b border-[hsl(220,15%,20%)] px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Site Selector */}
          <Select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="w-48 bg-[hsl(220,15%,18%)] border-[hsl(220,15%,30%)] text-gray-300"
          >
            <option value="all">All Sites</option>
            <option value="site1">Site 1</option>
            <option value="site2">Site 2</option>
          </Select>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-[hsl(220,15%,18%)] rounded transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-48 bg-[hsl(220,15%,18%)] border-[hsl(220,15%,30%)] text-gray-300"
            >
              <option value="current_month">Current Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="custom">Custom Range</option>
            </Select>
            <button className="p-1.5 hover:bg-[hsl(220,15%,18%)] rounded transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[hsl(220,15%,18%)] border-[hsl(220,15%,30%)] text-gray-300 placeholder-gray-500"
            />
          </div>

          {/* Refresh Button */}
          <button className="p-2 hover:bg-[hsl(220,15%,18%)] rounded transition-colors">
            <RotateCw className="w-4 h-4 text-orange-500" />
          </button>

          {/* Items Per Page */}
          <Select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="w-20 bg-[hsl(220,15%,18%)] border-[hsl(220,15%,30%)] text-gray-300"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[hsl(220,15%,14%)] m-4 rounded-lg border border-[hsl(220,15%,20%)] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[hsl(220,15%,16%)] border-b border-[hsl(220,15%,22%)]">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-1">
                      {column.label}
                      {column.sortable && (
                        <button className="hover:bg-[hsl(220,15%,22%)] rounded p-0.5 transition-colors">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 10l5 5 5-5"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <FileText className="w-12 h-12 text-orange-400/40" />
                    <div>
                      <p className="text-base font-medium text-gray-200 mb-1">
                        We couldn't find any DAR records.
                      </p>
                      <p className="text-sm text-gray-400">
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
        <div className="border-t border-[hsl(220,15%,22%)] px-4 py-3 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled
            className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,30%)] text-gray-400 hover:bg-[hsl(220,15%,22%)]"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,30%)] text-gray-400 hover:bg-[hsl(220,15%,22%)]"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
