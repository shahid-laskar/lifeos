import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { logDhikrSession } from "@/lib/api/endpoints";
import type { DhikrItemResponse } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { ArabicText } from "@/components/ui/arabic-text";
import { TranslationText } from "@/components/ui/translation-text";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Pill } from "@/components/ui/pill";
import { Card, CardContent } from "@/components/ui/card";

export function DhikrCard({
  item,
  progress = 0,
}: {
  item: DhikrItemResponse;
  progress?: number;
}) {
  const atTarget = progress >= item.recommended_count;
  const pct = Math.min(100, Math.max(0, (progress / item.recommended_count) * 100));

  return (
    <Card className="mb-4">
      <CardContent className="flex items-center justify-between gap-4 p-0">
        <div className="flex-1 space-y-3">
          <ArabicText className="text-[20px]">{item.arabic_text}</ArabicText>
          <TranslationText className="text-[13px]">{item.meaning}</TranslationText>
          <div className="flex items-center gap-2">
            {atTarget ? (
              <Pill className="!bg-[var(--brass)] !text-white dark:!text-[#0d1211]">Complete</Pill>
            ) : (
              <span className="text-[12px] font-semibold text-[var(--mute)]">
                {progress} of {item.recommended_count}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <ProgressRing
            percentage={pct}
            label={progress || ""}
            className="m-0 h-[44px] w-[44px] text-[12px]"
          />
        </div>
      </CardContent>
    </Card>
  );
}
