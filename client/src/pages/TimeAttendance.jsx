import { useState, useEffect } from "react";
import { Clock, Users, FileText, MapPin, Upload, Plus, Mail, Printer, Download, RotateCw, Settings2, Loader2, Calendar, User as UserIcon } from "lucide-react";
import AttendanceFilters from "../components/attendance/AttendanceFilters";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { clockApi, schedulerApi, employeeApi } from "../lib/api";

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
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 });
  const [sites, setSites] = useState([]);
  const [employees, setEmployees] = useState([]);

  const tabs = [
    { id: "timecard", label: "Time Card", icon: Clock },
    { id: "bulk", label: "Bulk Update", icon: Users },
    { id: "summary", label: "Summary", icon: FileText },
    { id: "whosin", label: "Who's In", icon: MapPin },
    { id: "export", label: "Export", icon: Upload },
  ];

  const columns = [
    { label: "Employee", sortable: true, section: "employee" },
    { label: "Date", sortable: true, section: "shift" },
    { label: "Site", sortable: true, section: "shift" },
    { label: "Clock In", sortable: true, section: "clocked" },
    { label: "Clock Out", sortable: true, section: "clocked" },
    { label: "Total HRS", sortable: true, section: "clocked" },
    { label: "Status", sortable: true, section: "other" },
  ];

  // Fetch initial data
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await schedulerApi.getSites();
        setSites(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch sites:', err);
      }
    };

    const fetchEmployees = async () => {
      try {
        const response = await employeeApi.getAll();
        setEmployees(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch employees:', err);
      }
    };

    fetchSites();
    fetchEmployees();
  }, []);

  // Fetch records when dependencies change
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const params = {
          page: pagination.page,
          limit: itemsPerPage,
        };

        // Apply date filter
        const now = new Date();
        if (filters.date === "today") {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          params.startDate = today.toISOString();
          params.endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
        } else if (filters.date === "yesterday") {
          const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          params.startDate = yesterday.toISOString();
          params.endDate = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
        } else if (filters.date === "this_week") {
          const firstDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
          params.startDate = firstDay.toISOString();
          params.endDate = now.toISOString();
        } else if (filters.date === "last_week") {
          const firstDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 7);
          const lastDay = new Date(firstDay.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
          params.startDate = firstDay.toISOString();
          params.endDate = lastDay.toISOString();
        } else if (filters.date === "this_month") {
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
          params.startDate = firstDay.toISOString();
          params.endDate = now.toISOString();
        }

        // Apply site filter
        if (filters.sites !== "all") {
          params.siteId = filters.sites;
        }

        const response = await clockApi.getRecords(params);
        setRecords(response.data.data || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } catch (err) {
        console.error('Failed to fetch records:', err);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [pagination.page, itemsPerPage, filters.date, filters.sites]);

  const fetchRecords = async () => {
    // Trigger re-fetch by updating page to current page
    setPagination(prev => ({ ...prev, page: prev.page }));
  };

  // Calculate stats from records
  const stats = {
    total: records.reduce((sum, r) => sum + (r.totalHours || 0), 0),
    approved: 0,
    rejected: 0,
    pending: records.reduce((sum, r) => sum + (r.status === 'CLOCKED_IN' ? (r.totalHours || 0) : 0), 0),
    void: 0,
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (hours) => {
    if (!hours) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
      {/* Header */}
      <div className="bg-[hsl(var(--color-surface-elevated))] border-b border-[hsl(var(--color-border))]">
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-orange-900/30 p-2 sm:p-2.5 lg:p-3 rounded-lg sm:rounded-xl">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-orange-400" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg lg:text-xl font-bold text-[hsl(var(--color-foreground))]">
                  Time & Attendance
                </h1>
                <p className="hidden sm:block text-xs sm:text-sm text-[hsl(var(--color-foreground-secondary))] mt-0.5">
                  Track and manage employee time records
                </p>
              </div>
            </div>
            <button
              onClick={fetchRecords}
              className="p-2 hover:bg-[hsl(var(--color-surface))] rounded-lg transition-colors border border-[hsl(var(--color-border))]"
              title="Refresh"
            >
              <RotateCw className={`w-4 h-4 sm:w-5 sm:h-5 text-[hsl(var(--color-foreground-muted))] ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)] sm:h-[calc(100vh-89px)]">
        {/* Left Sidebar - Filters */}
        <div className="hidden lg:block w-64 xl:w-72 bg-[hsl(var(--color-surface))] border-r border-[hsl(var(--color-border))] overflow-y-auto flex-shrink-0">
          <AttendanceFilters
            filters={filters}
            setFilters={setFilters}
            onSearch={handleSearch}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="bg-[hsl(var(--color-surface))] border-b border-[hsl(var(--color-border))] overflow-x-auto">
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-[hsl(var(--color-primary))] text-[hsl(var(--color-primary))]"
                        : "border-transparent text-[hsl(var(--color-foreground-secondary))] hover:text-[hsl(var(--color-foreground))]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-[hsl(var(--color-surface))] border-b border-[hsl(var(--color-border))] px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <Button className="bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-hover))] text-white flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2">
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">New Record</span>
              </Button>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button className="hidden md:flex p-1.5 sm:p-2 hover:bg-[hsl(var(--color-surface-elevated))] rounded transition-colors">
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[hsl(var(--color-foreground-secondary))]" />
              </button>
              <Select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="w-16 sm:w-20 text-xs sm:text-sm"
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
            <div className="bg-[hsl(var(--color-card))] m-2 sm:m-4 rounded-lg border border-[hsl(var(--color-border))] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-[hsl(var(--color-surface-elevated))] border-b border-[hsl(var(--color-border))]">
                    <tr className="bg-[hsl(var(--color-background))]">
                      <th className="px-4 py-3 border-b border-[hsl(var(--color-border))]">
                        <input type="checkbox" className="rounded border-[hsl(var(--color-border))]" />
                      </th>
                      {columns.map((column, index) => (
                        <th
                          key={index}
                          className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase tracking-wider whitespace-nowrap border-b border-[hsl(var(--color-border))]"
                        >
                          <div className="flex items-center gap-1">
                            {column.label}
                            {column.sortable && (
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
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={columns.length + 1}
                          className="px-4 py-12 text-center"
                        >
                          <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--color-primary))] mx-auto" />
                        </td>
                      </tr>
                    ) : records.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length + 1}
                          className="px-4 py-12 text-center text-sm text-[hsl(var(--color-foreground-secondary))]"
                        >
                          No data available in table
                        </td>
                      </tr>
                    ) : (
                      records.map((record) => (
                        <tr key={record._id} className="hover:bg-[hsl(var(--color-surface-elevated))] transition-colors">
                          <td className="px-4 py-3">
                            <input type="checkbox" className="rounded border-[hsl(var(--color-border))]" />
                          </td>
                          <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground))]">
                            <div className="flex items-center gap-2">
                              <UserIcon className="w-4 h-4 text-[hsl(var(--color-foreground-muted))]" />
                              {record.employeeId?.firstName} {record.employeeId?.lastName}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground))]">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-[hsl(var(--color-foreground-muted))]" />
                              {formatDate(record.clockInTime)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground))]">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-[hsl(var(--color-foreground-muted))]" />
                              {record.siteId?.siteLocationName || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground))]">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-green-400" />
                              {formatTime(record.clockInTime)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground))]">
                            {record.clockOutTime ? (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-red-400" />
                                {formatTime(record.clockOutTime)}
                              </div>
                            ) : (
                              <span className="text-[hsl(var(--color-foreground-muted))]">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-[hsl(var(--color-primary))]">
                            {formatDuration(record.totalHours)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.status === 'CLOCKED_IN'
                                ? 'bg-green-900/30 text-green-400'
                                : 'bg-[hsl(var(--color-surface-elevated))] text-[hsl(var(--color-foreground))]'
                            }`}>
                              {record.status === 'CLOCKED_IN' ? 'Active' : 'Completed'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer with Stats */}
              <div className="border-t border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-elevated))]">
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="text-sm text-[hsl(var(--color-foreground-secondary))]">
                    Showing {records.length > 0 ? ((pagination.page - 1) * itemsPerPage + 1) : 0} to {Math.min(pagination.page * itemsPerPage, pagination.total)} of {pagination.total} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1 || loading}
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.pages || loading}
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    >
                      Next
                    </Button>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="border-t border-[hsl(var(--color-border))] px-4 py-3 flex items-center justify-around text-sm">
                  <div className="flex flex-col items-center">
                    <span className="text-[hsl(var(--color-foreground-secondary))]">Total HRS</span>
                    <span className="font-semibold text-[hsl(var(--color-foreground))]">{stats.total.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[hsl(var(--color-foreground-secondary))]">Approved</span>
                    <span className="font-semibold text-[hsl(var(--color-foreground))]">{stats.approved.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[hsl(var(--color-foreground-secondary))]">Rejected</span>
                    <span className="font-semibold text-[hsl(var(--color-foreground))]">{stats.rejected.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[hsl(var(--color-foreground-secondary))]">Pending</span>
                    <span className="font-semibold text-[hsl(var(--color-foreground))]">{stats.pending.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[hsl(var(--color-foreground-secondary))]">Void</span>
                    <span className="font-semibold text-[hsl(var(--color-foreground))]">{stats.void.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
