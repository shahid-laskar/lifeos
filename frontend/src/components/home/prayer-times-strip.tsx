import { useEffect, useMemo, useState } from "react";
import { GeometricPattern } from "@/components/brand/pattern";
import type { PrayerTimes } from "@/lib/api/types";
import { PRAYER_LABELS, PRAYER_NAMES } from "@/lib/api/types";
import { formatCountdown, formatPrayerTime, nextPrayer } from "@/lib/prayer";
import { cn } from "@/lib/utils";

function getGradientStyle(nextPrayerName: string | null) {
  switch (nextPrayerName) {
    case "fajr":
      return { backgroundImage: "linear-gradient(160deg, #131a34, #2b2350, #8a5a2b)" };
    case "dhuhr":
    case "asr":
      return { backgroundImage: "linear-gradient(160deg, #2f7fb8, #2367a6, #1d4f86)" };
    case "maghrib":
      return { backgroundImage: "linear-gradient(160deg, #8a4a0e, #a3542e, #6b2d4d)" };
    case "isha":
      return { backgroundImage: "linear-gradient(160deg, #0e1330, #141a2e, #0a0d1c)" };
    default:
      return { backgroundImage: "linear-gradient(160deg, #0e1330, #141a2e, #0a0d1c)" };
  }
}

export function PrayerTimesStrip({ times }: { times: PrayerTimes }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const upcoming = useMemo(() => nextPrayer(times, now), [times, now]);
  const gradientStyle = getGradientStyle(upcoming?.name ?? null);

  return (
    <section
      className="relative overflow-hidden rounded-[20px] p-5 text-white"
      style={gradientStyle}
    >
      <GeometricPattern className="text-white" opacity={0.07} />
      <div className="relative">
        {upcoming ? (
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-75">
                Next Prayer
              </div>
              <div className="mt-2 text-[26px] font-bold tracking-[-0.02em]">
                {PRAYER_LABELS[upcoming.name].latin}
              </div>
            </div>
            <div className="text-right">
              <div className="font-sans text-[26px] font-semibold tabular-nums tracking-[-0.02em]">
                {formatCountdown(upcoming.msRemaining)}
              </div>
              <div className="text-[12px] opacity-62">remaining</div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-[13px] opacity-75">
            Prayer times will appear once your location is set.
          </div>
        )}

        {times && (
          <div className="mt-6 flex justify-between border-t border-white/20 pt-4">
            {PRAYER_NAMES.map((name) => {
              const isNext = upcoming?.name === name && !upcoming.tomorrow;
              return (
                <div
                  key={name}
                  className={cn("flex-1 text-center", isNext ? "opacity-100" : "opacity-62")}
                >
                  <b className="block text-[11px] font-semibold uppercase tracking-[0.14em]">
                    {PRAYER_LABELS[name].latin.substring(0, 3)}
                  </b>
                  <span className="mt-1 block text-[13px] font-medium tabular-nums">
                    {formatPrayerTime(times[name])}
                  </span>
                  {isNext && (
                    <i className="mx-auto mt-2 block h-[2px] w-[14px] rounded-full bg-white"></i>
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
