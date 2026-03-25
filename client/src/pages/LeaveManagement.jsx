import { useState, useEffect, useCallback } from "react";
import { Search, Plus, RotateCcw, SlidersHorizontal } from "lucide-react";
import LeaveFilters from "../components/leave/LeaveFilters";
import LeaveStats from "../components/leave/LeaveStats";
import LeaveTable from "../components/leave/LeaveTable";
import AddLeaveModal from "../components/leave/AddLeaveModal";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { leaveApi } from "../lib/api";
import toast from "react-hot-toast";

export default function LeaveManagement() {
  const [filters, setFilters] = useState({
    leavePeriod: "all",
    leaveCategory: "all",
    employee: "all",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, declined: 0, cancelled: 0 });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (filters.leaveCategory !== "all") params.leaveType = filters.leaveCategory;
      if (filters.employee !== "all") params.status = filters.employee;

      const [leavesRes, statsRes] = await Promise.all([
        leaveApi.getAll(params),
        leaveApi.getStats(),
      ]);

      setLeaves(leavesRes.data.data.leaves || []);
      setPagination(leavesRes.data.data.pagination || { total: 0, pages: 1 });
      setStats(statsRes.data.data || { total: 0, pending: 0, approved: 0, declined: 0, cancelled: 0 });
    } catch (err) {
      toast.error("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const displayed = searchQuery
    ? leaves.filter((l) => {
        const emp = l.employeeId;
        const name = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : "";
        return name.includes(searchQuery.toLowerCase());
      })
    : leaves;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-[hsl(var(--color-primary))] text-white px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
        <h1 className="text-base sm:text-lg font-semibold">Leave Management</h1>
        <div className="flex items-center gap-2">
          {/* Filter toggle — all screen sizes */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="p-2 hover:bg-[hsl(var(--color-primary-dark))] rounded-lg transition-colors"
            title={showFilters ? "Hide filters" : "Show filters"}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
          <button
            onClick={fetchData}
            className="p-2 hover:bg-[hsl(var(--color-primary-dark))] rounded-lg transition-colors"
            title="Refresh"
          >
            <RotateCcw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 bg-[hsl(var(--color-background))]">

        {/* ── Mobile filter drawer overlay (< lg) ── */}
        {showFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowFilters(false)}
            />
            <div className="absolute left-0 top-0 h-full w-72 bg-[hsl(var(--color-card))] shadow-xl overflow-y-auto">
              <LeaveFilters
                filters={filters}
                setFilters={setFilters}
                onClose={() => setShowFilters(false)}
              />
            </div>
          </div>
        )}

        {/* ── Desktop sidebar (lg+) — shown/hidden via showFilters ── */}
        {showFilters && (
          <div className="hidden lg:block w-64 bg-[hsl(var(--color-card))] border-r border-[hsl(var(--color-border))] overflow-y-auto flex-shrink-0">
            <LeaveFilters
              filters={filters}
              setFilters={setFilters}
              onClose={() => setShowFilters(false)}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Stats + Search/Actions bar */}
          <div className="p-4 bg-[hsl(var(--color-card))] border-b border-[hsl(var(--color-border))] flex-shrink-0">
            <LeaveStats stats={stats} />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4">
              {/* Search */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--color-foreground-secondary))]" />
                <Input
                  type="text"
                  placeholder="Search by employee name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-dark))] text-white flex items-center gap-2 flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add New Leave</span>
                  <span className="sm:hidden">Add</span>
                </Button>
                <Select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="w-20 flex-shrink-0"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-sm text-[hsl(var(--color-foreground-secondary))]">
                Loading leave requests...
              </div>
            ) : (
              <LeaveTable leaveRequests={displayed} onRefresh={fetchData} />
            )}

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-2 text-sm text-[hsl(var(--color-foreground-secondary))]">
              <span>
                {pagination.total > 0
                  ? `Showing ${Math.min((currentPage - 1) * itemsPerPage + 1, pagination.total)}–${Math.min(currentPage * itemsPerPage, pagination.total)} of ${pagination.total}`
                  : "No records"}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={currentPage >= pagination.pages} onClick={() => setCurrentPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddLeaveModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
