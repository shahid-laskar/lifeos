import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BookOpen, Home, MessageCircle, Sparkle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/quran", label: "Qur'an", icon: BookOpen },
  { to: "/dhikr", label: "Dhikr", icon: Sparkle },
  { to: "/assistant", label: "Assistant", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  void navigate;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-between px-1 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.to);
          const Icon = tab.icon;
          return (
            <li key={tab.to} className="flex-1">
              <Link
                to={tab.to}
                className={cn(
                  "flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.2 : 1.7} />
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "h-0.5 w-6 rounded-full transition-colors",
                    active ? "bg-gold" : "bg-transparent",
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
