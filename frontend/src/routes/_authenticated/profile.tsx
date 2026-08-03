import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
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
      <div className="flex flex-col gap-4">
        
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-[14px]">Islamic Learning</h4>
              <p className="text-[12px] text-[var(--mute)]">Explore structured courses and modules</p>
            </div>
            <Link
              to="/learning"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--primary)] hover:underline"
            >
              Go to Learning
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-[14px]">Daily Planner</h4>
              <p className="text-[12px] text-[var(--mute)]">Plan your day around your prayers</p>
            </div>
            <Link
              to="/planner"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--primary)] hover:underline"
            >
              Go to Planner
            </Link>
          </div>
        </div>

        <SettingsSection />
        <div className="pt-4">
          <button
            onClick={() => {
              signOut();
              navigate({ to: "/login", replace: true });
            }}
            className="w-full rounded-[14px] border border-[var(--line)] bg-[var(--surface)] py-3 text-[14px] font-semibold text-[var(--mute)] transition-colors hover:bg-[var(--bg)] hover:text-[var(--ink)]"
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}
