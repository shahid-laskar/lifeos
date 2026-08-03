import { useState, useEffect } from "react";
import type { DhikrItemResponse } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { ArabicText } from "@/components/ui/arabic-text";
import { TranslationText } from "@/components/ui/translation-text";

export function DhikrSession({
  items,
  onComplete,
}: {
  items: DhikrItemResponse[];
  onComplete: (counts: Record<string, number>) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  
  const currentItem = items[currentIndex];
  const count = counts[currentItem.id] || 0;
  const target = currentItem.recommended_count;
  
  const handleTap = () => {
    if (count < target) {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(10);
      }
      const newCount = count + 1;
      setCounts({ ...counts, [currentItem.id]: newCount });
      
      if (newCount >= target && currentIndex < items.length - 1) {
        setTimeout(() => setCurrentIndex((i) => i + 1), 800);
      } else if (newCount >= target && currentIndex === items.length - 1) {
        setTimeout(() => onComplete({ ...counts, [currentItem.id]: newCount }), 800);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg)] text-[var(--ink)]">
      {/* Progress Dots */}
      <div className="flex h-12 items-center justify-center gap-1.5 px-4 pt-4">
        {items.map((item, i) => (
          <div
            key={item.id}
            className={cn(
              "h-[4px] flex-1 rounded-full transition-colors",
              i < currentIndex ? "bg-[var(--primary)]" : i === currentIndex ? "bg-[var(--primary)] opacity-55" : "bg-[var(--line)]"
            )}
          />
        ))}
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col justify-center px-[32px] pb-[40px] pt-4">
        <ArabicText className="mb-6 text-center text-[28px] leading-[1.8]">{currentItem.arabic_text}</ArabicText>
        <TranslationText className="text-center text-[15px] leading-[1.6]">{currentItem.meaning}</TranslationText>
      </div>

      {/* Counter Area (Tap Target) */}
      <div 
        className="relative flex h-1/3 w-full cursor-pointer flex-col items-center justify-center border-t border-[var(--line)] active:bg-[var(--line)]/20"
        onClick={handleTap}
      >
        <div className="absolute top-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--mute)]">
          Tap anywhere below to count
        </div>
        
        {/* Breathing Halo behind counter */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[120px] w-[120px] animate-[pulse_6s_ease-in-out_infinite] rounded-full bg-[var(--primary-soft)] opacity-50 motion-reduce:animate-none motion-reduce:opacity-100" />
        </div>
        
        <div className="relative z-10 font-sans text-[44px] font-bold tabular-nums text-[var(--primary)]">
          {count}
        </div>
        <div className="relative z-10 text-[13px] font-semibold text-[var(--mute)]">
          of {target}
        </div>
      </div>
    </div>
  );
}
