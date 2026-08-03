import { DuaItemResponse } from "@/lib/api/types";
import { Card, CardContent } from "@/components/ui/card";
import { ArabicText } from "@/components/ui/arabic-text";
import { TranslationText } from "@/components/ui/translation-text";
import { Attrib } from "@/components/ui/quote";
import { Volume2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface DuaCardProps {
  item: DuaItemResponse;
  bookmarked?: boolean;
  onToggleBookmark?: (item: DuaItemResponse) => void;
  bookmarkPending?: boolean;
}

export function DuaCard({ item, bookmarked = false, onToggleBookmark, bookmarkPending = false }: DuaCardProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="mb-4 flex items-center justify-between">
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)] transition-colors hover:bg-[var(--primary)] hover:text-white">
            <Volume2 className="h-4 w-4" />
          </button>
          {onToggleBookmark ? (
            <button 
              disabled={bookmarkPending}
              onClick={() => onToggleBookmark(item)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                bookmarked ? "text-[var(--primary)]" : "text-[var(--mute)] hover:text-[var(--primary)]",
                bookmarkPending ? "opacity-50" : ""
              )}
            >
              <Heart className={cn("h-4 w-4", bookmarked && "fill-current")} />
            </button>
          ) : null}
        </div>
        <ArabicText className="mb-4 text-[26px]">{item.arabic_text}</ArabicText>
        <div className="mb-4 text-[13px] italic text-[var(--mute)]">
          {item.transliteration}
        </div>
        <TranslationText className="mb-5">{item.translation}</TranslationText>

        <div className="flex flex-col gap-1 border-t border-[var(--line)] pt-4">
          {item.when_to_recite && (
            <Attrib className="mt-0">
              <span className="font-semibold text-[var(--ink)]">When to recite:</span> {item.when_to_recite}
            </Attrib>
          )}
          <Attrib className="mt-0">
            <span className="font-semibold text-[var(--ink)]">Source:</span> {item.reference}
          </Attrib>
        </div>
      </CardContent>
    </Card>
  );
}
