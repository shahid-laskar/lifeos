import * as React from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app flex min-h-screen w-full bg-[var(--bg)] font-sans text-[var(--ink)]">
      {children}
    </div>
  );
}
