import * as React from "react";
import { cn } from "@/lib/utils";

export interface KhushooMoonsProps extends React.HTMLAttributes<HTMLDivElement> {
  rating: number; // 0 to 5
  caption?: string;
}

const MOONS = ["🌑", "🌘", "🌗", "🌖", "🌕"];

const KhushooMoons = React.forwardRef<HTMLDivElement, KhushooMoonsProps>(
  ({ className, rating, caption, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("mt-3 flex items-center gap-1.5", className)} {...props}>
        {MOONS.map((moon, index) => {
          const isOn = index < rating;
          return (
            <div
              key={index}
              className={cn(
                "flex h-[26px] w-[26px] items-center justify-center rounded-full border border-[var(--line)] text-[12px]",
                isOn && "border-[var(--brass)] text-[var(--brass)]"
              )}
            >
              {moon}
            </div>
          );
        })}
        {caption && <span className="ml-1.5 text-[11px] text-[var(--mute)]">{caption}</span>}
      </div>
    );
  }
);
KhushooMoons.displayName = "KhushooMoons";

export { KhushooMoons };
