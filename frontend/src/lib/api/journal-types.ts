// Reflection Journal types for Phase 5B

export type JournalEntryResponse = {
  id: string;
  user_id: string;
  date: string;
  entry_type: string;
  mood: string | null;
  content: string;
  prompts_used: string | null;
  is_private: boolean;
  created_at: string;
  updated_at: string;
};

export type JournalEntryCreate = {
  date: string;
  entry_type?: string;
  mood?: string | null;
  content: string;
  prompts_used?: string | null;
  is_private?: boolean;
};

export type JournalEntryUpdate = Partial<JournalEntryCreate>;
