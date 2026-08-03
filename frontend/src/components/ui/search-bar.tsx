import * as React from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-[var(--mute)]" />
        </div>
        <input
          ref={ref}
          className={cn(
            "block w-full rounded-[11px] border border-[var(--line)] bg-[var(--surface)] py-2 pl-10 pr-3 text-[13px] text-[var(--ink)] placeholder-[var(--mute)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
SearchBar.displayName = "SearchBar";

export { SearchBar };
