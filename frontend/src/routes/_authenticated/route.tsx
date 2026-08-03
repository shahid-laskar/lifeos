import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BottomTabs } from "@/components/layout/bottom-tabs";
import { Sidebar } from "@/components/layout/sidebar";
import { AppShell } from "@/components/layout/app-shell";
import { StarSpinner } from "@/components/brand/pattern";
import { Toaster } from "@/components/ui/toaster";
import { useIsAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/login", replace: true });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <StarSpinner size={36} />
      </div>
    );
  }

  return (
    <AppShell>
      <Sidebar />
      <main className="flex-1 pb-[env(safe-area-inset-bottom)] lg:pb-0">
        <Outlet />
      </main>
      <BottomTabs />
      <Toaster />
    </AppShell>
  );
}
