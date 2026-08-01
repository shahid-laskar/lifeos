import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, CircleDashed, Clock, ChevronRight } from "lucide-react";
import { LoadingBlock } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { getHifdhProgress, getHifdhTodayReview, markAyahMemorised } from "@/lib/api/endpoints";
import type { SurahResponse } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function HifdhTab({
  surahs,
  onNavigateToSurah,
}: {
  surahs: SurahResponse[];
  onNavigateToSurah: (s: SurahResponse) => void;
}) {
  const queryClient = useQueryClient();

  const progressQuery = useQuery({
    queryKey: ["hifdh-progress"],
    queryFn: getHifdhProgress,
  });

  const reviewQuery = useQuery({
    queryKey: ["hifdh-review"],
    queryFn: getHifdhTodayReview,
  });

  const markMutation = useMutation({
    mutationFn: ({ surahNumber, ayahNumber }: { surahNumber: number; ayahNumber: number }) =>
      markAyahMemorised(surahNumber, ayahNumber),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["hifdh-progress"] });
      queryClient.invalidateQueries({ queryKey: ["hifdh-review"] });
    },
  });

  if (progressQuery.isPending || reviewQuery.isPending) {
    return <LoadingBlock label="Loading memorisation data..." />;
  }

  if (progressQuery.isError) {
    return (
      <ErrorState
        title="Could not load Hifdh data"
        message="Check your connection and try again."
        onRetry={() => progressQuery.refetch()}
      />
    );
  }

  const reviewItems = reviewQuery.data || [];
  const progressList = progressQuery.data || [];

  return (
    <div className="px-5">
      <h2 className="mb-4 text-xl font-semibold">Today's Revision</h2>
      {reviewItems.length === 0 ? (
        <div className="mb-8 rounded-xl bg-card p-6 text-center shadow-sm border border-border text-muted-foreground">
          <CheckCircle2 className="mx-auto mb-2 size-8 text-gold" />
          <p>No revision due today. Great job!</p>
        </div>
      ) : (
        <div className="mb-8 space-y-3">
          {reviewItems.map((item, idx) => {
            const surah = surahs.find((s) => s.number === item.surah_number);
            return (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl bg-card p-4 border border-border shadow-sm cursor-pointer hover:bg-muted transition-colors"
                onClick={() => surah && onNavigateToSurah(surah)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
                    <Clock className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {surah?.transliterated_name || `Surah ${item.surah_number}`}
                    </p>
                    <p className="text-xs text-muted-foreground">Ayah {item.ayah_number}</p>
                  </div>
                </div>
                <ChevronRight className="size-5 text-muted-foreground" />
              </div>
            );
          })}
        </div>
      )}

      <h2 className="mb-4 text-xl font-semibold">My Progress</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {surahs.slice(0, 10).map((surah) => {
          const p = progressList.find((x) => x.surah_number === surah.number);
          const percent = p ? p.completion_percentage : 0;
          return (
            <div
              key={surah.number}
              className="flex flex-col justify-between rounded-xl border border-border bg-card p-3 shadow-sm cursor-pointer hover:bg-muted transition-colors"
              onClick={() => onNavigateToSurah(surah)}
            >
              <div className="flex items-start justify-between">
                <span className="text-sm font-semibold">{surah.transliterated_name}</span>
                {percent === 100 ? (
                  <CheckCircle2 className="size-4 text-gold" />
                ) : (
                  <CircleDashed className="size-4 text-muted-foreground" />
                )}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{percent}%</span>
                <span>{surah.ayah_count} Ayahs</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-gold" style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
