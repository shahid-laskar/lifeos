from __future__ import annotations

from datetime import date as date_type, datetime
from typing import Literal

from pydantic import BaseModel, Field


# ── Catalogue ───────────────────────────────────────────────────────────────


class DhikrItemResponse(BaseModel):
    id: str
    category: str
    arabic_text: str
    transliteration: str
    meaning: str
    recommended_count: int
    source: str


# ── Logging ─────────────────────────────────────────────────────────────────


class DhikrLogRequest(BaseModel):
    dhikr_item_id: str = Field(..., description="ID of the dhikr item from the catalogue")
    count: int = Field(..., ge=1, description="How many times the dhikr was recited")


class DhikrLogResponse(BaseModel):
    id: str
    dhikr_item_id: str
    category: str
    count: int
    date: date_type
    logged_at: datetime


class DhikrDailySummaryResponse(BaseModel):
    """Calm, non-punishing daily summary (ADR-008, Article 2)."""
    date: date_type
    total_morning: int = 0
    total_evening: int = 0
    total_post_prayer: int = 0
    total_general: int = 0
