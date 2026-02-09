// components/employees/EmployeeRow.jsx
import { Check, Mail, User } from "lucide-react";
import Badge from "../ui/Badge";
import EmployeeActionsMenu from "./EmployeeActionsMenu";

export default function EmployeeRow({ emp }) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center sticky left-0 bg-white hover:bg-gray-50 z-[5]">
        <input type="checkbox" className="rounded border-gray-300" />
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
        </div>
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-blue-600 font-medium whitespace-nowrap">{emp.empNo}</td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-blue-600 hover:underline cursor-pointer whitespace-nowrap">
        {emp.firstName}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-gray-700 whitespace-nowrap">{emp.middleName}</td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-blue-600 hover:underline cursor-pointer whitespace-nowrap">
        {emp.lastName}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-gray-700 whitespace-nowrap">{emp.mobile}</td>
      <td className="px-2 sm:px-3 py-2 sm:py-3">
        <Badge status={emp.status} />
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center">
        {emp.rosterAccess && <Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mx-auto" />}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center">
        {emp.mobileAttendanceAccess && (
          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mx-auto" />
        )}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-gray-700 whitespace-nowrap">{emp.team}</td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-gray-700 whitespace-nowrap">{emp.employmentType}</td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-gray-700 whitespace-nowrap">{emp.state}</td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-gray-700 whitespace-nowrap">{emp.customerRefNo}</td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center">
        <button className="text-gray-400 hover:text-blue-600 transition-colors">
          <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-right sticky right-0 bg-white hover:bg-gray-50 z-[5] relative">
        <EmployeeActionsMenu />
      </td>
    </tr>
  );
}
