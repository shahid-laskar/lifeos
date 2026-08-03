import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckSquare, Plus, Check } from "lucide-react";
import { getFamilyTasks, createFamilyTask, toggleFamilyTask } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";

export function FamilyTasks({ familyId, currentUserId }: { familyId: string, currentUserId: string }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["family-tasks", familyId],
    queryFn: () => getFamilyTasks(familyId),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createFamilyTask(familyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-tasks", familyId] });
      setIsAdding(false);
      setTitle("");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (taskId: string) => toggleFamilyTask(familyId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-tasks", familyId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    
    createMutation.mutate({
      title,
      is_completed: false
    });
  };

  return (
    <div className="card p-5 border-[var(--line)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-[16px] text-[var(--ink)] flex items-center gap-2">
          <CheckSquare className="h-4 w-4" /> Household Tasks
        </h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 text-[13px] font-medium text-[var(--primary)]"
        >
          <Plus className="h-4 w-4" /> Add Task
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-5 p-4 border border-[var(--primary)] rounded-lg bg-[var(--surface)] flex flex-col gap-3">
          <div>
            <label className="text-[12px] font-medium text-[var(--mute)] mb-1 block">Task Title</label>
            <input 
              autoFocus
              type="text" 
              required
              placeholder="e.g. Take out the trash"
              className="w-full bg-white border border-[var(--line)] rounded-md px-3 py-1.5 text-[14px] outline-none focus:border-[var(--primary)]"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="text-[13px] text-[var(--mute)] px-3 py-1"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={createMutation.isPending}
              className="btn px-4 py-1.5"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="py-5 text-center text-[13px] text-[var(--mute)]">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="py-5 text-center">
          <p className="text-[13px] text-[var(--mute)]">No household tasks defined.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className={cn(
                "flex items-center gap-3 p-3 border rounded-lg transition-colors cursor-pointer",
                task.is_completed ? "bg-[var(--surface)] border-[var(--line)]" : "border-[var(--line)] hover:border-[var(--primary-soft)]"
              )}
              onClick={() => toggleMutation.mutate(task.id)}
            >
              <div className={cn(
                "h-5 w-5 rounded-md flex items-center justify-center border shrink-0",
                task.is_completed ? "bg-[var(--primary)] border-[var(--primary)] text-white" : "border-[var(--mute)] text-transparent"
              )}>
                <Check className="h-3 w-3" />
              </div>
              <div className="flex-1">
                <h4 className={cn("text-[14px] font-medium", task.is_completed ? "text-[var(--mute)] line-through" : "text-[var(--ink)]")}>
                  {task.title}
                </h4>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
