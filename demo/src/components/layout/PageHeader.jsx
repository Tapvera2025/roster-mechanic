import * as React from "react";
import { cn } from "../../lib/utils";

export default function PageHeader({ title, description, icon: Icon, actions, className }) {
  return (
    <div
      className={cn(
        "bg-[hsl(var(--color-card))] border-b border-[hsl(var(--color-border))] px-8 py-6 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="p-3 bg-[hsl(var(--color-primary))] rounded-xl shadow-lg">
              <Icon className="w-6 h-6 text-[hsl(var(--color-primary-foreground))]" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--color-foreground))]">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-[hsl(var(--color-foreground-muted))] mt-1.5">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
