import * as React from "react";
import { cn } from "@/lib/utils";

export interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {}

const PageShell = React.forwardRef<HTMLDivElement, PageShellProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "scroll min-h-screen w-full px-[20px] py-[22px] md:px-[32px] md:py-[30px] lg:px-[40px] lg:py-[34px]",
          className
        )}
        {...props}
      >
        <div className="mx-auto max-w-3xl">
          {children}
        </div>
      </div>
    );
  }
);
PageShell.displayName = "PageShell";

export { PageShell };
