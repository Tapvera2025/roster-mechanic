import { Calendar, Users, FileText, AlertTriangle, UserX, Plane, Clock, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

export default function DashboardStats({ date = "Today" }) {
  const stats = [
    {
      label: "Tentative Shifts",
      value: "00",
      icon: Calendar,
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "bg-gradient-to-br from-orange-500/20 to-orange-600/20",
    },
    {
      label: "Open Shifts",
      value: "00",
      icon: Users,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "bg-gradient-to-br from-amber-500/20 to-orange-500/20",
    },
    {
      label: "Unpublished Shifts",
      value: "00",
      icon: FileText,
      gradient: "from-orange-400 to-amber-500",
      bgGradient: "bg-gradient-to-br from-orange-400/20 to-amber-500/20",
    },
    {
      label: "Licenses Expiry",
      value: "02",
      icon: AlertTriangle,
      gradient: "from-red-500 to-orange-500",
      bgGradient: "bg-gradient-to-br from-red-500/20 to-orange-500/20",
    },
    {
      label: "No Show/Absent",
      value: "00",
      icon: UserX,
      gradient: "from-red-500 to-red-600",
      bgGradient: "bg-gradient-to-br from-red-500/20 to-red-600/20",
    },
    {
      label: "Leave Requests",
      value: "00",
      icon: Plane,
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "bg-gradient-to-br from-green-500/20 to-emerald-500/20",
    },
    {
      label: "Availability Requests",
      value: "00",
      icon: Clock,
      gradient: "from-orange-600 to-orange-700",
      bgGradient: "bg-gradient-to-br from-orange-600/20 to-orange-700/20",
    },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Date Selector */}
      <div className="flex items-center justify-center py-4">
        <button className="p-2 hover:bg-[hsl(220,15%,18%)] rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        </button>
        <div className="mx-3 sm:mx-6 min-w-[100px] sm:min-w-[140px] text-center">
          <button className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-gray-200 hover:text-orange-500 flex items-center gap-1 sm:gap-2 transition-colors hover:bg-[hsl(220,15%,18%)] rounded-lg">
            {date}
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <button className="p-2 hover:bg-[hsl(220,15%,18%)] rounded-lg transition-colors">
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3 sm:gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-[hsl(220,15%,14%)] rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:shadow-xl transition-all duration-300 cursor-pointer border border-[hsl(220,15%,20%)] shadow-lg hover:-translate-y-1"
            >
              <div className="flex flex-col gap-2 sm:gap-3">
                <div className={`${stat.bgGradient} p-2 sm:p-3 rounded-lg sm:rounded-xl self-start`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-200" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-100">
                    {stat.value}
                  </div>
                  <div className="text-[10px] sm:text-xs font-medium text-gray-400 mt-1 sm:mt-1.5 leading-tight">
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
