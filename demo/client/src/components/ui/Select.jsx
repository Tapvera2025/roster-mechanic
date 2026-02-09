import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border border-[hsl(var(--color-input))] bg-[hsl(var(--color-surface))] px-3 py-2 text-sm text-[hsl(var(--color-foreground))] ring-offset-[hsl(var(--color-background))] placeholder:text-[hsl(var(--color-foreground-muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-ring))] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none pr-8 transition-colors",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-[hsl(var(--color-muted-foreground))] pointer-events-none" />
    </div>
  );
});

Select.displayName = "Select";

export { Select };
