import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  glyph: React.ReactNode;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, glyph, description, actionLabel, onAction, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("px-1 pb-0.5 pt-1.5 text-center", className)} {...props}>
        <div className="mx-auto mb-2.5 mt-0.5 flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-[var(--primary-soft)] text-[16px] text-[var(--primary)]">
          {glyph}
        </div>
        <p className="mt-1 text-[13px] leading-[1.6] text-[var(--mute)]">{description}</p>
        {actionLabel && (
          <Button className="mt-3" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    );
  }
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
