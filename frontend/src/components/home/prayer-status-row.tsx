import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Minus, X, Book, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getPrayerStatus, logPrayer } from "@/lib/api/endpoints";
import type { PrayerName, PrayerStatus, PrayerTimes } from "@/lib/api/types";
import { PRAYER_LABELS, PRAYER_NAMES } from "@/lib/api/types";
import { nextPrayer, todayISO } from "@/lib/prayer";
import { Skeleton } from "@/components/ui/skeleton";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  const handleSelect = (
    prayer: PrayerName,
    newStatus: PrayerStatus,
    oldStatus: PrayerStatus | undefined,
  ) => {
    mutation.mutate({ prayer, status: newStatus });
    setDrawerPrayer(null);

    toast(`Marked ${PRAYER_LABELS[prayer].latin} as ${newStatus}`, {
      duration: 10000,
      action: oldStatus
        ? {
            label: "Undo",
            onClick: () => mutation.mutate({ prayer, status: oldStatus }),
          }
        : undefined,
    });

    if (newStatus === "completed") {
      setKhushooPromptPrayer(prayer);
      setTimeout(() => {
        setKhushooPromptPrayer((current) => (current === prayer ? null : current));
      }, 7000);
    } else {
      setKhushooPromptPrayer(null);
    }
  };

  return (
    <>
      <section className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> Today's Prayers
          </h2>
          <Link
            to="/prayer-journal"
            className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            <Book className="size-3" /> Journal
          </Link>
        </div>

        <div className="flex justify-between items-end relative">
          {PRAYER_NAMES.map((name) => {
            const status = statuses?.[name];
            const isCompleted = status === "completed";
            const isMissed = status === "missed";
            const isExcused = status === "excused";
            const isPendingState = !status;

            return (
              <div key={name} className="flex flex-col items-center gap-2">
                {isPending ? (
                  <>
                    <Skeleton className="size-11 rounded-full" />
                    <Skeleton className="h-2 w-5 mt-1" />
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      aria-label={`${PRAYER_LABELS[name].latin}: ${status ?? "not logged"}`}
                      onClick={() => setDrawerPrayer(name)}
                      className={cn(
                        "flex size-11 items-center justify-center rounded-full border-[1.5px] motion-safe:transition-all motion-safe:duration-300",
                        isCompleted && "border-primary bg-primary shadow-sm shadow-primary/20",
                        isMissed && "border-border bg-transparent text-muted-foreground",
                        isExcused && "border-gold bg-gold/10 text-gold-foreground",
                        isPendingState &&
                          "border-dashed border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
                      )}
                    >
                      {isCompleted && <Check color="#ffffff" className="size-5 stroke-[2.5]" />}
                      {isMissed && <X className="size-5 stroke-[2.5]" />}
                      {isExcused && <Minus className="size-5 stroke-[2.5]" />}
                    </button>
                    <span
                      className={cn(
                        "text-[11px] font-medium transition-colors",
                        isCompleted ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {PRAYER_LABELS[name].latin.substring(0, 3)}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {khushooPromptPrayer && (
          <div className="mt-6 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-4 motion-safe:duration-500 border border-primary/20">
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm font-medium text-foreground text-center">
                Alhamdulillah. How was your focus during {PRAYER_LABELS[khushooPromptPrayer].latin}?
              </p>
              <div className="flex justify-between w-full max-w-[250px] text-3xl">
                {["🌑", "🌘", "🌗", "🌖", "🌕"].map((icon, i) => (
                  <button
                    key={i}
                    className="motion-safe:hover:-translate-y-2 motion-safe:transition-transform hover:drop-shadow-xl"
                    onClick={() => {
                      toast.success("Reflection saved beautifully.");
                      setKhushooPromptPrayer(null);
                    }}
                    title={["Struggled", "Distracted", "Present", "Focused", "Deep Focus"][i]}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <Drawer open={!!drawerPrayer} onOpenChange={(open) => !open && setDrawerPrayer(null)}>
        <DrawerContent className="max-w-md mx-auto rounded-t-3xl border-x border-t border-border/50">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-center text-xl">
              Log {drawerPrayer ? PRAYER_LABELS[drawerPrayer].latin : ""}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex justify-center gap-3 p-6 pb-10">
            <button
              className="flex flex-col items-center gap-3 p-5 w-28 rounded-2xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all group"
              onClick={() => handleSelect(drawerPrayer!, "completed", statuses?.[drawerPrayer!])}
            >
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary transition-colors">
                <Check className="size-6 stroke-[3] text-primary group-hover:text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">Prayed</span>
            </button>
            <button
              className="flex flex-col items-center gap-3 p-5 w-28 rounded-2xl border-2 border-border bg-card hover:border-muted-foreground/30 hover:bg-muted transition-all group"
              onClick={() => handleSelect(drawerPrayer!, "missed", statuses?.[drawerPrayer!])}
            >
              <div className="flex size-14 items-center justify-center rounded-full bg-muted-foreground/10 text-muted-foreground group-hover:bg-muted-foreground group-hover:text-white transition-colors">
                <X className="size-6 stroke-[3]" />
              </div>
              <span className="text-sm font-semibold text-foreground">Missed</span>
            </button>
            <button
              className="flex flex-col items-center gap-3 p-5 w-28 rounded-2xl border-2 border-border bg-card hover:border-gold/50 hover:bg-gold/10 transition-all group"
              onClick={() => handleSelect(drawerPrayer!, "excused", statuses?.[drawerPrayer!])}
            >
              <div className="flex size-14 items-center justify-center rounded-full bg-gold/20 text-gold-foreground group-hover:bg-gold group-hover:text-white transition-colors">
                <Minus className="size-6 stroke-[3]" />
              </div>
              <span className="text-sm font-semibold text-foreground">Excused</span>
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
