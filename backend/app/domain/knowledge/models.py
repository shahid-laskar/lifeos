from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
import json

# ── Notes ──────────────────────────────────────────────────────────────

class NoteBase(BaseModel):
    title: str
    content: str
    reference_type: str | None = None
    reference_id: str | None = None
    tags: List[str] | None = None

class NoteCreate(NoteBase):
    pass

class NoteResponse(NoteBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

# ── Flashcards ─────────────────────────────────────────────────────────

class FlashcardBase(BaseModel):
    front: str
    back: str

class FlashcardCreate(FlashcardBase):
    deck_id: str

class FlashcardResponse(FlashcardBase):
    id: str
    deck_id: str
    next_review: datetime | None
    interval: int
    ease_factor: float
    created_at: datetime
    updated_at: datetime

class FlashcardDeckBase(BaseModel):
    title: str
    description: str | None = None

class FlashcardDeckCreate(FlashcardDeckBase):
    pass

class FlashcardDeckResponse(FlashcardDeckBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    cards_count: int = 0
