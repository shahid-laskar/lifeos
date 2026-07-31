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

  const activeChapterId =
    chapterId ?? chaptersQuery.data?.[0]?.chapter_id ?? null;

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

  const selectedCollection = collectionsQuery.data?.find(
    (c) => c.slug === collectionSlug,
  );

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
        className="mx-5 mb-4 flex gap-2 overflow-x-auto pb-2"
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
              "shrink-0 px-4 py-2 text-sm font-medium transition-colors",
              tab === id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/50 text-secondary-foreground hover:bg-secondary/80",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "browse" ? (
        <div className="space-y-4 px-5 pb-10">
          <div
            role="tablist"
            aria-label="Hadith collections"
            className="flex gap-2 overflow-x-auto pb-1"
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
                    "shrink-0 px-4 py-2 text-sm font-medium transition-colors",
                    collectionSlug === collection.slug
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-secondary-foreground hover:bg-secondary/80",
                  )}
                >
                  {collection.name_english}
                </button>
              ))}
          </div>

          {selectedCollection ? (
            <div className="space-y-1">
              <p
                dir="rtl"
                lang="ar"
                className="arabic text-right text-lg text-gold"
              >
                {selectedCollection.name_arabic}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedCollection.author_english} ·{" "}
                {selectedCollection.hadith_count} hadiths in this library slice
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
            <div className="flex gap-2 overflow-x-auto pb-1">
              {chaptersQuery.data?.map((chapter) => (
                <button
                  key={chapter.chapter_id}
                  type="button"
                  onClick={() => setChapterId(chapter.chapter_id)}
                  className={cn(
                    "shrink-0 max-w-[220px] truncate border px-3 py-2 text-left text-sm transition-colors",
                    activeChapterId === chapter.chapter_id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                  title={chapter.name_english}
                >
                  {chapter.name_english}
                  <span className="mt-0.5 block text-xs opacity-70">
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
            <div className="space-y-4">
              {hadithsQuery.data?.map((item) => (
                <HadithCard
                  key={item.id}
                  item={item}
                  bookmarked={bookmarkedIds.has(item.id)}
                  bookmarkPending={
                    bookmarkMutation.isPending &&
                    bookmarkMutation.variables?.id === item.id
                  }
                  onToggleBookmark={(hadith) => bookmarkMutation.mutate(hadith)}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === "search" ? (
        <div className="space-y-4 px-5 pb-10">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmittedQuery(searchQuery.trim());
            }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search translation, narrator, or chapter"
                className="h-12 pl-10"
                aria-label="Search hadiths"
              />
            </div>
            <button
              type="submit"
              className="h-12 shrink-0 bg-primary px-5 text-sm font-medium text-primary-foreground"
            >
              Search
            </button>
          </form>

          {!submittedQuery ? (
            <p className="text-sm text-muted-foreground">
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
              <p className="text-sm text-muted-foreground">
                {searchQueryResult.data?.total ?? 0} result
                {(searchQueryResult.data?.total ?? 0) === 1 ? "" : "s"} for “
                {submittedQuery}”
              </p>
              <div className="space-y-4">
                {searchQueryResult.data?.results.map((item) => (
                  <HadithCard
                    key={item.id}
                    item={item}
                    bookmarked={bookmarkedIds.has(item.id)}
                    bookmarkPending={
                      bookmarkMutation.isPending &&
                      bookmarkMutation.variables?.id === item.id
                    }
                    onToggleBookmark={(hadith) =>
                      bookmarkMutation.mutate(hadith)
                    }
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}

      {tab === "bookmarks" ? (
        <div className="space-y-4 px-5 pb-10">
          {bookmarksQuery.isPending ? (
            <LoadingBlock label="Loading bookmarks" />
          ) : bookmarksQuery.isError ? (
            <ErrorState
              title="Couldn't load bookmarks"
              message="Check your connection and try once more."
              onRetry={() => bookmarksQuery.refetch()}
            />
          ) : (bookmarksQuery.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              No bookmarks yet. Save a hadith while browsing or searching.
            </p>
          ) : (
            <div className="space-y-4">
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
                    onToggleBookmark={(hadith) =>
                      bookmarkMutation.mutate(hadith)
                    }
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
