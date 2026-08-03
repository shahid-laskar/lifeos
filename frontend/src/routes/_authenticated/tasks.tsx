import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { SearchBar } from "@/components/ui/search-bar";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingBlock } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { getTasks, createTask, updateTask, deleteTask } from "@/lib/api/endpoints";
import type { TaskResponse } from "@/lib/api/task-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tasks")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Tasks — Muslim Life OS" }],
  }),
  component: TasksPage,
});

function TasksPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "active" | "completed">("active");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskNiyyah, setNewTaskNiyyah] = useState("");

  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: () => getTasks(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; niyyah?: string }) => createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setNewTaskTitle("");
      setNewTaskNiyyah("");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (task: TaskResponse) => updateTask(task.id, { completed: !task.completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    createMutation.mutate({ 
      title: newTaskTitle.trim(), 
      niyyah: newTaskNiyyah.trim() || undefined 
    });
  };

  const tasks = tasksQuery.data ?? [];
  
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filter === "active") return !t.completed;
      if (filter === "completed") return t.completed;
      return true;
    });
  }, [tasks, filter]);

  return (
    <>
      <PageHeader title="Tasks" subtitle="Manage your priorities and intentions" arabic="مَهَام" />

      <div className="flex flex-col gap-6 mt-6">
        <form onSubmit={handleCreateTask} className="flex flex-col gap-2 relative">
          <div className="searchbar group flex h-[48px] w-full items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 transition-all focus-within:border-[var(--primary)] focus-within:bg-white focus-within:shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <input 
              type="text" 
              placeholder="What needs to be done?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full bg-transparent text-[15px] outline-none placeholder:text-[var(--mute)]"
            />
          </div>
          {newTaskTitle.trim() && (
            <div className="searchbar group flex h-[44px] w-full items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 mt-1 opacity-80 focus-within:opacity-100">
              <input 
                type="text" 
                placeholder="Intention (Niyyah) - optional"
                value={newTaskNiyyah}
                onChange={(e) => setNewTaskNiyyah(e.target.value)}
                className="w-full bg-transparent text-[14px] outline-none placeholder:text-[var(--mute)] font-serif italic"
              />
              <button 
                type="submit" 
                className="text-[var(--primary)] font-medium text-[13px] px-2"
                disabled={createMutation.isPending}
              >
                Add
              </button>
            </div>
          )}
        </form>

        <div className="flex gap-2">
          {(["active", "completed", "all"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "pill px-4 py-1.5 text-[13px] font-medium transition-colors capitalize",
                filter === f 
                  ? "bg-[var(--primary)] text-white" 
                  : "bg-[var(--primary-soft)] text-[var(--primary)] hover:opacity-80"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {tasksQuery.isPending ? (
          <LoadingBlock label="Loading tasks" />
        ) : tasksQuery.isError ? (
          <ErrorState 
            title="Couldn't load tasks" 
            message="Check your connection and try again." 
            onRetry={() => tasksQuery.refetch()} 
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filteredTasks.length === 0 ? (
              <div className="empty py-10 text-center">
                <div className="glyph mx-auto mb-4 flex h-[44px] w-[44px] items-center justify-center rounded-[14px] bg-[var(--primary-soft)] text-[var(--primary)]">
                  📝
                </div>
                <h3 className="font-semibold text-[var(--ink)]">No tasks found</h3>
                <p className="mt-1 text-[13px] text-[var(--mute)]">
                  {filter === "completed" ? "You haven't completed any tasks yet." : "You're all caught up!"}
                </p>
              </div>
            ) : (
              filteredTasks.map(task => (
                <div key={task.id} className="card flex gap-4 p-4 items-start">
                  <button 
                    onClick={() => toggleMutation.mutate(task)}
                    className={cn(
                      "flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full border-2 transition-colors mt-0.5",
                      task.completed 
                        ? "border-[var(--primary)] bg-[var(--primary)]" 
                        : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--mute)]"
                    )}
                  >
                    {task.completed && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.5 6.5L5 9L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                  <div className="flex flex-col gap-1 w-full">
                    <span className={cn(
                      "text-[15px] font-medium transition-colors",
                      task.completed ? "text-[var(--mute)] line-through" : "text-[var(--ink)]"
                    )}>
                      {task.title}
                    </span>
                    {task.niyyah && (
                      <span className="tr text-[13px] text-[var(--mute)] italic pl-2 border-l-2 border-[var(--primary-soft)] mt-1">
                        "{task.niyyah}"
                      </span>
                    )}
                    {task.project && (
                      <div className="mt-1">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--primary)] bg-[var(--primary-soft)] px-2 py-0.5 rounded-full">
                          {task.project}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
