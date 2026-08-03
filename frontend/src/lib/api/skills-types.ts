// Skills Tracker types for Phase 5D

export type SkillMilestoneResponse = {
  id: string;
  skill_id: string;
  title: string;
  is_completed: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type SkillMilestoneCreate = {
  title: string;
  is_completed?: boolean;
  order_index?: number;
};

export type SkillMilestoneUpdate = {
  title?: string;
  is_completed?: boolean;
  order_index?: number;
};

export type SkillResponse = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  target_date: string | null;
  is_completed: boolean;
  milestones: SkillMilestoneResponse[];
  created_at: string;
  updated_at: string;
};

export type SkillCreate = {
  name: string;
  description?: string | null;
  target_date?: string | null;
  is_completed?: boolean;
  milestones?: SkillMilestoneCreate[];
};

export type SkillUpdate = {
  name?: string | null;
  description?: string | null;
  target_date?: string | null;
  is_completed?: boolean;
};
