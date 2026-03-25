import { Navigate } from "react-router-dom";

/**
 * AdminRoute - Protects routes that should only be accessible by ADMIN or MANAGER roles
 * Redirects employees (USER role) to their portal
 * Redirects unauthenticated users to login
 */
export default function AdminRoute({ children }) {
  const isAuthenticated = localStorage.getItem("isAuthenticated");
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  // If not authenticated, redirect to login
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but not admin/manager, redirect to employee portal
  if (userRole === "user") {
    return <Navigate to="/user/roster" replace />;
  }

  // User is authenticated and has admin/manager role
  return children;
}
