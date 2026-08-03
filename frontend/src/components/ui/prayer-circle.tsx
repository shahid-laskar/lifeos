import * as React from "react";
import { cn } from "@/lib/utils";

export interface PrayerCircleProps extends React.HTMLAttributes<HTMLDivElement> {
  status: "unlogged" | "done" | "missed";
  label?: string;
}

const PrayerCircle = React.forwardRef<HTMLDivElement, PrayerCircleProps>(
  ({ className, status, label, ...props }, ref) => {
    return (
      <div className={cn("flex flex-1 flex-col items-center gap-2", className)} ref={ref} {...props}>
        <div
          className={cn(
            "flex h-[44px] w-[44px] items-center justify-center rounded-full text-[14px] font-semibold",
            status === "done" && "border-[1.5px] border-[var(--primary)] bg-[var(--primary)] text-white dark:text-[#08120f]",
            status === "unlogged" && "border-[1.5px] border-dashed border-[var(--line)] text-[var(--mute)]",
            status === "missed" && "relative border-[1.5px] border-[var(--line)] bg-transparent text-[var(--mute)]"
          )}
        >
          {status === "done" && "✓"}
          {status === "missed" && <span className="absolute block h-[1.5px] w-[14px] bg-[var(--line)]"></span>}
        </div>
        {label && <small className="text-[11px] text-[var(--mute)]">{label}</small>}
      </div>
    );
  }
);
PrayerCircle.displayName = "PrayerCircle";

export { PrayerCircle };
