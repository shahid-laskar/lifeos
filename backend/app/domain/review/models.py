from datetime import date as date_type, datetime
from pydantic import BaseModel

class WeeklyReviewBase(BaseModel):
    worship_quality: str | None = None
    task_completion: str | None = None
    habit_consistency: str | None = None
    intentions: str | None = None

class WeeklyReviewCreate(WeeklyReviewBase):
    pass

class WeeklyReviewUpdate(WeeklyReviewBase):
    pass

class WeeklyReviewResponse(WeeklyReviewBase):
    id: str
    user_id: str
    week_start: date_type
    created_at: datetime
    updated_at: datetime
