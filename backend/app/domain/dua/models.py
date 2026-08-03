from __future__ import annotations

from pydantic import BaseModel

class DuaItemResponse(BaseModel):
    id: str
    category: str
    arabic_text: str
    transliteration: str
    translation: str
    reference: str
    when_to_recite: str | None = None

import datetime

class BookmarkRequest(BaseModel):
    dua_id: str

class BookmarkResponse(BaseModel):
    id: str
    dua_id: str
    created_at: datetime.datetime

class BookmarkItemResponse(BaseModel):
    id: str
    dua_id: str
    created_at: datetime.datetime
    dua: DuaItemResponse | None = None
