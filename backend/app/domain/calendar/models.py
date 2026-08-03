from datetime import datetime
from pydantic import BaseModel

class EventBase(BaseModel):
    title: str
    description: str | None = None
    start_time: datetime
    end_time: datetime
    is_all_day: bool = False
    recurrence: str | None = None

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    is_all_day: bool | None = None
    recurrence: str | None = None

class EventResponse(EventBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
