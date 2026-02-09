import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide border transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[hsl(var(--color-secondary))] text-[hsl(var(--color-secondary-foreground))] border-transparent",
        success: "bg-[hsl(var(--color-success-soft))] text-[hsl(var(--color-success))] border-[hsl(var(--color-success))]/20",
        warning: "bg-[hsl(var(--color-warning-soft))] text-[hsl(var(--color-warning))] border-[hsl(var(--color-warning))]/20",
        error: "bg-[hsl(var(--color-error-soft))] text-[hsl(var(--color-error))] border-[hsl(var(--color-error))]/20",
        info: "bg-[hsl(var(--color-info-soft))] text-[hsl(var(--color-info))] border-[hsl(var(--color-info))]/20",
        outline: "bg-transparent text-[hsl(var(--color-foreground))] border-[hsl(var(--color-border))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Badge = React.forwardRef(({ className, variant, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
});

Badge.displayName = "Badge";

export { Badge, badgeVariants };
export default Badge;
