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

  // Get user info from localStorage
  const userName = localStorage.getItem("userName") || "User";
  const userEmail = localStorage.getItem("userEmail") || "";
  const userRole = localStorage.getItem("userRole") || "USER";
  const userInitials = userName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  return (
    <nav className="bg-[hsl(var(--color-surface))] border-b border-[hsl(var(--color-border))] shadow-md sticky top-0 z-40">
      <div className="mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          {/* Menu Toggle & Search Bar */}
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button
              onClick={onToggleSidebar}
              className="p-2 hover:bg-[hsl(var(--color-surface-elevated))] rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5 text-[hsl(var(--color-foreground-muted))]" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[hsl(var(--color-foreground-muted))]" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 bg-[hsl(var(--color-surface-elevated))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] transition-all placeholder:text-[hsl(var(--color-foreground-muted))]"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4 ml-6">

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-[hsl(var(--color-surface-elevated))] rounded-xl transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-[hsl(var(--color-primary))] to-[hsl(var(--color-primary-hover))] rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">{userInitials}</span>
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-[hsl(var(--color-foreground))]">{userName}</div>
                  <div className="text-xs text-[hsl(var(--color-foreground-secondary))]">
                    {userRole === "ADMIN" ? "Admin" : userRole === "MANAGER" ? "Manager" : "Employee"}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-[hsl(var(--color-foreground-muted))]" />
              </button>

              {/* User Menu Dropdown */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 bg-[hsl(var(--color-card))] shadow-xl border border-[hsl(var(--color-border))] rounded-2xl z-20 w-56 overflow-hidden">
                    <div className="py-2">
                      <div className="px-4 py-3 border-b border-[hsl(var(--color-border))]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[hsl(var(--color-primary))] to-[hsl(var(--color-primary-hover))] rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">{userInitials}</span>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[hsl(var(--color-foreground))]">{userName}</div>
                            <div className="text-xs text-[hsl(var(--color-foreground-secondary))]">{userEmail}</div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          navigate("/profile");
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[hsl(var(--color-foreground-secondary))] hover:bg-[hsl(var(--color-surface-elevated))] transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Profile Settings
                      </button>
                      <div className="border-t border-[hsl(var(--color-border))] my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[hsl(var(--color-error))] hover:bg-[hsl(var(--color-error-soft))] transition-colors"
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
