import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { GeometricPattern } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { Link } from "@tanstack/react-router";
import { getDhikrSummary, getPrayerConsistency, getWeeklyQuranSummary } from "@/lib/api/endpoints";
import { todayISO } from "@/lib/prayer";
import { CardSkeleton } from "./skeletons";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ProgressBar, ProgressMeta } from "@/components/ui/progress-bar";
import { WeekDots } from "@/components/ui/week-dots";
import { ArabicText } from "@/components/ui/arabic-text";
import { TranslationText } from "@/components/ui/translation-text";
import { Quote, Attrib } from "@/components/ui/quote";

export function DhikrWidget() {
  const date = todayISO();
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["dhikr-summary", date],
    queryFn: () => getDhikrSummary(date),
  });

  if (isPending) return <CardSkeleton lines={2} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dhikr</CardTitle>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState title="Error" message="Couldn't load" onRetry={() => refetch()} />
        ) : (
          <>
            <ProgressRing percentage={100} label="33" />
            <p className="mt-2.5 text-center text-[12px] text-[var(--mute)]">
              Subhanallah &middot; complete
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function WeeklyQuranCard() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["quran-weekly"],
    queryFn: getWeeklyQuranSummary,
  });

  if (isPending) return <CardSkeleton lines={2} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Qur'an this week</CardTitle>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState title="Error" message="Couldn't load" onRetry={() => refetch()} />
        ) : (
          <>
            <ProgressBar percentage={64} />
            <ProgressMeta>
              <span>3 surahs &middot; 5 days read</span>
              <span>Al-Mulk 12</span>
            </ProgressMeta>
            <WeekDots days={["on", "on", "part", "on", "on", "off", "on"]} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function ConsistencyCard() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["prayer-consistency"],
    queryFn: getPrayerConsistency,
  });

  if (isPending) return <CardSkeleton lines={2} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consistency</CardTitle>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState title="Error" message="Couldn't load" onRetry={() => refetch()} />
        ) : (
          <>
            <Quote className="mt-3 text-[14px]">
              You've prayed Fajr on time 6 of the last 7 days — your steadiest week yet.
            </Quote>
            <WeekDots days={["on", "on", "on", "off", "on", "on", "on"]} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function DuasWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Du'a of the day</CardTitle>
      </CardHeader>
      <CardContent>
        <ArabicText className="mt-3">رَبِّ زِدْنِي عِلْمًا</ArabicText>
        <TranslationText className="mt-2">"My Lord, increase me in knowledge."</TranslationText>
        <Attrib className="mt-2.5">Ta-Ha 20:114</Attrib>
      </CardContent>
    </Card>
  );
}

export function HadithWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hadith of the day</CardTitle>
      </CardHeader>
      <CardContent>
        <Quote className="mt-3">
          "Actions are but by intention, and every man shall have only that which he intended."
        </Quote>
        <Attrib className="mt-2.5">Sahih al-Bukhari 1 &middot; Narrated by Umar ibn al-Khattab</Attrib>
      </CardContent>
    </Card>
  );
}
