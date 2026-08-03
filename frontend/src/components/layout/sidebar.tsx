import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BookOpen, Sparkle, Heart, MessageCircle, Users, Settings, BookMarked, User, CheckSquare, Target, Calendar as CalendarIcon, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/quran", label: "Qur'an", icon: BookOpen },
  { to: "/dhikr", label: "Dhikr", icon: Sparkle },
  { to: "/duas", label: "Du'as", icon: Heart },
  { to: "/assistant", label: "Assistant", icon: MessageCircle },
  { to: "/prayer-journal", label: "Prayer Journal", icon: BookMarked },
  { to: "/hadith", label: "Hadith", icon: BookOpen },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/habits", label: "Habits", icon: Activity },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/reading", label: "Reading", icon: BookOpen },
  { to: "/skills", label: "Skills", icon: Target },
  { to: "/planner", label: "Planner", icon: BookMarked },
  { to: "/calendar", label: "Calendar", icon: CalendarIcon },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/families", label: "Family", icon: Users },
  { to: "/learning", label: "Learning", icon: BookOpen },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="side hidden w-[220px] flex-col border-r border-[var(--line)] bg-[var(--surface)] px-4 py-[26px] lg:flex">
      <div className="mb-8 px-3">
        <h1 className="text-[18px] font-bold text-[var(--ink)]">Muslim Life OS</h1>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_LINKS.map((link) => {
          const active = pathname.startsWith(link.to);
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "flex items-center gap-3 rounded-[11px] px-3 py-2 text-[13px] font-medium transition-colors",
                active
                  ? "bg-[var(--primary-soft)] text-[var(--primary)] font-semibold"
                  : "text-[var(--mute)] hover:bg-[var(--primary-soft)] hover:text-[var(--ink)]"
              )}
            >
              <Icon className="size-[18px]" strokeWidth={active ? 2.5 : 2} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
