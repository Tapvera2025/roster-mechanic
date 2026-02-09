import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import MainLayout from "./components/layout/MainLayout";
import UserLayout from "./components/layout/UserLayout";
import Dashboard from "./pages/Dashboard";
import Roster from "./pages/Roster";
import Scheduler from "./pages/Scheduler";
import Employees from "./pages/Employees";
import Clients from "./pages/Clients";
import Sites from "./pages/Sites";
import Reports from "./pages/Reports";
import LeaveManagement from "./pages/LeaveManagement";
import SiteActivities from "./pages/SiteActivities";
import TimeAttendance from "./pages/TimeAttendance";
import Packages from "./pages/Packages";
import Login from "./pages/Login";
import MyRoster from "./pages/user/MyRoster";
import ChangePassword from "./pages/user/ChangePassword";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/packages" element={<Packages />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="dashboard" element={<Dashboard />} />
          <Route path="scheduler" element={<Scheduler />} />
          <Route path="roster" element={<Roster />} />
          <Route path="attendance/time" element={<TimeAttendance />} />
          <Route path="employees" element={<Employees />} />
          <Route path="employees/compliance" element={<Reports />} />
          <Route path="employees/leave" element={<LeaveManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="operations/site-activities" element={<SiteActivities />} />
          <Route path="company/sites" element={<Sites />} />
          <Route path="company/clients" element={<Clients />} />
        </Route>

        {/* User/Employee Portal Routes */}
        <Route path="/user" element={<UserLayout />}>
          <Route index element={<Navigate to="/user/roster" replace />} />
          <Route path="roster" element={<MyRoster />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
