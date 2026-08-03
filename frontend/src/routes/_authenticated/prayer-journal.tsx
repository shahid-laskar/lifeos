import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingBlock } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { getPrayerJournal, getPrayerInsights, logPrayerJournal } from "@/lib/api/endpoints";
import { PRAYER_NAMES, PRAYER_LABELS, PrayerName } from "@/lib/api/types";
import { todayISO } from "@/lib/prayer";
import { Book, LineChart, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/prayer-journal")({
  ssr: false,
  component: PrayerJournalPage,
});

const KHUSHOO_LEVELS = [
  { value: 1, icon: "🌑", label: "Struggled" },
  { value: 2, icon: "🌘", label: "Distracted" },
  { value: 3, icon: "🌗", label: "Present" },
  { value: 4, icon: "🌖", label: "Focused" },
  { value: 5, icon: "🌕", label: "Deep Focus" },
];

const COMMON_DISTRACTIONS = [
  "Phone",
  "Work/Study",
  "Family/Kids",
  "Fatigue",
  "Rushing",
  "Worldly Thoughts",
];

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

  const prayerAverages = useMemo(() => {
    if (!journalQuery.data) return [];
    const sums = {
      fajr: { total: 0, count: 0 },
      dhuhr: { total: 0, count: 0 },
      asr: { total: 0, count: 0 },
      maghrib: { total: 0, count: 0 },
      isha: { total: 0, count: 0 },
    };
    journalQuery.data.forEach((entry) => {
      if (sums[entry.prayer_name]) {
        sums[entry.prayer_name].total += entry.khushoo_rating;
        sums[entry.prayer_name].count += 1;
      }
    });
    return PRAYER_NAMES.map((name) => ({
      name: PRAYER_LABELS[name].latin,
      avg: sums[name].count > 0 ? Number((sums[name].total / sums[name].count).toFixed(1)) : 0,
    }));
  }, [journalQuery.data]);

  const topDistractions = useMemo(() => {
    if (!journalQuery.data) return [];
    const counts: Record<string, number> = {};
    journalQuery.data.forEach((entry) => {
      if (entry.distractions) {
        const items = entry.distractions
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        items.forEach((item) => {
          counts[item] = (counts[item] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [journalQuery.data]);

  return (
    <>
      <PageHeader title="Prayer Journal" subtitle="Reflect on your khushoo" arabic="خُشُوع" />

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab("journal")}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors flex items-center",
            activeTab === "journal"
              ? "bg-[var(--primary-soft)] text-[var(--primary)]"
              : "text-[var(--mute)] hover:bg-[var(--line)]"
          )}
        >
          <Book className="mr-2 h-4 w-4" />
          Journal
        </button>
        <button
          onClick={() => setActiveTab("insights")}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors flex items-center",
            activeTab === "insights"
              ? "bg-[var(--primary-soft)] text-[var(--primary)]"
              : "text-[var(--mute)] hover:bg-[var(--line)]"
          )}
        >
          <LineChart className="mr-2 h-4 w-4" />
          Insights
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {activeTab === "journal" && (
          <div className="flex flex-col gap-6">
            <Card className="overflow-hidden relative bg-[var(--surface)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary-soft)] rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

              <CardContent className="pt-6 relative z-10 space-y-6">
                <h3 className="font-semibold text-[15px] flex items-center gap-2 text-[var(--ink)]">
                  <Sparkles className="h-4 w-4 text-[var(--primary)]" /> New Reflection
                </h3>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
                  {PRAYER_NAMES.map((name) => (
                    <button
                      key={name}
                      onClick={() => setSelectedPrayer(name)}
                      className={cn(
                        "snap-center shrink-0 rounded-full px-5 py-2 text-[13px] font-medium transition-all border",
                        selectedPrayer === name
                          ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-md"
                          : "border-[var(--line)] bg-[var(--bg)] text-[var(--mute)] hover:border-[var(--primary-soft)] hover:text-[var(--ink)]",
                      )}
                    >
                      {PRAYER_LABELS[name].latin}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="mb-4 block text-[13px] font-medium text-[var(--ink)] text-center">
                    How was your focus during {PRAYER_LABELS[selectedPrayer].latin}?
                  </label>
                  <div className="flex justify-between items-end px-2">
                    {KHUSHOO_LEVELS.map((level) => {
                      const isSelected = khushoo === level.value;
                      return (
                        <button
                          key={level.value}
                          onClick={() => setKhushoo(level.value)}
                          className={cn(
                            "flex flex-col items-center gap-2 transition-all duration-300",
                            isSelected
                              ? "scale-110 opacity-100"
                              : "scale-100 opacity-40 hover:opacity-70",
                          )}
                        >
                          <span className="text-[28px] drop-shadow-sm">{level.icon}</span>
                          <span
                            className={cn(
                              "text-[10px] font-semibold transition-colors",
                              isSelected ? "text-[var(--primary)]" : "text-[var(--mute)]",
                            )}
                          >
                            {level.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

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
                  className="w-full rounded-full bg-[var(--primary)] py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {logMutation.isPending ? "Saving..." : "Save Reflection"}
                </button>
              </CardContent>
            </Card>

            <div>
              <h3 className="mb-4 font-semibold text-[15px] text-[var(--ink)]">
                Journal History
              </h3>
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
                    <div className="empty py-10 text-center">
                      <p className="mt-1 text-[13px] leading-[1.6] text-[var(--mute)]">
                        Log your first prayer to start tracking your khushoo journey.
                      </p>
                    </div>
                  ) : (
                    journalQuery.data?.map((entry) => {
                      const iconInfo = KHUSHOO_LEVELS.find((l) => l.value === entry.khushoo_rating);
                      return (
                        <Card key={entry.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-3">
                                <span className="text-[24px] drop-shadow-sm">
                                  {iconInfo?.icon || "🌗"}
                                </span>
                                <div>
                                  <span className="font-semibold text-[14px] text-[var(--ink)] capitalize block leading-none mb-1">
                                    {PRAYER_LABELS[entry.prayer_name].latin}
                                  </span>
                                  <span className="text-[11px] font-medium text-[var(--primary)]">
                                    {iconInfo?.label}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[11px] font-medium text-[var(--mute)] bg-[var(--line)] px-2 py-1 rounded-md">
                                {new Date(entry.date).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>

                            {(entry.notes || entry.distractions) && (
                              <div className="mt-3 space-y-2 pt-3 border-t border-[var(--line)]">
                                {entry.notes && (
                                  <p className="text-[13px] text-[var(--ink)] italic">"{entry.notes}"</p>
                                )}
                                {entry.distractions && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {entry.distractions.split(",").map((d) => (
                                      <span
                                        key={d}
                                        className="text-[10px] bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-sm font-medium"
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
                <div className="grid grid-cols-2 gap-4">
                  <Card className="text-center overflow-hidden relative">
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#d4af37]/10 rounded-full blur-xl pointer-events-none" />
                    <CardContent className="p-5">
                      <p className="text-[12px] font-medium text-[var(--mute)] mb-1 relative z-10">
                        Weekly Quality
                      </p>
                      <p className="text-[28px] font-bold text-[#d4af37] drop-shadow-sm relative z-10">
                        {insightsQuery.data?.weekly_quality.toFixed(1) || "N/A"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="text-center overflow-hidden relative">
                    <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-[var(--primary-soft)] rounded-full blur-xl pointer-events-none" />
                    <CardContent className="p-5">
                      <p className="text-[12px] font-medium text-[var(--mute)] mb-1 relative z-10">
                        Monthly Quality
                      </p>
                      <p className="text-[28px] font-bold text-[var(--primary)] drop-shadow-sm relative z-10">
                        {insightsQuery.data?.monthly_quality.toFixed(1) || "N/A"}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="mb-6 font-semibold text-[14px] text-[var(--ink)] flex items-center gap-2">
                      <LineChart className="h-4 w-4 text-[var(--primary)]" /> Average Khushoo
                    </h3>
                    <div className="h-[200px] w-full -ml-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prayerAverages}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fontSize: 11,
                              fill: "var(--mute)",
                              fontWeight: 500,
                            }}
                            dy={10}
                          />
                          <Tooltip
                            cursor={{ fill: "var(--line)", opacity: 0.4 }}
                            contentStyle={{
                              borderRadius: "12px",
                              border: "1px solid var(--line)",
                              backgroundColor: "var(--surface)",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                            itemStyle={{ color: "var(--primary)" }}
                          />
                          <Bar dataKey="avg" radius={[6, 6, 0, 0]} maxBarSize={40}>
                            {prayerAverages.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill="var(--primary)"
                                opacity={entry.avg > 0 ? 0.9 : 0.2}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {topDistractions.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="mb-4 font-semibold text-[14px] text-[var(--ink)] flex items-center gap-2">
                        Top Distractions
                      </h3>
                      <div className="flex flex-col gap-3">
                        {topDistractions.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-[12px] bg-[var(--bg)] border border-[var(--line)]"
                          >
                            <span className="text-[13px] font-medium text-[var(--ink)] capitalize">{item.name}</span>
                            <span className="text-[11px] font-semibold text-[var(--mute)] bg-[var(--surface)] px-2 py-1 rounded-md border border-[var(--line)]">
                              {item.count} {item.count === 1 ? "time" : "times"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {insightsQuery.data?.insights && insightsQuery.data.insights.length > 0 && (
                  <Card className="bg-gradient-to-br from-[var(--surface)] to-[var(--primary-soft)] border-[var(--line)]">
                    <CardContent className="p-6">
                      <h3 className="mb-5 font-semibold text-[14px] flex items-center gap-2 text-[var(--primary)]">
                        <Sparkles className="h-4 w-4" /> AI Insights
                      </h3>
                      <ul className="flex flex-col gap-4">
                        {insightsQuery.data.insights.map((insight, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-[13px] text-[var(--ink)] leading-relaxed"
                          >
                            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--primary)] shrink-0 opacity-60" />
                            {insight}
                          </li>
                        ))}
                      </ul>
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
