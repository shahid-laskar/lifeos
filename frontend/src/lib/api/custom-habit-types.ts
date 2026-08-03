// Generic Habit types for Phase 5A

export type GenericHabitResponse = {
  id: string;
  user_id: string;
  name: string;
  frequency: "daily" | "weekly";
  icon: string | null;
  category: string | null;
  streak: number;
  completed_today: boolean;
  recent_completions: string[];
  created_at: string;
  updated_at: string;
};

export type GenericHabitCreate = {
  name: string;
  frequency?: "daily" | "weekly";
  icon?: string | null;
  category?: string | null;
};

export type GenericHabitUpdate = Partial<GenericHabitCreate>;
