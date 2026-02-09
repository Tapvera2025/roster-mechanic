import { RotateCw, Maximize2, ChevronLeft, ChevronRight, Search } from "lucide-react";
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
      <div className="relative inline-flex" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="hsl(220, 15%, 20%)"
            strokeWidth="6"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#EA580C"
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-100">{percentage}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[hsl(220,15%,14%)] border border-[hsl(220,15%,20%)] rounded-3xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-[hsl(220,15%,14%)] border-b border-[hsl(220,15%,22%)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-100">Subcontractor Dashboard</h3>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-[hsl(220,15%,18%)] rounded transition-colors">
            <RotateCw className="w-4 h-4 text-gray-400" />
          </button>
          <button className="p-1.5 hover:bg-[hsl(220,15%,18%)] rounded transition-colors">
            <Maximize2 className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Date Selector */}
      <div className="border-b border-[hsl(220,15%,22%)] px-4 py-3 flex items-center justify-center">
        <button className="p-1 hover:bg-[hsl(220,15%,18%)] rounded text-gray-400">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="mx-4 text-sm font-medium text-gray-200 hover:text-orange-500 flex items-center gap-1">
          Current Month
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button className="p-1 hover:bg-[hsl(220,15%,18%)] rounded text-gray-400">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Search and Filters */}
      <div className="border-b border-[hsl(220,15%,22%)] px-4 py-3 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input placeholder="Search..." className="pl-9" />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded">
            <span className="text-sm font-medium text-orange-400">47</span>
            <span className="text-sm text-orange-300">Employees</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded">
            <span className="text-sm font-medium text-green-400">1</span>
            <span className="text-sm text-green-300">Admin/Office Users</span>
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
          <thead className="bg-[hsl(220,15%,16%)] border-b border-[hsl(220,15%,22%)]">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    {column}
                    {index === 0 && (
                      <button className="hover:bg-[hsl(220,15%,20%)] rounded p-0.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 10l5 5 5-5" />
                        </svg>
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[hsl(220,15%,14%)] divide-y divide-[hsl(220,15%,22%)]">
            {contractors.map((contractor, index) => (
              <tr key={index} className="hover:bg-[hsl(220,15%,16%)]">
                <td className="px-4 py-4 text-sm text-gray-100 whitespace-nowrap">
                  {contractor.name}
                </td>
                <td className="px-4 py-4 text-sm text-center">
                  <span className="inline-flex items-center justify-center px-3 py-1 bg-[hsl(220,15%,18%)] text-gray-100 rounded font-medium">
                    {contractor.empUsers}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-center">
                  <span className="inline-flex items-center justify-center px-3 py-1 bg-[hsl(220,15%,16%)] text-gray-200 rounded">
                    {contractor.rosteredHrs}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-center">
                  <span className="inline-flex items-center justify-center px-3 py-1 bg-[hsl(220,15%,16%)] text-gray-200 rounded">
                    {contractor.attendanceHrs}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-center">
                  <CircularProgress percentage={contractor.attendancePercent} />
                </td>
                <td className="px-4 py-4 text-sm text-center">
                  <CircularProgress percentage={contractor.mobileAttendancePercent} />
                </td>
                <td className="px-4 py-4 text-sm text-center">
                  <span className="text-gray-100 font-medium">{contractor.noShowPercent}%</span>
                </td>
                <td className="px-4 py-4 text-sm text-center">
                  <span className="text-gray-100 font-medium">{contractor.latenessRate}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="border-t border-[hsl(220,15%,22%)] px-4 py-3 flex items-center justify-end gap-2">
        <Button variant="outline" size="sm">
          Previous
        </Button>
        <Button variant="default" size="sm">
          1
        </Button>
        <Button variant="outline" size="sm">
          Next
        </Button>
      </div>
    </div>
  );
}
