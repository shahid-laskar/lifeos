import { useEffect, useMemo, useState } from "react";
import { GeometricPattern } from "@/components/brand/pattern";
import type { PrayerTimes } from "@/lib/api/types";
import { PRAYER_LABELS, PRAYER_NAMES } from "@/lib/api/types";
import { formatCountdown, formatPrayerTime, nextPrayer } from "@/lib/prayer";
import { cn } from "@/lib/utils";

function getGradientClass(nextPrayerName: string | null) {
  switch (nextPrayerName) {
    case "fajr":
      return "bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 text-white";
    case "sunrise":
      return "bg-gradient-to-b from-slate-900 via-indigo-900 to-amber-800 text-white";
    case "dhuhr":
      return "bg-gradient-to-b from-amber-100 via-sky-200 to-blue-300 text-slate-900";
    case "asr":
      return "bg-gradient-to-b from-sky-400 via-blue-500 to-blue-600 text-white";
    case "maghrib":
      return "bg-gradient-to-b from-orange-400 via-rose-500 to-purple-700 text-white";
    case "isha":
      return "bg-gradient-to-b from-indigo-900 via-slate-800 to-slate-900 text-white";
    default:
      return "bg-primary text-primary-foreground";
  }
}

export function PrayerTimesStrip({ times }: { times: PrayerTimes }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const upcoming = useMemo(() => nextPrayer(times, now), [times, now]);

  const gradientClass = getGradientClass(upcoming?.name ?? null);
  const isLightText = !gradientClass.includes("text-slate-900");

  return (
    <section
      className={cn("relative overflow-hidden rounded-2xl p-5 text-white shadow-sm", gradientClass)}
    >
      {/* Pattern at 7% opacity per design spec */}
      <GeometricPattern className={isLightText ? "text-white" : "text-slate-900"} opacity={0.07} />
      <div className="relative">
        {upcoming ? (
          <>
            <div className="text-[11px] uppercase tracking-[0.16em] opacity-75">
              {upcoming.tomorrow ? "Tomorrow" : "Next prayer"}
            </div>
            <div className="mt-2 flex items-baseline gap-2.5">
              <div className="text-2xl font-bold tracking-[-0.01em]">
                {PRAYER_LABELS[upcoming.name].latin}
              </div>
              <div className="ml-auto text-right">
                <div className="font-mono text-[26px] font-semibold tabular-nums tracking-[-0.02em]">
                  {formatCountdown(upcoming.msRemaining)}
                </div>
                <div className="mt-0.5 text-[11px] opacity-70">remaining</div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm opacity-80 py-4">
            Prayer times will appear once your location is set.
          </div>
        )}

        {times && (
          <div className="mt-5 flex justify-between border-t border-white/20 pt-3.5">
            {PRAYER_NAMES.map((name) => {
              const isNext = upcoming?.name === name && !upcoming.tomorrow;
              return (
                <div
                  key={name}
                  className={cn("flex-1 text-center", isNext ? "opacity-100" : "opacity-60")}
                >
                  <b className="block text-[11px] font-semibold uppercase tracking-[0.1em]">
                    {PRAYER_LABELS[name].latin}
                  </b>
                  <span className="mt-1.5 block text-[13px] tabular-nums">
                    {formatPrayerTime(times[name])}
                  </span>
                  {isNext && (
                    <i className="mx-auto mt-2 block h-[2px] w-[14px] rounded-sm bg-current"></i>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
