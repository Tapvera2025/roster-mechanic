import { Plane, RotateCw, Maximize2, ChevronLeft, ChevronRight, XCircle, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "../ui/Button";

export default function LeaveRequestsWidget() {
  const stats = [
    { label: "Awaiting", value: 0, icon: AlertCircle, color: "text-amber-500", bgColor: "bg-amber-500/20" },
    { label: "Approved", value: 0, icon: CheckCircle, color: "text-green-500", bgColor: "bg-green-500/20" },
    { label: "Declined", value: 0, icon: XCircle, color: "text-red-500", bgColor: "bg-red-500/20" },
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
    <div className="bg-[hsl(220,15%,14%)] border border-[hsl(220,15%,20%)] rounded-3xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-[hsl(220,15%,14%)] border-b border-[hsl(220,15%,20%)] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-orange-500" />
          <h3 className="text-base font-bold text-gray-100">Leave Requests</h3>
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
          Current & Prev Month
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button className="p-1 hover:bg-[hsl(220,15%,18%)] rounded text-gray-400">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 border-b border-[hsl(220,15%,22%)]">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-[hsl(220,15%,22%)] flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-100">{stat.value}</span>
                  </div>
                  <Icon className={`w-4 h-4 ${stat.color} absolute -top-1 -right-1`} />
                </div>
              </div>
              <div className="text-sm text-gray-300">{stat.label}</div>
            </div>
          );
        })}
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
                    <button className="hover:bg-[hsl(220,15%,20%)] rounded p-0.5">
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
              <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-gray-500">
                No data available in table
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="border-t border-[hsl(220,15%,22%)] px-4 py-3 flex items-center justify-end gap-2">
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
