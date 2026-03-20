import { Navigate } from "react-router-dom";

/**
 * EmployeeRoute - Protects routes that should only be accessible by USER (employee) role
 * Redirects admins/managers to their dashboard
 * Redirects unauthenticated users to login
 */
export default function EmployeeRoute({ children }) {
  const isAuthenticated = localStorage.getItem("isAuthenticated");
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  // If not authenticated, redirect to login
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but is admin/manager, redirect to admin dashboard
  if (userRole === "admin" || userRole === "manager") {
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated and has employee (USER) role
  return children;
}
