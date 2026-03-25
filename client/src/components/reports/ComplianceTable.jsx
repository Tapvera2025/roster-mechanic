import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import SortableHeader from "../ui/SortableHeader";
import { useTableSort } from "../../hooks/useTableSort";
import complianceData from "../../data/complianceData";

export default function ComplianceTable({ filters }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedRows, setSelectedRows] = useState([]);

  // Filter data based on filters
  const filteredData = useMemo(() => {
    let data = [...complianceData];

    // Filter by status
    if (filters.status !== "all") {
      data = data.filter((item) => item.status === filters.status);
    }

    // Filter by license type
    if (filters.licenseType !== "all") {
      data = data.filter((item) => item.licenseCert === filters.licenseType);
    }

    // Filter by state
    if (filters.state !== "all") {
      data = data.filter((item) => item.state === filters.state);
    }

    // Filter by dept/work group
    if (filters.deptWorkGroup !== "all") {
      data = data.filter((item) => item.deptWorkGroup === filters.deptWorkGroup);
    }

    // Filter by expires within
    if (filters.expiresWithin !== "all") {
      const daysMap = {
        "7 days": 7,
        "30 days": 30,
        "60 days": 60,
        "90 days": 90,
        "6 months": 180,
        "1 year": 365,
      };
      const days = daysMap[filters.expiresWithin];
      if (days) {
        data = data.filter((item) => item.daysToExpire <= days);
      }
    }

    // Filter by selected employees
    if (filters.selectedEmployees.length > 0) {
      data = data.filter((item) =>
        filters.selectedEmployees.includes(item.empNo)
      );
    }

    return data;
  }, [filters]);

  // Table sorting
  const { sortedData, requestSort, getSortIndicator } = useTableSort(filteredData, {
    defaultColumn: 'empNo',
    defaultDirection: 'asc',
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = sortedData.slice(startIndex, endIndex);

  const handleSelectAll = () => {
    if (selectedRows.length === currentData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(currentData.map((item) => item.id));
    }
  };

  const handleRowSelect = (id) => {
    setSelectedRows(
      selectedRows.includes(id)
        ? selectedRows.filter((rowId) => rowId !== id)
        : [...selectedRows, id]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Current":
        return "text-green-400 bg-green-900/30";
      case "Expired":
        return "text-red-400 bg-red-900/30";
      case "Expiring Soon":
        return "text-orange-400 bg-orange-900/30";
      default:
        return "text-[hsl(var(--color-foreground-muted))] bg-[hsl(var(--color-surface-elevated))]";
    }
  };

  const getDaysColor = (days) => {
    if (days < 0) return "text-red-400";
    if (days <= 30) return "text-orange-400";
    if (days <= 90) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="bg-[hsl(var(--color-card))] rounded-lg sm:rounded-xl border border-[hsl(var(--color-border))] shadow-md overflow-hidden">
      {/* Summary Bar */}
      <div className="bg-[hsl(var(--color-surface-elevated))] border-b border-[hsl(var(--color-border))] px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[hsl(var(--color-foreground-secondary))]" />
            <span className="text-xs sm:text-sm font-medium text-[hsl(var(--color-foreground))]">
              {filteredData.length} {filteredData.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>
          {selectedRows.length > 0 && (
            <span className="text-xs sm:text-sm text-[hsl(var(--color-primary))]">
              {selectedRows.length} selected
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm min-w-[800px] lg:min-w-[1200px]">
          <thead className="bg-[hsl(var(--color-surface-elevated))] border-b border-[hsl(var(--color-border))]">
            <tr className="text-[hsl(var(--color-foreground-secondary))] text-[10px] sm:text-xs font-semibold uppercase tracking-wider">
              <th className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-4 text-center w-8 sm:w-10 lg:w-12">
                <input
                  type="checkbox"
                  checked={
                    selectedRows.length === currentData.length &&
                    currentData.length > 0
                  }
                  onChange={handleSelectAll}
                  className="rounded border-[hsl(var(--color-border))] text-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))] focus:ring-offset-0 bg-[hsl(var(--color-surface-elevated))] w-3.5 h-3.5 sm:w-4 sm:h-4"
                />
              </th>
              <th className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-4 text-left whitespace-nowrap">
                <SortableHeader
                  label="Emp No."
                  sortKey="empNo"
                  onSort={requestSort}
                  sortDirection={getSortIndicator('empNo')}
                  className="text-[10px] sm:text-xs uppercase"
                />
              </th>
              <th className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-4 text-left whitespace-nowrap">
                <SortableHeader
                  label="Employee Name"
                  sortKey="employeeName"
                  onSort={requestSort}
                  sortDirection={getSortIndicator('employeeName')}
                  className="text-[10px] sm:text-xs uppercase"
                />
              </th>
              <th className="hidden md:table-cell px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-4 text-left whitespace-nowrap">
                <SortableHeader
                  label="Mobile"
                  sortKey="mobile"
                  onSort={requestSort}
                  sortDirection={getSortIndicator('mobile')}
                  className="text-[10px] sm:text-xs uppercase"
                />
              </th>
              <th className="hidden lg:table-cell px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-4 text-left whitespace-nowrap">
                <SortableHeader
                  label="State"
                  sortKey="state"
                  onSort={requestSort}
                  sortDirection={getSortIndicator('state')}
                  className="text-[10px] sm:text-xs uppercase"
                />
              </th>
              <th className="hidden xl:table-cell px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-4 text-left whitespace-nowrap">
                <SortableHeader
                  label="Dept/Work Group"
                  sortKey="deptWorkGroup"
                  onSort={requestSort}
                  sortDirection={getSortIndicator('deptWorkGroup')}
                  className="text-[10px] sm:text-xs uppercase"
                />
              </th>
              <th className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-4 text-left whitespace-nowrap">
                <SortableHeader
                  label="License/Cert."
                  sortKey="licenseCert"
                  onSort={requestSort}
                  sortDirection={getSortIndicator('licenseCert')}
                  className="text-[10px] sm:text-xs uppercase"
                />
              </th>
              <th className="hidden sm:table-cell px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-4 text-left whitespace-nowrap">
                <SortableHeader
                  label="Cert. No."
                  sortKey="certNo"
                  onSort={requestSort}
                  sortDirection={getSortIndicator('certNo')}
                  className="text-[10px] sm:text-xs uppercase"
                />
              </th>
              <th className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-4 text-left whitespace-nowrap">
                <SortableHeader
                  label="Expiry Date"
                  sortKey="expiryDate"
                  onSort={requestSort}
                  sortDirection={getSortIndicator('expiryDate')}
                  className="text-[10px] sm:text-xs uppercase"
                />
              </th>
              <th className="hidden md:table-cell px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-4 text-left whitespace-nowrap">
                <SortableHeader
                  label="Days Left"
                  sortKey="daysToExpire"
                  onSort={requestSort}
                  sortDirection={getSortIndicator('daysToExpire')}
                  className="text-[10px] sm:text-xs uppercase"
                />
              </th>
              <th className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-4 text-left whitespace-nowrap">
                <SortableHeader
                  label="Status"
                  sortKey="status"
                  onSort={requestSort}
                  sortDirection={getSortIndicator('status')}
                  className="text-[10px] sm:text-xs uppercase"
                />
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[hsl(var(--color-border))]">
            {currentData.length === 0 ? (
              <tr>
                <td colSpan="11" className="px-3 sm:px-4 py-8 sm:py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-[hsl(var(--color-foreground-muted))] opacity-50" />
                    <p className="text-xs sm:text-sm text-[hsl(var(--color-foreground-secondary))]">
                      No records found matching your filters
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              currentData.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-[hsl(var(--color-surface-elevated))] transition-colors"
                >
                  <td className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(item.id)}
                      onChange={() => handleRowSelect(item.id)}
                      className="rounded border-[hsl(var(--color-border))] text-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))] focus:ring-offset-0 bg-[hsl(var(--color-surface-elevated))] w-3.5 h-3.5 sm:w-4 sm:h-4"
                    />
                  </td>
                  <td className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-3.5 text-[hsl(var(--color-foreground))] font-mono text-[10px] sm:text-xs whitespace-nowrap">
                    {item.empNo}
                  </td>
                  <td className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-3.5 text-[hsl(var(--color-foreground))] font-medium whitespace-nowrap">
                    {item.employeeName}
                  </td>
                  <td className="hidden md:table-cell px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-3.5 text-[hsl(var(--color-foreground-secondary))] whitespace-nowrap">
                    {item.mobile}
                  </td>
                  <td className="hidden lg:table-cell px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-3.5 text-[hsl(var(--color-foreground-secondary))] whitespace-nowrap">
                    {item.state || "-"}
                  </td>
                  <td className="hidden xl:table-cell px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-3.5 text-[hsl(var(--color-foreground-secondary))] whitespace-nowrap">
                    {item.deptWorkGroup || "-"}
                  </td>
                  <td className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-3.5 text-[hsl(var(--color-foreground))]">
                    <div className="max-w-[120px] sm:max-w-[150px] truncate">
                      {item.licenseCert}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-3.5 text-[hsl(var(--color-foreground-secondary))] font-mono text-[10px] sm:text-xs">
                    <div className="max-w-[100px] sm:max-w-[120px] truncate">
                      {item.licenseCertNo || "-"}
                    </div>
                  </td>
                  <td className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-3.5 text-[hsl(var(--color-foreground))] whitespace-nowrap">
                    {item.expiryDate}
                  </td>
                  <td
                    className={`hidden md:table-cell px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-3.5 font-semibold whitespace-nowrap ${getDaysColor(
                      item.daysToExpire
                    )}`}
                  >
                    {item.daysToExpire}
                  </td>
                  <td className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-3.5">
                    <span
                      className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="border-t border-[hsl(var(--color-border))] px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 bg-[hsl(var(--color-surface-elevated))]">
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
          <span className="text-[hsl(var(--color-foreground-secondary))] whitespace-nowrap">
            Rows:
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 sm:px-3 py-1 sm:py-1.5 border border-[hsl(var(--color-border))] rounded-lg text-xs sm:text-sm bg-[hsl(var(--color-surface))] text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:border-transparent"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span className="text-[hsl(var(--color-foreground-secondary))] whitespace-nowrap">
            {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of{" "}
            {filteredData.length}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2 sm:px-3 py-1 sm:py-1.5 border border-[hsl(var(--color-border))] rounded-lg text-xs sm:text-sm hover:bg-[hsl(var(--color-surface))] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-1.5 transition-colors text-[hsl(var(--color-foreground))]"
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="flex items-center gap-1">
            {[...Array(Math.min(5, totalPages))].map((_, idx) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = idx + 1;
              } else if (currentPage <= 3) {
                pageNum = idx + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + idx;
              } else {
                pageNum = currentPage - 2 + idx;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 border rounded-lg text-xs sm:text-sm transition-all ${
                    currentPage === pageNum
                      ? "bg-[hsl(var(--color-primary))] text-white border-[hsl(var(--color-primary))]"
                      : "border-[hsl(var(--color-border))] hover:bg-[hsl(var(--color-surface))] text-[hsl(var(--color-foreground))]"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-2 sm:px-3 py-1 sm:py-1.5 border border-[hsl(var(--color-border))] rounded-lg text-xs sm:text-sm hover:bg-[hsl(var(--color-surface))] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-1.5 transition-colors text-[hsl(var(--color-foreground))]"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
