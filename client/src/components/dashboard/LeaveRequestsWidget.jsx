import { Plane, RotateCw, Maximize2, ChevronLeft, ChevronRight, XCircle, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "../ui/Button";

export default function LeaveRequestsWidget() {
  const stats = [
    { label: "Awaiting", value: 0, icon: AlertCircle, color: "text-yellow-600", bgColor: "bg-yellow-50" },
    { label: "Approved", value: 0, icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-50" },
    { label: "Declined", value: 0, icon: XCircle, color: "text-red-600", bgColor: "bg-red-50" },
  ];

  const columns = [
    "Requested By",
    "Type",
    "Date Submitted",
    "Period",
    "Status",
    "Actioned By",
  ];

  return (
    <div className="bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-3xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-[hsl(var(--color-card))] border-b border-[hsl(var(--color-border))] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-[hsl(var(--color-foreground))]">Leave Requests</h3>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-[hsl(var(--color-surface-elevated))] rounded transition-colors">
            <RotateCw className="w-4 h-4 text-[hsl(var(--color-foreground-secondary))]" />
          </button>
          <button className="p-1.5 hover:bg-[hsl(var(--color-surface-elevated))] rounded transition-colors">
            <Maximize2 className="w-4 h-4 text-[hsl(var(--color-foreground-secondary))]" />
          </button>
        </div>
      </div>

      {/* Date Selector */}
      <div className="border-b border-[hsl(var(--color-border))] px-4 py-3 flex items-center justify-center">
        <button className="p-1 hover:bg-[hsl(var(--color-surface-elevated))] rounded">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="mx-4 text-sm font-medium text-[hsl(var(--color-foreground-secondary))] hover:text-[hsl(var(--color-foreground))] flex items-center gap-1">
          Current & Prev Month
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button className="p-1 hover:bg-[hsl(var(--color-surface-elevated))] rounded">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 border-b border-[hsl(var(--color-border))]">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-[hsl(var(--color-border))] flex items-center justify-center">
                    <span className="text-lg font-bold text-[hsl(var(--color-foreground))]">{stat.value}</span>
                  </div>
                  <Icon className={`w-4 h-4 ${stat.color} absolute -top-1 -right-1`} />
                </div>
              </div>
              <div className="text-sm text-[hsl(var(--color-foreground-secondary))]">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[hsl(var(--color-surface-elevated))] border-b border-[hsl(var(--color-border))]">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase tracking-wider whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    {column}
                    <button className="hover:bg-[hsl(var(--color-surface-elevated))] rounded p-0.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 10l5 5 5-5" />
                      </svg>
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-[hsl(var(--color-foreground-muted))]">
                No data available in table
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
  );
}
