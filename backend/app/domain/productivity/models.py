from datetime import datetime
from pydantic import BaseModel, Field

class FocusSessionBase(BaseModel):
    task_id: str | None = None
    duration_minutes: int = Field(..., gt=0)
    focus_quality: str | None = Field(None, pattern="^(good|medium|poor)$")

class FocusSessionCreate(FocusSessionBase):
    pass

class FocusSessionResponse(FocusSessionBase):
    id: str
    user_id: str
    completed_at: datetime
    created_at: datetime
