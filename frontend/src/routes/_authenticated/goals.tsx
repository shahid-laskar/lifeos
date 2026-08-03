import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { LoadingBlock } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { getGoals, createGoal, addMilestone, updateMilestone } from "@/lib/api/endpoints";
import type { GoalResponse, GoalMilestoneResponse } from "@/lib/api/goal-types";
import { cn } from "@/lib/utils";
import { Quote } from "@/components/ui/quote";

export const Route = createFileRoute("/_authenticated/goals")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Goal Planner — Muslim Life OS" }],
  }),
  component: GoalsPage,
});

function GoalsPage() {
  const queryClient = useQueryClient();
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState<GoalResponse["category"]>("spiritual");

  const [addingMilestoneFor, setAddingMilestoneFor] = useState<string | null>(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");

  const goalsQuery = useQuery({
    queryKey: ["goals"],
    queryFn: getGoals,
  });

  const createGoalMutation = useMutation({
    mutationFn: (data: { title: string; category: GoalResponse["category"] }) => createGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setIsAddingGoal(false);
      setNewGoalTitle("");
    },
  });

  const addMilestoneMutation = useMutation({
    mutationFn: (data: { goalId: string; title: string }) => addMilestone(data.goalId, { title: data.title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setAddingMilestoneFor(null);
      setNewMilestoneTitle("");
    },
  });

  const toggleMilestoneMutation = useMutation({
    mutationFn: (m: GoalMilestoneResponse) => updateMilestone(m.id, { completed: !m.completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    createGoalMutation.mutate({ title: newGoalTitle.trim(), category: newGoalCategory });
  };

  const handleAddMilestone = (e: React.FormEvent, goalId: string) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;
    addMilestoneMutation.mutate({ goalId, title: newMilestoneTitle.trim() });
  };

  const goals = goalsQuery.data ?? [];

  return (
    <>
      <PageHeader title="Goals" subtitle="Align your ambitions with your hereafter" arabic="أَهْدَاف" />

      <div className="flex flex-col gap-6 mt-6">
        {goalsQuery.isPending ? (
          <LoadingBlock label="Loading goals" />
        ) : goalsQuery.isError ? (
          <ErrorState 
            title="Couldn't load goals" 
            message="Check your connection and try again." 
            onRetry={() => goalsQuery.refetch()} 
          />
        ) : (
          <div className="flex flex-col gap-6">
            {goals.length === 0 && !isAddingGoal ? (
              <div className="empty py-10 text-center">
                <div className="glyph mx-auto mb-4 flex h-[44px] w-[44px] items-center justify-center rounded-[14px] bg-[var(--primary-soft)] text-[var(--primary)]">
                  🎯
                </div>
                <h3 className="font-semibold text-[var(--ink)]">No goals set</h3>
                <p className="mt-1 text-[13px] text-[var(--mute)]">Define what matters most.</p>
                <button onClick={() => setIsAddingGoal(true)} className="btn mt-4">
                  Set a Goal
                </button>
              </div>
            ) : (
              goals.map((goal) => (
                <div key={goal.id} className="card flex flex-col gap-4 p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--primary-soft)] px-2 py-0.5 rounded-full mb-2 inline-block">
                        {goal.category}
                      </span>
                      <h3 className="text-[16px] font-semibold text-[var(--ink)]">{goal.title}</h3>
                    </div>
                  </div>

                  <Quote className="text-[13px]">
                    {goal.progress === 1 && goal.milestones.length > 0 
                      ? "Alhamdulillah, you have achieved this goal!"
                      : goal.milestones.length > 0 
                      ? `You are ${Math.round(goal.progress * 100)}% of the way there. Keep striving!`
                      : "Add milestones to break this goal down into actionable steps."}
                  </Quote>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-[var(--primary)] font-medium">Progress</span>
                      <span className="text-[var(--mute)]">{Math.round(goal.progress * 100)}%</span>
                    </div>
                    <div className="bar relative h-[7px] w-full overflow-hidden rounded-[9px] bg-[var(--line)]">
                      <div
                        className="absolute inset-y-0 left-0 bg-[var(--primary)] transition-all duration-500"
                        style={{ width: `${goal.progress * 100}%` }}
                      />
                    </div>
                    {/* weekdots pattern representation */}
                    {goal.milestones.length > 0 && (
                      <div className="flex gap-1 mt-1 justify-between w-full">
                        {goal.milestones.map((m, i) => (
                          <div 
                            key={`dot-${i}`} 
                            className={cn(
                              "h-1.5 flex-1 rounded-full transition-colors",
                              m.completed ? "bg-[var(--primary)]" : "bg-[var(--line)]"
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <h4 className="text-[13px] font-medium text-[var(--ink)]">Milestones</h4>
                    {goal.milestones.map(m => (
                      <div key={m.id} className="flex items-center gap-3 py-1">
                        <button 
                          onClick={() => toggleMilestoneMutation.mutate(m)}
                          className={cn(
                            "flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                            m.completed 
                              ? "border-[var(--primary)] bg-[var(--primary)]" 
                              : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--mute)]"
                          )}
                        >
                          {m.completed && (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M2.5 6.5L5 9L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                        <span className={cn(
                          "text-[13px] transition-colors",
                          m.completed ? "text-[var(--mute)] line-through" : "text-[var(--ink)]"
                        )}>
                          {m.title}
                        </span>
                      </div>
                    ))}
                    
                    {addingMilestoneFor === goal.id ? (
                      <form onSubmit={(e) => handleAddMilestone(e, goal.id)} className="flex items-center gap-2 mt-2">
                        <input 
                          autoFocus
                          type="text" 
                          placeholder="Milestone title..."
                          value={newMilestoneTitle}
                          onChange={(e) => setNewMilestoneTitle(e.target.value)}
                          className="flex-1 bg-[var(--surface)] border border-[var(--line)] rounded-md px-3 py-1.5 text-[13px] outline-none focus:border-[var(--primary)]"
                        />
                        <button type="button" onClick={() => setAddingMilestoneFor(null)} className="text-[12px] text-[var(--mute)] hover:text-[var(--ink)] px-2">
                          Cancel
                        </button>
                        <button type="submit" disabled={!newMilestoneTitle.trim() || addMilestoneMutation.isPending} className="text-[12px] font-medium text-[var(--primary)] px-2">
                          Add
                        </button>
                      </form>
                    ) : (
                      <button 
                        onClick={() => setAddingMilestoneFor(goal.id)}
                        className="text-[12px] text-[var(--mute)] hover:text-[var(--primary)] flex items-center gap-1 mt-1 font-medium transition-colors w-fit"
                      >
                        <Plus className="h-3 w-3" /> Add Milestone
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}

            {!isAddingGoal && goals.length > 0 && (
              <button 
                onClick={() => setIsAddingGoal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line)] py-4 text-[13px] font-medium text-[var(--mute)] transition-colors hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
              >
                <Plus className="h-4 w-4" /> Set New Goal
              </button>
            )}

            {isAddingGoal && (
              <form onSubmit={handleCreateGoal} className="card flex flex-col gap-4 p-5 border-[var(--primary)] border">
                <div>
                  <label className="text-[12px] font-medium text-[var(--mute)] uppercase tracking-wider mb-1 block">Goal Title</label>
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="E.g., Memorize Juz Amma"
                    className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-md px-3 py-2 text-[14px] outline-none focus:border-[var(--primary)]"
                    value={newGoalTitle}
                    onChange={e => setNewGoalTitle(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-[12px] font-medium text-[var(--mute)] uppercase tracking-wider mb-1 block">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {(["spiritual", "family", "career", "health", "other"] as const).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewGoalCategory(cat)}
                        className={cn(
                          "pill px-3 py-1 text-[12px] font-medium transition-colors capitalize",
                          newGoalCategory === cat 
                            ? "bg-[var(--primary)] text-white" 
                            : "bg-[var(--surface)] text-[var(--mute)] border border-[var(--line)] hover:border-[var(--primary-soft)] hover:text-[var(--primary)]"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end mt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingGoal(false)}
                    className="text-[13px] font-medium text-[var(--mute)] hover:text-[var(--ink)] px-3 py-1.5"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={!newGoalTitle.trim() || createGoalMutation.isPending}
                    className="btn px-4 py-1.5"
                  >
                    Save Goal
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </>
  );
}
