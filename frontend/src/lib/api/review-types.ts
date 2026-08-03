// Weekly Review types for Phase 4E

export type WeeklyReviewResponse = {
  id: string;
  user_id: string;
  week_start: string;
  worship_quality: string | null;
  task_completion: string | null;
  habit_consistency: string | null;
  intentions: string | null;
  created_at: string;
  updated_at: string;
};

export type WeeklyReviewCreate = {
  worship_quality?: string | null;
  task_completion?: string | null;
  habit_consistency?: string | null;
  intentions?: string | null;
};
