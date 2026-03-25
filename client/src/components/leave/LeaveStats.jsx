import { TrendingUp } from "lucide-react";

export default function LeaveStats({ stats }) {
  const statCards = [
    {
      title: "Total Leave Requests",
      value: stats?.total || 0,
      color: "bg-[hsl(var(--color-surface-elevated))]",
      textColor: "text-[hsl(var(--color-foreground))]",
    },
    {
      title: "Awaiting",
      value: stats?.awaiting || 0,
      color: "bg-[hsl(var(--color-surface-elevated))]",
      textColor: "text-[hsl(var(--color-foreground))]",
    },
    {
      title: "Approved",
      value: stats?.approved || 0,
      color: "bg-[hsl(var(--color-surface-elevated))]",
      textColor: "text-[hsl(var(--color-foreground))]",
    },
    {
      title: "Declined",
      value: stats?.declined || 0,
      color: "bg-[hsl(var(--color-surface-elevated))]",
      textColor: "text-[hsl(var(--color-foreground))]",
    },
    {
      title: "Cancelled",
      value: stats?.cancelled || 0,
      color: "bg-[hsl(var(--color-surface-elevated))]",
      textColor: "text-[hsl(var(--color-foreground))]",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className={`${stat.color} border border-[hsl(var(--color-border))] rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--color-foreground-secondary))] mb-1">{stat.title}</p>
              <p className={`text-3xl font-bold ${stat.textColor}`}>
                {stat.value}
              </p>
            </div>
            {index === 0 && (
              <TrendingUp className="w-5 h-5 text-[hsl(var(--color-primary))]" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
