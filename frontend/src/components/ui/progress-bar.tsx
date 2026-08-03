import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  percentage: number;
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, percentage, ...props }, ref) => {
    const pct = Math.min(100, Math.max(0, percentage));
    return (
      <div
        ref={ref}
        className={cn("mt-3.5 h-[7px] overflow-hidden rounded-[9px] bg-[var(--line)]", className)}
        {...props}
      >
        <i className="block h-full rounded-[9px] bg-[var(--primary)]" style={{ width: `${pct}%` }} />
      </div>
    );
  }
);
ProgressBar.displayName = "ProgressBar";

const ProgressMeta = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("mt-2.5 flex justify-between text-[12px] text-[var(--mute)]", className)}
      {...props}
    />
  )
);
ProgressMeta.displayName = "ProgressMeta";

export { ProgressBar, ProgressMeta };
