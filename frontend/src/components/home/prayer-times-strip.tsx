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
    <section className={cn("relative overflow-hidden rounded-2xl px-5 py-6", gradientClass)}>
      <GeometricPattern className={isLightText ? "text-white" : "text-slate-900"} opacity={0.1} />
      <div className="relative">
        {upcoming ? (
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.18em] opacity-70">
              {upcoming.tomorrow ? "Tomorrow" : "Next prayer"}
            </p>
            <p className={cn("arabic mt-1 text-3xl", isLightText ? "text-gold" : "text-amber-700")} lang="ar" dir="rtl">
              {PRAYER_LABELS[upcoming.name].arabic}
            </p>
            <p className="text-lg font-medium">
              {PRAYER_LABELS[upcoming.name].latin} · {formatPrayerTime(times[upcoming.name])}
            </p>
            <p className="mt-2 font-mono text-2xl tabular-nums">
              {formatCountdown(upcoming.msRemaining)}
            </p>
          </div>
        ) : (
          <p className="text-center text-sm opacity-80">
            Prayer times will appear once your location is set.
          </p>
        )}

        <ul className="mt-6 grid grid-cols-5 gap-1">
          {PRAYER_NAMES.map((name) => {
            const isNext = upcoming?.name === name && !upcoming.tomorrow;
            return (
              <li
                key={name}
                className={cn(
                  "rounded-xl px-1 py-2 text-center transition-colors",
                  isNext ? "bg-primary-foreground/15" : "bg-transparent",
                )}
              >
                <p className="text-[11px] uppercase tracking-wide opacity-75">
                  {PRAYER_LABELS[name].latin}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-sm tabular-nums",
                    isNext ? (isLightText ? "font-semibold text-gold" : "font-semibold text-amber-700") : "opacity-90",
                  )}
                >
                  {formatPrayerTime(times[name])}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
