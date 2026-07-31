import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { SettingsSection } from "@/components/settings/settings-section";

export const Route = createFileRoute("/_authenticated/profile")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Profile — Muslim Life OS" },
      {
        name: "description",
        content: "Your profile, settings, and account management.",
      },
      { property: "og:title", content: "Profile — Muslim Life OS" },
      {
        property: "og:description",
        content: "Your profile, settings, and account management.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="Profile" arabic="المِلْف" subtitle="Your account" />
      <div className="space-y-4 px-5 pb-8">
        <SettingsSection />
        <div className="pt-4">
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
      </div>
    </>
  );
}
