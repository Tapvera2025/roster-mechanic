import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))] hover:bg-[hsl(var(--color-primary-hover))] focus-visible:ring-[hsl(var(--color-ring))] shadow-md hover:shadow-lg",
        secondary: "bg-[hsl(var(--color-secondary))] text-[hsl(var(--color-secondary-foreground))] hover:bg-[hsl(var(--color-secondary-hover))] focus-visible:ring-[hsl(var(--color-ring))] shadow-sm hover:shadow-md",
        outline: "border-2 border-[hsl(var(--color-primary))] bg-transparent text-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary-foreground))] focus-visible:ring-[hsl(var(--color-ring))]",
        ghost: "hover:bg-[hsl(var(--color-secondary))] hover:text-[hsl(var(--color-secondary-foreground))] focus-visible:ring-[hsl(var(--color-ring))]",
        link: "text-[hsl(var(--color-primary))] underline-offset-4 hover:underline focus-visible:ring-0",
        danger: "bg-[hsl(var(--color-destructive))] text-[hsl(var(--color-destructive-foreground))] hover:opacity-90 focus-visible:ring-[hsl(var(--color-destructive))] shadow-md",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
export default Button;
