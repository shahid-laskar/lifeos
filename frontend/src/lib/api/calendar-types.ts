// Calendar types for Phase 4D

export type EventResponse = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  recurrence: string | null;
  created_at: string;
  updated_at: string;
};

export type EventCreate = {
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  is_all_day?: boolean;
  recurrence?: string | null;
};

export type EventUpdate = Partial<EventCreate>;
