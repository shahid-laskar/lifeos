import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Minus, X, Book } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getPrayerStatus, logPrayer } from "@/lib/api/endpoints";
import type { PrayerName, PrayerStatus } from "@/lib/api/types";
import { PRAYER_LABELS, PRAYER_NAMES } from "@/lib/api/types";
import { todayISO } from "@/lib/prayer";
import { cn } from "@/lib/utils";

const CYCLE: PrayerStatus[] = ["completed", "missed", "excused"];

function nextStatus(current: PrayerStatus | undefined): PrayerStatus {
  if (!current) return CYCLE[0];
  const index = CYCLE.indexOf(current);
  return CYCLE[(index + 1) % CYCLE.length];
}

export function PrayerStatusRow() {
  const date = todayISO();
  const queryClient = useQueryClient();

  const { data: statuses } = useQuery({
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
              <span className="text-[11px] text-muted-foreground">{PRAYER_LABELS[name].latin}</span>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <p className="text-xs leading-relaxed text-muted-foreground flex-1 pr-4">
          Tap to cycle through completed, missed and excused.
        </p>
        <Link
          to="/prayer-journal"
          className="flex items-center gap-2 text-xs font-medium text-primary hover:underline"
        >
          <Book className="size-3" />
          Journal
        </Link>
      </div>
    </section>
  );
}
