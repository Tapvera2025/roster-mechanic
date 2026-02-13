import { useState, useEffect, useCallback } from "react";
import { Plane, RotateCw, Maximize2, ChevronLeft, ChevronRight, XCircle, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { leaveApi } from "../../lib/api";
import { useNavigate } from "react-router-dom";

const TYPE_LABELS = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  personal: "Personal Leave",
  unpaid: "Unpaid Leave",
};

const STATUS_STYLES = {
  pending:   "bg-yellow-100 text-yellow-800",
  approved:  "bg-green-100 text-green-800",
  declined:  "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const PAGE_SIZE = 5;

export default function LeaveRequestsWidget() {
  const navigate = useNavigate();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, declined: 0 });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [leavesRes, statsRes] = await Promise.all([
        leaveApi.getAll({ page: currentPage, limit: PAGE_SIZE }),
        leaveApi.getStats(),
      ]);
      setLeaveRequests(leavesRes.data.data.leaves || []);
      setTotalPages(leavesRes.data.data.pagination?.pages || 1);
      const s = statsRes.data.data || {};
      setStats({ pending: s.pending || 0, approved: s.approved || 0, declined: s.declined || 0 });
    } catch {
      // silently fail — widget shouldn't crash the dashboard
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statCards = [
    { label: "Awaiting",  value: stats.pending,  icon: AlertCircle,  color: "text-yellow-600" },
    { label: "Approved",  value: stats.approved, icon: CheckCircle,  color: "text-green-600" },
    { label: "Declined",  value: stats.declined, icon: XCircle,      color: "text-red-600" },
  ];

  const columns = ["Requested By", "Type", "Date Submitted", "Period", "Status", "Actioned By"];

  return (
    <div className="bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-3xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-[hsl(var(--color-card))] border-b border-[hsl(var(--color-border))] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-[hsl(var(--color-foreground))]">Leave Requests</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-1.5 hover:bg-[hsl(var(--color-surface-elevated))] rounded transition-colors"
            title="Refresh"
          >
            <RotateCw className={`w-4 h-4 text-[hsl(var(--color-foreground-secondary))] ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => navigate("/employees/leave")}
            className="p-1.5 hover:bg-[hsl(var(--color-surface-elevated))] rounded transition-colors"
            title="Open Leave Management"
          >
            <Maximize2 className="w-4 h-4 text-[hsl(var(--color-foreground-secondary))]" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 border-b border-[hsl(var(--color-border))]">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-[hsl(var(--color-border))] flex items-center justify-center">
                    <span className="text-lg font-bold text-[hsl(var(--color-foreground))]">
                      {loading ? "—" : stat.value}
                    </span>
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
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase tracking-wider whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-[hsl(var(--color-foreground-secondary))]">
                  Loading...
                </td>
              </tr>
            ) : leaveRequests.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-[hsl(var(--color-foreground-muted))]">
                  No leave requests found
                </td>
              </tr>
            ) : (
              leaveRequests.map((req) => {
                const emp = req.employeeId;
                const employeeName = emp ? `${emp.firstName} ${emp.lastName}` : "—";
                const actionedBy = req.actionedBy?.name || "—";
                const period = `${fmt(req.startDate)} → ${fmt(req.endDate)}`;
                return (
                  <tr key={req._id} className="border-t border-[hsl(var(--color-border))] hover:bg-[hsl(var(--color-surface-elevated))]">
                    <td className="px-4 py-3 text-sm font-medium text-[hsl(var(--color-foreground))] whitespace-nowrap">
                      {employeeName}
                    </td>
                    <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground))] whitespace-nowrap">
                      {TYPE_LABELS[req.leaveType] || req.leaveType}
                    </td>
                    <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground))] whitespace-nowrap">
                      {fmt(req.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground))] whitespace-nowrap">
                      {period}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[req.status] || "bg-gray-100 text-gray-600"}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground))] whitespace-nowrap">
                      {actionedBy}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="border-t border-[hsl(var(--color-border))] px-4 py-3 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1 || loading}
          onClick={() => setCurrentPage((p) => p - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages || loading}
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
