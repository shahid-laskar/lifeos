import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { logDhikrSession } from "@/lib/api/endpoints";
import type { DhikrItemResponse } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/**
 * Individual dhikr card with a large circular tap counter.
 *
 * CONSTITUTION.md compliance:
 * - At recommended_count: subtle gold pulse only — no confetti, no sound,
 *   no congratulations banner (Principle 6: Humility over Gamification).
 * - "Log Session" posts to POST /api/v1/dhikr/sessions only.
 * - No streak counters anywhere in state or UI.
 */
export function DhikrCard({ item }: { item: DhikrItemResponse }) {
  const queryClient = useQueryClient();
  const [count, setCount] = useState(0);
  const atTarget = count >= item.recommended_count;

  const logMutation = useMutation({
    mutationFn: () => logDhikrSession({ dhikr_item_id: item.id, count }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dhikr-summary"] });
      setCount(0);
    },
  });

  return (
    <article id={`dhikr-${item.id}`} className="rounded-2xl border border-border bg-card p-5">
      {/* Arabic text — RTL, Amiri, ≥28px per CONSTITUTION.md */}
      <p
        lang="ar"
        dir="rtl"
        className="arabic mb-3 text-right text-[30px] leading-[2.1] text-foreground"
      >
        {item.arabic_text}
      </p>

      {/* Transliteration */}
      <p className="mb-1 text-sm italic text-muted-foreground">{item.transliteration}</p>

      {/* Meaning */}
      <p className="mb-1 text-sm text-foreground">{item.meaning}</p>

      {/* Source */}
      <p className="mb-5 text-xs text-muted-foreground">Source: {item.source}</p>

      {/* Counter row */}
      <div className="flex items-center justify-between gap-4">
        {/* Large circular tap counter */}
        <button
          type="button"
          id={`dhikr-counter-${item.id}`}
          aria-label={`Count for ${item.transliteration}. Current: ${count} of ${item.recommended_count}`}
          onClick={() => setCount((c) => c + 1)}
          className={cn(
            "relative flex size-20 shrink-0 flex-col items-center justify-center rounded-full border-2 text-center transition-all active:scale-95",
            atTarget
              ? "border-gold bg-gold/10 gold-pulse"
              : "border-border bg-muted/40 hover:border-primary/50 hover:bg-muted/60",
          )}
        >
          <span
            className={cn(
              "text-2xl font-bold tabular-nums leading-none",
              atTarget ? "text-gold-foreground" : "text-foreground",
            )}
          >
            {count}
          </span>
          <span className="text-[10px] text-muted-foreground">/ {item.recommended_count}</span>
        </button>

        {/* Right side: reset + log */}
        <div className="flex flex-1 flex-col gap-2">
          <button
            type="button"
            id={`dhikr-log-${item.id}`}
            disabled={count === 0 || logMutation.isPending}
            onClick={() => logMutation.mutate()}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40"
          >
            {logMutation.isPending ? "Logging…" : "Log Session"}
          </button>
          <button
            type="button"
            id={`dhikr-reset-${item.id}`}
            disabled={count === 0}
            onClick={() => setCount(0)}
            className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent disabled:opacity-40"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Success feedback — calm, no banner, no confetti */}
      {logMutation.isSuccess ? (
        <p role="status" className="mt-3 text-center text-xs text-muted-foreground">
          Session recorded.
        </p>
      ) : null}
    </article>
  );
}
