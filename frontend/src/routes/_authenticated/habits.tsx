import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Check, MoreVertical } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { LoadingBlock } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { getCustomHabits, createCustomHabit, toggleCustomHabitCompletion, deleteCustomHabit } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/habits")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Habits — Muslim Life OS" }],
  }),
  component: HabitsPage,
});

function getTodayString() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function HabitsPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitFreq, setNewHabitFreq] = useState<"daily" | "weekly">("daily");
  
  const todayStr = getTodayString();

  const habitsQuery = useQuery({
    queryKey: ["custom_habits"],
    queryFn: getCustomHabits,
  });

  const createHabitMutation = useMutation({
    mutationFn: (data: any) => createCustomHabit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_habits"] });
      setIsAdding(false);
      setNewHabitName("");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, date }: { id: string, date: string }) => toggleCustomHabitCompletion(id, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_habits"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCustomHabit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_habits"] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName) return;
    createHabitMutation.mutate({
      name: newHabitName,
      frequency: newHabitFreq,
    });
  };

  const habits = habitsQuery.data ?? [];

  // Generate density grid data (last 12 weeks = 84 days)
  const generateDensityGrid = (completions: string[]) => {
    const grid = [];
    const today = new Date();
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      grid.push({
        date: dateStr,
        completed: completions.includes(dateStr)
      });
    }
    return grid;
  };

  return (
    <>
      <PageHeader title="Habits" subtitle="Build identity-based habits, one step at a time" arabic="عَادَات" />

      <div className="flex flex-col gap-6 mt-6">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-[16px] text-[var(--ink)]">Daily Checklist</h3>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1 text-[13px] font-medium text-[var(--primary)]"
          >
            <Plus className="h-4 w-4" /> Add Habit
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleCreate} className="card p-4 flex flex-col gap-3 border-[var(--primary)] border">
            <div>
              <label className="text-[12px] font-medium text-[var(--mute)] mb-1 block">Habit Name</label>
              <input 
                autoFocus
                type="text" 
                required
                placeholder="e.g. Read 5 pages of Qur'an"
                className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-md px-3 py-1.5 text-[14px] outline-none focus:border-[var(--primary)]"
                value={newHabitName}
                onChange={e => setNewHabitName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[var(--mute)] mb-1 block">Frequency</label>
              <select 
                className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-md px-3 py-1.5 text-[14px] outline-none focus:border-[var(--primary)]"
                value={newHabitFreq}
                onChange={e => setNewHabitFreq(e.target.value as "daily" | "weekly")}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="text-[13px] text-[var(--mute)] px-3 py-1"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={createHabitMutation.isPending}
                className="btn px-4 py-1.5"
              >
                Save
              </button>
            </div>
          </form>
        )}

        {habitsQuery.isPending ? (
          <LoadingBlock label="Loading habits" />
        ) : habitsQuery.isError ? (
          <ErrorState 
            title="Couldn't load habits" 
            message="Please try again." 
            onRetry={() => habitsQuery.refetch()} 
          />
        ) : habits.length === 0 ? (
          <div className="empty py-10 text-center">
            <h3 className="font-semibold text-[var(--ink)]">No habits found</h3>
            <p className="mt-1 text-[13px] text-[var(--mute)]">Start building good habits today.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {habits.map((habit) => (
              <div key={habit.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <button
                      onClick={() => toggleMutation.mutate({ id: habit.id, date: todayStr })}
                      className={cn(
                        "flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full transition-all duration-300",
                        habit.completed_today
                          ? "bg-[var(--primary)] text-white"
                          : "border-2 border-[var(--line)] bg-[var(--surface)] text-transparent hover:border-[var(--primary-soft)] hover:text-[var(--primary-soft)]"
                      )}
                    >
                      <Check className="h-6 w-6" />
                    </button>
                    
                    <div>
                      <h4 className="font-medium text-[16px] text-[var(--ink)]">{habit.name}</h4>
                      <p className="text-[13px] text-[var(--mute)] mt-0.5">
                        {habit.frequency === 'daily' ? 'Daily' : 'Weekly'}
                        {habit.streak > 0 && ` • Consistent for ${habit.streak} ${habit.frequency === 'daily' ? 'days' : 'weeks'}`}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      if(confirm('Are you sure you want to delete this habit?')) {
                        deleteMutation.mutate(habit.id);
                      }
                    }}
                    className="p-1 text-[var(--mute)] hover:text-red-500 rounded-md"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
                
                {/* 12-week Density Grid */}
                <div className="mt-5 pt-5 border-t border-[var(--line)]">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mute)] mb-3">
                    Last 12 Weeks Activity
                  </p>
                  <div className="flex gap-[3px] flex-wrap">
                    {generateDensityGrid(habit.recent_completions).map((day, idx) => (
                      <div 
                        key={idx}
                        title={day.date}
                        className={cn(
                          "h-[10px] w-[10px] rounded-sm transition-colors",
                          day.completed ? "bg-[var(--primary)] opacity-80" : "bg-[var(--line)] opacity-50"
                        )}
                      />
                    ))}
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-[13px] text-[var(--ink)] font-medium">
                      Consistency builds identity.
                    </p>
                    <div className="weekdots flex items-center gap-1">
                      {/* Show last 7 days simplified */}
                      {[6, 5, 4, 3, 2, 1, 0].map(daysAgo => {
                        const d = new Date();
                        d.setDate(d.getDate() - daysAgo);
                        const isDone = habit.recent_completions.includes(d.toISOString().split('T')[0]);
                        return (
                          <div 
                            key={daysAgo} 
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              isDone ? "bg-[var(--primary)]" : "bg-[var(--line)]"
                            )}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
