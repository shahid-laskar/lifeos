import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { StarSpinner } from "@/components/brand/pattern";
import { useIsAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    navigate({ to: isAuthenticated ? "/home" : "/login", replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <StarSpinner size={40} />
      <p className="arabic text-2xl text-gold">مُسْلِم لايف</p>
      <p className="text-sm text-muted-foreground">Muslim Life OS</p>
    </div>
  );
}
