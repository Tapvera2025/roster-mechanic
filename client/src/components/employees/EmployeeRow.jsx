// components/employees/EmployeeRow.jsx
import { Check, Mail, User } from "lucide-react";
import Badge from "../ui/Badge";
import EmployeeActionsMenu from "./EmployeeActionsMenu";

export default function EmployeeRow({ emp }) {
  return (
    <tr className="hover:bg-[hsl(var(--color-surface-elevated))] transition-colors">
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center sticky left-0 bg-[hsl(var(--color-card))] hover:bg-[hsl(var(--color-surface-elevated))] z-[5]">
        <input
          type="checkbox"
          className="rounded border-[hsl(var(--color-border))]"
        />
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[hsl(var(--color-border))] flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 sm:w-6 sm:h-6 text-[hsl(var(--color-foreground-secondary))]" />
        </div>
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-[hsl(var(--color-primary))] font-medium whitespace-nowrap">
        {emp.empNo}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-[hsl(var(--color-primary))] hover:underline cursor-pointer whitespace-nowrap">
        {emp.firstName}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-[hsl(var(--color-foreground))] whitespace-nowrap hidden lg:table-cell">
        {emp.middleName}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-[hsl(var(--color-primary))] hover:underline cursor-pointer whitespace-nowrap">
        {emp.lastName}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-[hsl(var(--color-foreground))] whitespace-nowrap hidden lg:table-cell">
        {emp.mobile}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3">
        <Badge status={emp.status} />
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center hidden xl:table-cell">
        {emp.rosterAccess && (
          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[hsl(var(--color-primary))] mx-auto" />
        )}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center hidden xl:table-cell">
        {emp.mobileAttendanceAccess && (
          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[hsl(var(--color-primary))] mx-auto" />
        )}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-[hsl(var(--color-foreground))] whitespace-nowrap hidden md:table-cell">
        {emp.team}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-[hsl(var(--color-foreground))] whitespace-nowrap hidden xl:table-cell">
        {emp.employmentType}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-[hsl(var(--color-foreground))] whitespace-nowrap hidden xl:table-cell">
        {emp.state}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-[hsl(var(--color-foreground))] whitespace-nowrap hidden xl:table-cell">
        {emp.customerRefNo}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center hidden lg:table-cell">
        <button className="touch-target text-[hsl(var(--color-foreground-secondary))] hover:text-[hsl(var(--color-primary))] transition-colors">
          <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-right sticky right-0 bg-[hsl(var(--color-card))] hover:bg-[hsl(var(--color-surface-elevated))] z-[5] relative">
        <EmployeeActionsMenu />
      </td>
    </tr>
  );
}
