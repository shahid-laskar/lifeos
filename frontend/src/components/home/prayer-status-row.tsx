import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Book, Check, X, Minus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getPrayerStatus, logPrayer } from "@/lib/api/endpoints";
import type { PrayerName, PrayerStatus, PrayerTimes } from "@/lib/api/types";
import { PRAYER_LABELS, PRAYER_NAMES } from "@/lib/api/types";
import { todayISO } from "@/lib/prayer";
import { Skeleton } from "@/components/ui/skeleton";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PrayerCircle } from "@/components/ui/prayer-circle";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MOONS = ["🌑", "🌘", "🌗", "🌖", "🌕"];

export function PrayerStatusRow({ times }: { times?: PrayerTimes }) {
  const date = todayISO();
  const queryClient = useQueryClient();
  const [drawerPrayer, setDrawerPrayer] = useState<PrayerName | null>(null);
  const [khushooPromptPrayer, setKhushooPromptPrayer] = useState<PrayerName | null>(null);

  const { data: statuses, isPending } = useQuery({
    queryKey: ["prayer-logs", date],
    queryFn: () => getPrayerStatus(date),
  });

  const mutation = useMutation({
    mutationFn: (input: { prayer: PrayerName; status: PrayerStatus }) =>
      logPrayer({ ...input, date }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["prayer-logs", date] });
      const previous = queryClient.getQueryData(["prayer-logs", date]);
      queryClient.setQueryData(
        ["prayer-logs", date],
        (old: Partial<Record<PrayerName, PrayerStatus>> | undefined) => ({
          ...(old ?? {}),
          [input.prayer]: input.status,
        }),
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(["prayer-logs", date], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["prayer-logs", date] });
      queryClient.invalidateQueries({ queryKey: ["prayer-consistency"] });
    },
  });

  const handleSelect = (
    prayer: PrayerName,
    newStatus: PrayerStatus,
    oldStatus: PrayerStatus | undefined,
  ) => {
    mutation.mutate({ prayer, status: newStatus });
    setDrawerPrayer(null);

    if (newStatus === "completed") {
      setKhushooPromptPrayer(prayer);
      setTimeout(() => {
        setKhushooPromptPrayer((current) => (current === prayer ? null : current));
      }, 7000);
    } else {
      setKhushooPromptPrayer(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Today's Prayers</CardTitle>
          <Link
            to="/prayer-journal"
            className="flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--mute)] hover:text-[var(--ink)]"
          >
            <Book className="h-3 w-3" /> Journal
          </Link>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end">
            {PRAYER_NAMES.map((name) => {
              const status = statuses?.[name];
              const isPendingState = !status;

              let mappedStatus: "unlogged" | "done" | "missed" = "unlogged";
              if (status === "completed") mappedStatus = "done";
              if (status === "missed" || status === "excused") mappedStatus = "missed";

              return (
                <button
                  key={name}
                  onClick={() => setDrawerPrayer(name)}
                  className="flex-1 focus:outline-none"
                  type="button"
                >
                  {isPending ? (
                    <div className="flex flex-col items-center gap-2">
                      <Skeleton className="h-[44px] w-[44px] rounded-full" />
                      <Skeleton className="h-2 w-5 mt-1" />
                    </div>
                  ) : (
                    <PrayerCircle
                      status={mappedStatus}
                      label={PRAYER_LABELS[name].latin.substring(0, 3)}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {khushooPromptPrayer && (
            <div className="prompt mt-5 rounded-[12px] bg-[var(--primary-soft)] p-4 text-center text-[var(--primary)]">
              <p className="text-[13px] font-medium">
                How was your {PRAYER_LABELS[khushooPromptPrayer].latin}? &middot; Reflect &rarr;
              </p>
              <div className="mt-3 flex justify-center gap-3">
                {MOONS.map((moon, i) => (
                  <button
                    key={i}
                    className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[14px] hover:border-[var(--brass)] hover:text-[var(--brass)]"
                    onClick={() => {
                      toast.success("Reflection saved.");
                      setKhushooPromptPrayer(null);
                    }}
                  >
                    {moon}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Drawer open={!!drawerPrayer} onOpenChange={(open) => !open && setDrawerPrayer(null)}>
        <DrawerContent className="mx-auto max-w-md rounded-t-[18px] border-x border-t border-[var(--line)] bg-[var(--surface)]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-center text-[16px] font-semibold text-[var(--ink)]">
              Log {drawerPrayer ? PRAYER_LABELS[drawerPrayer].latin : ""}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex justify-center gap-3 p-6 pb-10">
            <button
              className="group flex w-24 flex-col items-center gap-3 rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]"
              onClick={() => handleSelect(drawerPrayer!, "completed", statuses?.[drawerPrayer!])}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white">
                <Check className="h-5 w-5 stroke-[2.5]" />
              </div>
              <span className="text-[12px] font-semibold text-[var(--ink)]">Prayed</span>
            </button>
            <button
              className="group flex w-24 flex-col items-center gap-3 rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--bg)]"
              onClick={() => handleSelect(drawerPrayer!, "missed", statuses?.[drawerPrayer!])}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--line)] text-[var(--mute)]">
                <X className="h-5 w-5 stroke-[2.5]" />
              </div>
              <span className="text-[12px] font-semibold text-[var(--ink)]">Missed</span>
            </button>
            <button
              className="group flex w-24 flex-col items-center gap-3 rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--bg)]"
              onClick={() => handleSelect(drawerPrayer!, "excused", statuses?.[drawerPrayer!])}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--line)] text-[var(--mute)]">
                <Minus className="h-5 w-5 stroke-[2.5]" />
              </div>
              <span className="text-[12px] font-semibold text-[var(--ink)]">Excused</span>
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
