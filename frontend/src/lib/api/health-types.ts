// Health Domain Types for Phase 7

export type SleepLogResponse = {
  id: string;
  user_id: string;
  date: string;
  sleep_time: string | null;
  wake_time: string | null;
  quality: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SleepLogCreate = {
  date: string;
  sleep_time?: string | null;
  wake_time?: string | null;
  quality?: number | null;
  notes?: string | null;
};

export type ExerciseLogResponse = {
  id: string;
  user_id: string;
  date: string;
  exercise_type: string;
  duration_minutes: number;
  intensity: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ExerciseLogCreate = {
  date: string;
  exercise_type: string;
  duration_minutes: number;
  intensity?: string | null;
  notes?: string | null;
};

export type EnergyLogResponse = {
  id: string;
  user_id: string;
  date: string;
  energy_level: number;
  mood: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type EnergyLogCreate = {
  date: string;
  energy_level: number;
  mood?: string | null;
  notes?: string | null;
};
