import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { LoadingBlock } from "@/components/brand/pattern";
import { EmptyState, ErrorState } from "@/components/brand/states";
import { getBookmarks, removeBookmark } from "@/lib/api/endpoints";
import type { BookmarkResponse, SurahResponse } from "@/lib/api/types";

export function BookmarksTab({
  surahs,
  onNavigateToSurah,
}: {
  surahs: SurahResponse[];
  onNavigateToSurah: (surah: SurahResponse) => void;
}) {
  const queryClient = useQueryClient();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: getBookmarks,
  });

  const deleteMutation = useMutation({
    mutationFn: (b: BookmarkResponse) =>
      removeBookmark(b.surah_number, b.ayah_number),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] }),
  });

  // Build lookup map for surah names
  const surahMap = new Map<number, SurahResponse>(surahs.map((s) => [s.number, s]));

  if (isPending) return <LoadingBlock label="Loading bookmarks…" />;
  if (isError)
    return (
      <ErrorState
        title="Couldn't load bookmarks"
        message="Check your connection and try again."
        onRetry={() => refetch()}
        className="mx-5"
      />
    );

  if (data.length === 0)
    return (
      <EmptyState
        title="No bookmarks yet"
        message="Tap the bookmark ribbon on any ayah to save it here."
      />
    );

  return (
    <ul className="divide-y divide-border">
      {data.map((bookmark) => {
        const surah = surahMap.get(bookmark.surah_number);
        return (
          <li
            key={bookmark.id}
            className="flex items-start gap-3 px-5 py-4"
          >
            {/* Gold ribbon */}
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-gold/15">
              <span className="text-gold text-sm">🔖</span>
            </span>

            {/* Info */}
            <button
              type="button"
              id={`bookmark-${bookmark.id}`}
              className="flex-1 text-left"
              onClick={() => surah && onNavigateToSurah(surah)}
            >
              <p className="text-sm font-medium text-foreground">
                {surah?.transliterated_name ?? `Surah ${bookmark.surah_number}`}
                {" "}
                <span className="text-muted-foreground">
                  · Ayah {bookmark.ayah_number}
                </span>
              </p>
              {bookmark.note ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {bookmark.note}
                </p>
              ) : null}
            </button>

            {/* Delete */}
            <button
              type="button"
              aria-label={`Remove bookmark for surah ${bookmark.surah_number} ayah ${bookmark.ayah_number}`}
              onClick={() => deleteMutation.mutate(bookmark)}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
