import { FileText, RotateCw, Zap } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import DashboardStats from "../components/dashboard/DashboardStats";
import AttendanceChart from "../components/dashboard/AttendanceChart";
import CoverageWidget from "../components/dashboard/CoverageWidget";
import LeaveRequestsWidget from "../components/dashboard/LeaveRequestsWidget";
import AvailabilityRequestsWidget from "../components/dashboard/AvailabilityRequestsWidget";
import SubcontractorWidget from "../components/dashboard/SubcontractorWidget";

export default function Dashboard() {
  return (
    <div className="min-h-screen">
      {/* Content */}
      <div className="relative">
        {/* Greeting Section */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--color-foreground))] mb-1">
            Hello ACE T 👋
          </h1>
          <p className="text-[hsl(var(--color-foreground-secondary))] text-sm">Let's manage your roster today!</p>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats />

        {/* Main Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <AttendanceChart />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <CoverageWidget />
            <div className="space-y-6">
              <LeaveRequestsWidget />
              <AvailabilityRequestsWidget />
            </div>
          </div>
          <SubcontractorWidget />
        </div>
      </div>
    </div>
  );
}
