import { DuaItemResponse } from "@/lib/api/types";

interface DuaCardProps {
  item: DuaItemResponse;
}

export function DuaCard({ item }: DuaCardProps) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4">
        <p dir="rtl" className="text-right font-arabic text-3xl leading-relaxed text-foreground">
          {item.arabic_text}
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium italic text-muted-foreground">{item.transliteration}</p>
        <p className="text-base text-foreground/90">"{item.translation}"</p>
      </div>

      <div className="mt-5 border-t pt-4 text-xs text-muted-foreground space-y-1">
        {item.when_to_recite && (
          <p>
            <span className="font-medium text-foreground/70">When to recite:</span>{" "}
            {item.when_to_recite}
          </p>
        )}
        <p>
          <span className="font-medium text-foreground/70">Source:</span> {item.reference}
        </p>
      </div>
    </div>
  );
}
