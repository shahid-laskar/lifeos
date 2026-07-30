import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Settings — Muslim Life OS" },
      {
        name: "description",
        content: "Your location, prayer calculation preferences, goals and your data.",
      },
      { property: "og:title", content: "Settings — Muslim Life OS" },
      {
        property: "og:description",
        content: "Your location, prayer calculation preferences, goals and your data.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="Settings" arabic="الإعْدادات" subtitle="Yours to adjust" />
      <div className="space-y-4 px-5 pb-8">
        <p className="rounded-xl border border-border bg-card px-5 py-6 text-sm text-muted-foreground">
          The full profile form, onboarding checklist and data transparency section
          arrive in the final stage of the build.
        </p>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            signOut();
            navigate({ to: "/login", replace: true });
          }}
        >
          Sign out
        </Button>
      </div>
    </>
  );
}
