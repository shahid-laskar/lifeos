from __future__ import annotations

from dataclasses import dataclass

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
