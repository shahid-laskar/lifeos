import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingBlock } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { getPrayerJournal, getPrayerInsights, logPrayerJournal } from "@/lib/api/endpoints";
import { PRAYER_NAMES } from "@/lib/api/types";
import { todayISO } from "@/lib/prayer";
import { Book, LineChart, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/prayer-journal")({
  ssr: false,
  component: PrayerJournalPage,
});

function PrayerJournalPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"journal" | "insights">("journal");
  const [selectedPrayer, setSelectedPrayer] = useState(PRAYER_NAMES[0]);
  const [khushoo, setKhushoo] = useState(3);
  const [notes, setNotes] = useState("");
  const [distractions, setDistractions] = useState("");

  const journalQuery = useQuery({
    queryKey: ["prayer-journal"],
    queryFn: getPrayerJournal,
  });

  const insightsQuery = useQuery({
    queryKey: ["prayer-insights"],
    queryFn: getPrayerInsights,
  });

  const logMutation = useMutation({
    mutationFn: () => logPrayerJournal({
      prayer_name: selectedPrayer,
      date: todayISO(),
      khushoo_rating: khushoo,
      notes,
      distractions
    }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["prayer-journal"] });
      queryClient.invalidateQueries({ queryKey: ["prayer-insights"] });
      setNotes("");
      setDistractions("");
      setKhushoo(3);
    }
  });

  return (
    <>
      <PageHeader
        title="Prayer Journal"
        subtitle="Reflect on your khushoo"
        arabic="خُشُوع"
      />

      <div className="mx-5 mb-6 flex rounded-xl border border-border bg-muted/50 p-1">
        <button
          onClick={() => setActiveTab("journal")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            activeTab === "journal" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          <Book className="mr-2 inline size-4" />
          Journal
        </button>
        <button
          onClick={() => setActiveTab("insights")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            activeTab === "insights" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          <LineChart className="mr-2 inline size-4" />
          Insights
        </button>
      </div>

      <div className="px-5 pb-24">
        {activeTab === "journal" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="mb-4 font-semibold text-lg">New Reflection</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Prayer</label>
                  <select
                    value={selectedPrayer}
                    onChange={(e) => setSelectedPrayer(e.target.value as any)}
                    className="w-full rounded-md border border-input bg-background p-2 text-sm"
                  >
                    {PRAYER_NAMES.map((name) => (
                      <option key={name} value={name}>{name.charAt(0).toUpperCase() + name.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Khushoo Rating (1-5)</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={khushoo}
                    onChange={(e) => setKhushoo(parseInt(e.target.value, 10))}
                    className="w-full"
                  />
                  <div className="text-center text-sm font-bold text-gold">{khushoo}</div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="How did you feel during prayer?"
                    className="w-full rounded-md border border-input bg-background p-2 text-sm"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Distractions (optional)</label>
                  <textarea
                    value={distractions}
                    onChange={(e) => setDistractions(e.target.value)}
                    placeholder="What distracted you?"
                    className="w-full rounded-md border border-input bg-background p-2 text-sm"
                    rows={2}
                  />
                </div>
                <button
                  onClick={() => logMutation.mutate()}
                  disabled={logMutation.isPending}
                  className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {logMutation.isPending ? "Saving..." : "Save Reflection"}
                </button>
              </div>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-lg">History</h3>
              {journalQuery.isPending ? (
                <LoadingBlock label="Loading journal..." />
              ) : journalQuery.isError ? (
                <ErrorState title="Error" message="Could not load journal." onRetry={() => journalQuery.refetch()} />
              ) : (
                <div className="space-y-3">
                  {journalQuery.data?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center">No journal entries yet.</p>
                  ) : (
                    journalQuery.data?.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold capitalize">{entry.prayer_name}</span>
                          <span className="text-xs text-muted-foreground">{entry.date}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-gold">Khushoo: {entry.khushoo_rating}/5</span>
                        </div>
                        {entry.notes && <p className="mt-2 text-sm text-muted-foreground">"{entry.notes}"</p>}
                        {entry.distractions && <p className="mt-1 text-xs text-muted-foreground">Distractions: {entry.distractions}</p>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "insights" && (
          <div className="space-y-6">
            {insightsQuery.isPending ? (
              <LoadingBlock label="Loading insights..." />
            ) : insightsQuery.isError ? (
              <ErrorState title="Error" message="Could not load insights." onRetry={() => insightsQuery.refetch()} />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">Weekly Quality</p>
                    <p className="text-2xl font-bold text-gold">{insightsQuery.data?.weekly_quality.toFixed(1) || "N/A"}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">Monthly Quality</p>
                    <p className="text-2xl font-bold text-gold">{insightsQuery.data?.monthly_quality.toFixed(1) || "N/A"}</p>
                  </div>
                </div>
                
                {insightsQuery.data?.insights && insightsQuery.data.insights.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <h3 className="mb-4 font-semibold flex items-center gap-2">
                      <Sparkles className="size-4 text-primary" />
                      AI Insights
                    </h3>
                    <ul className="space-y-3 list-disc pl-4 text-sm text-muted-foreground">
                      {insightsQuery.data.insights.map((insight, i) => (
                        <li key={i}>{insight}</li>
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
