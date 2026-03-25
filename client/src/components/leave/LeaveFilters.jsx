import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";

export default function LeaveFilters({ filters, setFilters, onClose }) {
  const handleClearFilters = () => {
    setFilters({
      leavePeriod: "all",
      leaveCategory: "all",
      employee: "all",
    });
  };

  return (
    <div className="bg-[hsl(var(--color-surface-elevated))] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--color-border))]">
        <button
          onClick={handleClearFilters}
          className="flex items-center gap-1 text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary-dark))] text-sm font-medium"
        >
          <X className="w-4 h-4" />
          Clear Filters
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[hsl(var(--color-border))] text-[hsl(var(--color-foreground-secondary))] hover:text-[hsl(var(--color-foreground))] transition-colors"
            title="Close filters"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Select Leave Period */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[hsl(var(--color-foreground))]">
          Select Leave Period
        </label>
        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-[hsl(var(--color-card))] rounded">
            <ChevronLeft className="w-4 h-4 text-[hsl(var(--color-foreground))]" />
          </button>
          <Select
            value={filters.leavePeriod}
            onChange={(e) => setFilters({ ...filters, leavePeriod: e.target.value })}
            className="flex-1"
          >
            <option value="all">All Time</option>
            <option value="current_prev_month">Current & Prev Month</option>
            <option value="current_month">Current Month</option>
            <option value="last_3_months">Last 3 Months</option>
            <option value="last_6_months">Last 6 Months</option>
            <option value="this_year">This Year</option>
          </Select>
          <button className="p-1 hover:bg-[hsl(var(--color-card))] rounded">
            <ChevronRight className="w-4 h-4 text-[hsl(var(--color-foreground))]" />
          </button>
        </div>
      </div>

      {/* Leave Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[hsl(var(--color-foreground))]">
          Leave Category
        </label>
        <Select
          value={filters.leaveCategory}
          onChange={(e) => setFilters({ ...filters, leaveCategory: e.target.value })}
        >
          <option value="all">All Leave Categories</option>
          <option value="annual">Annual Leave</option>
          <option value="sick">Sick Leave</option>
          <option value="personal">Personal Leave</option>
          <option value="unpaid">Unpaid Leave</option>
        </Select>
      </div>

      {/* Status filter (maps to employee filter slot) */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[hsl(var(--color-foreground))]">
          Status
        </label>
        <Select
          value={filters.employee}
          onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="declined">Declined</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      {onClose && (
        <Button
          className="w-full bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-dark))] text-white"
          onClick={onClose}
        >
          Apply & Close
        </Button>
      )}
    </div>
  );
}
