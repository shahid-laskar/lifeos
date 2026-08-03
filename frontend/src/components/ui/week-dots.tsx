import * as React from "react";
import { cn } from "@/lib/utils";

export interface WeekDotsProps extends React.HTMLAttributes<HTMLDivElement> {
  days: ("on" | "part" | "off")[];
}

const WeekDots = React.forwardRef<HTMLDivElement, WeekDotsProps>(
  ({ className, days, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("mt-3.5 flex gap-1.5", className)} {...props}>
        {days.slice(0, 7).map((status, index) => (
          <i
            key={index}
            className={cn(
              "h-[26px] flex-1 rounded-[7px]",
              status === "on" ? "bg-[var(--primary)]" : status === "part" ? "bg-[var(--primary)] opacity-[0.42]" : "bg-[var(--line)]"
            )}
          />
        ))}
      </div>
    );
  }
);
WeekDots.displayName = "WeekDots";

export { WeekDots };
