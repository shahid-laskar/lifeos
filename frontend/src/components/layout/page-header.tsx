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
          <p className="arabic text-lg text-gold" lang="ar" dir="rtl">
            {arabic}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}
