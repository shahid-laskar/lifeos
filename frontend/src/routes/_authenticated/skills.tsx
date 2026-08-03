import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Zap, Plus, MoreVertical, Check, Target, Milestone } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { LoadingBlock } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { getSkills, createSkill, updateSkill, deleteSkill, updateSkillMilestone } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/skills")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Skill Roadmaps — Muslim Life OS" }],
  }),
  component: SkillsPage,
});

function SkillsPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [milestone1, setMilestone1] = useState("");
  const [milestone2, setMilestone2] = useState("");
  const [milestone3, setMilestone3] = useState("");

  const skillsQuery = useQuery({
    queryKey: ["skills"],
    queryFn: getSkills,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createSkill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateSkill(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateSkillMilestone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });

  const resetForm = () => {
    setIsAdding(false);
    setName("");
    setDescription("");
    setMilestone1("");
    setMilestone2("");
    setMilestone3("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    const milestones = [];
    if (milestone1) milestones.push({ title: milestone1, order_index: 0 });
    if (milestone2) milestones.push({ title: milestone2, order_index: 1 });
    if (milestone3) milestones.push({ title: milestone3, order_index: 2 });
    
    createMutation.mutate({
      name,
      description: description || null,
      milestones
    });
  };

  const skills = skillsQuery.data ?? [];

  return (
    <>
      <PageHeader title="Skill Roadmaps" subtitle="Mastery through consistent, deliberate effort" arabic="إِتْقَان" />

      <div className="flex flex-col gap-6 mt-6">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-[16px] text-[var(--ink)]">Your Roadmaps</h3>
          <button 
            onClick={() => { resetForm(); setIsAdding(!isAdding); }}
            className="flex items-center gap-1 text-[13px] font-medium text-[var(--primary)]"
          >
            <Plus className="h-4 w-4" /> Add Skill
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleSubmit} className="card p-5 flex flex-col gap-4 border-[var(--primary)] border">
            <div>
              <label className="text-[12px] font-medium text-[var(--mute)] mb-1 block">Skill Name</label>
              <input 
                autoFocus
                type="text" 
                required
                placeholder="e.g. Arabic Grammar (Nahw)"
                className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-md px-3 py-1.5 text-[14px] outline-none focus:border-[var(--primary)]"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[var(--mute)] mb-1 block">Why are you learning this?</label>
              <textarea 
                className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-md px-3 py-1.5 text-[14px] outline-none focus:border-[var(--primary)] resize-y min-h-[60px]"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-[12px] font-medium text-[var(--mute)] mb-2 block flex items-center gap-1">
                <Milestone className="h-3 w-3" /> Key Milestones (Optional)
              </label>
              <div className="flex flex-col gap-2">
                <input 
                  type="text" 
                  placeholder="Milestone 1 (e.g. Memorize alphabet)"
                  className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-md px-3 py-1.5 text-[14px] outline-none focus:border-[var(--primary)]"
                  value={milestone1}
                  onChange={e => setMilestone1(e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="Milestone 2"
                  className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-md px-3 py-1.5 text-[14px] outline-none focus:border-[var(--primary)]"
                  value={milestone2}
                  onChange={e => setMilestone2(e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="Milestone 3"
                  className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-md px-3 py-1.5 text-[14px] outline-none focus:border-[var(--primary)]"
                  value={milestone3}
                  onChange={e => setMilestone3(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button 
                type="button" 
                onClick={resetForm}
                className="text-[13px] text-[var(--mute)] px-3 py-1"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={createMutation.isPending}
                className="btn px-5 py-1.5"
              >
                Create Roadmap
              </button>
            </div>
          </form>
        )}

        {skillsQuery.isPending ? (
          <LoadingBlock label="Loading roadmaps" />
        ) : skillsQuery.isError ? (
          <ErrorState 
            title="Couldn't load skills" 
            message="Please try again." 
            onRetry={() => skillsQuery.refetch()} 
          />
        ) : skills.length === 0 ? (
          <div className="empty py-10 text-center">
            <Zap className="h-10 w-10 text-[var(--line)] mx-auto mb-3" />
            <h3 className="font-semibold text-[var(--ink)]">No skills tracked</h3>
            <p className="mt-1 text-[13px] text-[var(--mute)]">Define a skill and break it down into milestones.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {skills.map(skill => {
              const totalMilestones = skill.milestones.length;
              const completedMilestones = skill.milestones.filter(m => m.is_completed).length;
              const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : (skill.is_completed ? 100 : 0);
              
              return (
                <div key={skill.id} className="card p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-[16px] text-[var(--ink)] flex items-center gap-2">
                        {skill.name}
                        {skill.is_completed && <span className="px-2 py-0.5 rounded-full bg-[var(--primary)] text-white text-[10px] uppercase font-bold tracking-wider">Mastered</span>}
                      </h4>
                      {skill.description && <p className="text-[13px] text-[var(--mute)] mt-1">{skill.description}</p>}
                    </div>
                    <button 
                      onClick={() => { if(confirm('Delete this skill roadmap?')) deleteMutation.mutate(skill.id) }}
                      className="p-1 text-[var(--mute)] hover:text-red-500 rounded-md"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4 mb-5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[12px] font-medium text-[var(--mute)] uppercase tracking-wider">Progress</span>
                      <span className="text-[12px] font-bold text-[var(--primary)]">{progress}%</span>
                    </div>
                    <div className="bar h-2 w-full bg-[var(--line)] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones */}
                  {skill.milestones.length > 0 && (
                    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-lg p-3">
                      <h5 className="text-[12px] font-bold uppercase tracking-wider text-[var(--mute)] mb-3 flex items-center gap-1">
                        <Target className="h-3 w-3" /> Milestones
                      </h5>
                      <div className="flex flex-col gap-2">
                        {skill.milestones.map((milestone) => (
                          <div 
                            key={milestone.id}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-md transition-colors",
                              milestone.is_completed ? "bg-[var(--primary-soft)]" : "hover:bg-[var(--line)] cursor-pointer"
                            )}
                            onClick={() => {
                              if (!milestone.is_completed) {
                                updateMilestoneMutation.mutate({ id: milestone.id, data: { is_completed: true } });
                                
                                // Auto-complete skill if this was the last milestone
                                if (completedMilestones + 1 === totalMilestones) {
                                  updateMutation.mutate({ id: skill.id, data: { is_completed: true } });
                                }
                              } else {
                                updateMilestoneMutation.mutate({ id: milestone.id, data: { is_completed: false } });
                                updateMutation.mutate({ id: skill.id, data: { is_completed: false } });
                              }
                            }}
                          >
                            <div className={cn(
                              "h-5 w-5 rounded-full flex items-center justify-center border shrink-0",
                              milestone.is_completed 
                                ? "bg-[var(--primary)] border-[var(--primary)] text-white" 
                                : "border-[var(--mute)] text-transparent"
                            )}>
                              <Check className="h-3 w-3" />
                            </div>
                            <span className={cn(
                              "text-[14px] flex-1",
                              milestone.is_completed ? "text-[var(--primary)] line-through opacity-70 font-medium" : "text-[var(--ink)]"
                            )}>
                              {milestone.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Mark complete if no milestones */}
                  {skill.milestones.length === 0 && !skill.is_completed && (
                    <button
                      onClick={() => updateMutation.mutate({ id: skill.id, data: { is_completed: true } })}
                      className="mt-2 w-full py-2 border border-[var(--line)] rounded-md text-[13px] font-medium text-[var(--ink)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                    >
                      Mark as Mastered
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
