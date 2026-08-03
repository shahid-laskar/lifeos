import { SkeletonHero, SkeletonLine } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function HeroSkeleton() {
  return <SkeletonHero />;
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Card className="p-5">
      <SkeletonLine className="h-3 w-1/3 mb-4" />
      <div className="space-y-3">
        <SkeletonLine className="w-[92%]" />
        {lines >= 2 && <SkeletonLine className="w-[76%]" />}
        {lines >= 3 && <SkeletonLine className="w-[58%]" />}
      </div>
    </Card>
  );
}
