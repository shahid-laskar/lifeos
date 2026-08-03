from datetime import date as date_type, datetime
from pydantic import BaseModel, Field

class TaskBase(BaseModel):
    title: str
    description: str | None = None
    priority: str = Field(default="medium", pattern="^(low|medium|high|critical)$")
    due_date: date_type | None = None
    project: str | None = None
    recurrence: str | None = None
    niyyah: str | None = None
    completed: bool = False

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: str | None = Field(None, pattern="^(low|medium|high|critical)$")
    due_date: date_type | None = None
    project: str | None = None
    recurrence: str | None = None
    niyyah: str | None = None
    completed: bool | None = None

class TaskResponse(TaskBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
