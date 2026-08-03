import * as React from "react";
import { cn } from "@/lib/utils";

const Pill = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-soft)] px-3 py-[7px] text-[12px] font-semibold text-[var(--primary)]",
          className
        )}
        {...props}
      />
    );
  }
);
Pill.displayName = "Pill";

export { Pill };
