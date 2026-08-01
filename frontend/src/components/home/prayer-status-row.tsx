import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Minus, X, Book } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getPrayerStatus, logPrayer } from "@/lib/api/endpoints";
import type { PrayerName, PrayerStatus, PrayerTimes } from "@/lib/api/types";
import { PRAYER_LABELS, PRAYER_NAMES } from "@/lib/api/types";
import { nextPrayer, todayISO } from "@/lib/prayer";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CYCLE: PrayerStatus[] = ["completed", "missed", "excused"];

function nextStatus(current: PrayerStatus | undefined): PrayerStatus {
  if (!current) return CYCLE[0];
  const index = CYCLE.indexOf(current);
  return CYCLE[(index + 1) % CYCLE.length];
}

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

  const upcoming = times ? nextPrayer(times, new Date()) : null;
  const lastPrayer = getLastPrayer(upcoming?.name);
  const lastPrayerLabel = lastPrayer ? PRAYER_LABELS[lastPrayer].latin : "";

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-foreground">Today's prayers</h2>
        <p className="text-xs text-muted-foreground">Tap to log</p>
      </div>
      <ul className="mt-4 grid grid-cols-5 gap-2">
        {PRAYER_NAMES.map((name) => {
          const status = statuses?.[name];
          return (
            <li key={name} className="flex flex-col items-center gap-2">
              {isPending ? (
                <Skeleton className="size-12 rounded-full" />
              ) : (
                <button
                  type="button"
                  aria-label={`${PRAYER_LABELS[name].latin}: ${status ?? "not logged"}`}
                  onClick={() => mutation.mutate({ prayer: name, status: nextStatus(status) })}
                  className={cn(
                    "flex size-12 items-center justify-center rounded-full border transition-colors",
                    status === "completed" && "border-primary bg-primary text-primary-foreground",
                    status === "missed" &&
                      "border-muted-foreground/40 bg-muted text-muted-foreground",
                    status === "excused" && "border-gold bg-gold/20 text-gold-foreground",
                    !status && "border-dashed border-border bg-background text-muted-foreground",
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
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        {lastPrayer ? (
          <p className="text-sm font-medium text-foreground flex-1 pr-4">
            How was your {lastPrayerLabel}?
          </p>
        ) : (
          <p className="text-xs leading-relaxed text-muted-foreground flex-1 pr-4">
            Tap to cycle through completed, missed and excused.
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
  );
}
