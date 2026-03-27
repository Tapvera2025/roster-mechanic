import { useState, useEffect, useCallback } from "react";
import { Clock, Users, FileText, MapPin, Upload, Plus, Mail, Printer, Download, RotateCw, Settings2, Loader2, Calendar, User as UserIcon, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import AttendanceFilters from "../components/attendance/AttendanceFilters";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import SortableHeader from "../components/ui/SortableHeader";
import { clockApi, schedulerApi, employeeApi } from "../lib/api";
import { useTableSort } from "../hooks/useTableSort";
import { useSocketEvent } from "../contexts/SocketContext";

export default function TimeAttendance() {
  const [activeTab, setActiveTab] = useState("timecard");
  const [filtersCollapsed, setFiltersCollapsed] = useState(true); // Start collapsed to save space
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
    { label: "Employee", sortable: true, section: "employee", sortKey: "employeeId.firstName" },
    { label: "Date", sortable: true, section: "shift", sortKey: "clockInTime" },
    { label: "Site", sortable: true, section: "shift", sortKey: "siteId.siteLocationName" },
    { label: "Clock In", sortable: true, section: "clocked", sortKey: "clockInTime" },
    { label: "Clock Out", sortable: true, section: "clocked", sortKey: "clockOutTime" },
    { label: "Total HRS", sortable: true, section: "clocked", sortKey: "totalHours" },
    { label: "Status", sortable: true, section: "other", sortKey: "status" },
  ];

  // Table sorting
  const { sortedData: sortedRecords, requestSort, getSortIndicator } = useTableSort(records, {
    defaultColumn: 'clockInTime',
    defaultDirection: 'desc',
  });

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

  // Fetch records function as useCallback for stable reference
  const fetchRecords = useCallback(async () => {
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
  }, [pagination.page, itemsPerPage, filters.date, filters.sites]);

  // Fetch records when dependencies change
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Real-time updates: Listen for clock-in/out events and refresh data
  useSocketEvent('clock-in', useCallback((data) => {
    console.log('Clock-in event received on dashboard, refreshing records:', data);
    fetchRecords();
  }, [fetchRecords]));

  useSocketEvent('clock-out', useCallback((data) => {
    console.log('Clock-out event received on dashboard, refreshing records:', data);
    fetchRecords();
  }, [fetchRecords]));

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

      <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)] sm:h-[calc(100vh-89px)] relative">
        {/* Left Sidebar - Filters (Desktop) */}
        <div
          className={`hidden lg:block bg-[hsl(var(--color-surface))] border-r border-[hsl(var(--color-border))] overflow-y-auto flex-shrink-0 transition-all duration-300 relative ${
            filtersCollapsed ? 'w-0 border-0' : 'w-64 xl:w-72'
          }`}
        >
          <div className={`transition-opacity duration-300 ${filtersCollapsed ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
            <AttendanceFilters
              filters={filters}
              setFilters={setFilters}
              onSearch={handleSearch}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Mobile Filter Button */}
          <div className="lg:hidden bg-[hsl(var(--color-surface))] border-b border-[hsl(var(--color-border))] px-4 py-2">
            <button
              onClick={() => setFiltersCollapsed(!filtersCollapsed)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[hsl(var(--color-border))] hover:bg-[hsl(var(--color-surface-elevated))] transition-colors w-full justify-between"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-sm font-medium">Filters</span>
              </div>
              <div className="flex items-center gap-2">
                {Object.values(filters).filter(v => v !== 'all' && v !== 'today').length > 0 && (
                  <span className="bg-[hsl(var(--color-primary))] text-white text-xs px-2 py-0.5 rounded-full">
                    {Object.values(filters).filter(v => v !== 'all' && v !== 'today').length}
                  </span>
                )}
                {filtersCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4 rotate-90" />
                )}
              </div>
            </button>
          </div>

          {/* Mobile Filter Panel */}
          {!filtersCollapsed && (
            <div className="lg:hidden bg-[hsl(var(--color-surface))] border-b border-[hsl(var(--color-border))] p-4">
              <AttendanceFilters
                filters={filters}
                setFilters={setFilters}
                onSearch={handleSearch}
              />
            </div>
          )}
          {/* Tabs */}
          <div className="bg-[hsl(var(--color-surface))] border-b border-[hsl(var(--color-border))] overflow-x-auto">
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 min-w-max">
              {/* Filter Toggle Button (Desktop - Integrated in Tabs) */}
              <button
                onClick={() => setFiltersCollapsed(!filtersCollapsed)}
                className="hidden lg:flex items-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-medium border-b-2 border-transparent hover:bg-[hsl(var(--color-surface-elevated))] transition-colors rounded-t-lg"
                title={filtersCollapsed ? 'Show Filters' : 'Hide Filters'}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[hsl(var(--color-foreground-secondary))]" />
                {filtersCollapsed && (
                  <span className="text-[hsl(var(--color-foreground-secondary))]">Filters</span>
                )}
                {!filtersCollapsed && (
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[hsl(var(--color-foreground-secondary))]" />
                )}
                {Object.values(filters).filter(v => v !== 'all' && v !== 'today').length > 0 && (
                  <span className="bg-[hsl(var(--color-primary))] text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {Object.values(filters).filter(v => v !== 'all' && v !== 'today').length}
                  </span>
                )}
              </button>
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

          {/* Action Bar - Only show for timecard tab */}
          {activeTab === "timecard" && (
            <div className="bg-[hsl(var(--color-surface))] border-b border-[hsl(var(--color-border))] px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-2">
                <Button className="bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-hover))] text-white flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2">
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">New Record</span>
                </Button>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={async () => {
                    try {
                      const params = {};
                      if (filters.date === "today") {
                        const today = new Date();
                        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        params.startDate = start.toISOString();
                        params.endDate = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
                      }
                      if (filters.sites !== "all") params.siteId = filters.sites;

                      const response = await clockApi.exportCSV(params);
                      const blob = new Blob([response.data], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `time-records-${new Date().toISOString().split('T')[0]}.csv`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch (err) {
                      console.error('Export failed:', err);
                    }
                  }}
                  className="hidden md:flex p-1.5 sm:p-2 hover:bg-[hsl(var(--color-surface-elevated))] rounded transition-colors"
                  title="Export CSV"
                >
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
          )}

          {/* Tab Content */}
          <div className="flex-1 overflow-auto">
            {/* Time Card Tab */}
            {activeTab === "timecard" && (
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
                          {column.sortable ? (
                            <SortableHeader
                              label={column.label}
                              sortKey={column.sortKey}
                              onSort={requestSort}
                              sortDirection={getSortIndicator(column.sortKey)}
                              className="uppercase text-xs"
                            />
                          ) : (
                            column.label
                          )}
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
                      sortedRecords.map((record) => (
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
            )}

            {/* Bulk Update Tab */}
            {activeTab === "bulk" && (
              <div className="bg-[hsl(var(--color-card))] m-2 sm:m-4 rounded-lg border border-[hsl(var(--color-border))] p-12 text-center">
                <Users className="w-16 h-16 text-[hsl(var(--color-foreground-muted))] mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-semibold text-[hsl(var(--color-foreground))] mb-2">Bulk Update</h3>
                <p className="text-[hsl(var(--color-foreground-secondary))]">Bulk update functionality coming soon</p>
              </div>
            )}

            {/* Summary Tab */}
            {activeTab === "summary" && (
              <div className="bg-[hsl(var(--color-card))] m-2 sm:m-4 rounded-lg border border-[hsl(var(--color-border))] p-6">
                <h3 className="text-lg font-semibold text-[hsl(var(--color-foreground))] mb-6">Time & Attendance Summary</h3>

                {/* Summary Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-[hsl(var(--color-surface-elevated))] p-4 rounded-lg border border-[hsl(var(--color-border))]">
                    <div className="text-sm text-[hsl(var(--color-foreground-secondary))] mb-1">Total Hours</div>
                    <div className="text-2xl font-bold text-[hsl(var(--color-primary))]">{stats.total.toFixed(1)}h</div>
                  </div>
                  <div className="bg-[hsl(var(--color-surface-elevated))] p-4 rounded-lg border border-[hsl(var(--color-border))]">
                    <div className="text-sm text-[hsl(var(--color-foreground-secondary))] mb-1">Approved</div>
                    <div className="text-2xl font-bold text-green-400">{stats.approved.toFixed(1)}h</div>
                  </div>
                  <div className="bg-[hsl(var(--color-surface-elevated))] p-4 rounded-lg border border-[hsl(var(--color-border))]">
                    <div className="text-sm text-[hsl(var(--color-foreground-secondary))] mb-1">Pending</div>
                    <div className="text-2xl font-bold text-yellow-400">{stats.pending.toFixed(1)}h</div>
                  </div>
                  <div className="bg-[hsl(var(--color-surface-elevated))] p-4 rounded-lg border border-[hsl(var(--color-border))]">
                    <div className="text-sm text-[hsl(var(--color-foreground-secondary))] mb-1">Total Records</div>
                    <div className="text-2xl font-bold text-[hsl(var(--color-foreground))]">{pagination.total}</div>
                  </div>
                </div>

                <div className="text-center text-[hsl(var(--color-foreground-secondary))] mt-8">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Detailed summary charts and reports coming soon</p>
                </div>
              </div>
            )}

            {/* Who's In Tab */}
            {activeTab === "whosin" && (
              <div className="bg-[hsl(var(--color-card))] m-2 sm:m-4 rounded-lg border border-[hsl(var(--color-border))] p-6">
                <h3 className="text-lg font-semibold text-[hsl(var(--color-foreground))] mb-6">Who's Currently Clocked In</h3>

                {/* Filter active records */}
                {(() => {
                  const activeRecords = records.filter(r => r.status === 'CLOCKED_IN');
                  return activeRecords.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeRecords.map((record) => (
                        <div key={record._id} className="bg-[hsl(var(--color-surface-elevated))] p-4 rounded-lg border border-[hsl(var(--color-border))]">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                              <Clock className="w-5 h-5 text-green-400" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-[hsl(var(--color-foreground))]">
                                {record.employeeId?.firstName} {record.employeeId?.lastName}
                              </div>
                              <div className="text-xs text-[hsl(var(--color-foreground-secondary))]">
                                Active
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-[hsl(var(--color-foreground-secondary))]">
                              <MapPin className="w-4 h-4" />
                              <span>{record.siteId?.siteLocationName || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[hsl(var(--color-foreground-secondary))]">
                              <Clock className="w-4 h-4" />
                              <span>Since {formatTime(record.clockInTime)}</span>
                            </div>
                            <div className="text-[hsl(var(--color-primary))] font-semibold mt-2">
                              {formatDuration(record.totalHours)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MapPin className="w-16 h-16 text-[hsl(var(--color-foreground-muted))] mx-auto mb-4 opacity-30" />
                      <p className="text-[hsl(var(--color-foreground-secondary))]">No employees currently clocked in</p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Export Tab */}
            {activeTab === "export" && (
              <div className="bg-[hsl(var(--color-card))] m-2 sm:m-4 rounded-lg border border-[hsl(var(--color-border))] p-12">
                <div className="max-w-md mx-auto text-center">
                  <div className="w-16 h-16 rounded-full bg-[hsl(var(--color-primary))]/10 flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-[hsl(var(--color-primary))]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[hsl(var(--color-foreground))] mb-2">Export Time Records</h3>
                  <p className="text-[hsl(var(--color-foreground-secondary))] mb-6">
                    Export filtered time records to CSV format
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        const params = {};
                        if (filters.date === "today") {
                          const today = new Date();
                          const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                          params.startDate = start.toISOString();
                          params.endDate = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
                        }
                        if (filters.sites !== "all") params.siteId = filters.sites;

                        const response = await clockApi.exportCSV(params);
                        const blob = new Blob([response.data], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `time-records-${new Date().toISOString().split('T')[0]}.csv`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                      } catch (err) {
                        console.error('Export failed:', err);
                      }
                    }}
                    className="px-6 py-3 bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-hover))] text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Download className="w-5 h-5" />
                    Download CSV
                  </button>
                  <p className="text-xs text-[hsl(var(--color-foreground-muted))] mt-4">
                    Current filters: {filters.date !== "all" ? filters.date : "all dates"}, {filters.sites !== "all" ? "filtered by site" : "all sites"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
