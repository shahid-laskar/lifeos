import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ErrorState } from "@/components/brand/states";
import { Link } from "@tanstack/react-router";
import {
  getDhikrSummary,
  getPrayerConsistency,
  getWeeklyQuranSummary,
  getDuas,
  getHadithChapterItems,
  getHadithChapters,
  getFastingStatus,
} from "@/lib/api/endpoints";
import { todayISO } from "@/lib/prayer";
import { CardSkeleton } from "./skeletons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ProgressBar, ProgressMeta } from "@/components/ui/progress-bar";
import { WeekDots } from "@/components/ui/week-dots";
import { ArabicText } from "@/components/ui/arabic-text";
import { TranslationText } from "@/components/ui/translation-text";
import { Quote, Attrib } from "@/components/ui/quote";
import { Pill } from "@/components/ui/pill";

// ── Dhikr Widget ──────────────────────────────────────────────────────────────

export function DhikrWidget() {
  const date = todayISO();
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["dhikr-summary", date],
    queryFn: () => getDhikrSummary(date),
  });

  if (isPending) return <CardSkeleton lines={2} />;

  const total = data
    ? data.total_morning + data.total_evening + data.total_post_prayer + data.total_general
    : 0;

  // Show a progress ring: target is 99 (33×3 common adhkar)
  const target = 99;
  const pct = Math.min(100, Math.round((total / target) * 100));
  const label = total > 0 ? `${total}` : "0";
  const mid = total >= target ? "Complete" : `of ${target} today`;

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
            <ProgressRing percentage={pct} label={label} />
            <p className="mt-2.5 text-center text-[12px] text-[var(--mute)]">{mid}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Qur'an This Week ─────────────────────────────────────────────────────────

export function WeeklyQuranCard() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["quran-weekly"],
    queryFn: getWeeklyQuranSummary,
  });

  if (isPending) return <CardSkeleton lines={2} />;

  const surahs = data?.surahs_read_last_7_days ?? 0;
  const days = data?.active_days_last_7_days ?? 0;

  // Build 7 weekdot states: fill in the last N active days
  const dots = Array.from({ length: 7 }, (_, i) =>
    i < days ? "on" : "off"
  ) as Array<"on" | "part" | "off">;

  const pct = Math.min(100, Math.round((days / 7) * 100));

  // Sentence-based insight copy
  const insightCopy =
    days === 0
      ? "Start your Qur'an reading today — even one verse is a beginning."
      : days === 7
        ? "You've read Qur'an every day this week — may it continue."
        : `You've read Qur'an on ${days} of the last 7 days${surahs > 0 ? `, completing ${surahs} surah${surahs !== 1 ? "s" : ""}` : ""}.`;

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
            <ProgressBar percentage={pct} />
            <ProgressMeta>
              <span>{insightCopy}</span>
            </ProgressMeta>
            <WeekDots days={dots} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Consistency Card ──────────────────────────────────────────────────────────

export function ConsistencyCard() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["prayer-consistency"],
    queryFn: getPrayerConsistency,
  });

  if (isPending) return <CardSkeleton lines={2} />;

  const days = data?.days_completed_last_30 ?? 0;
  const prayers = data?.total_prayers_logged_last_30 ?? 0;

  // Build 7-day weekdots from the 30-day count proportionally
  const weekDays = Math.min(7, Math.round((days / 30) * 7));
  const dots = Array.from({ length: 7 }, (_, i) =>
    i < weekDays ? "on" : "off"
  ) as Array<"on" | "part" | "off">;

  // Sentence-based copy — never raw percentages
  let copy = "Set your location and log your first prayer to begin tracking.";
  if (prayers > 0) {
    if (days >= 25) {
      copy = `You've prayed on ${days} of the last 30 days — your steadiest month yet.`;
    } else if (days >= 15) {
      copy = `You've maintained your prayers on ${days} of the last 30 days. Keep building.`;
    } else if (days > 0) {
      copy = `You've prayed on ${days} of the last 30 days — every prayer counts.`;
    }
  }

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
            <Quote className="mt-3 text-[14px]">{copy}</Quote>
            <WeekDots days={dots} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Du'a of the Day ───────────────────────────────────────────────────────────

export function DuasWidget() {
  // Fetch Morning duas and show a deterministic "du'a of the day" based on day-of-year
  const { data, isPending } = useQuery({
    queryKey: ["duas", "Morning"],
    queryFn: () => getDuas("Morning"),
    staleTime: 60 * 60 * 1000,
  });

  if (isPending) return <CardSkeleton lines={2} />;

  // Pick a du'a based on today's day-of-year so it rotates daily
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const dua = data && data.length > 0 ? data[dayOfYear % data.length] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Du'a of the day</CardTitle>
      </CardHeader>
      <CardContent>
        {dua ? (
          <>
            <ArabicText className="mt-3">{dua.arabic_text}</ArabicText>
            <TranslationText className="mt-2">"{dua.translation}"</TranslationText>
            {dua.reference && <Attrib className="mt-2.5">{dua.reference}</Attrib>}
          </>
        ) : (
          <>
            <ArabicText className="mt-3">رَبِّ زِدْنِي عِلْمًا</ArabicText>
            <TranslationText className="mt-2">"My Lord, increase me in knowledge."</TranslationText>
            <Attrib className="mt-2.5">Ta-Ha 20:114</Attrib>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Hadith of the Day ─────────────────────────────────────────────────────────

export function HadithWidget() {
  // Fetch Bukhari chapter 1 hadiths and rotate daily
  const chaptersQuery = useQuery({
    queryKey: ["hadith-chapters", "bukhari"],
    queryFn: () => getHadithChapters("bukhari"),
    staleTime: 60 * 60 * 1000,
  });

  const firstChapterId = chaptersQuery.data?.[0]?.chapter_id ?? null;

  const hadithsQuery = useQuery({
    queryKey: ["hadith-chapter", "bukhari", firstChapterId],
    queryFn: () => getHadithChapterItems("bukhari", firstChapterId!),
    enabled: firstChapterId !== null,
    staleTime: 60 * 60 * 1000,
  });

  const isPending = chaptersQuery.isPending || hadithsQuery.isPending;

  if (isPending) return <CardSkeleton lines={2} />;

  const hadiths = hadithsQuery.data ?? [];
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const hadith = hadiths.length > 0 ? hadiths[dayOfYear % hadiths.length] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hadith of the day</CardTitle>
      </CardHeader>
      <CardContent>
        {hadith ? (
          <>
            <Quote className="mt-3">"{hadith.translation}"</Quote>
            <Attrib className="mt-2.5">
              {hadith.collection_name} {hadith.hadith_number}
              {hadith.narrator && ` · ${hadith.narrator}`}
            </Attrib>
          </>
        ) : (
          <>
            <Quote className="mt-3">
              "Actions are but by intention, and every man shall have only that which he intended."
            </Quote>
            <Attrib className="mt-2.5">Sahih al-Bukhari 1 · Narrated by Umar ibn al-Khattab</Attrib>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Fasting Card ──────────────────────────────────────────────────────────────

export function FastingCard() {
  const date = todayISO();
  const { data, isPending } = useQuery({
    queryKey: ["fasting-status", date],
    queryFn: () => getFastingStatus(date),
  });

  if (isPending) return <CardSkeleton lines={1} />;

  const isFasting = data?.fasting ?? false;
  const fastType = data?.type;

  const fastLabel = fastType === "voluntary" ? "Voluntary fast" : fastType === "ramadan" ? "Ramadan" : "Fasting";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fasting</CardTitle>
      </CardHeader>
      <CardContent>
        {isFasting ? (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[13px] text-[var(--ink)]">
              {fastLabel} today — may it be accepted.
            </p>
            <Pill>Active</Pill>
          </div>
        ) : (
          <p className="mt-2 text-[13px] text-[var(--mute)]">
            No fast logged today. Log a fast to track your dedication.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
