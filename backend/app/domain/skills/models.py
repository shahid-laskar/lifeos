from datetime import date as date_type, datetime
from pydantic import BaseModel, Field

class SkillMilestoneBase(BaseModel):
    title: str
    is_completed: bool = False
    order_index: int = 0

class SkillMilestoneCreate(SkillMilestoneBase):
    pass

class SkillMilestoneUpdate(BaseModel):
    title: str | None = None
    is_completed: bool | None = None
    order_index: int | None = None

class SkillMilestoneResponse(SkillMilestoneBase):
    id: str
    skill_id: str
    created_at: datetime
    updated_at: datetime

class SkillBase(BaseModel):
    name: str
    description: str | None = None
    target_date: date_type | None = None
    is_completed: bool = False

class SkillCreate(SkillBase):
    milestones: list[SkillMilestoneCreate] = []

class SkillUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    target_date: date_type | None = None
    is_completed: bool | None = None

class SkillResponse(SkillBase):
    id: str
    user_id: str
    milestones: list[SkillMilestoneResponse] = []
    created_at: datetime
    updated_at: datetime
