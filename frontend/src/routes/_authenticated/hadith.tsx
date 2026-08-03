import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { LoadingBlock } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { HadithCard } from "@/components/hadith/hadith-card";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  addHadithBookmark,
  getHadithChapterItems,
  getHadithChapters,
  getHadithCollections,
  listHadithBookmarks,
  removeHadithBookmark,
  searchHadiths,
} from "@/lib/api/endpoints";
import type { HadithItemResponse } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/hadith")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Hadith — Muslim Life OS" },
      {
        name: "description",
        content:
          "Browse authentic hadith collections with chapter navigation, search, and bookmarks.",
      },
      { property: "og:title", content: "Hadith — Muslim Life OS" },
      {
        property: "og:description",
        content:
          "Browse authentic hadith collections with chapter navigation, search, and bookmarks.",
      },
    ],
  }),
  component: HadithPage,
});

type Tab = "browse" | "search" | "bookmarks";

function HadithPage() {
  const [tab, setTab] = useState<Tab>("browse");
  const [collectionSlug, setCollectionSlug] = useState<string>("bukhari");
  const [chapterId, setChapterId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const collectionsQuery = useQuery({
    queryKey: ["hadith-collections"],
    queryFn: getHadithCollections,
    staleTime: 60 * 60 * 1000,
  });

  const chaptersQuery = useQuery({
    queryKey: ["hadith-chapters", collectionSlug],
    queryFn: () => getHadithChapters(collectionSlug),
    enabled: !!collectionSlug,
    staleTime: 60 * 60 * 1000,
  });

  const activeChapterId = chapterId ?? chaptersQuery.data?.[0]?.chapter_id ?? null;

  const hadithsQuery = useQuery({
    queryKey: ["hadith-chapter", collectionSlug, activeChapterId],
    queryFn: () => getHadithChapterItems(collectionSlug, activeChapterId!),
    enabled: activeChapterId !== null,
    staleTime: 60 * 60 * 1000,
  });

  const searchQueryResult = useQuery({
    queryKey: ["hadith-search", submittedQuery],
    queryFn: () => searchHadiths({ q: submittedQuery, limit: 40 }),
    enabled: submittedQuery.trim().length > 0,
  });

  const bookmarksQuery = useQuery({
    queryKey: ["hadith-bookmarks"],
    queryFn: listHadithBookmarks,
  });

  const bookmarkedIds = useMemo(() => {
    return new Set((bookmarksQuery.data ?? []).map((b) => b.hadith_id));
  }, [bookmarksQuery.data]);

  const bookmarkMutation = useMutation({
    mutationFn: async (item: HadithItemResponse) => {
      if (bookmarkedIds.has(item.id)) {
        await removeHadithBookmark(item.id);
        return { action: "removed" as const, id: item.id };
      }
      await addHadithBookmark(item.id);
      return { action: "added" as const, id: item.id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["hadith-bookmarks"] });
      toast({
        title: result.action === "added" ? "Bookmarked" : "Bookmark removed",
      });
    },
    onError: () => {
      toast({
        title: "Could not update bookmark",
        variant: "destructive",
      });
    },
  });

  const selectedCollection = collectionsQuery.data?.find((c) => c.slug === collectionSlug);

  return (
    <>
      <PageHeader
        title="Hadith"
        arabic="حَدِيث"
        subtitle="Authentic collections, carefully sourced"
      />

      <div
        role="tablist"
        aria-label="Hadith views"
        className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-none"
      >
        {(
          [
            ["browse", "Browse"],
            ["search", "Search"],
            ["bookmarks", "Bookmarks"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors",
              tab === id
                ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                : "text-[var(--mute)] hover:bg-[var(--line)]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "browse" ? (
        <div className="flex flex-col gap-6">
          <div
            role="tablist"
            aria-label="Hadith collections"
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
          >
            {collectionsQuery.isSuccess &&
              collectionsQuery.data.map((collection) => (
                <button
                  key={collection.slug}
                  type="button"
                  role="tab"
                  aria-selected={collectionSlug === collection.slug}
                  onClick={() => {
                    setCollectionSlug(collection.slug);
                    setChapterId(null);
                  }}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors border border-[var(--line)]",
                    collectionSlug === collection.slug
                      ? "bg-[var(--ink)] text-[var(--bg)] border-transparent"
                      : "bg-transparent text-[var(--mute)] hover:text-[var(--ink)]"
                  )}
                >
                  {collection.name_english}
                </button>
              ))}
          </div>

          {selectedCollection ? (
            <div className="space-y-1">
              <p dir="rtl" lang="ar" className="arabic text-right text-[20px] text-[var(--brass)]">
                {selectedCollection.name_arabic}
              </p>
              <p className="text-[13px] text-[var(--mute)]">
                {selectedCollection.author_english} &middot; {selectedCollection.hadith_count} hadiths in
                this library slice
              </p>
            </div>
          ) : null}

          {chaptersQuery.isPending ? (
            <LoadingBlock label="Loading chapters" />
          ) : chaptersQuery.isError ? (
            <ErrorState
              title="Couldn't load chapters"
              message="Check your connection and try once more."
              onRetry={() => chaptersQuery.refetch()}
            />
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {chaptersQuery.data?.map((chapter) => (
                <button
                  key={chapter.chapter_id}
                  type="button"
                  onClick={() => setChapterId(chapter.chapter_id)}
                  className={cn(
                    "shrink-0 max-w-[220px] truncate rounded-[12px] border px-3 py-2 text-left text-[13px] transition-colors",
                    activeChapterId === chapter.chapter_id
                      ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--ink)]"
                      : "border-[var(--line)] bg-[var(--surface)] text-[var(--mute)] hover:text-[var(--ink)]"
                  )}
                  title={chapter.name_english}
                >
                  {chapter.name_english}
                  <span className="mt-0.5 block text-[11px] opacity-70">
                    {chapter.hadith_count} hadiths
                  </span>
                </button>
              ))}
            </div>
          )}

          {hadithsQuery.isPending ? (
            <LoadingBlock label="Loading hadiths" />
          ) : hadithsQuery.isError ? (
            <ErrorState
              title="Couldn't load hadiths"
              message="Check your connection and try once more."
              onRetry={() => hadithsQuery.refetch()}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {hadithsQuery.data?.map((item) => (
                <HadithCard
                  key={item.id}
                  item={item}
                  bookmarked={bookmarkedIds.has(item.id)}
                  bookmarkPending={
                    bookmarkMutation.isPending && bookmarkMutation.variables?.id === item.id
                  }
                  onToggleBookmark={(hadith) => bookmarkMutation.mutate(hadith)}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === "search" ? (
        <div className="flex flex-col gap-4">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmittedQuery(searchQuery.trim());
            }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mute)]" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search translation, narrator, or chapter"
                className="h-11 rounded-[14px] border border-[var(--line)] bg-[var(--surface)] pl-9 text-[14px] text-[var(--ink)] focus:border-[var(--primary)] focus:ring-0"
                aria-label="Search hadiths"
              />
            </div>
            <button
              type="submit"
              className="h-11 shrink-0 rounded-[14px] bg-[var(--primary)] px-5 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
            >
              Search
            </button>
          </form>

          {!submittedQuery ? (
            <p className="text-[13px] text-[var(--mute)]">
              Try words like “intention”, “prayer”, or a narrator name.
            </p>
          ) : searchQueryResult.isPending ? (
            <LoadingBlock label="Searching" />
          ) : searchQueryResult.isError ? (
            <ErrorState
              title="Search failed"
              message="Please try again in a moment."
              onRetry={() => searchQueryResult.refetch()}
            />
          ) : (
            <>
              <p className="text-[13px] text-[var(--mute)]">
                {searchQueryResult.data?.total ?? 0} result
                {(searchQueryResult.data?.total ?? 0) === 1 ? "" : "s"} for “{submittedQuery}”
              </p>
              <div className="flex flex-col gap-4">
                {searchQueryResult.data?.results.map((item) => (
                  <HadithCard
                    key={item.id}
                    item={item}
                    bookmarked={bookmarkedIds.has(item.id)}
                    bookmarkPending={
                      bookmarkMutation.isPending && bookmarkMutation.variables?.id === item.id
                    }
                    onToggleBookmark={(hadith) => bookmarkMutation.mutate(hadith)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}

      {tab === "bookmarks" ? (
        <div className="flex flex-col gap-4">
          {bookmarksQuery.isPending ? (
            <LoadingBlock label="Loading bookmarks" />
          ) : bookmarksQuery.isError ? (
            <ErrorState
              title="Couldn't load bookmarks"
              message="Check your connection and try once more."
              onRetry={() => bookmarksQuery.refetch()}
            />
          ) : (bookmarksQuery.data?.length ?? 0) === 0 ? (
            <p className="text-[13px] text-[var(--mute)]">
              No bookmarks yet. Save a hadith while browsing or searching.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {bookmarksQuery.data?.map((bookmark) =>
                bookmark.hadith ? (
                  <HadithCard
                    key={bookmark.id}
                    item={bookmark.hadith}
                    bookmarked
                    bookmarkPending={
                      bookmarkMutation.isPending &&
                      bookmarkMutation.variables?.id === bookmark.hadith_id
                    }
                    onToggleBookmark={(hadith) => bookmarkMutation.mutate(hadith)}
                  />
                ) : null,
              )}
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
