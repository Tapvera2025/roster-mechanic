import { useState, useEffect } from "react";
import { Calendar, Users, FileText, AlertTriangle, UserX, Plane, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { dashboardApi } from "../../lib/api";

export default function DashboardStats({ date = "Today" }) {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await dashboardApi.getStats();
        console.log('Dashboard stats response:', res.data);
        setStatsData(res.data.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setError(err.message || 'Failed to load stats');
        setStatsData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const fmt = (val) => {
    if (loading) return "—";
    if (val == null) return "00";
    return String(val).padStart(2, "0");
  };

  const stats = [
    {
      label: "Tentative Shifts",
      value: fmt(statsData?.tentativeShifts),
      icon: Calendar,
      iconBg: "bg-orange-900/30",
      iconColor: "text-orange-400",
    },
    {
      label: "Open Shifts",
      value: fmt(statsData?.openShifts),
      icon: Users,
      iconBg: "bg-orange-900/30",
      iconColor: "text-orange-400",
    },
    {
      label: "Unpublished Shifts",
      value: fmt(statsData?.unpublishedShifts),
      icon: FileText,
      iconBg: "bg-orange-900/30",
      iconColor: "text-orange-400",
    },
    {
      label: "Licenses Expiry",
      value: fmt(statsData?.licensesExpiry),
      icon: AlertTriangle,
      iconBg: "bg-orange-900/30",
      iconColor: "text-orange-400",
    },
    {
      label: "No Show/Absent",
      value: fmt(statsData?.noShowAbsent),
      icon: UserX,
      iconBg: "bg-red-900/30",
      iconColor: "text-red-400",
    },
    {
      label: "Leave Requests",
      value: fmt(statsData?.leaveRequests),
      icon: Plane,
      iconBg: "bg-green-900/30",
      iconColor: "text-green-400",
    },
    {
      label: "Availability Requests",
      value: fmt(statsData?.availabilityRequests),
      icon: Clock,
      iconBg: "bg-orange-900/30",
      iconColor: "text-orange-400",
    },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Date Selector */}
      <div className="flex items-center justify-center py-4">
        <button className="p-2 hover:bg-[hsl(var(--color-surface-elevated))] rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[hsl(var(--color-foreground-muted))]" />
        </button>
        <div className="mx-3 sm:mx-6 min-w-[100px] sm:min-w-[140px] text-center">
          <button className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-[hsl(var(--color-foreground-secondary))] hover:text-[hsl(var(--color-primary))] flex items-center gap-1 sm:gap-2 transition-colors hover:bg-[hsl(var(--color-surface-elevated))] rounded-lg">
            {date}
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <button className="p-2 hover:bg-[hsl(var(--color-surface-elevated))] rounded-lg transition-colors">
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[hsl(var(--color-foreground-muted))]" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3 sm:gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-[hsl(var(--color-card))] rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:shadow-lg transition-all duration-300 cursor-pointer border border-[hsl(var(--color-border))] shadow-sm hover:-translate-y-1"
            >
              <div className="flex flex-col gap-2 sm:gap-3">
                <div className={`${stat.iconBg} p-2 sm:p-3 rounded-lg sm:rounded-xl self-start`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.iconColor}`} />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-[hsl(var(--color-foreground))]">
                    {stat.value}
                  </div>
                  <div className="text-[10px] sm:text-xs font-medium text-[hsl(var(--color-foreground-secondary))] mt-1 sm:mt-1.5 leading-tight">
                    {stat.label}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
