import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  arabic,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  arabic?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 flex items-start justify-between gap-4", className)}>
      <div>
        {arabic ? (
          <p
            className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--mute)]"
            lang="ar"
            dir="rtl"
          >
            {arabic}
          </p>
        ) : null}
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-[var(--ink)]">{title}</h1>
        {subtitle ? (
          <div className="mt-1 flex items-center gap-2 text-[13px] text-[var(--mute)]">
            {subtitle.includes("·") ? (
              <>
                <span className="font-semibold text-[var(--primary)]">{subtitle.split("·")[0].trim()}</span>
                <span className="h-[3px] w-[3px] rounded-full bg-current opacity-50"></span>
                <span>{subtitle.split("·")[1].trim()}</span>
              </>
            ) : (
              subtitle
            )}
          </div>
        ) : null}
      </div>
      {action}
      {children}
    </header>
  );
}
