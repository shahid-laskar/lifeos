import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { GeometricPattern } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { Link } from "@tanstack/react-router";
import { getDhikrSummary, getPrayerConsistency, getWeeklyQuranSummary } from "@/lib/api/endpoints";
import { todayISO } from "@/lib/prayer";
import { CardSkeleton } from "./skeletons";
import { cn } from "@/lib/utils";

function Card({
  title,
  children,
  pattern = false,
  className,
}: {
  title: string;
  children: ReactNode;
  pattern?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card p-4",
        className,
      )}
    >
      {pattern && <GeometricPattern className="text-primary" opacity={0.05} />}
      <div className="relative">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </h3>
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

  if (isPending) return <CardSkeleton lines={2} />;

  return (
    <Card title="Dhikr">
      {isError ? (
        <ErrorState title="Error" message="Couldn't load" onRetry={() => refetch()} />
      ) : (
        <>
          <div className="mx-auto mt-3.5 flex size-[74px] items-center justify-center rounded-full bg-[conic-gradient(var(--color-primary)_100%,var(--color-border)_0)] font-bold">
            <div className="flex size-[60px] items-center justify-center rounded-full bg-card">
              <span className="font-mono text-base tabular-nums">33</span>
            </div>
          </div>
          <p className="mt-2.5 text-center text-[12px] text-muted-foreground">
            Subhanallah · complete
          </p>
        </>
      )}
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
    <Card title="Qur'an this week">
      {isError ? (
        <ErrorState title="Error" message="Couldn't load" onRetry={() => refetch()} />
      ) : (
        <>
          <div className="mt-3.5 h-[7px] w-full overflow-hidden rounded-full bg-border">
            <div className="h-full w-[64%] rounded-full bg-primary"></div>
          </div>
          <div className="mt-2.5 flex justify-between text-[12px] text-muted-foreground">
            <span>3 surahs · 5 days read</span>
            <span>Al-Mulk 12</span>
          </div>
          <div className="mt-3.5 flex gap-1.5">
            {[true, true, "part", true, true, false, true].map((day, i) => (
              <div
                key={i}
                className={cn(
                  "h-[26px] flex-1 rounded-[7px]",
                  day === true ? "bg-primary" : day === "part" ? "bg-primary/40" : "bg-border",
                )}
              />
            ))}
          </div>
        </>
      )}
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
    <Card title="Consistency">
      {isError ? (
        <ErrorState title="Error" message="Couldn't load" onRetry={() => refetch()} />
      ) : (
        <>
          <div
            className="mt-3 text-[14px] leading-[1.7] text-foreground"
            style={{ fontFamily: '"Lora", Georgia, serif' }}
          >
            You've prayed Fajr on time 6 of the last 7 days — your steadiest week yet.
          </div>
          <div className="mt-3.5 flex gap-1.5">
            {[true, true, true, false, true, true, true].map((day, i) => (
              <div
                key={i}
                className={cn("h-[26px] flex-1 rounded-[7px]", day ? "bg-primary" : "bg-border")}
              />
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

export function DuasWidget() {
  return (
    <Card title="Du'a of the day">
      <div className="mt-3 font-arabic text-[20px] leading-[1.9] text-right" lang="ar" dir="rtl">
        رَبِّ زِدْنِي عِلْمًا
      </div>
      <div
        className="mt-2 text-[13px] leading-[1.6] text-muted-foreground"
        style={{ fontFamily: '"Lora", Georgia, serif' }}
      >
        "My Lord, increase me in knowledge."
      </div>
      <div className="mt-2.5 text-[12px] text-muted-foreground">Ta-Ha 20:114</div>
    </Card>
  );
}

export function HadithWidget() {
  return (
    <Card title="Hadith of the day">
      <div
        className="mt-3 text-[15px] leading-[1.7]"
        style={{ fontFamily: '"Lora", Georgia, serif' }}
      >
        "Actions are but by intention, and every man shall have only that which he intended."
      </div>
      <div className="mt-2.5 text-[12px] text-muted-foreground">
        Sahih al-Bukhari 1 · Narrated by Umar ibn al-Khattab
      </div>
    </Card>
  );
}
