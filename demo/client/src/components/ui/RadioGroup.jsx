import * as React from "react";
import { cn } from "../../lib/utils";

const RadioGroup = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("grid gap-2", className)} {...props} />
  );
});

RadioGroup.displayName = "RadioGroup";

const RadioGroupItem = React.forwardRef(({ className, children, id, ...props }, ref) => {
  return (
    <div className="flex items-center space-x-2">
      <input
        type="radio"
        className={cn(
          "h-4 w-4 rounded-full border border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-950 focus:ring-offset-2",
          className
        )}
        id={id}
        ref={ref}
        {...props}
      />
      {children}
    </div>
  );
});

RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
