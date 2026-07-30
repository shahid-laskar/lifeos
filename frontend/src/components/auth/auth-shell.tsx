import type { ReactNode } from "react";
import { GeometricPattern } from "@/components/brand/pattern";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-7 text-card-foreground shadow-sm">
        <GeometricPattern className="text-primary" opacity={0.05} />
        <div className="relative">
          <p className="arabic text-center text-2xl text-gold">
            بِسْمِ اللهِ
          </p>
          <h1 className="mt-4 text-center text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
          <div className="mt-7">{children}</div>
          {footer ? (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

export function FormNotice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
      {children}
    </p>
  );
}

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "العربية" },
  { value: "fr", label: "Français" },
  { value: "tr", label: "Türkçe" },
  { value: "ur", label: "اردو" },
];
