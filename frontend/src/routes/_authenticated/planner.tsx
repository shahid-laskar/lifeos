import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { LoadingBlock } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { getPlannerDay, addTimeBlock, updateTimeBlock, deleteTimeBlock, getMyPrayerTimes } from "@/lib/api/endpoints";
import { todayISO } from "@/lib/prayer";
import { cn } from "@/lib/utils";
import type { TimeBlockResponse } from "@/lib/api/planner-types";
import { Quote } from "@/components/ui/quote";

export const Route = createFileRoute("/_authenticated/planner")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Daily Planner — Muslim Life OS" }],
  }),
  component: PlannerPage,
});

function PlannerPage() {
  const queryClient = useQueryClient();
  const date = todayISO();

  const [isAdding, setIsAdding] = useState(false);
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const prayerQuery = useQuery({
    queryKey: ["prayer-times", date],
    queryFn: () => getMyPrayerTimes(date),
  });

  const plannerQuery = useQuery({
    queryKey: ["planner-day", date],
    queryFn: () => getPlannerDay(date),
  });

  const addMutation = useMutation({
    mutationFn: (data: { start_time: string; end_time: string; title: string }) => addTimeBlock(date, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner-day", date] });
      setIsAdding(false);
      setNewTitle("");
      setNewStart("");
      setNewEnd("");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (block: TimeBlockResponse) => updateTimeBlock(block.id, { completed: !block.completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner-day", date] });
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStart || !newEnd || !newTitle) return;
    addMutation.mutate({ start_time: newStart, end_time: newEnd, title: newTitle });
  };

  const blocks = plannerQuery.data?.blocks ?? [];
  const completedCount = blocks.filter(b => b.completed).length;
  const progress = blocks.length > 0 ? completedCount / blocks.length : 0;

  return (
    <>
      <PageHeader title="Planner" subtitle="Plan your day around your prayers" arabic="خُطَّة" />
      
      <div className="flex flex-col gap-6 mt-6">
        <div className="card">
          <Quote className="text-[14px]">
            {progress === 1 && blocks.length > 0 
              ? "Excellent work! You've completed all your planned blocks today."
              : blocks.length > 0 
              ? `You've completed ${completedCount} of ${blocks.length} time blocks today. Keep going!`
              : "No time blocks scheduled for today yet. Add some to get started!"}
          </Quote>
          
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[var(--primary)] font-medium">Daily Progress</span>
              <span className="text-[var(--mute)]">{Math.round(progress * 100)}%</span>
            </div>
            <div className="bar relative h-[7px] w-full overflow-hidden rounded-[9px] bg-[var(--line)]">
              <div
                className="absolute inset-y-0 left-0 bg-[var(--primary)] transition-all duration-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </div>

        {plannerQuery.isPending || prayerQuery.isPending ? (
          <LoadingBlock label="Loading your schedule" />
        ) : plannerQuery.isError ? (
          <ErrorState 
            title="Couldn't load schedule" 
            message="Please check your connection and try again." 
            onRetry={() => plannerQuery.refetch()} 
          />
        ) : (
          <div className="flex flex-col gap-4">
            {blocks.length === 0 && !isAdding ? (
              <div className="empty py-10 text-center">
                <div className="glyph mx-auto mb-4 flex h-[44px] w-[44px] items-center justify-center rounded-[14px] bg-[var(--primary-soft)] text-[var(--primary)]">
                  📅
                </div>
                <h3 className="font-semibold text-[var(--ink)]">A blank canvas</h3>
                <p className="mt-1 text-[13px] text-[var(--mute)]">Add time blocks to structure your day.</p>
                <button
                  onClick={() => setIsAdding(true)}
                  className="btn mt-4"
                >
                  Add Time Block
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 relative">
                {(() => {
                  const timelineItems: Array<{ type: 'prayer' | 'block', time: string, obj: any }> = [];
                  
                  if (prayerQuery.data?.times) {
                    const times = prayerQuery.data.times;
                    timelineItems.push({ type: 'prayer', time: times.fajr, obj: { name: 'Fajr', time: times.fajr } });
                    timelineItems.push({ type: 'prayer', time: times.dhuhr, obj: { name: 'Dhuhr', time: times.dhuhr } });
                    timelineItems.push({ type: 'prayer', time: times.asr, obj: { name: 'Asr', time: times.asr } });
                    timelineItems.push({ type: 'prayer', time: times.maghrib, obj: { name: 'Maghrib', time: times.maghrib } });
                    timelineItems.push({ type: 'prayer', time: times.isha, obj: { name: 'Isha', time: times.isha } });
                  }
                  
                  blocks.forEach(b => {
                    timelineItems.push({ type: 'block', time: b.start_time, obj: b });
                  });
                  
                  timelineItems.sort((a, b) => a.time.localeCompare(b.time));
                  
                  return timelineItems.map((item, idx) => {
                    if (item.type === 'prayer') {
                      return (
                        <div key={`prayer-${idx}`} className="flex items-center gap-4 py-2 opacity-70">
                          <div className="flex w-16 shrink-0 flex-col text-right">
                            <span className="text-[12px] font-medium text-[var(--primary)]">{item.time}</span>
                          </div>
                          <div className="flex h-[1px] flex-1 bg-[var(--primary-soft)]" />
                          <span className="text-[12px] font-semibold text-[var(--primary)] uppercase tracking-wider">{item.obj.name}</span>
                          <div className="flex h-[1px] flex-1 bg-[var(--primary-soft)]" />
                        </div>
                      );
                    } else {
                      const block = item.obj as TimeBlockResponse;
                      return (
                        <div key={`block-${block.id}`} className="card flex items-center justify-between p-4 ml-6 border-l-4 border-l-[var(--primary)]">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => toggleMutation.mutate(block)}
                              className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                                block.completed 
                                  ? "border-[var(--primary)] bg-[var(--primary)]" 
                                  : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--mute)]"
                              )}
                            >
                              {block.completed && (
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M2.5 6.5L5 9L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </button>
                            <div className="flex flex-col">
                              <span className={cn(
                                "text-[14px] font-medium transition-colors",
                                block.completed ? "text-[var(--mute)] line-through" : "text-[var(--ink)]"
                              )}>
                                {block.title}
                              </span>
                              <span className="text-[12px] text-[var(--mute)]">
                                {block.start_time} - {block.end_time}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  });
                })()}

                {isAdding ? (
                  <form onSubmit={handleAddSubmit} className="card flex flex-col gap-3 p-4 border-[var(--primary)] border">
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Block title (e.g. Deep Work)"
                      className="w-full bg-transparent outline-none text-[14px] font-medium text-[var(--ink)] placeholder-[var(--mute)]"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                    />
                    <div className="flex gap-2 items-center text-[13px]">
                      <input 
                        type="time" 
                        value={newStart}
                        onChange={e => setNewStart(e.target.value)}
                        className="bg-[var(--surface)] border border-[var(--line)] rounded-md px-2 py-1 text-[var(--ink)]"
                      />
                      <span className="text-[var(--mute)]">to</span>
                      <input 
                        type="time" 
                        value={newEnd}
                        onChange={e => setNewEnd(e.target.value)}
                        className="bg-[var(--surface)] border border-[var(--line)] rounded-md px-2 py-1 text-[var(--ink)]"
                      />
                    </div>
                    <div className="flex gap-2 justify-end mt-2">
                      <button 
                        type="button" 
                        onClick={() => setIsAdding(false)}
                        className="text-[13px] font-medium text-[var(--mute)] hover:text-[var(--ink)] px-3 py-1.5"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={!newStart || !newEnd || !newTitle || addMutation.isPending}
                        className="btn px-4 py-1.5"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <button 
                    onClick={() => setIsAdding(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line)] py-4 text-[13px] font-medium text-[var(--mute)] transition-colors hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                  >
                    <Plus className="h-4 w-4" /> Add Block
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
