// Planner types added for Phase 4A

export type TimeBlockResponse = {
  id: string;
  day_id: string;
  start_time: string;
  end_time: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export type PlannerDayResponse = {
  id: string;
  user_id: string;
  date: string;
  blocks: TimeBlockResponse[];
  created_at: string;
  updated_at: string;
};

export type TimeBlockCreate = {
  start_time: string;
  end_time: string;
  title: string;
  description?: string;
  completed?: boolean;
};

export type TimeBlockUpdate = Partial<TimeBlockCreate>;
