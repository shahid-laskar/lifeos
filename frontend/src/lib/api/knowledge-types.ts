// Knowledge Domain Types for Phase 9

export type NoteResponse = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  reference_type: string | null;
  reference_id: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type NoteCreate = {
  title: string;
  content: string;
  reference_type?: string | null;
  reference_id?: string | null;
  tags?: string[];
};

export type FlashcardDeckResponse = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cards_count: number;
  created_at: string;
  updated_at: string;
};

export type FlashcardDeckCreate = {
  title: string;
  description?: string | null;
};

export type FlashcardResponse = {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  next_review: string | null;
  interval: number;
  ease_factor: number;
  created_at: string;
  updated_at: string;
};

export type FlashcardCreate = {
  deck_id: string;
  front: string;
  back: string;
};
