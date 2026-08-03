// Task types added for Phase 4B

export type TaskResponse = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date: string | null;
  project: string | null;
  recurrence: string | null;
  niyyah: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export type TaskCreate = {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string | null;
  project?: string | null;
  recurrence?: string | null;
  niyyah?: string | null;
  completed?: boolean;
};

export type TaskUpdate = Partial<TaskCreate>;
