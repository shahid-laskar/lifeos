import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LoadingBlock } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { DuaCard } from "@/components/dua/dua-card";
import { PageHeader } from "@/components/layout/page-header";
import { getDuaCategories, getDuas } from "@/lib/api/endpoints";
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

function DuasPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Morning");

  const categoriesQuery = useQuery({
    queryKey: ["dua-categories"],
    queryFn: getDuaCategories,
    staleTime: 60 * 60 * 1000,
  });

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["duas", selectedCategory],
    queryFn: () => getDuas(selectedCategory),
    staleTime: 60 * 60 * 1000,
    enabled: !!selectedCategory,
  });

  return (
    <>
      <PageHeader
        title="Du'as"
        arabic="دُعَاء"
        subtitle="Supplications for every occasion"
      />

      {/* Category tab bar */}
      <div
        role="tablist"
        aria-label="Dua categories"
        className="mx-5 mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none"
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
                "shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/50 text-secondary-foreground hover:bg-secondary/80",
              )}
            >
              {cat}
            </button>
          ))}
      </div>

      {/* Items */}
      <div className="space-y-4 px-5 pb-8">
        {isPending ? (
          <LoadingBlock label="Loading Du'as…" />
        ) : isError ? (
          <ErrorState
            title="Couldn't load Du'as"
            message="Check your connection and try again."
            onRetry={() => refetch()}
          />
        ) : data.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No Du'as found for this category.
          </p>
        ) : (
          data.map((item) => <DuaCard key={item.id} item={item} />)
        )}
      </div>
    </>
  );
}
