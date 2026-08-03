from datetime import date as date_type, datetime
from pydantic import BaseModel, Field

class TimeBlockBase(BaseModel):
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="HH:MM format")
    end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="HH:MM format")
    title: str
    description: str | None = None
    completed: bool = False

class TimeBlockCreate(TimeBlockBase):
    pass

class TimeBlockUpdate(BaseModel):
    start_time: str | None = Field(None, pattern=r"^\d{2}:\d{2}$")
    end_time: str | None = Field(None, pattern=r"^\d{2}:\d{2}$")
    title: str | None = None
    description: str | None = None
    completed: bool | None = None

class TimeBlockResponse(TimeBlockBase):
    id: str
    day_id: str
    created_at: datetime
    updated_at: datetime

class PlannerDayBase(BaseModel):
    date: date_type

class PlannerDayCreate(PlannerDayBase):
    pass

class PlannerDayResponse(PlannerDayBase):
    id: str
    user_id: str
    blocks: list[TimeBlockResponse] = []
    created_at: datetime
    updated_at: datetime
