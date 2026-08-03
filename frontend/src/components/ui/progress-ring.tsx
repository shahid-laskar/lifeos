import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressRingProps extends React.HTMLAttributes<HTMLDivElement> {
  percentage: number;
  label?: React.ReactNode;
}

const ProgressRing = React.forwardRef<HTMLDivElement, ProgressRingProps>(
  ({ className, percentage, label, ...props }, ref) => {
    const pct = Math.min(100, Math.max(0, percentage));
    return (
      <div
        ref={ref}
        className={cn(
          "relative mx-auto mt-3.5 flex h-[74px] w-[74px] items-center justify-center rounded-full text-[16px] font-bold",
          className
        )}
        style={{
          background: `conic-gradient(var(--primary) ${pct}%, var(--line) 0)`,
          ...props.style,
        }}
        {...props}
      >
        <div className="absolute inset-[7px] rounded-full bg-[var(--surface)]" />
        <b className="relative z-10 tabular-nums">{label || pct}</b>
      </div>
    );
  }
);
ProgressRing.displayName = "ProgressRing";

export { ProgressRing };
