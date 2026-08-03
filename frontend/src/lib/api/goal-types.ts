// Goal Planner types for Phase 4C

export type GoalMilestoneResponse = {
  id: string;
  goal_id: string;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export type GoalResponse = {
  id: string;
  user_id: string;
  title: string;
  category: 'spiritual' | 'family' | 'career' | 'health' | 'other';
  target_date: string | null;
  progress: number;
  linked_tasks: string[];
  milestones: GoalMilestoneResponse[];
  created_at: string;
  updated_at: string;
};

export type GoalMilestoneCreate = {
  title: string;
  completed?: boolean;
};

export type GoalMilestoneUpdate = Partial<GoalMilestoneCreate>;

export type GoalCreate = {
  title: string;
  category: 'spiritual' | 'family' | 'career' | 'health' | 'other';
  target_date?: string | null;
  linked_tasks?: string[];
};

export type GoalUpdate = Partial<GoalCreate>;
