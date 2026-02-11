import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";

export default function LeaveFilters({ filters, setFilters }) {
  const handleClearFilters = () => {
    setFilters({
      leavePeriod: "current_prev_month",
      leaveCategory: "all",
      employee: "all",
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

      {/* Select Leave Period */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[hsl(var(--color-foreground))]">
          Select Leave Period
        </label>
        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-[hsl(var(--color-surface-elevated))] rounded">
            <ChevronLeft className="w-4 h-4 text-[hsl(var(--color-foreground))]" />
          </button>
          <Select
            value={filters.leavePeriod}
            onChange={(e) =>
              setFilters({ ...filters, leavePeriod: e.target.value })
            }
            className="flex-1"
          >
            <option value="current_prev_month">Current & Prev Month</option>
            <option value="current_month">Current Month</option>
            <option value="last_3_months">Last 3 Months</option>
            <option value="last_6_months">Last 6 Months</option>
            <option value="this_year">This Year</option>
          </Select>
          <button className="p-1 hover:bg-[hsl(var(--color-surface-elevated))] rounded">
            <ChevronRight className="w-4 h-4 text-[hsl(var(--color-foreground))]" />
          </button>
        </div>
      </div>

      {/* All Leave Categories */}
      <div className="space-y-2">
        <Select
          value={filters.leaveCategory}
          onChange={(e) =>
            setFilters({ ...filters, leaveCategory: e.target.value })
          }
        >
          <option value="all">All Leave Categories</option>
          <option value="annual">Annual Leave</option>
          <option value="sick">Sick Leave</option>
          <option value="personal">Personal Leave</option>
          <option value="unpaid">Unpaid Leave</option>
        </Select>
      </div>

      {/* All Employees */}
      <div className="space-y-2">
        <Select
          value={filters.employee}
          onChange={(e) =>
            setFilters({ ...filters, employee: e.target.value })
          }
        >
          <option value="all">All Employees</option>
          <option value="active">Active Employees</option>
          <option value="inactive">Inactive Employees</option>
        </Select>
      </div>

      {/* Search Button */}
      <Button
        className="w-full bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-dark))] text-white"
        variant="default"
      >
        Search
      </Button>
    </div>
  );
}
