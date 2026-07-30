import { useQuery } from "@tanstack/react-query";
import { BookOpen, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { LoadingBlock } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { getReadingProgress, getSurahs } from "@/lib/api/endpoints";
import type { ReadingProgressResponse, SurahResponse } from "@/lib/api/types";
import { cn } from "@/lib/utils";

function RevelationBadge({ type }: { type: string }) {
  const isMeccan = type.toLowerCase() === "meccan";
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        isMeccan
          ? "bg-gold/15 text-gold-foreground"
          : "bg-sage/20 text-sage-foreground",
      )}
    >
      {type}
    </span>
  );
}

function ProgressDot({ fraction }: { fraction: number }) {
  if (fraction <= 0) return null;
  const pct = Math.min(Math.round(fraction * 100), 100);
  return (
    <span
      aria-label={`${pct}% read`}
      title={`${pct}% read`}
      className="relative flex size-5 shrink-0 items-center justify-center"
    >
      <svg viewBox="0 0 20 20" className="absolute inset-0 size-full -rotate-90">
        <circle
          cx="10"
          cy="10"
          r="8"
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth="2"
        />
        <circle
          cx="10"
          cy="10"
          r="8"
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="2"
          strokeDasharray={`${2 * Math.PI * 8}`}
          strokeDashoffset={`${2 * Math.PI * 8 * (1 - fraction)}`}
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function SurahList({
  onSelect,
}: {
  onSelect: (surah: SurahResponse) => void;
}) {
  const [search, setSearch] = useState("");

  const surahsQuery = useQuery({
    queryKey: ["surahs"],
    queryFn: getSurahs,
    staleTime: 24 * 60 * 60 * 1000, // surah list is stable for a day
  });

  const progressQuery = useQuery({
    queryKey: ["reading-progress"],
    queryFn: getReadingProgress,
  });

  // Build a map of surah_number → fraction read
  const progressMap = useMemo(() => {
    const map = new Map<number, number>();
    if (!progressQuery.data || !surahsQuery.data) return map;
    const ayahCounts = new Map<number, number>(
      surahsQuery.data.map((s) => [s.number, s.ayah_count]),
    );
    for (const p of progressQuery.data as ReadingProgressResponse[]) {
      const total = ayahCounts.get(p.surah_number);
      if (total) map.set(p.surah_number, p.last_ayah_number / total);
    }
    return map;
  }, [progressQuery.data, surahsQuery.data]);

  const filtered = useMemo(() => {
    if (!surahsQuery.data) return [];
    const q = search.toLowerCase().trim();
    if (!q) return surahsQuery.data;
    return surahsQuery.data.filter(
      (s) =>
        s.transliterated_name.toLowerCase().includes(q) ||
        s.meaning.toLowerCase().includes(q) ||
        s.arabic_name.includes(q) ||
        String(s.number).includes(q),
    );
  }, [surahsQuery.data, search]);

  if (surahsQuery.isPending) return <LoadingBlock label="Loading surahs…" />;
  if (surahsQuery.isError)
    return (
      <ErrorState
        title="Couldn't load surahs"
        message="Check your connection and try again."
        onRetry={() => surahsQuery.refetch()}
        className="mx-5"
      />
    );

  return (
    <div className="flex flex-col gap-0">
      {/* Search bar */}
      <div className="relative mx-5 mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="quran-surah-search"
          type="search"
          placeholder="Search by name or meaning…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          No surahs match "{search}"
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {filtered.map((surah) => {
            const fraction = progressMap.get(surah.number) ?? 0;
            return (
              <li key={surah.number}>
                <button
                  type="button"
                  id={`surah-${surah.number}`}
                  onClick={() => onSelect(surah)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/40 active:bg-accent/60"
                >
                  {/* Number badge */}
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                    {surah.number}
                  </span>

                  {/* Name + meta */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {surah.transliterated_name}
                      </span>
                      <RevelationBadge type={surah.revelation_type} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {surah.meaning} · {surah.ayah_count} ayahs
                    </p>
                  </div>

                  {/* Arabic name */}
                  <span
                    lang="ar"
                    dir="rtl"
                    className="arabic shrink-0 text-xl text-foreground"
                    style={{ lineHeight: 1.5 }}
                  >
                    {surah.arabic_name}
                  </span>

                  {/* Progress ring */}
                  <ProgressDot fraction={fraction} />

                  {/* Chevron */}
                  <BookOpen className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
