import { useEffect, useMemo, useState } from "react";
import { GeometricPattern } from "@/components/brand/pattern";
import type { PrayerTimes } from "@/lib/api/types";
import { PRAYER_LABELS, PRAYER_NAMES } from "@/lib/api/types";
import { formatCountdown, formatPrayerTime, nextPrayer } from "@/lib/prayer";
import { cn } from "@/lib/utils";

export function PrayerTimesStrip({ times }: { times: PrayerTimes }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const upcoming = useMemo(() => nextPrayer(times, now), [times, now]);

  return (
    <section className="relative overflow-hidden rounded-2xl bg-primary px-5 py-6 text-primary-foreground">
      <GeometricPattern className="text-primary-foreground" opacity={0.1} />
      <div className="relative">
        {upcoming ? (
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.18em] opacity-70">
              {upcoming.tomorrow ? "Tomorrow" : "Next prayer"}
            </p>
            <p className="arabic mt-1 text-3xl text-gold" lang="ar" dir="rtl">
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
                    isNext ? "font-semibold text-gold" : "opacity-90",
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
