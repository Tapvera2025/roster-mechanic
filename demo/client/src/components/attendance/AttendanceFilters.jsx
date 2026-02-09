import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";

export default function AttendanceFilters({ filters, setFilters, onSearch }) {
  const handleClearFilters = () => {
    setFilters({
      date: "today",
      contractors: "all",
      states: "all",
      sites: "all",
      exceptions: "all",
      status: "all",
      shiftType: "all",
    });
  };

  return (
    <div className="bg-[hsl(220,15%,14%)] p-4 space-y-4">
      {/* Clear Filters Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[hsl(220,15%,20%)]">
        <button
          onClick={handleClearFilters}
          className="flex items-center gap-1 text-orange-500 hover:text-orange-600 text-sm font-medium"
        >
          <X className="w-4 h-4" />
          Clear Filters
        </button>
        <X className="w-4 h-4 text-orange-500" />
      </div>

      {/* Date Selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-[hsl(220,15%,18%)] rounded text-gray-300">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <Select
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="flex-1 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="last_week">Last Week</option>
            <option value="this_month">This Month</option>
          </Select>
          <button className="p-1 hover:bg-[hsl(220,15%,18%)] rounded text-gray-300">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* All Contractors */}
      <div className="space-y-2">
        <Select
          value={filters.contractors}
          onChange={(e) =>
            setFilters({ ...filters, contractors: e.target.value })
          }
          className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100"
        >
          <option value="all">All Contractors</option>
          <option value="internal">Internal Team/Staff</option>
          <option value="external">External Contractors</option>
        </Select>
      </div>

      {/* All States */}
      <div className="space-y-2">
        <Select
          value={filters.states}
          onChange={(e) => setFilters({ ...filters, states: e.target.value })}
          className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100"
        >
          <option value="all">All States</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      {/* All Sites */}
      <div className="space-y-2">
        <Select
          value={filters.sites}
          onChange={(e) => setFilters({ ...filters, sites: e.target.value })}
          className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100"
        >
          <option value="all">All Sites</option>
          <option value="site1">Site 1</option>
          <option value="site2">Site 2</option>
        </Select>
      </div>

      {/* All Exceptions */}
      <div className="space-y-2">
        <Select
          value={filters.exceptions}
          onChange={(e) =>
            setFilters({ ...filters, exceptions: e.target.value })
          }
          className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100"
        >
          <option value="all">All Exceptions</option>
          <option value="late">Late Arrival</option>
          <option value="early">Early Leave</option>
          <option value="no_show">No Show</option>
        </Select>
      </div>

      {/* All Status */}
      <div className="space-y-2">
        <Select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100"
        >
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {/* Shift Type Tabs */}
      <div className="border-t border-[hsl(220,15%,20%)] pt-3">
        <div className="flex gap-1">
          <button
            onClick={() => setFilters({ ...filters, shiftType: "all" })}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              filters.shiftType === "all"
                ? "bg-orange-600 text-white"
                : "bg-[hsl(220,15%,16%)] text-gray-300 hover:bg-[hsl(220,15%,18%)] border border-[hsl(220,15%,22%)]"
            }`}
          >
            All Shifts
          </button>
          <button
            onClick={() => setFilters({ ...filters, shiftType: "scheduled" })}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              filters.shiftType === "scheduled"
                ? "bg-orange-600 text-white"
                : "bg-[hsl(220,15%,16%)] text-gray-300 hover:bg-[hsl(220,15%,18%)] border border-[hsl(220,15%,22%)]"
            }`}
          >
            Scheduled
          </button>
          <button
            onClick={() => setFilters({ ...filters, shiftType: "adhoc" })}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              filters.shiftType === "adhoc"
                ? "bg-orange-600 text-white"
                : "bg-[hsl(220,15%,16%)] text-gray-300 hover:bg-[hsl(220,15%,18%)] border border-[hsl(220,15%,22%)]"
            }`}
          >
            Adhoc
          </button>
        </div>
      </div>

      {/* Search Button */}
      <Button
        onClick={onSearch}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white border-orange-600"
        variant="default"
      >
        Search
      </Button>
    </div>
  );
}
