from datetime import date as date_type, datetime
from pydantic import BaseModel

class JournalEntryBase(BaseModel):
    date: date_type
    entry_type: str = "reflection"
    mood: str | None = None
    content: str
    prompts_used: str | None = None
    is_private: bool = True

class JournalEntryCreate(JournalEntryBase):
    pass

class JournalEntryUpdate(BaseModel):
    entry_type: str | None = None
    mood: str | None = None
    content: str | None = None
    prompts_used: str | None = None
    is_private: bool | None = None

class JournalEntryResponse(JournalEntryBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
