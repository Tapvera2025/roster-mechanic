import {
  RotateCw,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";

export default function SubcontractorWidget() {
  const columns = [
    "Contractor",
    "Emp & Users",
    "Rostered Hrs",
    "Attendance Hrs",
    "Attendance %",
    "Mobile Attendance %",
    "No Show %",
    "Lateness Rate",
  ];

  const contractors = [
    {
      name: "Internal Team/Staff",
      empUsers: 48,
      rosteredHrs: "0.00 Hrs",
      attendanceHrs: "0.02 Hrs",
      attendancePercent: 100,
      mobileAttendancePercent: 100,
      noShowPercent: 0,
      latenessRate: 0,
    },
  ];

  const CircularProgress = ({ percentage, size = 48 }) => {
    const radius = (size - 8) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div
        className="relative inline-flex"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="hsl(var(--color-border))"
            strokeWidth="6"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="hsl(var(--color-primary, 220 90% 56%))"
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-[hsl(var(--color-foreground))]">
            {percentage}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-3xl shadow-sm">
      {/* Header */}
      <div className="border-b border-[hsl(var(--color-border))] px-4 py-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[hsl(var(--color-foreground))]">
          Subcontractor Dashboard
        </h3>
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
          Current Month
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        <button className="p-1 hover:bg-[hsl(var(--color-surface-elevated))] rounded">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Search and Filters */}
      <div className="border-b border-[hsl(var(--color-border))] px-4 py-3 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--color-foreground-muted))]" />
          <Input
            placeholder="Search..."
            className="pl-9 bg-[hsl(var(--color-card))] border-[hsl(var(--color-border))]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[hsl(var(--color-surface-elevated))] border border-[hsl(var(--color-border))] rounded">
            <span className="text-sm font-medium text-[hsl(var(--color-foreground))]">
              47
            </span>
            <span className="text-sm text-[hsl(var(--color-foreground-secondary))]">
              Employees
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[hsl(var(--color-surface-elevated))] border border-[hsl(var(--color-border))] rounded">
            <span className="text-sm font-medium text-[hsl(var(--color-foreground))]">
              1
            </span>
            <span className="text-sm text-[hsl(var(--color-foreground-secondary))]">
              Admin/Office Users
            </span>
          </div>
          <Select className="w-20">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </Select>
        </div>
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
                    {index === 0 && (
                      <button className="hover:bg-[hsl(var(--color-surface-elevated))] rounded p-0.5">
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

          <tbody className="divide-y divide-[hsl(var(--color-border))]">
            {contractors.map((contractor, index) => (
              <tr
                key={index}
                className="hover:bg-[hsl(var(--color-surface-elevated))]"
              >
                <td className="px-4 py-4 text-sm text-[hsl(var(--color-foreground))] whitespace-nowrap">
                  {contractor.name}
                </td>
                <td className="px-4 py-4 text-sm text-center">
                  <span className="inline-flex items-center justify-center px-3 py-1 bg-[hsl(var(--color-surface-elevated))] text-[hsl(var(--color-foreground))] rounded font-medium">
                    {contractor.empUsers}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-center">
                  <span className="inline-flex items-center justify-center px-3 py-1 bg-[hsl(var(--color-surface-elevated))] rounded">
                    {contractor.rosteredHrs}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-center">
                  <span className="inline-flex items-center justify-center px-3 py-1 bg-[hsl(var(--color-surface-elevated))] rounded">
                    {contractor.attendanceHrs}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-center">
                  <CircularProgress percentage={contractor.attendancePercent} />
                </td>
                <td className="px-4 py-4 text-sm text-center">
                  <CircularProgress
                    percentage={contractor.mobileAttendancePercent}
                  />
                </td>
                <td className="px-4 py-4 text-sm text-center font-medium">
                  {contractor.noShowPercent}%
                </td>
                <td className="px-4 py-4 text-sm text-center font-medium">
                  {contractor.latenessRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="border-t border-[hsl(var(--color-border))] px-4 py-3 flex items-center justify-end gap-2">
        <Button variant="outline" size="sm">
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-blue-500 text-white hover:bg-blue-600"
        >
          1
        </Button>
        <Button variant="outline" size="sm">
          Next
        </Button>
      </div>
    </Card>
  );
}
