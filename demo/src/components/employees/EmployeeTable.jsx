// components/employees/EmployeeTable.jsx
import { ArrowUpDown } from "lucide-react";
import { useMemo } from "react";
import employees from "../../data/employees";
import EmployeeRow from "./EmployeeRow";

export default function EmployeeTable({ showInactive }) {
  // Filter employees based on inactive toggle
  const filteredEmployees = useMemo(() => {
    if (showInactive) {
      return employees; // Show all employees
    }
    return employees.filter((emp) => emp.status !== "Inactive"); // Show only active employees
  }, [showInactive]);

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm">
      {/* Scrollable table container */}
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full text-sm min-w-[1200px]">
          <thead className="bg-white border-b border-white">
            <tr className="text-gray-600 text-xs">
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-center w-10 sm:w-12 sticky left-0 bg-white z-[5]">
                <input type="checkbox" className="rounded border-white" />
              </th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left w-14 sm:w-16">
                Photo
              </th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left">
                <div className="flex items-center gap-1 whitespace-nowrap">
                  Emp No.
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left whitespace-nowrap">
                First Name
              </th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left whitespace-nowrap">
                Middle Name
              </th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left whitespace-nowrap">
                Last Name
              </th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left">Mobile</th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left">Status</th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-center whitespace-nowrap">
                Roster Access
              </th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-center whitespace-nowrap">
                Mobile Attendance
              </th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left">Team</th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left whitespace-nowrap">
                Employment Type
              </th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left">State</th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left whitespace-nowrap">
                Customer Ref-No
              </th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-center w-10 sm:w-12"></th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-right w-20 sm:w-24 sticky right-0 bg-gray-50 z-[5]">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {filteredEmployees.map((emp) => (
              <EmployeeRow key={emp.id} emp={emp} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Scroll indicator for mobile */}
      <div className="md:hidden px-3 py-2 bg-gray-50 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          Scroll horizontally to view all columns
        </p>
      </div>
    </div>
  );
}
