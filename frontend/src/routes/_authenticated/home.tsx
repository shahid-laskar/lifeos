import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ErrorState } from "@/components/brand/states";
import { HeroSkeleton } from "@/components/home/skeletons";
import {
  ConsistencyCard,
  DhikrWidget,
  WeeklyQuranCard,
  DuasWidget,
  HadithWidget,
  FastingCard,
} from "@/components/home/summary-cards";
import { PrayerStatusRow } from "@/components/home/prayer-status-row";
import { PrayerTimesStrip } from "@/components/home/prayer-times-strip";
import { PageHeader } from "@/components/layout/page-header";
import { getMyPrayerTimes, getPrayerTimesForLocation, getProfile } from "@/lib/api/endpoints";
import { todayISO, utcOffsetHours } from "@/lib/prayer";
import { getHijriDate } from "@/lib/hijri";

export const Route = createFileRoute("/_authenticated/home")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Today — Muslim Life OS" },
      {
        name: "description",
        content: "Your prayer times, prayer log, dhikr totals and Qur'an reading for today.",
      },
      { property: "og:title", content: "Today — Muslim Life OS" },
      {
        property: "og:description",
        content: "Your prayer times, prayer log, dhikr totals and Qur'an reading for today.",
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
    retry: 1,
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

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  const times = prayerTimes.data ?? fallbackTimes.data;
  const loading =
    prayerTimes.isPending || (prayerTimes.isError && coords !== null && fallbackTimes.isPending);

  const greetingDate = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const hijriDate = getHijriDate();

  const firstName = profileQuery.data?.name?.split(" ")[0] || "there";

  return (
    <>
      <PageHeader
        title={`Assalamu Alaikum, ${firstName}`}
        subtitle={`${hijriDate} · ${greetingDate}`}
        arabic="السَّلامُ عَلَيْكُم"
      />
      <div className="flex flex-col gap-[22px]">
        {loading ? (
          <HeroSkeleton />
        ) : times ? (
          <PrayerTimesStrip times={times.times} />
        ) : (
          <ErrorState
            title="Couldn't load prayer times"
            message="Set your city in Settings (search by name — no map API key needed), then try again."
            onRetry={() => prayerTimes.refetch()}
          />
        )}
        {!times && !loading ? (
          <p className="text-center text-[13px]">
            <Link to="/settings" className="text-[var(--primary)] underline-offset-4 hover:underline">
              Open Settings &rarr; Location
            </Link>
          </p>
        ) : null}

        <PrayerStatusRow times={times?.times} />

        {/* 2-column grid: Du'a + Dhikr */}
        <div className="grid grid-cols-2 gap-3.5 md:gap-4">
          <DuasWidget />
          <DhikrWidget />
        </div>

        <WeeklyQuranCard />
        <HadithWidget />
        <ConsistencyCard />
        <FastingCard />
      </div>
    </>
  );
}
