import * as React from "react";
import { cn } from "@/lib/utils";

const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("animate-[pulse_1.6s_ease-in-out_infinite] rounded-[8px] bg-[var(--skel)] motion-reduce:animate-none", className)}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

const SkeletonHero = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "h-[158px] w-full animate-[pulse_1.6s_ease-in-out_infinite] rounded-[20px] bg-[var(--skel)] motion-reduce:animate-none",
          className
        )}
        {...props}
      />
    );
  }
);
SkeletonHero.displayName = "SkeletonHero";

const SkeletonLine = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "h-[11px] w-full animate-[pulse_1.6s_ease-in-out_infinite] rounded-[4px] bg-[var(--skel)] motion-reduce:animate-none",
          className
        )}
        {...props}
      />
    );
  }
);
SkeletonLine.displayName = "SkeletonLine";

const SkeletonCirc = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "h-[44px] w-[44px] animate-[pulse_1.6s_ease-in-out_infinite] rounded-full bg-[var(--skel)] motion-reduce:animate-none",
          className
        )}
        {...props}
      />
    );
  }
);
SkeletonCirc.displayName = "SkeletonCirc";

export { Skeleton, SkeletonHero, SkeletonLine, SkeletonCirc };
