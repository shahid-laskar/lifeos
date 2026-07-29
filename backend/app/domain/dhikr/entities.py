from __future__ import annotations

import enum
from dataclasses import dataclass
from datetime import date as date_type, datetime


class DhikrCategory(str, enum.Enum):
    MORNING = "morning"
    EVENING = "evening"
    POST_PRAYER = "post_prayer"
    GENERAL = "general"


@dataclass(frozen=True)
class DhikrItem:
    """Immutable dhikr catalogue entry. Loaded from bundled JSON; never mutated.

    Sourced from Hisnul Muslim (Fortress of the Muslim) and established Sunnah
    references (ADR-008, Article 5: Evidence over Opinion).
    """
    id: str                       # stable slug, e.g. "morning-01"
    category: DhikrCategory
    arabic_text: str
    transliteration: str
    meaning: str
    recommended_count: int        # how many times this dhikr is typically recited
    source: str                   # primary hadith reference


@dataclass
class DhikrLog:
    """A single user session of reciting a dhikr item.

    No streak field, no cumulative totals-as-KPI (ADR-003, Article 2:
    Consistency over Intensity, Article 1: Benefit over Engagement).
    """
    id: str
    user_id: str
    dhikr_item_id: str            # references DhikrItem.id (catalogue, not DB FK)
    category: DhikrCategory
    count: int                    # how many times the user actually recited
    date: date_type               # the local date this session was recorded
    logged_at: datetime           # UTC timestamp of the log action
