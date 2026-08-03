import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Plus, BookOpen, Clock, MoreVertical, PenTool } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { LoadingBlock } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { getJournalEntries, createJournalEntry, deleteJournalEntry } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/journal")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Reflection Journal — Muslim Life OS" }],
  }),
  component: JournalPage,
});

const PROMPTS = [
  "What is one blessing you are truly grateful for today?",
  "How did you experience patience (sabr) today?",
  "Is there a verse or hadith that resonated with you recently?",
  "What is one thing you can improve tomorrow for the sake of Allah?",
];

function getIslamicDateString(date: Date) {
  return new Intl.DateTimeFormat("en-US-u-ca-islamic", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function JournalPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [content, setContent] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  
  const todayStr = new Date().toISOString().split('T')[0];

  const entriesQuery = useQuery({
    queryKey: ["journal_entries"],
    queryFn: getJournalEntries,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createJournalEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal_entries"] });
      setIsAdding(false);
      setContent("");
      setSelectedPrompt(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteJournalEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal_entries"] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createMutation.mutate({
      date: todayStr,
      content,
      prompts_used: selectedPrompt,
      is_private: true,
    });
  };

  const entries = entriesQuery.data ?? [];

  return (
    <>
      <PageHeader title="Reflection Journal" subtitle="Private thoughts, sincere reflections" arabic="تَفَكُّر" />

      <div className="flex flex-col gap-6 mt-6">
        <div className="card p-4 border border-[var(--primary-soft)] bg-[var(--surface)] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-4 w-4 text-[var(--primary)]" />
            <h3 className="font-semibold text-[14px] text-[var(--ink)]">Absolutely Private</h3>
          </div>
          <p className="text-[13px] text-[var(--mute)] leading-relaxed">
            Your journal entries are encrypted and completely private. They are never shared with family members or external services. This space is just for you and your reflections.
          </p>
        </div>

        <div className="flex justify-between items-center mt-2">
          <h3 className="font-semibold text-[16px] text-[var(--ink)]">Your Entries</h3>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1 text-[13px] font-medium text-[var(--primary)]"
          >
            <Plus className="h-4 w-4" /> New Entry
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleCreate} className="card p-5 flex flex-col gap-4 border-[var(--primary)] border">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--mute)] mb-2">Writing Prompts</p>
              <div className="flex flex-wrap gap-2">
                {PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPrompt(prompt === selectedPrompt ? null : prompt)}
                    className={cn(
                      "text-[12px] px-3 py-1.5 rounded-full transition-colors text-left",
                      selectedPrompt === prompt 
                        ? "bg-[var(--primary)] text-white" 
                        : "bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--line)]"
                    )}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <textarea 
                autoFocus
                required
                placeholder="What's on your mind today?"
                className="w-full min-h-[160px] bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 text-[14px] outline-none focus:border-[var(--primary)] resize-y leading-relaxed"
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => {
                  setIsAdding(false);
                  setSelectedPrompt(null);
                  setContent("");
                }}
                className="text-[13px] text-[var(--mute)] px-3 py-1"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={createMutation.isPending || !content.trim()}
                className="btn px-5 py-2 flex items-center gap-2"
              >
                <PenTool className="h-4 w-4" />
                Save Entry
              </button>
            </div>
          </form>
        )}

        {entriesQuery.isPending ? (
          <LoadingBlock label="Loading journal entries" />
        ) : entriesQuery.isError ? (
          <ErrorState 
            title="Couldn't load journal" 
            message="Please try again." 
            onRetry={() => entriesQuery.refetch()} 
          />
        ) : entries.length === 0 ? (
          <div className="empty py-10 text-center">
            <BookOpen className="h-10 w-10 text-[var(--line)] mx-auto mb-3" />
            <h3 className="font-semibold text-[var(--ink)]">No entries yet</h3>
            <p className="mt-1 text-[13px] text-[var(--mute)]">Take a moment to reflect on your day.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {entries.map((entry, index) => {
              const entryDate = new Date(entry.date);
              const isLast = index === entries.length - 1;
              return (
                <div key={entry.id} className="tl flex gap-4">
                  <div className="tl-line flex flex-col items-center">
                    <div className="tl-dot h-3 w-3 rounded-full bg-[var(--primary)] mt-1.5" />
                    {!isLast && <div className="h-full w-[2px] bg-[var(--line)] my-1" />}
                  </div>
                  <div className="tl-content pb-8 flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-[15px] text-[var(--primary)]">
                          {getIslamicDateString(entryDate)}
                        </h4>
                        <p className="text-[12px] text-[var(--mute)] flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {entryDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          if(confirm('Are you sure you want to delete this entry?')) {
                            deleteMutation.mutate(entry.id);
                          }
                        }}
                        className="p-1 text-[var(--mute)] hover:text-red-500 rounded-md"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="card p-4 bg-[var(--surface)]">
                      {entry.prompts_used && (
                        <div className="mb-3 px-3 py-2 bg-[var(--primary-soft)] rounded-md inline-block">
                          <p className="text-[12px] font-medium text-[var(--primary)]">
                            Prompt: {entry.prompts_used}
                          </p>
                        </div>
                      )}
                      <p className="text-[14px] text-[var(--ink)] leading-relaxed whitespace-pre-wrap">
                        {entry.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
