from datetime import date as date_type, datetime
from pydantic import BaseModel, Field

class GoalMilestoneBase(BaseModel):
    title: str
    completed: bool = False

class GoalMilestoneCreate(GoalMilestoneBase):
    pass

class GoalMilestoneUpdate(BaseModel):
    title: str | None = None
    completed: bool | None = None

class GoalMilestoneResponse(GoalMilestoneBase):
    id: str
    goal_id: str
    created_at: datetime
    updated_at: datetime

class GoalBase(BaseModel):
    title: str
    category: str = Field(..., pattern="^(spiritual|family|career|health|other)$")
    target_date: date_type | None = None
    linked_tasks: list[str] = []

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    title: str | None = None
    category: str | None = Field(None, pattern="^(spiritual|family|career|health|other)$")
    target_date: date_type | None = None
    linked_tasks: list[str] | None = None

class GoalResponse(GoalBase):
    id: str
    user_id: str
    progress: float
    milestones: list[GoalMilestoneResponse] = []
    created_at: datetime
    updated_at: datetime
