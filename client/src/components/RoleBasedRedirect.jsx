import { Navigate } from "react-router-dom";

/**
 * RoleBasedRedirect - Redirects authenticated users to their appropriate home page based on role
 * Used for root path and fallback routes
 */
export default function RoleBasedRedirect() {
  const isAuthenticated = localStorage.getItem("isAuthenticated");
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  // If not authenticated, redirect to login
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role
  if (userRole === "admin" || userRole === "manager") {
    return <Navigate to="/dashboard" replace />;
  } else if (userRole === "user") {
    return <Navigate to="/user/roster" replace />;
  }

  // Fallback to login if role is undefined or invalid
  return <Navigate to="/login" replace />;
}
