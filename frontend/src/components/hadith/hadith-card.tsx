import type { HadithItemResponse } from "@/lib/api/types";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ArabicText } from "@/components/ui/arabic-text";
import { Quote, Attrib } from "@/components/ui/quote";
import { cn } from "@/lib/utils";

interface HadithCardProps {
  item: HadithItemResponse;
  bookmarked?: boolean;
  onToggleBookmark?: (item: HadithItemResponse) => void;
  bookmarkPending?: boolean;
}

export function HadithCard({
  item,
  bookmarked = false,
  onToggleBookmark,
  bookmarkPending = false,
}: HadithCardProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            <p className="text-[12px] font-semibold tracking-[0.02em] text-[var(--mute)]">
              {item.collection_name} &middot; Hadith {item.hadith_number}
            </p>
            <p className="text-[14px] font-medium text-[var(--ink)]">{item.chapter_name_english}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                item.grade.toLowerCase().includes("sahih")
                  ? "bg-[var(--brass)]/15 text-[var(--brass)]"
                  : "bg-[var(--line)] text-[var(--mute)]"
              )}
            >
              {item.grade}
            </span>
            {onToggleBookmark ? (
              <button
                type="button"
                className="flex items-center justify-center text-[var(--mute)] transition-colors hover:text-[var(--ink)] disabled:opacity-50"
                aria-label={bookmarked ? "Remove bookmark" : "Bookmark hadith"}
                disabled={bookmarkPending}
                onClick={() => onToggleBookmark(item)}
              >
                {bookmarked ? (
                  <BookmarkCheck className="h-5 w-5 text-[var(--primary)]" />
                ) : (
                  <Bookmark className="h-5 w-5" />
                )}
              </button>
            ) : null}
          </div>
        </div>

        <ArabicText className="mb-5 text-[24px] leading-relaxed">
          {item.arabic_text}
        </ArabicText>

        {item.narrator ? (
          <p className="mb-2 text-[13px] font-medium italic text-[var(--mute)]">{item.narrator}</p>
        ) : null}

        <Quote className="text-[15px]">{item.translation}</Quote>

        {item.chapter_name_arabic ? (
          <div className="mt-5 border-t border-[var(--line)] pt-3 text-right">
            <p dir="rtl" lang="ar" className="arabic text-[14px] text-[var(--mute)]">
              {item.chapter_name_arabic}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
