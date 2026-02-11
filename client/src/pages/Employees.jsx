import { useState, useEffect } from "react";
import { Users, Plus, Link2, ChevronDown, Settings, Maximize, RotateCw, Mail, Trash2, Edit } from "lucide-react";
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
    totalPages: 0
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
        limit: pagination.limit
      });
      setEmployees(response.data.data.employees);
      setPagination(prev => ({
        ...prev,
        ...response.data.data.pagination
      }));
    } catch (err) {
      toast.error('Failed to load employees');
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
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      await employeeApi.delete(employeeId);
      toast.success('Employee deleted successfully');
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete employee');
    }
  };

  const handleSaveEmployee = async (employeeData, selectedSiteIds = []) => {
    try {
      let response;
      if (editingEmployee) {
        response = await employeeApi.update(editingEmployee.id, employeeData);
        toast.success('Employee updated successfully');

        // Assign sites if provided
        if (selectedSiteIds.length > 0) {
          await employeeApi.assignToSites(editingEmployee.id, selectedSiteIds);
          toast.success('Sites assigned successfully');
        }
      } else {
        response = await employeeApi.create(employeeData);
        const createdEmployee = response.data.data;
        toast.success('Employee created successfully');

        // Assign sites if provided
        if (selectedSiteIds.length > 0) {
          await employeeApi.assignToSites(createdEmployee.id, selectedSiteIds);
          toast.success('Sites assigned successfully');
        }
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save employee');
      throw err; // Re-throw to let modal know it failed
    }
  };

  const toggleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(e => e.id));
    }
  };

  const toggleSelectEmployee = (employeeId) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  return (
    <div className="min-h-screen">
      {/* Employees Header */}
      <div className="bg-[hsl(var(--color-primary))] text-white px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h1 className="text-base sm:text-lg font-semibold">Employees</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-[hsl(var(--color-primary-dark))] rounded-lg transition-colors" title="Settings">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-[hsl(var(--color-primary-dark))] rounded-lg transition-colors" title="Expand">
              <Maximize className="w-5 h-5" />
            </button>
            <button
              onClick={fetchEmployees}
              className="p-2 hover:bg-[hsl(var(--color-primary-dark))] rounded-lg transition-colors"
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
        <div className="bg-[hsl(var(--color-card))] rounded-lg shadow-sm border border-[hsl(var(--color-border))] mb-4">
          <div className="p-4 flex flex-wrap items-center justify-between gap-4">
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <Select value="name" className="w-32">
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </Select>

              <Input
                type="text"
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
              />

              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-[hsl(var(--color-foreground))]">Display Inactive Employees</span>
                <div
                  onClick={() => setShowInactive(!showInactive)}
                  className={`relative inline-block w-12 h-6 rounded-full transition-colors ${
                    showInactive ? 'bg-[hsl(var(--color-error))]' : 'bg-[hsl(var(--color-border))]'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      showInactive ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className={`text-sm font-medium ${showInactive ? 'text-[hsl(var(--color-error))]' : 'text-[hsl(var(--color-foreground-secondary))]'}`}>{showInactive ? 'ON' : 'OFF'}</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                onClick={handleAddNew}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add New
              </Button>

              <Button variant="outline" className="flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Get App Link
              </Button>

              <Button variant="outline" className="flex items-center gap-2">
                Actions
                <ChevronDown className="w-4 h-4" />
              </Button>

              <Button variant="outline" className="flex items-center gap-2">
                Columns
                <ChevronDown className="w-4 h-4" />
              </Button>

              <Select value={pagination.limit} className="w-20">
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Employee Table */}
        <div className="bg-[hsl(var(--color-card))] rounded-lg shadow-sm border border-[hsl(var(--color-border))] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[hsl(var(--color-surface-elevated))] border-b border-[hsl(var(--color-border))]">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.length === employees.length && employees.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase">Photo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase">Emp No.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase">First Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase">Last Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase">Mobile</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase">Position</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--color-border))]">
                {loading ? (
                  <tr>
                    <td colSpan="11" className="px-4 py-8 text-center text-[hsl(var(--color-foreground-secondary))]">
                      Loading...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="px-4 py-8 text-center text-[hsl(var(--color-foreground-secondary))]">
                      No employees found
                    </td>
                  </tr>
                ) : (
                  employees.map((employee, index) => (
                    <tr key={employee.id} className="hover:bg-[hsl(var(--color-surface-elevated))]">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(employee.id)}
                          onChange={() => toggleSelectEmployee(employee.id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-10 h-10 rounded-full bg-[hsl(var(--color-border))] flex items-center justify-center">
                          <Users className="w-6 h-6 text-[hsl(var(--color-foreground-secondary))]" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[hsl(var(--color-primary))] font-medium">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-[hsl(var(--color-primary))] hover:underline cursor-pointer">
                        {employee.firstName}
                      </td>
                      <td className="px-4 py-3 text-sm text-[hsl(var(--color-primary))] hover:underline cursor-pointer">
                        {employee.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground))]">
                        {employee.phone || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded ${
                          employee.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-[hsl(var(--color-surface-elevated))] text-[hsl(var(--color-foreground-secondary))]'
                        }`}>
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground))]">
                        {employee.position}
                      </td>
                      <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground))]">
                        {employee.department || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary-dark))]">
                          <Mail className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(employee)}
                            className="text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary-dark))]"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(employee.id)}
                            className="text-[hsl(var(--color-error))] hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button className="text-[hsl(var(--color-foreground-secondary))] hover:text-[hsl(var(--color-foreground))]">
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
            <div className="px-4 py-3 border-t border-[hsl(var(--color-border))] flex items-center justify-between bg-[hsl(var(--color-surface-elevated))]">
              <div className="text-sm text-[hsl(var(--color-foreground))]">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} employees
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-[hsl(var(--color-foreground))]">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
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
