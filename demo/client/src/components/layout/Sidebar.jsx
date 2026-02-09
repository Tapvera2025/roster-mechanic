import { useState } from "react";
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

export default function Sidebar({ isOpen, onClose }) {
  const [employeesOpen, setEmployeesOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [operationsOpen, setOperationsOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);

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
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${
          isOpen ? "w-64" : "lg:w-20 w-64"
        } bg-[hsl(220,15%,12%)] border-r border-[hsl(220,15%,20%)] h-screen fixed lg:sticky top-0 flex flex-col shadow-lg transition-all duration-300 z-50`}
      >
        {/* Logo/Brand */}
        <div className="p-6 border-b border-[hsl(220,15%,20%)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            {(isOpen || window.innerWidth >= 1024) && (
              <div className={isOpen ? "block" : "hidden lg:hidden"}>
                <h1 className="text-lg font-bold text-gray-100">ROSTER</h1>
                <p className="text-xs text-gray-400">Mechanic</p>
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
                    className={`w-full flex items-center ${
                      isOpen ? "justify-between px-4" : "justify-center px-2"
                    } py-3 text-sm font-medium text-gray-300 hover:bg-[hsl(220,15%,18%)] rounded-xl transition-colors`}
                    title={!isOpen ? item.label : ""}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      {isOpen && <span>{item.label}</span>}
                    </div>
                    {isOpen && (
                      item.isOpen ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )
                    )}
                  </button>
                  {item.isOpen && isOpen && (
                    <ul className="mt-1 ml-4 space-y-1">
                      {item.submenu.map((subItem, subIndex) => (
                        <li key={subIndex}>
                          <NavLink
                            to={subItem.to}
                            onClick={() => window.innerWidth < 1024 && onClose && onClose()}
                            className={({ isActive }) =>
                              `block px-4 py-2 text-sm rounded-lg transition-colors ${
                                isActive
                                  ? "bg-orange-600/20 text-orange-500 font-medium"
                                  : "text-gray-400 hover:bg-[hsl(220,15%,18%)]"
                              }`
                            }
                          >
                            {subItem.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={index}>
                <NavLink
                  to={item.to}
                  onClick={() => window.innerWidth < 1024 && onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 ${
                      isOpen ? "px-4" : "lg:px-2 px-4 lg:justify-center"
                    } py-3 text-sm font-medium rounded-xl transition-colors ${
                      isActive
                        ? "bg-orange-600 text-white shadow-md"
                        : "text-gray-300 hover:bg-[hsl(220,15%,18%)]"
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
