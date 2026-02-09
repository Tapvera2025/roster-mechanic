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
    <div className="flex h-[calc(100vh-56px)]">
      {/* Left Sidebar - Filters */}
      <div className="w-64 bg-[hsl(220,15%,12%)] border-r border-[hsl(220,15%,20%)] overflow-y-auto flex-shrink-0">
        <LeaveFilters filters={filters} setFilters={setFilters} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Stats Section */}
        <div className="p-4 bg-[hsl(220,15%,14%)] border-b border-[hsl(220,15%,20%)]">
          <LeaveStats stats={stats} />

          {/* Search and Actions Bar */}
          <div className="flex items-center justify-between gap-4 mt-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add New Leave
              </Button>

              <button className="p-2 hover:bg-[hsl(220,15%,18%)] rounded transition-colors">
                <RotateCcw className="w-4 h-4 text-gray-400" />
              </button>

              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-[hsl(220,15%,18%)] rounded transition-colors flex items-center gap-1 text-sm text-gray-300">
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
  );
}
