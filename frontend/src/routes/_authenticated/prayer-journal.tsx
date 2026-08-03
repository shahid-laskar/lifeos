import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingBlock } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { getPrayerJournal, getPrayerInsights, logPrayerJournal } from "@/lib/api/endpoints";
import { PRAYER_NAMES, PRAYER_LABELS, PrayerName } from "@/lib/api/types";
import { todayISO } from "@/lib/prayer";
import { getHijriDate } from "@/lib/hijri";
import { Book, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { KhushooMoons } from "@/components/ui/khushoo-moons";
import { ProgressBar, ProgressMeta } from "@/components/ui/progress-bar";
import { WeekDots } from "@/components/ui/week-dots";

export const Route = createFileRoute("/_authenticated/prayer-journal")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Prayer Journal — Muslim Life OS" },
      { name: "description", content: "Reflect on your khushoo and prayer quality." },
    ],
  }),
  component: PrayerJournalPage,
});

const KHUSHOO_LEVELS = [
  { value: 1, label: "Struggled" },
  { value: 2, label: "Distracted" },
  { value: 3, label: "Present" },
  { value: 4, label: "Focused" },
  { value: 5, label: "Deep Focus" },
];

const COMMON_DISTRACTIONS = [
  "Phone",
  "Work/Study",
  "Family/Kids",
  "Fatigue",
  "Rushing",
  "Worldly Thoughts",
];

/** Format a date showing Hijri primary (emerald), Gregorian muted — per mockup spec */
function JournalDate({ dateStr }: { dateStr: string }) {
  const date = new Date(dateStr);
  const hijri = getHijriDate(date);
  const gregorian = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return (
    <span className="text-[11px]">
      <span className="font-semibold text-[var(--primary)]">{hijri}</span>
      <span className="ml-1.5 text-[var(--mute)]">· {gregorian}</span>
    </span>
  );
}

function PrayerJournalPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"journal" | "insights">("journal");
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerName>(PRAYER_NAMES[0]);
  const [khushoo, setKhushoo] = useState(3);
  const [notes, setNotes] = useState("");
  const [distractions, setDistractions] = useState("");
  const [showPrompts, setShowPrompts] = useState(false);

  const journalQuery = useQuery({
    queryKey: ["prayer-journal"],
    queryFn: getPrayerJournal,
  });

  const insightsQuery = useQuery({
    queryKey: ["prayer-insights"],
    queryFn: getPrayerInsights,
  });

  const logMutation = useMutation({
    mutationFn: () =>
      logPrayerJournal({
        prayer_name: selectedPrayer,
        date: todayISO(),
        khushoo_rating: khushoo,
        notes,
        distractions,
      }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["prayer-journal"] });
      queryClient.invalidateQueries({ queryKey: ["prayer-insights"] });
      setNotes("");
      setDistractions("");
      setKhushoo(3);
      setShowPrompts(false);
    },
  });

  const toggleDistraction = (d: string) => {
    const current = distractions
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (current.includes(d)) {
      setDistractions(current.filter((x) => x !== d).join(", "));
    } else {
      setDistractions([...current, d].join(", "));
    }
  };

  const currentDistractionsArr = distractions
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  /** Build sentence-based insight from PrayerInsights — never raw numbers */
  const insightSentence = useMemo(() => {
    const q = insightsQuery.data?.weekly_quality ?? 0;
    const insights = insightsQuery.data?.insights ?? [];
    if (q === 0) return "Log a few prayers to begin seeing insights about your khushoo.";
    if (q >= 4) return `Your khushoo this week is running deep — ${insights[0] ?? "keep nurturing this quality."}`;
    if (q >= 3) return `You've been present in prayer this week. ${insights[0] ?? "Consistency builds depth."}`;
    return `Your focus is building. ${insights[0] ?? "Each prayer is a new beginning."}`;
  }, [insightsQuery.data]);

  /** Build 7-day weekdots from journal data */
  const weekdots = useMemo(() => {
    if (!journalQuery.data) return Array<"on" | "part" | "off">(7).fill("off");
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dateStr = d.toISOString().slice(0, 10);
      const hasEntry = journalQuery.data.some((e) => e.date.slice(0, 10) === dateStr);
      return hasEntry ? "on" : "off";
    }) as Array<"on" | "part" | "off">;
  }, [journalQuery.data]);

  return (
    <>
      <PageHeader title="Prayer Journal" subtitle="Reflect on your khushoo" arabic="خُشُوع" />

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab("journal")}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors flex items-center gap-2",
            activeTab === "journal"
              ? "bg-[var(--primary-soft)] text-[var(--primary)]"
              : "text-[var(--mute)] hover:bg-[var(--line)]"
          )}
        >
          <Book className="h-4 w-4" />
          Journal
        </button>
        <button
          onClick={() => setActiveTab("insights")}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors flex items-center gap-2",
            activeTab === "insights"
              ? "bg-[var(--primary-soft)] text-[var(--primary)]"
              : "text-[var(--mute)] hover:bg-[var(--line)]"
          )}
        >
          <Sparkles className="h-4 w-4" />
          Insights
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {activeTab === "journal" && (
          <div className="flex flex-col gap-6">
            {/* New reflection form */}
            <Card>
              <CardContent className="pt-6 space-y-6">
                <h3 className="font-semibold text-[15px] text-[var(--ink)]">New Reflection</h3>

                {/* Prayer selector */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {PRAYER_NAMES.map((name) => (
                    <button
                      key={name}
                      onClick={() => setSelectedPrayer(name)}
                      className={cn(
                        "shrink-0 rounded-full px-5 py-2 text-[13px] font-medium transition-all border",
                        selectedPrayer === name
                          ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                          : "border-[var(--line)] bg-[var(--bg)] text-[var(--mute)] hover:text-[var(--ink)]",
                      )}
                    >
                      {PRAYER_LABELS[name].latin}
                    </button>
                  ))}
                </div>

                {/* Khushoo rating — using KhushooMoons component */}
                <div className="pt-2">
                  <label className="mb-4 block text-[13px] font-medium text-[var(--ink)] text-center">
                    How was your focus during {PRAYER_LABELS[selectedPrayer].latin}?
                  </label>
                  <div className="flex items-center justify-center gap-3">
                    {KHUSHOO_LEVELS.map((level) => {
                      const isSelected = khushoo === level.value;
                      return (
                        <button
                          key={level.value}
                          onClick={() => setKhushoo(level.value)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 transition-all duration-200",
                            isSelected ? "scale-110 opacity-100" : "scale-100 opacity-40 hover:opacity-70",
                          )}
                        >
                          {/* Single moon icon at this position */}
                          <div
                            className={cn(
                              "flex h-[26px] w-[26px] items-center justify-center rounded-full border text-[12px]",
                              isSelected
                                ? "border-[var(--brass)] text-[var(--brass)]"
                                : "border-[var(--line)]"
                            )}
                          >
                            {["🌑", "🌘", "🌗", "🌖", "🌕"][level.value - 1]}
                          </div>
                          <span
                            className={cn(
                              "text-[10px] font-semibold",
                              isSelected ? "text-[var(--brass)]" : "text-[var(--mute)]"
                            )}
                          >
                            {level.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Guided prompts (optional) */}
                <div className="border-t border-[var(--line)] pt-4">
                  <button
                    onClick={() => setShowPrompts(!showPrompts)}
                    className="flex w-full items-center justify-between py-2 text-[13px] font-medium text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
                  >
                    <span>Guided Prompts</span>
                    {showPrompts ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {showPrompts && (
                    <div className="mt-4 space-y-5">
                      <div>
                        <label className="mb-2 block text-[12px] font-medium text-[var(--ink)]">
                          What distracted you?
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {COMMON_DISTRACTIONS.map((d) => (
                            <button
                              key={d}
                              onClick={() => toggleDistraction(d)}
                              className={cn(
                                "rounded-full px-3 py-1 text-[11px] font-medium transition-colors border",
                                currentDistractionsArr.includes(d)
                                  ? "bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)]"
                                  : "bg-[var(--bg)] border-[var(--line)] text-[var(--mute)] hover:border-[var(--mute)]",
                              )}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={distractions}
                          onChange={(e) => setDistractions(e.target.value)}
                          placeholder="Other distractions..."
                          className="w-full rounded-[12px] border border-[var(--line)] bg-[var(--bg)] p-3 text-[13px] text-[var(--ink)] focus:border-[var(--primary)] focus:outline-none"
                          rows={2}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[12px] font-medium text-[var(--ink)]">
                          What was in your heart?
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Any specific duas or feelings..."
                          className="w-full rounded-[12px] border border-[var(--line)] bg-[var(--bg)] p-3 text-[13px] text-[var(--ink)] focus:border-[var(--primary)] focus:outline-none"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => logMutation.mutate()}
                  disabled={logMutation.isPending}
                  className="w-full rounded-[11px] bg-[var(--primary)] py-[9px] text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:text-[#08120f]"
                >
                  {logMutation.isPending ? "Saving..." : "Save Reflection"}
                </button>
              </CardContent>
            </Card>

            {/* Journal history */}
            <div>
              <h3 className="mb-4 font-semibold text-[15px] text-[var(--ink)]">Journal History</h3>
              {journalQuery.isPending ? (
                <LoadingBlock label="Loading journal..." />
              ) : journalQuery.isError ? (
                <ErrorState
                  title="Error"
                  message="Could not load journal."
                  onRetry={() => journalQuery.refetch()}
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {journalQuery.data?.length === 0 ? (
                    <EmptyState
                      glyph="📖"
                      description="Log your first prayer to start tracking your khushoo journey."
                    />
                  ) : (
                    journalQuery.data?.map((entry) => {
                      const levelInfo = KHUSHOO_LEVELS.find(
                        (l) => l.value === entry.khushoo_rating
                      );
                      return (
                        <Card key={entry.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <span className="font-semibold text-[14px] text-[var(--ink)] capitalize block leading-none mb-1">
                                  {PRAYER_LABELS[entry.prayer_name].latin}
                                </span>
                                <JournalDate dateStr={entry.date} />
                              </div>
                              {/* Khushoo moons display */}
                              <KhushooMoons
                                rating={entry.khushoo_rating}
                                caption={levelInfo?.label}
                                className="mt-0"
                              />
                            </div>

                            {(entry.notes || entry.distractions) && (
                              <div className="mt-3 space-y-2 pt-3 border-t border-[var(--line)]">
                                {entry.notes && (
                                  <p className="text-[13px] text-[var(--ink)] italic">
                                    "{entry.notes}"
                                  </p>
                                )}
                                {entry.distractions && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {entry.distractions.split(",").map((d) => (
                                      <span
                                        key={d}
                                        className="text-[10px] bg-[var(--primary-soft)] text-[var(--primary)] px-2 py-0.5 rounded-full font-medium"
                                      >
                                        {d.trim()}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "insights" && (
          <div className="flex flex-col gap-6">
            {insightsQuery.isPending || journalQuery.isPending ? (
              <LoadingBlock label="Loading insights..." />
            ) : insightsQuery.isError || journalQuery.isError ? (
              <ErrorState
                title="Error"
                message="Could not load insights."
                onRetry={() => {
                  insightsQuery.refetch();
                  journalQuery.refetch();
                }}
              />
            ) : (
              <>
                {/* Sentence-based weekly insight */}
                <Card>
                  <CardContent className="p-5">
                    <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--mute)]">
                      Weekly Khushoo
                    </h3>
                    <p className="text-[14px] text-[var(--ink)] leading-[1.65]">{insightSentence}</p>
                    <WeekDots days={weekdots} />
                    <ProgressMeta>
                      <span>
                        {journalQuery.data?.filter((e) => {
                          const d = new Date(e.date);
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return d >= weekAgo;
                        }).length ?? 0}{" "}
                        reflections this week
                      </span>
                    </ProgressMeta>
                  </CardContent>
                </Card>

                {/* AI insights if available */}
                {insightsQuery.data?.insights && insightsQuery.data.insights.length > 0 && (
                  <Card>
                    <CardContent className="p-5">
                      <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--mute)] flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-[var(--primary)]" />
                        Reflections
                      </h3>
                      <ul className="flex flex-col gap-4">
                        {insightsQuery.data.insights.map((insight, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-[13px] text-[var(--ink)] leading-[1.65]"
                          >
                            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--primary)] shrink-0 opacity-60" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Per-prayer breakdown */}
                {journalQuery.data && journalQuery.data.length > 0 && (
                  <Card>
                    <CardContent className="p-5">
                      <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--mute)]">
                        By Prayer
                      </h3>
                      <div className="flex flex-col gap-4">
                        {PRAYER_NAMES.map((name) => {
                          const entries = journalQuery.data!.filter((e) => e.prayer_name === name);
                          if (entries.length === 0) return null;
                          const avg =
                            entries.reduce((s, e) => s + e.khushoo_rating, 0) / entries.length;
                          const pct = Math.round((avg / 5) * 100);
                          const avgLabel = avg.toFixed(1);
                          return (
                            <div key={name}>
                              <div className="flex justify-between mb-1">
                                <span className="text-[13px] font-medium text-[var(--ink)]">
                                  {PRAYER_LABELS[name].latin}
                                </span>
                                <span className="text-[12px] text-[var(--mute)]">
                                  avg {avgLabel}/5 · {entries.length} logged
                                </span>
                              </div>
                              <ProgressBar percentage={pct} />
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
