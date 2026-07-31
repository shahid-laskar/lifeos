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
