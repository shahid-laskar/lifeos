import type { HadithItemResponse } from "@/lib/api/types";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            {item.collection_name} · Hadith {item.hadith_number}
          </p>
          <p className="text-sm text-foreground/80">{item.chapter_name_english}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 text-xs",
              item.grade.toLowerCase().includes("sahih")
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-muted-foreground",
            )}
          >
            {item.grade}
          </span>
          {onToggleBookmark ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 shrink-0"
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark hadith"}
              disabled={bookmarkPending}
              onClick={() => onToggleBookmark(item)}
            >
              {bookmarked ? (
                <BookmarkCheck className="size-5 text-primary" />
              ) : (
                <Bookmark className="size-5" />
              )}
            </Button>
          ) : null}
        </div>
      </div>

      <p
        dir="rtl"
        lang="ar"
        className="arabic mb-4 text-right text-2xl leading-relaxed text-foreground"
      >
        {item.arabic_text}
      </p>

      {item.narrator ? (
        <p className="mb-2 text-sm font-medium text-muted-foreground">{item.narrator}</p>
      ) : null}

      <p className="text-base leading-relaxed text-foreground/90">{item.translation}</p>

      {item.chapter_name_arabic ? (
        <p
          dir="rtl"
          lang="ar"
          className="mt-4 border-t border-border pt-3 text-right text-xs text-muted-foreground"
        >
          {item.chapter_name_arabic}
        </p>
      ) : null}
    </article>
  );
}
