import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
      data = data.filter(
        (item) => item.deptWorkGroup === filters.deptWorkGroup,
      );
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
        filters.selectedEmployees.includes(item.empNo),
      );
    }

    return data;
  }, [filters]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

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
        : [...selectedRows, id],
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Current":
        return "text-green-400 bg-green-500/20 border border-green-500/30";
      case "Expired":
        return "text-red-400 bg-red-500/20 border border-red-500/30";
      case "Expiring Soon":
        return "text-orange-400 bg-orange-500/20 border border-orange-500/30";
      default:
        return "text-gray-400 bg-gray-500/20 border border-gray-500/30";
    }
  };

  const getDaysColor = (days) => {
    if (days < 0) return "text-red-400";
    if (days <= 30) return "text-orange-400";
    if (days <= 90) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="bg-[hsl(220,15%,14%)] rounded-xl shadow-lg border border-[hsl(220,15%,20%)] overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1400px]">
          <thead className="bg-[hsl(220,15%,16%)] border-b border-[hsl(220,15%,22%)]">
            <tr className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
              <th className="px-3 py-3 text-center w-12">
                <input
                  type="checkbox"
                  checked={
                    selectedRows.length === currentData.length &&
                    currentData.length > 0
                  }
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-[hsl(220,15%,22%)] bg-[hsl(220,15%,18%)] text-orange-600 focus:ring-orange-500"
                />
              </th>
              <th className="px-3 py-3 text-left">Emp No.</th>
              <th className="px-3 py-3 text-left">Employee Name</th>
              <th className="px-3 py-3 text-left">Mobile</th>
              <th className="px-3 py-3 text-left">State</th>
              <th className="px-3 py-3 text-left">Dept/Work Group</th>
              <th className="px-3 py-3 text-left">License/Cert.</th>
              <th className="px-3 py-3 text-left">License/Cert. No.</th>
              <th className="px-3 py-3 text-left">Expiry Date</th>
              <th className="px-3 py-3 text-left">Days to Expire</th>
              <th className="px-3 py-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[hsl(220,15%,22%)]">
            {currentData.length === 0 ? (
              <tr>
                <td
                  colSpan="11"
                  className="px-3 py-8 text-center text-gray-400"
                >
                  No records found matching your filters
                </td>
              </tr>
            ) : (
              currentData.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-[hsl(220,15%,16%)] transition-colors"
                >
                  <td className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(item.id)}
                      onChange={() => handleRowSelect(item.id)}
                      className="w-4 h-4 rounded border-[hsl(220,15%,22%)] bg-[hsl(220,15%,18%)] text-orange-600 focus:ring-orange-500"
                    />
                  </td>
                  <td className="px-3 py-3 text-orange-500 font-medium">
                    {item.empNo}
                  </td>
                  <td className="px-3 py-3 text-gray-100 font-medium">
                    {item.employeeName}
                  </td>
                  <td className="px-3 py-3 text-gray-300">{item.mobile}</td>
                  <td className="px-3 py-3 text-gray-300">
                    {item.state || "-"}
                  </td>
                  <td className="px-3 py-3 text-gray-300">
                    {item.deptWorkGroup || "-"}
                  </td>
                  <td className="px-3 py-3 text-gray-100">
                    {item.licenseCert}
                  </td>
                  <td className="px-3 py-3 text-gray-300">
                    {item.licenseCertNo}
                  </td>
                  <td className="px-3 py-3 text-gray-100">{item.expiryDate}</td>
                  <td
                    className={`px-3 py-3 font-semibold ${getDaysColor(
                      item.daysToExpire,
                    )}`}
                  >
                    {item.daysToExpire}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        item.status,
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
      <div className="border-t border-[hsl(220,15%,22%)] px-4 py-3 flex items-center justify-between bg-[hsl(220,15%,16%)]">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">Rows per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 border border-[hsl(220,15%,22%)] rounded-lg text-sm bg-[hsl(220,15%,18%)] text-gray-100 hover:bg-[hsl(220,15%,20%)] transition-colors"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span className="text-sm text-gray-300 ml-4">
            {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of{" "}
            {filteredData.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-[hsl(220,15%,22%)] rounded-lg text-sm bg-[hsl(220,15%,18%)] text-gray-300 hover:bg-[hsl(220,15%,22%)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
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
                  className={`px-3 py-1 border rounded-lg text-sm transition-colors ${
                    currentPage === pageNum
                      ? "bg-orange-600 text-white border-orange-600"
                      : "border-[hsl(220,15%,22%)] bg-[hsl(220,15%,18%)] text-gray-300 hover:bg-[hsl(220,15%,22%)]"
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
            className="px-3 py-1 border border-[hsl(220,15%,22%)] rounded-lg text-sm bg-[hsl(220,15%,18%)] text-gray-300 hover:bg-[hsl(220,15%,22%)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
