import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bookmark, BookmarkCheck, BookOpen, CheckCircle2, Circle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoadingBlock } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import {
  addBookmark,
  getBookmarks,
  getSurahAyahs,
  removeBookmark,
  updateReadingProgress,
  getAyahTafsir,
  getHifdhProgress,
  markAyahMemorised,
} from "@/lib/api/endpoints";
import type { SurahResponse } from "@/lib/api/types";

/**
 * Debounce helper — returns a function that fires `fn` after `delay` ms of
 * inactivity. Complies with CONSTITUTION.md: we debounce reading-progress
 * updates at 2 s, not on every scroll event.
 */
function useDebounce<T extends unknown[]>(fn: (...args: T) => void, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (...args: T) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay],
  );
}

function AyahCard({
  numberInSurah,
  text,
  surahNumber,
  isBookmarked,
  onBookmark,
  onUnbookmark,
  isMemorised,
  onMemorise,
}: {
  numberInSurah: number;
  text: string;
  surahNumber: number;
  isBookmarked: boolean;
  onBookmark: (ayah: number) => void;
  onUnbookmark: (ayah: number) => void;
  isMemorised: boolean;
  onMemorise: (ayah: number) => void;
}) {
  const [showTafsir, setShowTafsir] = useState(false);
  const [tafsirSource, setTafsirSource] = useState("ibn_kathir");

  const tafsirQuery = useQuery({
    queryKey: ["tafsir", surahNumber, numberInSurah, tafsirSource],
    queryFn: () => getAyahTafsir(surahNumber, numberInSurah, tafsirSource),
    enabled: showTafsir,
  });

  return (
    <article
      id={`ayah-${numberInSurah}`}
      className="border-b border-border px-5 py-6 last:border-none"
    >
      <div className="mb-4 flex items-center justify-between">
        {/* Ayah number circle */}
        <span className="flex size-9 items-center justify-center rounded-full border border-border text-sm font-semibold tabular-nums text-muted-foreground">
          {numberInSurah}
        </span>

        {/* Bookmark toggle */}
        <button
          type="button"
          aria-label={
            isBookmarked
              ? `Remove bookmark from ayah ${numberInSurah}`
              : `Bookmark ayah ${numberInSurah}`
          }
          onClick={() => (isBookmarked ? onUnbookmark(numberInSurah) : onBookmark(numberInSurah))}
          className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-gold/10"
        >
          {isBookmarked ? (
            <BookmarkCheck className="size-5 text-gold" />
          ) : (
            <Bookmark className="size-5 text-muted-foreground" />
          )}
        </button>
        <button
          type="button"
          aria-label={`View Tafsir for ayah ${numberInSurah}`}
          onClick={() => setShowTafsir(!showTafsir)}
          className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-gold/10"
        >
          <BookOpen className="size-5 text-muted-foreground" />
        </button>
        <button
          type="button"
          aria-label={`Mark ayah ${numberInSurah} as memorised`}
          onClick={() => !isMemorised && onMemorise(numberInSurah)}
          disabled={isMemorised}
          className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-gold/10 disabled:opacity-50"
        >
          {isMemorised ? (
            <CheckCircle2 className="size-5 text-gold" />
          ) : (
            <Circle className="size-5 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Arabic text — RTL, Amiri, ≥28px as per CONSTITUTION.md */}
      <p
        lang="ar"
        dir="rtl"
        className="arabic text-right text-[30px] leading-[2.2] text-foreground"
      >
        {text}
      </p>

      {showTafsir && (
        <div className="mt-6 rounded-lg bg-muted p-4">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-semibold text-sm">Tafsir</h4>
            <select
              value={tafsirSource}
              onChange={(e) => setTafsirSource(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            >
              <option value="ibn_kathir">Ibn Kathir</option>
              <option value="jalalayn">Jalalayn</option>
            </select>
          </div>
          {tafsirQuery.isPending ? (
            <LoadingBlock label="Loading tafsir..." />
          ) : tafsirQuery.isError ? (
            <ErrorState
              title="Error"
              message="Couldn't load tafsir."
              onRetry={() => tafsirQuery.refetch()}
            />
          ) : (
            <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {tafsirQuery.data?.text || "No tafsir found for this ayah."}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export function AyahReader({ surah, onBack }: { surah: SurahResponse; onBack: () => void }) {
  const queryClient = useQueryClient();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const ayahsQuery = useQuery({
    queryKey: ["surah-ayahs", surah.number],
    queryFn: () => getSurahAyahs(surah.number),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const bookmarksQuery = useQuery({
    queryKey: ["bookmarks"],
    queryFn: getBookmarks,
  });

  // Set of ayah numbers that are bookmarked for this surah
  const bookmarkedAyahs = useMemo(() => {
    const set = new Set<number>();
    if (!bookmarksQuery.data) return set;
    for (const b of bookmarksQuery.data) {
      if (b.surah_number === surah.number) set.add(b.ayah_number);
    }
    return set;
  }, [bookmarksQuery.data, surah.number]);

  const hifdhQuery = useQuery({
    queryKey: ["hifdh-progress"],
    queryFn: getHifdhProgress,
  });

  const memorisedAyahs = useMemo(() => {
    const set = new Set<number>();
    if (!hifdhQuery.data) return set;
    const progress = hifdhQuery.data.find((p) => p.surah_number === surah.number);
    if (progress) {
      progress.ayahs_memorised.forEach((a) => set.add(a));
    }
    return set;
  }, [hifdhQuery.data, surah.number]);

  const addBookmarkMutation = useMutation({
    mutationFn: (ayahNumber: number) =>
      addBookmark({ surah_number: surah.number, ayah_number: ayahNumber }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["bookmarks"] }),
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: (ayahNumber: number) => removeBookmark(surah.number, ayahNumber),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["bookmarks"] }),
  });

  const memoriseMutation = useMutation({
    mutationFn: (ayahNumber: number) => markAyahMemorised(surah.number, ayahNumber),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["hifdh-progress"] });
      queryClient.invalidateQueries({ queryKey: ["hifdh-review"] });
    },
  });

  // Scroll-debounced reading progress update (2 s debounce per spec)
  const [lastVisibleAyah, setLastVisibleAyah] = useState(1);

  const debouncedProgressUpdate = useDebounce(
    useCallback(
      (ayahNumber: number) => {
        void updateReadingProgress({
          surah_number: surah.number,
          last_ayah_number: ayahNumber,
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ["reading-progress"] });
        });
      },
      [surah.number, queryClient],
    ),
    2000,
  );

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    function onScroll() {
      const articles = container!.querySelectorAll("article[id^='ayah-']");
      let bottomMost = 1;
      for (const el of articles) {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.75) {
          const num = parseInt(el.id.replace("ayah-", ""), 10);
          if (!isNaN(num) && num > bottomMost) bottomMost = num;
        }
      }
      if (bottomMost !== lastVisibleAyah) {
        setLastVisibleAyah(bottomMost);
        debouncedProgressUpdate(bottomMost);
      }
    }

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [debouncedProgressUpdate, lastVisibleAyah]);

  return (
    <div className="flex h-full flex-col">
      {/* Reader header */}
      <header className="flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          id="ayah-reader-back"
          aria-label="Back to surah list"
          onClick={onBack}
          className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-accent"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="truncate font-semibold text-foreground">
            {surah.number}. {surah.transliterated_name}
          </p>
          <p className="text-xs text-muted-foreground">{surah.meaning}</p>
        </div>
        <p
          lang="ar"
          dir="rtl"
          className="arabic shrink-0 text-[22px] text-gold"
          style={{ lineHeight: 1.4 }}
        >
          {surah.arabic_name}
        </p>
      </header>

      {/* Scrollable ayah list */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {ayahsQuery.isPending ? (
          <LoadingBlock label="Loading ayahs…" />
        ) : ayahsQuery.isError ? (
          <ErrorState
            title="Couldn't load this surah"
            message="Check your connection and try again."
            onRetry={() => ayahsQuery.refetch()}
            className="m-5"
          />
        ) : (
          <div className="pb-24">
            {ayahsQuery.data.ayahs.map((ayah) => (
              <AyahCard
                key={ayah.number_in_surah}
                numberInSurah={ayah.number_in_surah}
                text={ayah.text}
                surahNumber={surah.number}
                isBookmarked={bookmarkedAyahs.has(ayah.number_in_surah)}
                onBookmark={(n) => addBookmarkMutation.mutate(n)}
                onUnbookmark={(n) => removeBookmarkMutation.mutate(n)}
                isMemorised={memorisedAyahs.has(ayah.number_in_surah)}
                onMemorise={(n) => memoriseMutation.mutate(n)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
