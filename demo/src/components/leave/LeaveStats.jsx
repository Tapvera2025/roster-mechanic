import { TrendingUp } from "lucide-react";

export default function LeaveStats({ stats }) {
  const statCards = [
    {
      title: "Total Leave Requests",
      value: stats?.total || 0,
      color: "bg-[hsl(220,15%,14%)]",
      textColor: "text-gray-100",
    },
    {
      title: "Awaiting",
      value: stats?.awaiting || 0,
      color: "bg-[hsl(220,15%,14%)]",
      textColor: "text-amber-400",
    },
    {
      title: "Approved",
      value: stats?.approved || 0,
      color: "bg-[hsl(220,15%,14%)]",
      textColor: "text-green-400",
    },
    {
      title: "Declined",
      value: stats?.declined || 0,
      color: "bg-[hsl(220,15%,14%)]",
      textColor: "text-red-400",
    },
    {
      title: "Cancelled",
      value: stats?.cancelled || 0,
      color: "bg-[hsl(220,15%,14%)]",
      textColor: "text-gray-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className={`${stat.color} border border-[hsl(220,15%,20%)] rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
              <p className={`text-3xl font-bold ${stat.textColor}`}>
                {stat.value}
              </p>
            </div>
            {index === 0 && (
              <TrendingUp className="w-5 h-5 text-orange-500" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
