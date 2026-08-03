import { createFileRoute } from "@tanstack/react-router";
import { SettingsSection } from "@/components/settings/settings-section";

export const Route = createFileRoute("/_authenticated/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Settings — Muslim Life OS" },
      {
        name: "description",
        content: "Configure your location, prayer method, theme, and account preferences.",
      },
      { property: "og:title", content: "Settings — Muslim Life OS" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <>
      {/* Settings page title uses Lora serif per mockup spec (0I) */}
      <header className="mb-6">
        <h1
          className="text-[26px] font-[500] tracking-[-0.01em] text-[var(--ink)]"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Settings
        </h1>
        <p className="mt-1 text-[13px] text-[var(--mute)]">
          Preferences, location, and account
        </p>
      </header>

      <SettingsSection />
    </>
  );
}
