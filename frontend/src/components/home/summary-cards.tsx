import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { GeometricPattern } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { getDhikrSummary, getPrayerConsistency, getWeeklyQuranSummary } from "@/lib/api/endpoints";
import { todayISO } from "@/lib/prayer";

function Card({
  title,
  children,
  pattern = false,
}: {
  title: string;
  children: ReactNode;
  pattern?: boolean;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
      {pattern ? <GeometricPattern className="text-primary" opacity={0.05} /> : null}
      <div className="relative">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </section>
  );
}

export function DhikrWidget() {
  const date = todayISO();
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["dhikr-summary", date],
    queryFn: () => getDhikrSummary(date),
  });

  return (
    <Card title="Dhikr today" pattern>
      {isPending ? (
        <Skeleton className="mt-2 h-16 w-full" />
      ) : isError ? (
        <ErrorState
          title="Couldn't load your dhikr"
          message="Check your connection and try once more."
          onRetry={() => refetch()}
        />
      ) : (
        <div className="flex items-end gap-6">
          <div>
            <p className="text-3xl font-semibold tabular-nums text-primary">
              {data?.total_morning ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">Morning</p>
          </div>
          <div>
            <p className="text-3xl font-semibold tabular-nums text-primary">
              {data?.total_evening ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">Evening</p>
          </div>
          <p className="arabic ms-auto text-xl text-gold" lang="ar" dir="rtl">
            ذِكْر
          </p>
        </div>
      )}
    </Card>
  );
}

export function WeeklyQuranCard() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["quran-weekly"],
    queryFn: getWeeklyQuranSummary,
  });

  return (
    <Card title="Qur'an this week">
      {isPending ? (
        <Skeleton className="mt-2 h-16 w-full" />
      ) : isError ? (
        <ErrorState
          title="Couldn't load your reading"
          message="Check your connection and try once more."
          onRetry={() => refetch()}
        />
      ) : (
        <p className="text-base text-foreground">
          Read{" "}
          <span className="font-semibold text-primary">{data?.surahs_read_last_7_days ?? 0}</span>{" "}
          {(data?.surahs_read_last_7_days ?? 0) === 1 ? "surah" : "surahs"} over{" "}
          <span className="font-semibold text-primary">{data?.active_days_last_7_days ?? 0}</span>{" "}
          {(data?.active_days_last_7_days ?? 0) === 1 ? "day" : "days"}.
        </p>
      )}
    </Card>
  );
}

export function ConsistencyCard() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["prayer-consistency"],
    queryFn: getPrayerConsistency,
  });

  const days = data?.days_completed_last_30 ?? 0;
  const logged = data?.total_prayers_logged_last_30 ?? 0;

  return (
    <Card title="Consistency" pattern>
      {isPending ? (
        <Skeleton className="mt-2 h-20 w-full" />
      ) : isError ? (
        <ErrorState
          title="Couldn't load your consistency"
          message="Check your connection and try once more."
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {days} <span className="text-muted-foreground">/ 30 days</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            All five prayers logged. {logged} prayers recorded in the last 30 days — a record, not a
            scoreboard.
          </p>
        </>
      )}
    </Card>
  );
}

export function DuasWidget() {
  return (
    <Card title="Du'a of the Day" pattern>
      <div className="mt-2 space-y-3">
        <p className="arabic text-2xl text-right text-foreground leading-loose" lang="ar" dir="rtl">
          رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ
        </p>
        <p className="text-sm text-muted-foreground italic">
          "Our Lord, give us in this world [that which is] good and in the Hereafter [that which is] good and protect us from the punishment of the Fire."
        </p>
        <div className="flex justify-between items-center pt-2">
          <span className="text-[11px] text-muted-foreground">Quran 2:201</span>
          <Link to="/duas" className="text-xs text-primary hover:underline font-medium">More Du'as →</Link>
        </div>
      </div>
    </Card>
  );
}

export function HadithWidget() {
  return (
    <Card title="Hadith of the Day" pattern>
      <div className="mt-2 space-y-3">
        <p className="arabic text-2xl text-right text-foreground leading-loose" lang="ar" dir="rtl">
          إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ
        </p>
        <p className="text-sm text-muted-foreground italic">
          "Actions are (judged) by motives (niyyah), so each man will have what he intended."
        </p>
        <div className="flex justify-between items-center pt-2">
          <span className="text-[11px] text-muted-foreground">Sahih al-Bukhari 1</span>
          <Link to="/hadith" className="text-xs text-primary hover:underline font-medium">Read Hadith →</Link>
        </div>
      </div>
    </Card>
  );
}
