import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Link2,
  ChevronDown,
  Settings,
  Maximize,
  RotateCw,
  Mail,
  Trash2,
  Edit,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import toast from "react-hot-toast";
import { employeeApi } from "../lib/api";
import AddEmployeeModal from "../components/employees/AddEmployeeModal";

export default function Employees() {
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeApi.getAll({
        search,
        isActive: showInactive ? undefined : true,
        page: pagination.page,
        limit: pagination.limit,
      });
      setEmployees(response.data.data.employees);
      setPagination((prev) => ({
        ...prev,
        ...response.data.data.pagination,
      }));
    } catch (err) {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, showInactive, pagination.page]);

  const handleAddNew = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDelete = async (employeeId) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;

    try {
      await employeeApi.delete(employeeId);
      toast.success("Employee deleted successfully");
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete employee");
    }
  };

  const handleSaveEmployee = async (employeeData) => {
    try {
      if (editingEmployee) {
        await employeeApi.update(editingEmployee.id, employeeData);
        toast.success("Employee updated successfully");
      } else {
        await employeeApi.create(employeeData);
        toast.success("Employee created successfully");
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save employee");
    }
  };

  const toggleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map((e) => e.id));
    }
  };

  const toggleSelectEmployee = (employeeId) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId],
    );
  };

  return (
    <div className="min-h-screen bg-[hsl(220,15%,12%)]">
      {/* Employees Header */}
      <div className="bg-[hsl(220,15%,14%)] border-b border-[hsl(220,15%,20%)] text-white px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            <h1 className="text-base sm:text-lg font-semibold text-gray-100">
              Employees
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-2 hover:bg-[hsl(220,15%,18%)] rounded-lg transition-colors text-gray-300 hover:text-gray-100"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              className="p-2 hover:bg-[hsl(220,15%,18%)] rounded-lg transition-colors text-gray-300 hover:text-gray-100"
              title="Expand"
            >
              <Maximize className="w-5 h-5" />
            </button>
            <button
              onClick={fetchEmployees}
              className="p-2 hover:bg-[hsl(220,15%,18%)] rounded-lg transition-colors text-gray-300 hover:text-gray-100"
              title="Refresh"
            >
              <RotateCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6">
        {/* Filters and Actions */}
        <div className="bg-[hsl(220,15%,14%)] rounded-xl shadow-lg border border-[hsl(220,15%,20%)] mb-4">
          <div className="p-4 flex flex-wrap items-center justify-between gap-4">
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value="name"
                className="w-32 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100"
              >
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </Select>

              <Input
                type="text"
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
              />

              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-gray-300">
                  Display Inactive Employees
                </span>
                <div
                  onClick={() => setShowInactive(!showInactive)}
                  className={`relative inline-block w-12 h-6 rounded-full transition-colors ${
                    showInactive ? "bg-orange-600" : "bg-[hsl(220,15%,22%)]"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                      showInactive ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </div>
                <span className="text-sm font-medium text-gray-300">
                  {showInactive ? "ON" : "OFF"}
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                onClick={handleAddNew}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white border-orange-600"
              >
                <Plus className="w-4 h-4" />
                Add New
              </Button>

              <Button
                variant="outline"
                className="flex items-center gap-2 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-300 hover:bg-[hsl(220,15%,18%)]"
              >
                <Link2 className="w-4 h-4" />
                Get App Link
              </Button>

              <Button
                variant="outline"
                className="flex items-center gap-2 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-300 hover:bg-[hsl(220,15%,18%)]"
              >
                Actions
                <ChevronDown className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                className="flex items-center gap-2 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-300 hover:bg-[hsl(220,15%,18%)]"
              >
                Columns
                <ChevronDown className="w-4 h-4" />
              </Button>

              <Select
                value={pagination.limit}
                className="w-20 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Employee Table */}
        <div className="bg-[hsl(220,15%,14%)] rounded-xl shadow-lg border border-[hsl(220,15%,20%)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[hsl(220,15%,16%)] border-b border-[hsl(220,15%,22%)]">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedEmployees.length === employees.length &&
                        employees.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-[hsl(220,15%,22%)] bg-[hsl(220,15%,18%)] text-orange-600 focus:ring-orange-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Photo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Emp No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    First Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Last Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Mobile
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(220,15%,22%)]">
                {loading ? (
                  <tr>
                    <td
                      colSpan="11"
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td
                      colSpan="11"
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      No employees found
                    </td>
                  </tr>
                ) : (
                  employees.map((employee, index) => (
                    <tr
                      key={employee.id}
                      className="hover:bg-[hsl(220,15%,16%)] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(employee.id)}
                          onChange={() => toggleSelectEmployee(employee.id)}
                          className="w-4 h-4 rounded border-[hsl(220,15%,22%)] bg-[hsl(220,15%,18%)] text-orange-600 focus:ring-orange-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-10 h-10 rounded-full bg-[hsl(220,15%,20%)] border border-[hsl(220,15%,22%)] flex items-center justify-center">
                          <Users className="w-6 h-6 text-gray-500" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-orange-500 font-medium">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-orange-500 hover:underline cursor-pointer font-medium">
                        {employee.firstName}
                      </td>
                      <td className="px-4 py-3 text-sm text-orange-500 hover:underline cursor-pointer font-medium">
                        {employee.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {employee.phone || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            employee.isActive
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                          }`}
                        >
                          {employee.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {employee.position}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {employee.department || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-orange-500 hover:text-orange-400 transition-colors">
                          <Mail className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(employee)}
                            className="text-orange-500 hover:text-orange-400 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(employee.id)}
                            className="text-red-500 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button className="text-gray-400 hover:text-gray-300 transition-colors">
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-[hsl(220,15%,22%)] flex items-center justify-between bg-[hsl(220,15%,16%)]">
              <div className="text-sm text-gray-400">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} employees
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-300 hover:bg-[hsl(220,15%,22%)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-300">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-300 hover:bg-[hsl(220,15%,22%)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
      <AddEmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEmployee}
        employee={editingEmployee}
      />
    </div>
  );
}
