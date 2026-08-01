import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Minus, X, Book } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getPrayerStatus, logPrayer } from "@/lib/api/endpoints";
import type { PrayerName, PrayerStatus, PrayerTimes } from "@/lib/api/types";
import { PRAYER_LABELS, PRAYER_NAMES } from "@/lib/api/types";
import { nextPrayer, todayISO } from "@/lib/prayer";
import { Skeleton } from "@/components/ui/skeleton";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function getLastPrayer(upcomingName: string | undefined): PrayerName | null {
  if (!upcomingName) return null;
  if (upcomingName === "sunrise") return "fajr";
  if (upcomingName === "fajr") return "isha";
  
  const index = PRAYER_NAMES.indexOf(upcomingName as PrayerName);
  if (index > 0) return PRAYER_NAMES[index - 1];
  return null;
}

export function PrayerStatusRow({ times }: { times?: PrayerTimes }) {
  const date = todayISO();
  const queryClient = useQueryClient();
  const [drawerPrayer, setDrawerPrayer] = useState<PrayerName | null>(null);
  const [khushooPromptPrayer, setKhushooPromptPrayer] = useState<PrayerName | null>(null);

  const { data: statuses, isPending } = useQuery({
    queryKey: ["prayer-logs", date],
    queryFn: () => getPrayerStatus(date),
  });

  const mutation = useMutation({
    mutationFn: (input: { prayer: PrayerName; status: PrayerStatus }) =>
      logPrayer({ ...input, date }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["prayer-logs", date] });
      const previous = queryClient.getQueryData(["prayer-logs", date]);
      queryClient.setQueryData(
        ["prayer-logs", date],
        (old: Partial<Record<PrayerName, PrayerStatus>> | undefined) => ({
          ...(old ?? {}),
          [input.prayer]: input.status,
        }),
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(["prayer-logs", date], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["prayer-logs", date] });
      queryClient.invalidateQueries({ queryKey: ["prayer-consistency"] });
    },
  });

  const handleSelect = (prayer: PrayerName, newStatus: PrayerStatus, oldStatus: PrayerStatus | undefined) => {
    mutation.mutate({ prayer, status: newStatus });
    setDrawerPrayer(null);
    
    toast(`Marked ${PRAYER_LABELS[prayer].latin} as ${newStatus}`, {
      duration: 10000,
      action: oldStatus ? {
        label: "Undo",
        onClick: () => mutation.mutate({ prayer, status: oldStatus })
      } : undefined
    });

    if (newStatus === "completed") {
      setKhushooPromptPrayer(prayer);
      setTimeout(() => {
        setKhushooPromptPrayer(current => current === prayer ? null : current);
      }, 5000);
    } else {
      setKhushooPromptPrayer(null);
    }
  };

  const upcoming = times ? nextPrayer(times, new Date()) : null;
  const lastPrayer = getLastPrayer(upcoming?.name);
  const lastPrayerLabel = lastPrayer ? PRAYER_LABELS[lastPrayer].latin : "";

  return (
    <>
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-foreground">Today's prayers</h2>
          <p className="text-xs text-muted-foreground">Tap to log</p>
        </div>
        
        <ul className="mt-4 grid grid-cols-5 gap-2 relative">
          {PRAYER_NAMES.map((name) => {
            const status = statuses?.[name];
            return (
              <li key={name} className="flex flex-col items-center gap-2 relative">
                {isPending ? (
                  <Skeleton className="size-12 rounded-full" />
                ) : (
                  <button
                    type="button"
                    aria-label={`${PRAYER_LABELS[name].latin}: ${status ?? "not logged"}`}
                    onClick={() => setDrawerPrayer(name)}
                    className={cn(
                      "flex size-12 items-center justify-center rounded-full border motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out",
                      status === "completed" && "border-primary bg-primary text-primary-foreground fill-primary",
                      status === "missed" &&
                        "border-muted-foreground/40 bg-muted text-muted-foreground",
                      status === "excused" && "border-gold bg-gold/20 text-gold-foreground",
                      !status && "border-dashed border-border bg-background text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    {status === "completed" ? <Check className="size-5" /> : null}
                    {status === "missed" ? <X className="size-5" /> : null}
                    {status === "excused" ? <Minus className="size-5" /> : null}
                  </button>
                )}
                <span className="text-[11px] text-muted-foreground">{PRAYER_LABELS[name].latin}</span>
              </li>
            );
          })}
        </ul>

        {khushooPromptPrayer && (
          <div className="mt-4 flex flex-col items-center rounded-xl bg-muted p-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-300">
            <p className="text-sm font-medium">How was your {PRAYER_LABELS[khushooPromptPrayer].latin}?</p>
            <div className="mt-3 flex justify-between w-full max-w-[200px] text-2xl">
              {["🌑", "🌘", "🌗", "🌖", "🌕"].map((icon, i) => (
                <button 
                  key={i} 
                  className="motion-safe:hover:scale-125 motion-safe:transition-transform"
                  onClick={() => {
                    toast.success("Reflection saved");
                    setKhushooPromptPrayer(null);
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          {lastPrayer ? (
            <p className="text-sm font-medium text-foreground flex-1 pr-4">
              How was your {lastPrayerLabel}?
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground flex-1 pr-4">
              Tap a prayer to log its status.
            </p>
          )}
          <Link
            to="/prayer-journal"
            className="flex items-center gap-2 text-xs font-medium text-primary hover:underline"
          >
            <Book className="size-3" />
            {lastPrayer ? "Reflect" : "Journal"}
          </Link>
        </div>
      </section>

      <Drawer open={!!drawerPrayer} onOpenChange={(open) => !open && setDrawerPrayer(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Log {drawerPrayer ? PRAYER_LABELS[drawerPrayer].latin : ""} Prayer</DrawerTitle>
          </DrawerHeader>
          <div className="flex justify-center gap-4 p-4 pb-8">
            <button
              className="flex flex-col items-center gap-2 p-4 w-[100px] rounded-xl border border-border hover:bg-muted transition-colors"
              onClick={() => handleSelect(drawerPrayer!, "completed", statuses?.[drawerPrayer!])}
            >
              <div className="flex size-14 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground">
                <Check className="size-6" />
              </div>
              <span className="text-sm font-medium">Prayed</span>
            </button>
            <button
              className="flex flex-col items-center gap-2 p-4 w-[100px] rounded-xl border border-border hover:bg-muted transition-colors"
              onClick={() => handleSelect(drawerPrayer!, "missed", statuses?.[drawerPrayer!])}
            >
              <div className="flex size-14 items-center justify-center rounded-full border border-muted-foreground/40 bg-muted text-muted-foreground">
                <X className="size-6" />
              </div>
              <span className="text-sm font-medium">Missed</span>
            </button>
            <button
              className="flex flex-col items-center gap-2 p-4 w-[100px] rounded-xl border border-border hover:bg-muted transition-colors"
              onClick={() => handleSelect(drawerPrayer!, "excused", statuses?.[drawerPrayer!])}
            >
              <div className="flex size-14 items-center justify-center rounded-full border border-gold bg-gold/20 text-gold-foreground">
                <Minus className="size-6" />
              </div>
              <span className="text-sm font-medium">Excused</span>
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
