import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { GeometricPattern, StarSpinner } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { Link } from "@tanstack/react-router";
import {
  getDhikrSummary,
  getPrayerConsistency,
  getWeeklyQuranSummary,
} from "@/lib/api/endpoints";
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
        <StarSpinner size={22} />
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
        <StarSpinner size={22} />
      ) : isError ? (
        <ErrorState
          title="Couldn't load your reading"
          message="Check your connection and try once more."
          onRetry={() => refetch()}
        />
      ) : (
        <p className="text-base text-foreground">
          Read{" "}
          <span className="font-semibold text-primary">
            {data?.surahs_read_last_7_days ?? 0}
          </span>{" "}
          {(data?.surahs_read_last_7_days ?? 0) === 1 ? "surah" : "surahs"} over{" "}
          <span className="font-semibold text-primary">
            {data?.active_days_last_7_days ?? 0}
          </span>{" "}
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
        <StarSpinner size={22} />
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
            All five prayers logged. {logged} prayers recorded in the last 30
            days — a record, not a scoreboard.
          </p>
        </>
      )}
    </Card>
  );
}

export function DuasWidget() {
  return (
    <Card title="Du'as" pattern>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mt-1">
            Supplications for every occasion
          </p>
          <Link
            to="/duas"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Explore Du'as
          </Link>
        </div>
        <p className="arabic ms-auto text-3xl text-gold opacity-80" lang="ar" dir="rtl">
          دُعَاء
        </p>
      </div>
    </Card>
  );
}
