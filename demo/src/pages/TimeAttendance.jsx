import { useState } from "react";
import { Clock, Users, FileText, MapPin, Upload, Plus, Mail, Printer, Download, RotateCw, Settings2 } from "lucide-react";
import AttendanceFilters from "../components/attendance/AttendanceFilters";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";

export default function TimeAttendance() {
  const [activeTab, setActiveTab] = useState("timecard");
  const [filters, setFilters] = useState({
    date: "today",
    contractors: "all",
    states: "all",
    sites: "all",
    exceptions: "all",
    status: "all",
    shiftType: "all",
  });
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const tabs = [
    { id: "timecard", label: "Time Card", icon: Clock },
    { id: "bulk", label: "Bulk Update", icon: Users },
    { id: "summary", label: "Summary", icon: FileText },
    { id: "whosin", label: "Who's In", icon: MapPin },
    { id: "export", label: "Export", icon: Upload },
  ];

  const columns = [
    { label: "Date", sortable: true, section: "shift" },
    { label: "Status", sortable: true, section: "shift" },
    { label: "Site", sortable: true, section: "shift" },
    { label: "Shift Time", sortable: true, section: "shift" },
    { label: "HRS", sortable: true, section: "shift" },
    { label: "In", sortable: true, section: "clocked" },
    { label: "Out", sortable: true, section: "clocked" },
    { label: "Break", sortable: true, section: "clocked" },
    { label: "Total HRS", sortable: true, section: "clocked" },
    { label: "Notes", sortable: false, section: "other" },
    { label: "HRS Diff", sortable: true, section: "other" },
    { label: "Clocking Status", sortable: true, section: "other" },
  ];

  const stats = {
    total: 0.0,
    approved: 0.0,
    rejected: 0.0,
    pending: 0.0,
    void: 0.0,
  };

  const handleSearch = () => {
    console.log("Searching with filters:", filters);
  };

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Left Sidebar - Filters */}
      <div className="w-64 bg-[hsl(220,15%,12%)] border-r border-[hsl(220,15%,20%)] overflow-y-auto flex-shrink-0">
        <AttendanceFilters
          filters={filters}
          setFilters={setFilters}
          onSearch={handleSearch}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="bg-[hsl(220,15%,14%)] border-b border-[hsl(220,15%,20%)]">
          <div className="flex items-center gap-2 px-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-orange-500 text-orange-500"
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

        {/* Action Bar */}
        <div className="bg-[hsl(220,15%,14%)] border-b border-[hsl(220,15%,20%)] px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Time Record
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              Bulk Actions
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-[hsl(220,15%,18%)] rounded transition-colors">
              <Mail className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-2 hover:bg-[hsl(220,15%,18%)] rounded transition-colors">
              <Printer className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-2 hover:bg-[hsl(220,15%,18%)] rounded transition-colors">
              <Download className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-2 hover:bg-[hsl(220,15%,18%)] rounded transition-colors">
              <RotateCw className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-2 hover:bg-[hsl(220,15%,18%)] rounded transition-colors flex items-center gap-1 text-sm text-gray-300">
              Actions
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button className="p-2 hover:bg-[hsl(220,15%,18%)] rounded transition-colors flex items-center gap-1 text-sm text-gray-300">
              <Settings2 className="w-4 h-4" />
              Columns
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
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
        <div className="flex-1 overflow-auto">
          <div className="bg-[hsl(220,15%,14%)] m-4 rounded-lg border border-[hsl(220,15%,20%)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[hsl(220,15%,16%)] border-b border-[hsl(220,15%,22%)]">
                  <tr>
                    <th className="px-4 py-3 border-r border-[hsl(220,15%,22%)]">
                      <input type="checkbox" className="rounded border-gray-600" />
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider border-r border-[hsl(220,15%,22%)]"
                      colSpan="5"
                    >
                      Shift Assignments
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider"
                      colSpan="4"
                    >
                      Clocked Record
                    </th>
                    <th className="px-4 py-3" colSpan="3"></th>
                  </tr>
                  <tr className="bg-[hsl(220,15%,18%)]">
                    <th className="px-4 py-3"></th>
                    {columns.map((column, index) => (
                      <th
                        key={index}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1">
                          {column.label}
                          {column.sortable && (
                            <button className="hover:bg-[hsl(220,15%,22%)] rounded p-0.5">
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
                    <td
                      colSpan={columns.length + 1}
                      className="px-4 py-12 text-center text-sm text-gray-500"
                    >
                      No data available in table
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer with Stats */}
            <div className="border-t border-[hsl(220,15%,22%)] bg-[hsl(220,15%,16%)]">
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="text-sm text-gray-400 italic">
                  Showing 0 to 0 of 0 entries
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                </div>
              </div>

              {/* Stats Row */}
              <div className="border-t border-[hsl(220,15%,22%)] px-4 py-3 flex items-center justify-around text-sm">
                <div className="flex flex-col items-center">
                  <span className="text-gray-400">Total HRS</span>
                  <span className="font-semibold text-gray-100">{stats.total.toFixed(2)}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-gray-400">Approved</span>
                  <span className="font-semibold text-gray-100">{stats.approved.toFixed(2)}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-gray-400">Rejected</span>
                  <span className="font-semibold text-gray-100">{stats.rejected.toFixed(2)}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-gray-400">Pending</span>
                  <span className="font-semibold text-gray-100">{stats.pending.toFixed(2)}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-gray-400">Void</span>
                  <span className="font-semibold text-gray-100">{stats.void.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
