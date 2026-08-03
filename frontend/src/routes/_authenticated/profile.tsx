import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { signOut } from "@/lib/auth";
import {
  BookMarked, MessageCircle, Library, Users, Settings, Timer,
  ClipboardList, CheckSquare, Target, Activity, ScrollText,
  GraduationCap, Heart, Leaf
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profile")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "More — Muslim Life OS" },
      {
        name: "description",
        content: "Access all features — assistant, family, settings, and more.",
      },
      { property: "og:title", content: "More — Muslim Life OS" },
    ],
  }),
  component: ProfilePage,
});

const SECTIONS = [
  {
    title: "Faith",
    links: [
      { to: "/prayer-journal", label: "Prayer Journal", icon: BookMarked, desc: "Reflect on your khushoo" },
      { to: "/hadith", label: "Hadith", icon: Library, desc: "Authentic collections, carefully sourced" },
      { to: "/duas", label: "Du'as", icon: Heart, desc: "Supplications for every occasion" },
    ],
  },
  {
    title: "Productivity",
    links: [
      { to: "/tasks", label: "Tasks", icon: CheckSquare, desc: "Manage your priorities and intentions" },
      { to: "/planner", label: "Daily Planner", icon: ClipboardList, desc: "Plan your day around your prayers" },
      { to: "/goals", label: "Goals", icon: Target, desc: "Set long-term milestones" },
      { to: "/deep-work", label: "Deep Work", icon: Timer, desc: "Focus without distractions" },
      { to: "/reviews", label: "Weekly Review", icon: Activity, desc: "Reflect and set intentions" },
    ],
  },
  {
    title: "Personal Growth",
    links: [
      { to: "/habits", label: "Habits", icon: Activity, desc: "Build consistent daily practices" },
      { to: "/journal", label: "Reflection Journal", icon: ScrollText, desc: "Private reflections and gratitude" },
      { to: "/reading", label: "Reading", icon: BookMarked, desc: "Track your reading journey" },
      { to: "/learning", label: "Islamic Learning", icon: GraduationCap, desc: "Explore structured courses and modules" },
    ],
  },
  {
    title: "Community & Health",
    links: [
      { to: "/families", label: "Family", icon: Users, desc: "Shared goals and activities" },
      { to: "/health", label: "Health", icon: Leaf, desc: "Sleep, exercise, and wellbeing" },
      { to: "/community", label: "Community", icon: Users, desc: "Charity, masjid, and volunteering" },
    ],
  },
  {
    title: "Account",
    links: [
      { to: "/assistant", label: "AI Assistant", icon: MessageCircle, desc: "Your calm, supportive study companion" },
      { to: "/settings", label: "Settings", icon: Settings, desc: "Location, prayer method, and preferences" },
    ],
  },
];

function ProfilePage() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="More" arabic="المزيد" subtitle="All features and settings" />
      <div className="flex flex-col gap-6">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--mute)]">
              {section.title}
            </h2>
            <div className="overflow-hidden rounded-[16px] border border-[var(--line)] bg-[var(--surface)]">
              {section.links.map((link, i) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={cn(
                      "flex min-h-[56px] items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg)]",
                      i > 0 && "border-t border-[var(--line)]"
                    )}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[var(--primary-soft)] text-[var(--primary)]">
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-medium text-[var(--ink)]">{link.label}</div>
                      <div className="text-[12px] text-[var(--mute)] truncate">{link.desc}</div>
                    </div>
                    <svg className="h-4 w-4 text-[var(--mute)]" viewBox="0 0 16 16" fill="none">
                      <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-2">
          <button
            onClick={() => {
              signOut();
              navigate({ to: "/login", replace: true });
            }}
            className="w-full min-h-[56px] rounded-[16px] border border-[var(--line)] bg-[var(--surface)] py-3 text-[14px] font-semibold text-[var(--mute)] transition-colors hover:bg-[var(--bg)] hover:text-[var(--ink)]"
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}
