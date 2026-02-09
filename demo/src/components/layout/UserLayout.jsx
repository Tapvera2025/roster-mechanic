import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutGrid, Lock, Menu, X } from "lucide-react";

export default function UserLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: "/user/roster", label: "Roster", icon: LayoutGrid },
    { to: "/user/change-password", label: "Change Password", icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-[hsl(220,15%,8%)] flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } w-64 lg:w-20 hover:lg:w-64 bg-[hsl(220,15%,12%)] border-r border-[hsl(220,15%,20%)] h-screen fixed lg:sticky top-0 flex flex-col shadow-lg transition-all duration-300 z-50 group`}
      >
        {/* Logo/Brand */}
        <div className="p-4 border-b border-[hsl(220,15%,20%)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <div className="lg:hidden lg:group-hover:block">
              <h1 className="text-lg font-bold text-gray-100">ROSTER</h1>
              <p className="text-xs text-gray-400">Employee Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 lg:px-2 lg:group-hover:px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                        isActive
                          ? "bg-orange-600 text-white shadow-md"
                          : "text-gray-300 hover:bg-[hsl(220,15%,18%)]"
                      }`
                    }
                    title={item.label}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="lg:hidden lg:group-hover:inline">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Close button for mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden bg-[hsl(220,15%,12%)] border-b border-[hsl(220,15%,20%)] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-gray-200"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="font-semibold text-gray-100">Employee Portal</span>
          </div>
          <div className="w-10" />
        </header>

        {/* Page Content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
