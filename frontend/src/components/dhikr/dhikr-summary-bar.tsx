import { useQuery } from "@tanstack/react-query";
import { getDhikrSummary } from "@/lib/api/endpoints";
import { todayISO } from "@/lib/prayer";

const LABELS: Array<{
  key: "total_morning" | "total_evening" | "total_post_prayer" | "total_general";
  label: string;
}> = [
  { key: "total_morning", label: "Morning" },
  { key: "total_evening", label: "Evening" },
  { key: "total_post_prayer", label: "Post-Prayer" },
  { key: "total_general", label: "General" },
];

/**
 * Daily totals bar sourced from GET /api/v1/dhikr/summary.
 * Shows totals for each category — no percentages, no targets, no shaming.
 * CONSTITUTION.md: Mercy over Guilt, Consistency over Intensity.
 */
export function DhikrSummaryBar() {
  const date = todayISO();
  const { data } = useQuery({
    queryKey: ["dhikr-summary", date],
    queryFn: () => getDhikrSummary(date),
  });

  const total =
    (data?.total_morning ?? 0) +
    (data?.total_evening ?? 0) +
    (data?.total_post_prayer ?? 0) +
    (data?.total_general ?? 0);

  return (
    <div
      className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-card/95 px-4 py-3 backdrop-blur"
      aria-label="Today's dhikr totals"
    >
      <div className="mx-auto flex max-w-2xl items-center gap-4">
        <p className="shrink-0 text-xs text-muted-foreground">Today</p>
        <div className="flex flex-1 items-center justify-between gap-2">
          {LABELS.map(({ key, label }) => (
            <div key={key} className="flex flex-col items-center">
              <span className="text-base font-semibold tabular-nums text-primary">
                {data?.[key] ?? 0}
              </span>
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
        <div className="shrink-0 text-right">
          <span className="text-base font-semibold tabular-nums text-foreground">
            {total}
          </span>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
      </div>
    </div>
  );
}
