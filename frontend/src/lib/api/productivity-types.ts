// Productivity types for Phase 4F

export type FocusSessionResponse = {
  id: string;
  user_id: string;
  task_id: string | null;
  duration_minutes: number;
  focus_quality: 'good' | 'medium' | 'poor' | null;
  completed_at: string;
  created_at: string;
};

export type FocusSessionCreate = {
  task_id?: string | null;
  duration_minutes: number;
  focus_quality?: 'good' | 'medium' | 'poor' | null;
};
