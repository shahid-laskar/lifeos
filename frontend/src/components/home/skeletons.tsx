import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function HeroSkeleton() {
  return (
    <div className="h-[158px] w-full animate-pulse rounded-[20px] bg-gradient-to-br from-muted to-primary/10" />
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
      <Skeleton className="h-3 w-1/3" />
      <div className="mt-4 space-y-3">
        <Skeleton className="h-2.5 w-[92%]" />
        {lines >= 2 && <Skeleton className="h-2.5 w-[76%]" />}
        {lines >= 3 && <Skeleton className="h-2.5 w-[58%]" />}
      </div>
    </div>
  );
}
