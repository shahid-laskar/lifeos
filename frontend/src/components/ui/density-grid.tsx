import * as React from "react";
import { cn } from "@/lib/utils";

export interface DensityGridProps extends React.HTMLAttributes<HTMLDivElement> {
  weeks: ("on" | "part" | "off")[][];
}

const DensityGrid = React.forwardRef<HTMLDivElement, DensityGridProps>(
  ({ className, weeks, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("mt-3.5 flex gap-1.5", className)} {...props}>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-1 flex-col gap-1.5">
            {week.map((status, dayIndex) => (
              <i
                key={dayIndex}
                className={cn(
                  "h-[12px] flex-1 rounded-[4px]",
                  status === "on" ? "bg-[var(--primary)]" : status === "part" ? "bg-[var(--primary)] opacity-[0.42]" : "bg-[var(--line)]"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }
);
DensityGrid.displayName = "DensityGrid";

export { DensityGrid };
