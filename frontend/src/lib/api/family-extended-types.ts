// Family Extended types for Phase 6

export type FamilyEventResponse = {
  id: string;
  family_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  location: string | null;
  created_at: string;
  updated_at: string;
};

export type FamilyEventCreate = {
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  is_all_day?: boolean;
  location?: string | null;
};

export type FamilyGoalResponse = {
  id: string;
  family_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type FamilyGoalCreate = {
  title: string;
  description?: string | null;
  target_date?: string | null;
  is_completed?: boolean;
};

export type FamilyTaskResponse = {
  id: string;
  family_id: string;
  creator_id: string;
  assignee_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type FamilyTaskCreate = {
  title: string;
  description?: string | null;
  due_date?: string | null;
  is_completed?: boolean;
  assignee_id?: string | null;
};
