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

      <div className="mx-5 mb-6 flex rounded-xl border border-border bg-muted/30 p-1 backdrop-blur-md">
        <button
          onClick={() => setActiveTab("journal")}
          className={cn(
            "flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-300",
            activeTab === "journal"
              ? "bg-card text-foreground shadow-sm scale-[1.02]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Book className="mr-2 inline size-4" />
          Journal
        </button>
        <button
          onClick={() => setActiveTab("insights")}
          className={cn(
            "flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-300",
            activeTab === "insights"
              ? "bg-card text-foreground shadow-sm scale-[1.02]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <LineChart className="mr-2 inline size-4" />
          Insights
        </button>
      </div>

      <div className="px-5 pb-24">
        {activeTab === "journal" && (
          <div className="space-y-8">
            <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

              <h3 className="mb-6 font-semibold text-lg flex items-center gap-2">
                <Sparkles className="size-4 text-primary" /> New Reflection
              </h3>

              <div className="space-y-6 relative z-10">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
                  {PRAYER_NAMES.map((name) => (
                    <button
                      key={name}
                      onClick={() => setSelectedPrayer(name)}
                      className={cn(
                        "snap-center shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-all border",
                        selectedPrayer === name
                          ? "border-primary bg-primary text-primary-foreground shadow-md"
                          : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:bg-primary/5",
                      )}
                    >
                      {PRAYER_LABELS[name].latin}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="mb-4 block text-sm font-medium text-foreground text-center">
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
                          <span className="text-3xl drop-shadow-sm">{level.icon}</span>
                          <span
                            className={cn(
                              "text-[10px] font-medium transition-colors",
                              isSelected ? "text-primary" : "text-muted-foreground",
                            )}
                          >
                            {level.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-border/50 pt-4">
                  <button
                    onClick={() => setShowPrompts(!showPrompts)}
                    className="flex w-full items-center justify-between py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>Guided Prompts</span>
                    {showPrompts ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </button>

                  {showPrompts && (
                    <div className="mt-4 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div>
                        <label className="mb-2 block text-xs font-medium text-foreground">
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
                                  ? "bg-primary/10 border-primary/30 text-primary"
                                  : "bg-muted border-border text-muted-foreground hover:border-muted-foreground/30",
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
                          className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                          rows={2}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-medium text-foreground">
                          What was in your heart?
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Any specific duas or feelings..."
                          className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => logMutation.mutate()}
                  disabled={logMutation.isPending}
                  className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 hover:shadow-lg transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  {logMutation.isPending ? "Saving Reflection..." : "Save Reflection"}
                </button>
              </div>
            </div>

            <div>
              <h3 className="mb-4 ml-1 font-semibold text-lg text-foreground/80">
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
                <div className="space-y-4">
                  {journalQuery.data?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-10 text-center bg-card/50 rounded-3xl border border-border/50 border-dashed">
                      <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Book className="size-5 text-primary" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        Your first reflection awaits
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 max-w-[200px] leading-relaxed">
                        Log your first prayer to start tracking your khushoo journey.
                      </p>
                    </div>
                  ) : (
                    journalQuery.data?.map((entry) => {
                      const iconInfo = KHUSHOO_LEVELS.find((l) => l.value === entry.khushoo_rating);
                      return (
                        <div
                          key={entry.id}
                          className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all hover:shadow-md"
                        >
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl drop-shadow-sm">
                                {iconInfo?.icon || "🌗"}
                              </span>
                              <div>
                                <span className="font-semibold text-foreground capitalize block leading-none">
                                  {PRAYER_LABELS[entry.prayer_name].latin}
                                </span>
                                <span className="text-[11px] text-primary font-medium">
                                  {iconInfo?.label}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                              {new Date(entry.date).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>

                          {(entry.notes || entry.distractions) && (
                            <div className="mt-3 space-y-2 pt-3 border-t border-border/30">
                              {entry.notes && (
                                <p className="text-sm text-foreground/90 italic">"{entry.notes}"</p>
                              )}
                              {entry.distractions && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {entry.distractions.split(",").map((d) => (
                                    <span
                                      key={d}
                                      className="text-[10px] bg-destructive/10 text-destructive/80 px-2 py-0.5 rounded-sm font-medium"
                                    >
                                      {d.trim()}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "insights" && (
          <div className="space-y-6">
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
                  <div className="rounded-2xl border border-border/50 bg-card p-5 text-center shadow-sm relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-gold/10 rounded-full blur-xl pointer-events-none" />
                    <p className="text-xs font-medium text-muted-foreground mb-1 relative z-10">
                      Weekly Quality
                    </p>
                    <p className="text-3xl font-bold text-gold drop-shadow-sm relative z-10">
                      {insightsQuery.data?.weekly_quality.toFixed(1) || "N/A"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-card p-5 text-center shadow-sm relative overflow-hidden">
                    <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary/10 rounded-full blur-xl pointer-events-none" />
                    <p className="text-xs font-medium text-muted-foreground mb-1 relative z-10">
                      Monthly Quality
                    </p>
                    <p className="text-3xl font-bold text-primary drop-shadow-sm relative z-10">
                      {insightsQuery.data?.monthly_quality.toFixed(1) || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
                  <h3 className="mb-6 font-semibold text-sm text-foreground flex items-center gap-2">
                    <LineChart className="size-4 text-primary" /> Average Khushoo by Prayer
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
                            fill: "var(--color-muted-foreground)",
                            fontWeight: 500,
                          }}
                          dy={10}
                        />
                        <Tooltip
                          cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid var(--color-border)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                          itemStyle={{ color: "var(--color-primary)" }}
                        />
                        <Bar dataKey="avg" radius={[6, 6, 0, 0]} maxBarSize={40}>
                          {prayerAverages.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill="var(--color-primary)"
                              opacity={entry.avg > 0 ? 0.9 : 0.2}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {topDistractions.length > 0 && (
                  <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
                    <h3 className="mb-4 font-semibold text-sm text-foreground flex items-center gap-2">
                      Top Distractions
                    </h3>
                    <div className="space-y-3">
                      {topDistractions.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
                        >
                          <span className="text-sm font-medium capitalize">{item.name}</span>
                          <span className="text-xs font-bold text-muted-foreground bg-background px-2 py-1 rounded-md border border-border/50">
                            {item.count} {item.count === 1 ? "time" : "times"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {insightsQuery.data?.insights && insightsQuery.data.insights.length > 0 && (
                  <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm bg-gradient-to-br from-card to-primary/5">
                    <h3 className="mb-5 font-semibold text-sm flex items-center gap-2 text-primary">
                      <Sparkles className="size-4" /> AI Insights
                    </h3>
                    <ul className="space-y-4">
                      {insightsQuery.data.insights.map((insight, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm text-foreground/90 leading-relaxed"
                        >
                          <div className="mt-1.5 size-1.5 rounded-full bg-primary/60 shrink-0" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
