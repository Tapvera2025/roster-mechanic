import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { schedulerApi } from "../../lib/api";

export default function AttendanceFilters({ filters, setFilters, onSearch }) {
  const [sites, setSites] = useState([]);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const response = await schedulerApi.getSites();
      setSites(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch sites:', err);
    }
  };

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
    <div className="bg-[hsl(var(--color-surface-elevated))] p-4 space-y-4">
      {/* Clear Filters Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--color-border))]">
        <button
          onClick={handleClearFilters}
          className="flex items-center gap-1 text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary-dark))] text-sm font-medium"
        >
          <X className="w-4 h-4" />
          Clear Filters
        </button>
        <X className="w-4 h-4 text-[hsl(var(--color-primary))]" />
      </div>

      {/* Date Selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-[hsl(var(--color-surface-elevated))] rounded">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <Select
            value={filters.date}
            onChange={(e) =>
              setFilters({ ...filters, date: e.target.value })
            }
            className="flex-1"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="last_week">Last Week</option>
            <option value="this_month">This Month</option>
          </Select>
          <button className="p-1 hover:bg-[hsl(var(--color-surface-elevated))] rounded">
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
          onChange={(e) =>
            setFilters({ ...filters, states: e.target.value })
          }
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
          onChange={(e) =>
            setFilters({ ...filters, sites: e.target.value })
          }
        >
          <option value="all">All Sites</option>
          {sites.map((site) => (
            <option key={site._id} value={site._id}>
              {site.siteLocationName}
            </option>
          ))}
        </Select>
      </div>

      {/* All Exceptions */}
      <div className="space-y-2">
        <Select
          value={filters.exceptions}
          onChange={(e) =>
            setFilters({ ...filters, exceptions: e.target.value })
          }
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
          onChange={(e) =>
            setFilters({ ...filters, status: e.target.value })
          }
        >
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {/* Shift Type Tabs */}
      <div className="border-t border-[hsl(var(--color-border))] pt-3">
        <div className="flex gap-1">
          <button
            onClick={() => setFilters({ ...filters, shiftType: "all" })}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded ${
              filters.shiftType === "all"
                ? "bg-[hsl(var(--color-primary))] text-white"
                : "bg-[hsl(var(--color-card))] text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-background))]"
            }`}
          >
            All Shifts
          </button>
          <button
            onClick={() => setFilters({ ...filters, shiftType: "scheduled" })}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded ${
              filters.shiftType === "scheduled"
                ? "bg-[hsl(var(--color-primary))] text-white"
                : "bg-[hsl(var(--color-card))] text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-background))]"
            }`}
          >
            Scheduled
          </button>
          <button
            onClick={() => setFilters({ ...filters, shiftType: "adhoc" })}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded ${
              filters.shiftType === "adhoc"
                ? "bg-[hsl(var(--color-primary))] text-white"
                : "bg-[hsl(var(--color-card))] text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-background))]"
            }`}
          >
            Adhoc
          </button>
        </div>
      </div>

      {/* Search Button */}
      <Button
        onClick={onSearch}
        className="w-full bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-dark))] text-white"
        variant="default"
      >
        Search
      </Button>
    </div>
  );
}
