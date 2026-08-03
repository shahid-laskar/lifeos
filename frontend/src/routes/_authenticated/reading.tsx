import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Book, Plus, MoreVertical, Edit2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { LoadingBlock } from "@/components/brand/pattern";
import { ErrorState } from "@/components/brand/states";
import { getBooks, createBook, updateBook, deleteBook } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";
import type { BookResponse } from "@/lib/api/reading-types";

export const Route = createFileRoute("/_authenticated/reading")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Reading Tracker — Muslim Life OS" }],
  }),
  component: ReadingPage,
});

function ReadingPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [currentPage, setCurrentPage] = useState("");

  const booksQuery = useQuery({
    queryKey: ["reading_books"],
    queryFn: getBooks,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createBook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reading_books"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateBook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reading_books"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reading_books"] });
    },
  });

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setTitle("");
    setAuthor("");
    setTotalPages("");
    setCurrentPage("");
  };

  const handleEdit = (book: BookResponse) => {
    setEditingId(book.id);
    setTitle(book.title);
    setAuthor(book.author || "");
    setTotalPages(book.total_pages.toString());
    setCurrentPage(book.current_page.toString());
    setIsAdding(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    
    const payload = {
      title,
      author: author || null,
      total_pages: parseInt(totalPages) || 0,
      current_page: parseInt(currentPage) || 0,
      status: (parseInt(currentPage) >= parseInt(totalPages) && parseInt(totalPages) > 0) ? "completed" : "reading"
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const books = booksQuery.data ?? [];
  const currentlyReading = books.filter(b => b.status === "reading");
  const completed = books.filter(b => b.status === "completed");
  const toRead = books.filter(b => b.status === "to-read");

  return (
    <>
      <PageHeader title="Reading" subtitle="Seek knowledge from cradle to grave" arabic="إِقْرَأ" />

      <div className="flex flex-col gap-6 mt-6">
        {/* Insight */}
        <div className="card p-4 border border-[var(--primary-soft)] bg-[var(--surface)] text-center">
          <p className="text-[14px] font-medium text-[var(--ink)]">
            "The first word revealed to the Prophet ﷺ was Iqra (Read)."
          </p>
        </div>

        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-[16px] text-[var(--ink)]">Your Library</h3>
          <button 
            onClick={() => { resetForm(); setIsAdding(true); }}
            className="flex items-center gap-1 text-[13px] font-medium text-[var(--primary)]"
          >
            <Plus className="h-4 w-4" /> Add Book
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleSubmit} className="card p-4 flex flex-col gap-3 border-[var(--primary)] border">
            <div>
              <label className="text-[12px] font-medium text-[var(--mute)] mb-1 block">Title</label>
              <input 
                autoFocus
                type="text" 
                required
                className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-md px-3 py-1.5 text-[14px] outline-none focus:border-[var(--primary)]"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[var(--mute)] mb-1 block">Author</label>
              <input 
                type="text" 
                className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-md px-3 py-1.5 text-[14px] outline-none focus:border-[var(--primary)]"
                value={author}
                onChange={e => setAuthor(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[12px] font-medium text-[var(--mute)] mb-1 block">Current Page</label>
                <input 
                  type="number" 
                  min="0"
                  className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-md px-3 py-1.5 text-[14px] outline-none focus:border-[var(--primary)]"
                  value={currentPage}
                  onChange={e => setCurrentPage(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-[12px] font-medium text-[var(--mute)] mb-1 block">Total Pages</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-md px-3 py-1.5 text-[14px] outline-none focus:border-[var(--primary)]"
                  value={totalPages}
                  onChange={e => setTotalPages(e.target.value)}
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
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn px-4 py-1.5"
              >
                Save
              </button>
            </div>
          </form>
        )}

        {booksQuery.isPending ? (
          <LoadingBlock label="Loading library" />
        ) : booksQuery.isError ? (
          <ErrorState 
            title="Couldn't load library" 
            message="Please try again." 
            onRetry={() => booksQuery.refetch()} 
          />
        ) : books.length === 0 ? (
          <div className="empty py-10 text-center">
            <Book className="h-10 w-10 text-[var(--line)] mx-auto mb-3" />
            <h3 className="font-semibold text-[var(--ink)]">Library is empty</h3>
            <p className="mt-1 text-[13px] text-[var(--mute)]">Add a book to start tracking your reading.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {currentlyReading.length > 0 && (
              <div className="flex flex-col gap-3">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[var(--mute)]">Currently Reading</h4>
                {currentlyReading.map(book => (
                  <BookCard 
                    key={book.id} 
                    book={book} 
                    onEdit={() => handleEdit(book)}
                    onDelete={() => { if(confirm('Delete book?')) deleteMutation.mutate(book.id) }} 
                  />
                ))}
              </div>
            )}
            
            {toRead.length > 0 && (
              <div className="flex flex-col gap-3">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[var(--mute)]">To Read</h4>
                {toRead.map(book => (
                  <BookCard 
                    key={book.id} 
                    book={book} 
                    onEdit={() => handleEdit(book)}
                    onDelete={() => { if(confirm('Delete book?')) deleteMutation.mutate(book.id) }} 
                  />
                ))}
              </div>
            )}

            {completed.length > 0 && (
              <div className="flex flex-col gap-3">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[var(--mute)]">Completed</h4>
                {completed.map(book => (
                  <BookCard 
                    key={book.id} 
                    book={book} 
                    onEdit={() => handleEdit(book)}
                    onDelete={() => { if(confirm('Delete book?')) deleteMutation.mutate(book.id) }} 
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function BookCard({ book, onEdit, onDelete }: { book: BookResponse, onEdit: () => void, onDelete: () => void }) {
  const progress = book.total_pages > 0 ? Math.min(100, Math.round((book.current_page / book.total_pages) * 100)) : 0;
  
  return (
    <div className="card p-4">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h4 className="font-medium text-[15px] text-[var(--ink)] line-clamp-1">{book.title}</h4>
          {book.author && <p className="text-[13px] text-[var(--mute)] mt-0.5 line-clamp-1">{book.author}</p>}
        </div>
        <div className="flex items-center">
          <button onClick={onEdit} className="p-1.5 text-[var(--mute)] hover:text-[var(--primary)] rounded-md">
            <Edit2 className="h-4 w-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-[var(--mute)] hover:text-red-500 rounded-md">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="flex justify-between items-end mb-1.5">
          <span className="text-[12px] font-medium text-[var(--mute)]">
            {book.current_page} / {book.total_pages || '?'} pages
          </span>
          <span className="text-[12px] font-bold text-[var(--primary)]">{progress}%</span>
        </div>
        <div className="bar h-1.5 w-full bg-[var(--line)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
