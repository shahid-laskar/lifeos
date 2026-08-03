import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CardSkeleton } from "@/components/home/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/brand/states";
import { DuaCard } from "@/components/dua/dua-card";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/ui/use-toast";
import { SearchBar } from "@/components/ui/search-bar";
import { getDuaCategories, getDuas, getDuaBookmarks, addDuaBookmark, removeDuaBookmark } from "@/lib/api/endpoints";
import type { DuaItemResponse } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/duas")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Du'as — Muslim Life OS" },
      {
        name: "description",
        content: "A curated collection of authentic supplications.",
      },
      { property: "og:title", content: "Du'as — Muslim Life OS" },
      {
        property: "og:description",
        content: "A curated collection of authentic supplications.",
      },
    ],
  }),
  component: DuasPage,
});

type Tab = "browse" | "bookmarks";

function DuasPage() {
  const [tab, setTab] = useState<Tab>("browse");
  const [selectedCategory, setSelectedCategory] = useState<string>("Morning");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ["dua-categories"],
    queryFn: getDuaCategories,
    staleTime: 60 * 60 * 1000,
  });

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["duas", selectedCategory],
    queryFn: () => getDuas(selectedCategory),
    staleTime: 60 * 60 * 1000,
    enabled: !!selectedCategory && tab === "browse",
  });

  const bookmarksQuery = useQuery({
    queryKey: ["dua-bookmarks"],
    queryFn: getDuaBookmarks,
    enabled: tab === "bookmarks" || tab === "browse",
  });

  const bookmarkedIds = useMemo(() => {
    return new Set((bookmarksQuery.data ?? []).map((b) => b.dua_id));
  }, [bookmarksQuery.data]);

  const bookmarkMutation = useMutation({
    mutationFn: async (item: DuaItemResponse) => {
      if (bookmarkedIds.has(item.id)) {
        await removeDuaBookmark(item.id);
        return { action: "removed" as const, id: item.id };
      }
      await addDuaBookmark(item.id);
      return { action: "added" as const, id: item.id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["dua-bookmarks"] });
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

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      (item) =>
        item.translation.toLowerCase().includes(q) ||
        item.transliteration.toLowerCase().includes(q) ||
        item.arabic_text.includes(q)
    );
  }, [data, searchQuery]);

  return (
    <>
      <PageHeader title="Du'as" arabic="دُعَاء" subtitle="Supplications for every occasion" />

      {/* Main Tab bar */}
      <div
        role="tablist"
        aria-label="Duas views"
        className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-none"
      >
        {(
          [
            ["browse", "Browse"],
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
        <>
          <div className="mb-6">
            <SearchBar 
              placeholder="Search Du'as..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Category tab bar */}
          <div
            role="tablist"
            aria-label="Dua categories"
            className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-none"
          >
            {categoriesQuery.isSuccess &&
              categoriesQuery.data.map((cat) => (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={selectedCategory === cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors border border-[var(--line)]",
                    selectedCategory === cat
                      ? "bg-[var(--ink)] text-[var(--bg)] border-transparent"
                      : "bg-transparent text-[var(--mute)] hover:text-[var(--ink)]"
                  )}
                >
                  {cat}
                </button>
              ))}
          </div>

          {/* Items */}
          <div className="flex flex-col gap-4">
            {isPending ? (
              <div className="flex flex-col gap-3">
                <CardSkeleton lines={2} />
                <CardSkeleton lines={2} />
              </div>
            ) : isError ? (
              <ErrorState
                title="Couldn't load Du'as"
                message="Check your connection and try again."
                onRetry={() => refetch()}
              />
            ) : filteredData.length === 0 ? (
              <EmptyState
                glyph="🤲"
                description="No Du'as found for this filter."
              />
            ) : (
              filteredData.map((item) => (
                <DuaCard 
                  key={item.id} 
                  item={item} 
                  bookmarked={bookmarkedIds.has(item.id)}
                  bookmarkPending={bookmarkMutation.isPending && bookmarkMutation.variables?.id === item.id}
                  onToggleBookmark={(dua) => bookmarkMutation.mutate(dua)}
                />
              ))
            )}
          </div>
        </>
      ) : null}

      {tab === "bookmarks" ? (
        <div className="flex flex-col gap-4">
          {bookmarksQuery.isPending ? (
            <div className="flex flex-col gap-3">
              <CardSkeleton lines={2} />
            </div>
          ) : bookmarksQuery.isError ? (
            <ErrorState
              title="Couldn't load bookmarks"
              message="Check your connection and try once more."
              onRetry={() => bookmarksQuery.refetch()}
            />
          ) : (bookmarksQuery.data?.length ?? 0) === 0 ? (
            <EmptyState
              glyph="🔖"
              description="No bookmarks yet. Save a dua while browsing."
            />
          ) : (
            <div className="flex flex-col gap-4">
              {bookmarksQuery.data?.map((bookmark) =>
                bookmark.dua ? (
                  <DuaCard
                    key={bookmark.id}
                    item={bookmark.dua}
                    bookmarked
                    bookmarkPending={
                      bookmarkMutation.isPending &&
                      bookmarkMutation.variables?.id === bookmark.dua_id
                    }
                    onToggleBookmark={(dua) => bookmarkMutation.mutate(dua)}
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
