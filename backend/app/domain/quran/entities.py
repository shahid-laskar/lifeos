from __future__ import annotations

import enum
from dataclasses import dataclass
from datetime import datetime


class RevelationType(str, enum.Enum):
    MECCAN = "Meccan"
    MEDINAN = "Medinan"


@dataclass(frozen=True)
class SurahInfo:
    """Immutable surah metadata. Loaded once from the bundled JSON; never mutated."""
    number: int                    # 1–114 (Uthmanic ordering)
    arabic_name: str
    transliterated_name: str
    meaning: str
    ayah_count: int
    revelation_type: RevelationType


@dataclass(frozen=True)
class AyahInfo:
    """A verbatim ayah from the bundled Tanzil Uthmani text."""
    number_in_surah: int
    text: str


@dataclass
class QuranBookmark:
    """User-owned bookmark on a specific ayah."""
    id: str
    user_id: str
    surah_number: int              # 1–114
    ayah_number: int               # 1–ayah_count
    note: str | None               # optional personal note — max 500 chars
    created_at: datetime


@dataclass
class QuranReadingProgress:
    """Last-read position per surah for a user.

    Deliberately a simple 'where I left off' record — not a streak counter
    (ADR-003, Article 2: Consistency over Intensity).
    """
    id: str
    user_id: str
    surah_number: int              # 1–114
    last_ayah_number: int          # last ayah the user read
    updated_at: datetime
