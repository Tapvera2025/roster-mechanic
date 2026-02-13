import { useState, useEffect, useCallback } from "react";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { dashboardApi } from "../../lib/api";

export default function AttendanceChart() {
  const [viewMode, setViewMode] = useState("shift");
  const [chartType, setChartType] = useState("bar");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [page, setPage] = useState(1);

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getAttendance();
      setAttendanceRecords(res.data.data || []);
    } catch {
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and auto-refresh every 60 seconds
  useEffect(() => {
    fetchAttendance();
    const interval = setInterval(fetchAttendance, 60000);
    return () => clearInterval(interval);
  }, [fetchAttendance]);

  const formatTime = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      CLOCKED_IN:  "bg-green-100 text-green-800",
      CLOCKED_OUT: "bg-blue-100 text-blue-800",
      NO_SHOW:     "bg-red-100 text-red-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  const formatStatus = (status) => {
    const labels = {
      CLOCKED_IN:  "Clocked In",
      CLOCKED_OUT: "Clocked Out",
      NO_SHOW:     "No Show",
    };
    return labels[status] || status?.replace(/_/g, " ") || "—";
  };

  // Derived stats
  const workingCount  = attendanceRecords.filter((r) => r.status === "CLOCKED_IN").length;
  const clockedOut    = attendanceRecords.filter((r) => r.status === "CLOCKED_OUT").length;
  const noShowCount   = attendanceRecords.filter((r) => r.status === "NO_SHOW").length;
  const totalShifts   = attendanceRecords.length;

  // Pagination
  const totalPages  = Math.max(1, Math.ceil(totalShifts / itemsPerPage));
  const startIdx    = (page - 1) * itemsPerPage;
  const pagedRecords = attendanceRecords.slice(startIdx, startIdx + itemsPerPage);

  const attendanceData = [
    { label: "Working",             value: workingCount, color: "bg-blue-500" },
    { label: "No Show",             value: noShowCount,  color: "bg-red-500" },
    { label: "Clocked Out",         value: clockedOut,   color: "bg-green-500" },
    { label: "No Activity",         value: 0,            color: "bg-gray-400" },
    { label: "Late Arrival",        value: 0,            color: "bg-orange-400" },
    { label: "Early Leave",         value: 0,            color: "bg-yellow-400" },
    { label: "Left Job Site",       value: 0,            color: "bg-purple-400" },
    { label: "Outside Job Site",    value: 0,            color: "bg-pink-400" },
  ];

  const maxVal = Math.max(...attendanceData.map((d) => d.value), 1);

  const summaryStats = [
    { label: "Currently Working",     value: workingCount },
    { label: "No Show",               value: noShowCount },
    { label: "Clocked Out (Done)",    value: clockedOut },
    { label: "No Activity",           value: 0 },
    { label: "Late Arrival",          value: 0 },
    { label: "Early Leave",           value: 0 },
    { label: "Left Job Site",         value: 0 },
    { label: "Outside Job Site",      value: 0 },
    { label: "Total Scheduled Shifts", value: totalShifts },
    { label: "Total Worked Shifts",   value: clockedOut },
  ];

  const liveAttendanceColumns = [
    "Date", "Employee", "Mobile", "Site",
    "Shift Time", "HRS", "In", "Out", "Break", "Total HRS", "Status",
  ];

  // ── Live Attendance Table ──────────────────────────────────────────────────
  const renderLiveAttendance = () => (
    <div className="bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-3xl shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-[hsl(var(--color-border))] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[hsl(var(--color-foreground-secondary))]">Today</span>
          <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--color-foreground-secondary))]">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Clocked In: {workingCount}
            </span>
            <span className="mx-1">·</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Clocked Out: {clockedOut}
            </span>
            <span className="mx-1">·</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> No Show: {noShowCount}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAttendance}
            className="p-1.5 hover:bg-[hsl(var(--color-surface-elevated))] rounded transition-colors"
            title="Refresh"
          >
            <RotateCw className={`w-4 h-4 text-[hsl(var(--color-foreground-secondary))] ${loading ? "animate-spin" : ""}`} />
          </button>
          <Select
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1); }}
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
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[hsl(var(--color-surface-elevated))] border-b border-[hsl(var(--color-border))]">
            <tr>
              <th className="px-4 py-3 text-center text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase tracking-wider border-r border-[hsl(var(--color-border))]" colSpan="4" />
              <th className="px-4 py-3 text-center text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase tracking-wider border-r border-[hsl(var(--color-border))]" colSpan="2">
                Shift Assignment
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase tracking-wider border-r border-[hsl(var(--color-border))]" colSpan="4">
                Clocked Record
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase tracking-wider" />
            </tr>
            <tr className="bg-[hsl(var(--color-surface-elevated))]">
              {liveAttendanceColumns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase tracking-wider whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--color-border))]">
            {loading ? (
              <tr>
                <td colSpan={liveAttendanceColumns.length} className="px-4 py-12 text-center text-sm text-[hsl(var(--color-foreground-muted))]">
                  <div className="flex items-center justify-center gap-2">
                    <RotateCw className="w-4 h-4 animate-spin" />
                    Loading attendance data…
                  </div>
                </td>
              </tr>
            ) : pagedRecords.length === 0 ? (
              <tr>
                <td colSpan={liveAttendanceColumns.length} className="px-4 py-12 text-center text-sm text-[hsl(var(--color-foreground-muted))]">
                  No shifts scheduled for today
                </td>
              </tr>
            ) : (
              pagedRecords.map((record) => (
                <tr key={record.id} className="hover:bg-[hsl(var(--color-surface-elevated))] transition-colors">
                  <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground-secondary))] whitespace-nowrap">
                    {formatDate(record.date)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-[hsl(var(--color-foreground))] whitespace-nowrap">
                    {record.employee}
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground-secondary))] whitespace-nowrap">
                    {record.mobile}
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground-secondary))] whitespace-nowrap">
                    {record.site}
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground-secondary))] whitespace-nowrap">
                    {record.shiftTime}
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground-secondary))] whitespace-nowrap">
                    {record.shiftHrs ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground-secondary))] whitespace-nowrap">
                    {formatTime(record.clockIn)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground-secondary))] whitespace-nowrap">
                    {formatTime(record.clockOut)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground-secondary))] whitespace-nowrap">
                    {record.breakMins ? `${record.breakMins}m` : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground-secondary))] whitespace-nowrap">
                    {record.totalHrs ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(record.status)}`}>
                      {formatStatus(record.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t border-[hsl(var(--color-border))] px-4 py-3 flex items-center justify-between">
        <div className="text-sm text-[hsl(var(--color-foreground-secondary))] italic">
          {totalShifts === 0
            ? "Showing 0 to 0 of 0 entries"
            : `Showing ${startIdx + 1} to ${Math.min(startIdx + itemsPerPage, totalShifts)} of ${totalShifts} entries`}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );

  // ── Chart View ─────────────────────────────────────────────────────────────
  const renderChartView = () => (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Bar Chart */}
      <div className="flex-1 bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-[hsl(var(--color-foreground))]">Today's Attendance</span>
          <button
            onClick={fetchAttendance}
            className="p-1.5 hover:bg-[hsl(var(--color-surface-elevated))] rounded transition-colors"
          >
            <RotateCw className={`w-4 h-4 text-[hsl(var(--color-foreground-secondary))] ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-sm text-[hsl(var(--color-foreground-secondary))]">
            <RotateCw className="w-4 h-4 animate-spin mr-2" /> Loading…
          </div>
        ) : (
          <>
            {/* Bar Chart */}
            <div className="h-48 flex items-end justify-around gap-2 mb-4">
              {attendanceData.map((item) => (
                <div key={item.label} className="flex flex-col items-center flex-1">
                  <div className="w-full bg-[hsl(var(--color-surface-elevated))] rounded-t relative" style={{ height: "160px" }}>
                    <div
                      className={`${item.color} rounded-t absolute bottom-0 w-full transition-all duration-500`}
                      style={{ height: `${(item.value / maxVal) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-[hsl(var(--color-foreground-secondary))] mt-2 text-center w-full px-1 truncate" title={item.label}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Circles */}
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4 mt-4">
              {attendanceData.map((item) => (
                <div key={item.label} className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full border-4 border-[hsl(var(--color-border))] flex items-center justify-center">
                    <span className="text-base font-bold text-[hsl(var(--color-foreground))]">{item.value}</span>
                  </div>
                  <div className="text-xs text-[hsl(var(--color-foreground-secondary))] mt-1.5 text-center px-1 truncate" title={item.label}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Stats Sidebar */}
      <div className="xl:w-72 bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-[hsl(var(--color-foreground))]">Summary</span>
          <Select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="w-28 text-sm"
          >
            <option value="bar">Bar Chart</option>
            <option value="pie">Pie Chart</option>
            <option value="line">Line Chart</option>
          </Select>
        </div>

        <div className="space-y-1">
          {summaryStats.map((stat, index) => (
            <div
              key={stat.label}
              className={`flex items-center justify-between py-2 px-3 rounded ${
                index >= summaryStats.length - 2
                  ? "bg-[hsl(var(--color-surface-elevated))] font-semibold"
                  : "hover:bg-[hsl(var(--color-surface-elevated))]"
              }`}
            >
              <span className="text-sm text-[hsl(var(--color-foreground-secondary))]">{stat.label}</span>
              <span className="text-sm font-medium text-[hsl(var(--color-foreground))]">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <button
          onClick={() => setViewMode("shift")}
          className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${
            viewMode === "shift"
              ? "bg-blue-500 text-white shadow-md hover:bg-blue-600"
              : "bg-[hsl(var(--color-card))] text-[hsl(var(--color-foreground-secondary))] border border-[hsl(var(--color-border))] hover:bg-[hsl(var(--color-surface-elevated))] shadow-sm"
          }`}
        >
          Attendance By Shift
        </button>
        <button
          onClick={() => setViewMode("live")}
          className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${
            viewMode === "live"
              ? "bg-blue-500 text-white shadow-md hover:bg-blue-600"
              : "bg-[hsl(var(--color-card))] text-[hsl(var(--color-foreground-secondary))] border border-[hsl(var(--color-border))] hover:bg-[hsl(var(--color-surface-elevated))] shadow-sm"
          }`}
        >
          Live Attendance
        </button>
      </div>

      {viewMode === "live" ? renderLiveAttendance() : renderChartView()}
    </div>
  );
}
