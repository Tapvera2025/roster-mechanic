import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  LogOut,
  User,
  Menu,
} from "lucide-react";

export default function Navbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/login");
  };

  return (
    <nav className="bg-[hsl(220,15%,12%)] border-b border-[hsl(220,15%,20%)] shadow-lg sticky top-0 z-40">
      <div className="mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          {/* Menu Toggle & Search Bar */}
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button
              onClick={onToggleSidebar}
              className="p-2 hover:bg-[hsl(220,15%,18%)] rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-400" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 bg-[hsl(220,15%,16%)] border border-[hsl(220,15%,22%)] rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4 ml-6">

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-[hsl(220,15%,18%)] rounded-xl transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-orange-700 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">AT</span>
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-gray-100">ACE T</div>
                  <div className="text-xs text-gray-400">Admin</div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {/* User Menu Dropdown */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 bg-[hsl(220,15%,16%)] shadow-xl border border-[hsl(220,15%,22%)] rounded-2xl z-20 w-56 overflow-hidden">
                    <div className="py-2">
                      <div className="px-4 py-3 border-b border-[hsl(220,15%,22%)]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-orange-700 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">AT</span>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-100">ACE T</div>
                            <div className="text-xs text-gray-400">ace@roster.com</div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/settings")}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-[hsl(220,15%,20%)] transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Profile Settings
                      </button>
                      <div className="border-t border-[hsl(220,15%,22%)] my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
