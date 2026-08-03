// Reading Tracker types for Phase 5C

export type BookResponse = {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  category: string | null;
  total_pages: number;
  current_page: number;
  status: "to-read" | "reading" | "completed";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type BookCreate = {
  title: string;
  author?: string | null;
  category?: string | null;
  total_pages?: number;
  current_page?: number;
  status?: "to-read" | "reading" | "completed";
  notes?: string | null;
};

export type BookUpdate = Partial<BookCreate>;
