import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, Layers, Plus, FileText, Share2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { getNotes, createNote, getFlashcardDecks, createFlashcardDeck } from "@/lib/api/endpoints";

export const Route = createFileRoute("/_authenticated/knowledge")({
  component: KnowledgePage,
});

function KnowledgePage() {
  return (
    <>
      <PageHeader title="Knowledge" arabic="المعرفة" subtitle="Notes & Flashcards" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NotesSystem />
        <FlashcardsSystem />
      </div>
    </>
  );
}

function NotesSystem() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["knowledge-notes"],
    queryFn: getNotes,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-notes"] });
      setIsAdding(false);
      setTitle("");
      setContent("");
      setTags("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title,
      content,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="card p-5 border-[var(--line)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-[16px] text-[var(--ink)] flex items-center gap-2">
          <FileText className="h-4 w-4" /> Notes System
        </h3>
        <button onClick={() => setIsAdding(!isAdding)} className="text-[var(--primary)] text-[13px] font-medium flex items-center gap-1">
          <Plus className="h-4 w-4" /> New Note
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-5 p-4 bg-[var(--surface)] border border-[var(--line)] rounded-lg flex flex-col gap-3">
          <div>
            <label className="text-[12px] text-[var(--mute)] mb-1 block">Title</label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white border border-[var(--line)] rounded-md px-2 py-1.5 text-[13px]" />
          </div>
          <div>
            <label className="text-[12px] text-[var(--mute)] mb-1 block">Content</label>
            <textarea required value={content} onChange={e => setContent(e.target.value)} rows={4} className="w-full bg-white border border-[var(--line)] rounded-md px-2 py-1.5 text-[13px]" />
          </div>
          <div>
            <label className="text-[12px] text-[var(--mute)] mb-1 block">Tags (comma separated)</label>
            <input type="text" value={tags} onChange={e => setTags(e.target.value)} className="w-full bg-white border border-[var(--line)] rounded-md px-2 py-1.5 text-[13px]" />
          </div>
          <div className="flex justify-end mt-2">
            <button type="submit" disabled={createMutation.isPending} className="btn text-[13px] px-3 py-1">Save Note</button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <p className="text-[13px] text-[var(--mute)] text-center py-4">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-[13px] text-[var(--mute)] text-center py-4">No notes created yet.</p>
        ) : (
          notes.map(note => (
            <div key={note.id} className="p-4 bg-[var(--surface)] border border-[var(--line)] rounded-lg">
              <h4 className="font-semibold text-[14px] text-[var(--ink)]">{note.title}</h4>
              <p className="text-[13px] text-[var(--mute)] mt-2 line-clamp-2">{note.content}</p>
              {note.tags && note.tags.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {note.tags.map(tag => (
                    <span key={tag} className="text-[11px] bg-[var(--line)] text-[var(--ink)] px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function FlashcardsSystem() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data: decks = [], isLoading } = useQuery({
    queryKey: ["knowledge-decks"],
    queryFn: getFlashcardDecks,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createFlashcardDeck(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-decks"] });
      setIsAdding(false);
      setTitle("");
      setDescription("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title,
      description,
    });
  };

  return (
    <div className="card p-5 border-[var(--line)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-[16px] text-[var(--ink)] flex items-center gap-2">
          <Layers className="h-4 w-4" /> Flashcards
        </h3>
        <button onClick={() => setIsAdding(!isAdding)} className="text-[var(--primary)] text-[13px] font-medium flex items-center gap-1">
          <Plus className="h-4 w-4" /> New Deck
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-5 p-4 bg-[var(--surface)] border border-[var(--line)] rounded-lg flex flex-col gap-3">
          <div>
            <label className="text-[12px] text-[var(--mute)] mb-1 block">Deck Title</label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white border border-[var(--line)] rounded-md px-2 py-1.5 text-[13px]" />
          </div>
          <div>
            <label className="text-[12px] text-[var(--mute)] mb-1 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full bg-white border border-[var(--line)] rounded-md px-2 py-1.5 text-[13px]" />
          </div>
          <div className="flex justify-end mt-2">
            <button type="submit" disabled={createMutation.isPending} className="btn text-[13px] px-3 py-1">Create Deck</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-3">
        {isLoading ? (
          <p className="text-[13px] text-[var(--mute)] text-center py-4">Loading decks...</p>
        ) : decks.length === 0 ? (
          <p className="text-[13px] text-[var(--mute)] text-center py-4">No flashcard decks yet.</p>
        ) : (
          decks.map(deck => (
            <div key={deck.id} className="p-4 bg-[var(--surface)] border border-[var(--line)] rounded-lg flex justify-between items-center cursor-pointer hover:border-[var(--primary-soft)] transition-colors">
              <div>
                <h4 className="font-semibold text-[14px] text-[var(--ink)]">{deck.title}</h4>
                {deck.description && <p className="text-[12px] text-[var(--mute)] mt-1">{deck.description}</p>}
              </div>
              <div className="text-center bg-white border border-[var(--line)] rounded-lg px-3 py-1.5 min-w-[60px]">
                <p className="text-[16px] font-bold text-[var(--primary)]">{deck.cards_count}</p>
                <p className="text-[10px] text-[var(--mute)] uppercase tracking-wider">Cards</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
