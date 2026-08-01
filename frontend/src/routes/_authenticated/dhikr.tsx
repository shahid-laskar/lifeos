import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LoadingBlock } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { DhikrCard } from "@/components/dhikr/dhikr-card";
import { DhikrSummaryBar } from "@/components/dhikr/dhikr-summary-bar";
import { PageHeader } from "@/components/layout/page-header";
import { getDhikrItems } from "@/lib/api/endpoints";
import type { DhikrCategory } from "@/lib/api/types";
import { DHIKR_CATEGORIES } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dhikr")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dhikr — Muslim Life OS" },
      {
        name: "description",
        content: "Morning, evening and post-prayer remembrance with a gentle counter.",
      },
      { property: "og:title", content: "Dhikr — Muslim Life OS" },
      {
        property: "og:description",
        content: "Morning, evening and post-prayer remembrance with a gentle counter.",
      },
    ],
  }),
  component: DhikrPage,
});

function DhikrPage() {
  const [category, setCategory] = useState<DhikrCategory>("morning");

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["dhikr-items", category],
    queryFn: () => getDhikrItems(category),
    staleTime: 60 * 60 * 1000, // catalogue is stable for 1 h
  });

  return (
    <>
      <PageHeader title="Dhikr" arabic="ذِكْر" subtitle="Remembrance, unhurried" />

      {/* Category tab bar */}
      <div
        role="tablist"
        aria-label="Dhikr categories"
        className="mx-5 mb-4 flex gap-1 overflow-x-auto pb-1"
      >
        {DHIKR_CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            id={`dhikr-cat-${value}`}
            role="tab"
            aria-selected={category === value}
            type="button"
            onClick={() => setCategory(value)}
            className={cn(
              "shrink-0 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
              category === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-4 px-5 pb-36">
        {isPending ? (
          <LoadingBlock label="Loading…" />
        ) : isError ? (
          <ErrorState
            title="Couldn't load dhikr"
            message="Check your connection and try again."
            onRetry={() => refetch()}
          />
        ) : data.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No dhikr found for this category.
          </p>
        ) : (
          data.map((item) => <DhikrCard key={item.id} item={item} />)
        )}
      </div>

      {/* Fixed daily totals bar */}
      <DhikrSummaryBar />
    </>
  );
}
