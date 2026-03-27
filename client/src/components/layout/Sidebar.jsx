import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Calendar,
  Clock,
  Users,
  Building2,
  FileText,
  BarChart3,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// LocalStorage keys for persisting sidebar section state
const STORAGE_KEYS = {
  employees: 'sidebar_employees_open',
  company: 'sidebar_company_open',
  operations: 'sidebar_operations_open',
  attendance: 'sidebar_attendance_open',
};

export default function Sidebar({ isOpen, onClose }) {
  // Initialize from localStorage or default to false
  const [employeesOpen, setEmployeesOpen] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.employees) === 'true';
  });
  const [companyOpen, setCompanyOpen] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.company) === 'true';
  });
  const [operationsOpen, setOperationsOpen] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.operations) === 'true';
  });
  const [attendanceOpen, setAttendanceOpen] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.attendance) === 'true';
  });

  // Persist state changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.employees, employeesOpen);
  }, [employeesOpen]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.company, companyOpen);
  }, [companyOpen]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.operations, operationsOpen);
  }, [operationsOpen]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.attendance, attendanceOpen);
  }, [attendanceOpen]);

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: Home },
    { to: "/scheduler", label: "Scheduler", icon: Calendar },
    {
      label: "Attendance",
      icon: Clock,
      hasSubmenu: true,
      isOpen: attendanceOpen,
      toggle: () => setAttendanceOpen(!attendanceOpen),
      submenu: [
        { label: "Time Attendance", to: "/attendance/time" },
        { label: "Export Timesheet", to: "/attendance/export" },
      ],
    },
    {
      label: "Employees",
      icon: Users,
      hasSubmenu: true,
      isOpen: employeesOpen,
      toggle: () => setEmployeesOpen(!employeesOpen),
      submenu: [
        { label: "Employees", to: "/employees" },
        { label: "Run Compliance Report", to: "/employees/compliance" },
        { label: "Job Applications", to: "/employees/applications" },
        { label: "Leave Management", to: "/employees/leave" },
      ],
    },
    {
      label: "Company",
      icon: Building2,
      hasSubmenu: true,
      isOpen: companyOpen,
      toggle: () => setCompanyOpen(!companyOpen),
      submenu: [
        { label: "Sites", to: "/company/sites" },
        { label: "Clients", to: "/company/clients" },
      ],
    },
    {
      label: "Operations",
      icon: FileText,
      hasSubmenu: true,
      isOpen: operationsOpen,
      toggle: () => setOperationsOpen(!operationsOpen),
      submenu: [
        { label: "Site Activities", to: "/operations/site-activities" },
      ],
    },
    { to: "/reports", label: "Reports", icon: BarChart3 },
    { to: "/notifications", label: "Notifications", icon: Bell },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${
          isOpen ? "w-64" : "lg:w-20 w-64"
        } bg-[hsl(var(--color-surface))] border-r border-[hsl(var(--color-border))] h-screen fixed lg:sticky top-0 flex flex-col shadow-lg transition-all duration-300 z-50`}
      >
        {/* Logo/Brand */}
        <div className="p-6 border-b border-[hsl(var(--color-border))]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[hsl(var(--color-primary))] to-[hsl(var(--color-primary-hover))] rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            {(isOpen || window.innerWidth >= 1024) && (
              <div className={isOpen ? "block" : "hidden lg:hidden"}>
                <h1 className="text-lg font-bold text-[hsl(var(--color-foreground))]">ROSTER</h1>
                <p className="text-xs text-[hsl(var(--color-foreground-secondary))]">Mechanic</p>
              </div>
            )}
          </div>
        </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;

            if (item.hasSubmenu) {
              return (
                <li key={index}>
                  <button
                    onClick={item.toggle}
                    className={`touch-target w-full flex items-center ${
                      isOpen ? "justify-between px-4" : "justify-center px-2"
                    } py-3 text-sm font-medium text-[hsl(var(--color-foreground-secondary))] hover:bg-[hsl(var(--color-surface-elevated))] rounded-xl transition-colors`}
                    title={!isOpen ? item.label : ""}
                    aria-expanded={item.isOpen}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-[hsl(var(--color-foreground-muted))] flex-shrink-0" />
                      {isOpen && <span>{item.label}</span>}
                    </div>
                    {isOpen && (
                      <ChevronDown
                        className={`w-4 h-4 text-[hsl(var(--color-foreground-muted))] transition-transform ${
                          item.isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${
                    item.isOpen && isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <ul className="mt-1 ml-4 space-y-1 pb-1">
                      {item.submenu.map((subItem, subIndex) => (
                        <li key={subIndex}>
                          <NavLink
                            to={subItem.to}
                            onClick={() => window.innerWidth < 1024 && onClose && onClose()}
                            className={({ isActive }) =>
                              `touch-target block px-4 py-2 text-sm rounded-lg transition-colors ${
                                isActive
                                  ? "bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))] font-medium"
                                  : "text-[hsl(var(--color-foreground-secondary))] hover:bg-[hsl(var(--color-surface-elevated))]"
                              }`
                            }
                          >
                            {subItem.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            }

            return (
              <li key={index}>
                <NavLink
                  to={item.to}
                  onClick={() => window.innerWidth < 1024 && onClose && onClose()}
                  className={({ isActive }) =>
                    `touch-target flex items-center gap-3 ${
                      isOpen ? "px-4" : "lg:px-2 px-4 lg:justify-center"
                    } py-3 text-sm font-medium rounded-xl transition-colors ${
                      isActive
                        ? "bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))] shadow-lg"
                        : "text-[hsl(var(--color-foreground-secondary))] hover:bg-[hsl(var(--color-surface-elevated))]"
                    }`
                  }
                  title={!isOpen ? item.label : ""}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {(isOpen || window.innerWidth < 1024) && <span className={!isOpen ? "lg:hidden" : ""}>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
    </>
  );
}
