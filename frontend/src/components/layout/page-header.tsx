import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  arabic,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  arabic?: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4 px-5 pb-4 pt-7">
      <div>
        {arabic ? (
          <p
            className="text-xs tracking-[0.14em] uppercase text-muted-foreground font-arabic"
            lang="ar"
            dir="rtl"
          >
            {arabic}
          </p>
        ) : null}
        <h1 className="mt-1.5 text-[26px] font-bold tracking-[-0.02em] text-foreground">{title}</h1>
        {subtitle ? (
          <div className="mt-2 flex items-center gap-2 text-[13px] text-muted-foreground">
            {subtitle.includes("·") ? (
              <>
                <span className="font-semibold text-primary">{subtitle.split("·")[0].trim()}</span>
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
    </header>
  );
}
