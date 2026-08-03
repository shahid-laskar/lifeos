import { useQuery } from "@tanstack/react-query";
import { BookOpen, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { LoadingBlock } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { getReadingProgress, getSurahs } from "@/lib/api/endpoints";
import type { ReadingProgressResponse, SurahResponse } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { ArabicText } from "@/components/ui/arabic-text";
import { ProgressRing } from "@/components/ui/progress-ring";

function RevelationBadge({ type }: { type: string }) {
  const isMeccan = type.toLowerCase() === "meccan";
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        isMeccan ? "bg-[#d4af37]/15 text-[#d4af37]" : "bg-[#879f84]/20 text-[#879f84]"
      )}
    >
      {type}
    </span>
  );
}

export function SurahList({ onSelect }: { onSelect: (surah: SurahResponse) => void }) {
  const [search, setSearch] = useState("");

  const surahsQuery = useQuery({
    queryKey: ["surahs"],
    queryFn: getSurahs,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const progressQuery = useQuery({
    queryKey: ["reading-progress"],
    queryFn: getReadingProgress,
  });

  const progressMap = useMemo(() => {
    const map = new Map<number, number>();
    if (!progressQuery.data || !surahsQuery.data) return map;
    const ayahCounts = new Map<number, number>(
      surahsQuery.data.map((s) => [s.number, s.ayah_count]),
    );
    for (const p of progressQuery.data as ReadingProgressResponse[]) {
      const total = ayahCounts.get(p.surah_number);
      if (total) map.set(p.surah_number, (p.last_ayah_number / total) * 100);
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
      />
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mute)]" />
        <input
          id="quran-surah-search"
          type="search"
          placeholder="Search by name or meaning…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-[14px] border border-[var(--line)] bg-[var(--surface)] py-3 pl-10 pr-4 text-[14px] text-[var(--ink)] placeholder:text-[var(--mute)] focus:border-[var(--primary)] focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-[var(--mute)]">
          No surahs match "{search}"
        </p>
      ) : (
        <div className="rounded-[18px] border border-[var(--line)] bg-[var(--surface)]">
          <ul className="divide-y divide-[var(--line)]">
            {filtered.map((surah) => {
              const pct = progressMap.get(surah.number) ?? 0;
              return (
                <li key={surah.number}>
                  <button
                    type="button"
                    onClick={() => onSelect(surah)}
                    className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[var(--bg)]"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[12px] font-semibold text-[var(--primary)]">
                      {surah.number}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--ink)]">
                          {surah.transliterated_name}
                        </span>
                        <RevelationBadge type={surah.revelation_type} />
                      </div>
                      <p className="mt-0.5 text-[12px] text-[var(--mute)]">
                        {surah.meaning} &middot; {surah.ayah_count} ayahs
                      </p>
                    </div>

                    <ArabicText className="shrink-0 text-[20px]">{surah.arabic_name}</ArabicText>

                    {pct > 0 && (
                      <ProgressRing percentage={pct} className="m-0 h-6 w-6 border-[2px]" />
                    )}

                    <BookOpen className="h-4 w-4 shrink-0 text-[var(--mute)]" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
