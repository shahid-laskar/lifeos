from __future__ import annotations

import datetime
from dataclasses import dataclass
from typing import Protocol

@dataclass(frozen=True)
class DuaBookmark:
    id: str
    user_id: str
    dua_id: str
    created_at: datetime.datetime

class DuaBookmarkRepository(Protocol):
    def add(self, bookmark: DuaBookmark) -> DuaBookmark: ...
    def get(self, user_id: str, dua_id: str) -> DuaBookmark | None: ...
    def remove(self, user_id: str, dua_id: str) -> bool: ...
    def list_for_user(self, user_id: str) -> list[DuaBookmark]: ...

@dataclass(frozen=True)
class DuaItem:
    """Immutable dua catalogue entry."""
    id: str
    category: str
    arabic_text: str
    transliteration: str
    translation: str
    reference: str
    when_to_recite: str | None = None
