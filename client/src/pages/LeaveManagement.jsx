import { useState } from "react";
import { Search, Plus, RotateCcw, Settings2 } from "lucide-react";
import LeaveFilters from "../components/leave/LeaveFilters";
import LeaveStats from "../components/leave/LeaveStats";
import LeaveTable from "../components/leave/LeaveTable";
import AddLeaveModal from "../components/leave/AddLeaveModal";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";

export default function LeaveManagement() {
  const [filters, setFilters] = useState({
    leavePeriod: "current_prev_month",
    leaveCategory: "all",
    employee: "all",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Sample stats data
  const stats = {
    total: 0,
    awaiting: 0,
    approved: 0,
    declined: 0,
    cancelled: 0,
  };

  // Sample leave requests data (empty for now)
  const leaveRequests = [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-[hsl(var(--color-primary))] text-white px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-semibold">Leave Management</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-[hsl(var(--color-primary-dark))] rounded-lg transition-colors" title="Refresh">
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)] bg-[hsl(var(--color-background))]">
        {/* Left Sidebar - Filters */}
        <div className="w-64 bg-[hsl(var(--color-card))] border-r border-[hsl(var(--color-border))] overflow-y-auto flex-shrink-0">
          <LeaveFilters filters={filters} setFilters={setFilters} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Stats Section */}
          <div className="p-4 bg-[hsl(var(--color-card))] border-b border-[hsl(var(--color-border))]">
            <LeaveStats stats={stats} />

            {/* Search and Actions Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
              {/* Search */}
              <div className="relative flex-1 w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[hsl(var(--color-foreground-secondary))]" />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-dark))] text-white flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New Leave
                </Button>

                <button className="p-2 hover:bg-[hsl(var(--color-surface-elevated))] rounded transition-colors flex items-center gap-1 text-sm text-[hsl(var(--color-foreground))]">
                  <Settings2 className="w-4 h-4" />
                  Columns
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
          </div>

          {/* Table Section */}
          <div className="flex-1 overflow-auto p-4">
            <LeaveTable leaveRequests={leaveRequests} />

            {/* Pagination */}
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={true}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={true}
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        {/* Add Leave Modal */}
        <AddLeaveModal open={showAddModal} onClose={() => setShowAddModal(false)} />
      </div>
    </div>
  );
}
