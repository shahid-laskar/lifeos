import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LoadingBlock } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { DhikrCard } from "@/components/dhikr/dhikr-card";
import { DhikrSummaryBar } from "@/components/dhikr/dhikr-summary-bar";
import { DhikrSession } from "@/components/dhikr/dhikr-session";
import { PageHeader } from "@/components/layout/page-header";
import { getDhikrItems, logDhikrSession } from "@/lib/api/endpoints";
import type { DhikrCategory } from "@/lib/api/types";
import { DHIKR_CATEGORIES } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<DhikrCategory>("morning");
  const [sessionActive, setSessionActive] = useState(false);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["dhikr-items", category],
    queryFn: () => getDhikrItems(category),
    staleTime: 60 * 60 * 1000, // catalogue is stable for 1 h
  });

  const logMutation = useMutation({
    mutationFn: (counts: Record<string, number>) => {
      const promises = Object.entries(counts).map(([id, count]) => 
        logDhikrSession({ dhikr_item_id: id, count })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dhikr-summary"] });
      toast.success("Session completed");
      setSessionActive(false);
    },
  });

  if (sessionActive && data) {
    return (
      <DhikrSession 
        items={data} 
        onComplete={(counts) => logMutation.mutate(counts)} 
      />
    );
  }

  return (
    <>
      <PageHeader title="Dhikr" arabic="ذِكْر" subtitle="Remembrance, unhurried" />

      {/* Category selector */}
      <div
        role="tablist"
        className="mb-6 flex gap-2 overflow-x-auto pb-2"
      >
        {DHIKR_CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            role="tab"
            aria-selected={category === value}
            onClick={() => setCategory(value)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors",
              category === value
                ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                : "text-[var(--mute)] hover:bg-[var(--line)]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[15px] font-semibold text-[var(--ink)]">
            {DHIKR_CATEGORIES.find((c) => c.value === category)?.label} Dhikr
          </h2>
          <Button 
            onClick={() => setSessionActive(true)}
            disabled={!data || data.length === 0}
            className="rounded-full"
          >
            Start Session
          </Button>
        </div>

        {isPending ? (
          <LoadingBlock label="Loading…" />
        ) : isError ? (
          <ErrorState
            title="Couldn't load dhikr"
            message="Check your connection and try again."
            onRetry={() => refetch()}
          />
        ) : data.length === 0 ? (
          <div className="empty py-12 text-center">
            <p className="mt-1 text-[13px] leading-[1.6] text-[var(--mute)]">
              No dhikr found for this category.
            </p>
          </div>
        ) : (
          data.map((item) => <DhikrCard key={item.id} item={item} />)
        )}
      </div>

      {/* Fixed daily totals bar */}
      <DhikrSummaryBar />
    </>
  );
}
