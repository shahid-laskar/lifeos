from datetime import datetime
from pydantic import BaseModel, Field

class BookBase(BaseModel):
    title: str
    author: str | None = None
    category: str | None = None
    total_pages: int = Field(0, ge=0)
    current_page: int = Field(0, ge=0)
    status: str = Field("reading", pattern="^(to-read|reading|completed)$")
    notes: str | None = None

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    title: str | None = None
    author: str | None = None
    category: str | None = None
    total_pages: int | None = Field(None, ge=0)
    current_page: int | None = Field(None, ge=0)
    status: str | None = Field(None, pattern="^(to-read|reading|completed)$")
    notes: str | None = None

class BookResponse(BookBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
