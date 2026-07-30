import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StarSpinner } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import {
  ConsistencyCard,
  DhikrWidget,
  WeeklyQuranCard,
} from "@/components/home/summary-cards";
import { PrayerStatusRow } from "@/components/home/prayer-status-row";
import { PrayerTimesStrip } from "@/components/home/prayer-times-strip";
import { PageHeader } from "@/components/layout/page-header";
import { getMyPrayerTimes, getPrayerTimesForLocation } from "@/lib/api/endpoints";
import { todayISO, utcOffsetHours } from "@/lib/prayer";

export const Route = createFileRoute("/_authenticated/home")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Today — Muslim Life OS" },
      {
        name: "description",
        content:
          "Your prayer times, prayer log, dhikr totals and Qur'an reading for today.",
      },
      { property: "og:title", content: "Today — Muslim Life OS" },
      {
        property: "og:description",
        content:
          "Your prayer times, prayer log, dhikr totals and Qur'an reading for today.",
      },
    ],
  }),
  component: HomePage,
});

function useCoords() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => setCoords(null),
      { maximumAge: 600000, timeout: 8000 },
    );
  }, []);

  return coords;
}

function HomePage() {
  const date = todayISO();
  const coords = useCoords();

  const prayerTimes = useQuery({
    queryKey: ["prayer-times", date],
    queryFn: () => getMyPrayerTimes(date),
  });

  const fallbackTimes = useQuery({
    queryKey: ["prayer-times-fallback", date, coords?.lat, coords?.lng],
    enabled: prayerTimes.isError && coords !== null,
    queryFn: () =>
      getPrayerTimesForLocation({
        latitude: coords!.lat,
        longitude: coords!.lng,
        utc_offset: utcOffsetHours(),
        date,
      }),
  });

  const times = prayerTimes.data ?? fallbackTimes.data;

  const greetingDate = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <PageHeader title="Today" subtitle={greetingDate} arabic="السَّلامُ عَلَيْكُم" />
      <div className="space-y-4 px-5 pb-8">
        {prayerTimes.isPending ? (
          <div className="flex justify-center py-10">
            <StarSpinner size={32} />
          </div>
        ) : times ? (
          <PrayerTimesStrip times={times.times} />
        ) : (
          <ErrorState
            title="Couldn't load prayer times"
            message="Check your connection, or set your location in Settings."
            onRetry={() => prayerTimes.refetch()}
          />
        )}

        <PrayerStatusRow />
        <DhikrWidget />
        <WeeklyQuranCard />
        <ConsistencyCard />
      </div>
    </>
  );
}
