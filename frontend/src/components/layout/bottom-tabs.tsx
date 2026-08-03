import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BookOpen, Sparkle, Heart, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/quran", label: "Qur'an", icon: BookOpen },
  { to: "/dhikr", label: "Dhikr", icon: Sparkle },
  { to: "/duas", label: "Du'as", icon: Heart },
  { to: "/profile", label: "More", icon: Menu }, // 'more' will act as a sub-nav page or sheet, for now points to profile
] as const;

export function BottomTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Bottom Navigation"
      className="tabs fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--surface)] px-2 pb-[20px] pt-[10px] lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.to);
          const Icon = tab.icon;
          return (
            <li key={tab.to} className="flex-1">
              <Link
                to={tab.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-1 text-[11px] font-medium transition-colors",
                  active ? "text-[var(--primary)]" : "text-[var(--mute)] hover:text-[var(--ink)]"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    active ? "bg-[var(--primary-soft)]" : "bg-transparent"
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
                </div>
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
