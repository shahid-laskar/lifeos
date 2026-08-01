"""
Pydantic models for the Qur'an API — request/response shapes only.

The domain entities (entities.py) are framework-agnostic dataclasses.
These Pydantic models live at the API boundary and are responsible for
validation and serialisation.
"""
from __future__ import annotations

from datetime import date as date_type, datetime

from pydantic import BaseModel, Field


# ── Surah ──────────────────────────────────────────────────────────────────


class SurahResponse(BaseModel):
    number: int
    arabic_name: str
    transliterated_name: str
    meaning: str
    ayah_count: int
    revelation_type: str


class AyahResponse(BaseModel):
    number_in_surah: int
    text: str


class SurahAyahsResponse(BaseModel):
    surah_number: int
    ayahs: list[AyahResponse]


# ── Bookmarks ──────────────────────────────────────────────────────────────


class BookmarkRequest(BaseModel):
    surah_number: int = Field(..., ge=1, le=114)
    ayah_number: int = Field(..., ge=1)
    note: str | None = Field(None, max_length=500)


class BookmarkResponse(BaseModel):
    id: str
    surah_number: int
    ayah_number: int
    note: str | None
    created_at: datetime


# ── Reading progress ────────────────────────────────────────────────────────


class ReadingProgressRequest(BaseModel):
    surah_number: int = Field(..., ge=1, le=114)
    last_ayah_number: int = Field(..., ge=1)


class ReadingProgressResponse(BaseModel):
    surah_number: int
    last_ayah_number: int
    updated_at: datetime


class QuranWeeklySummaryResponse(BaseModel):
    surahs_read_last_7_days: int
    active_days_last_7_days: int

class MemorisationMarkRequest(BaseModel):
    surah_number: int
    ayah_number: int
    quality: int = Field(..., ge=1, le=5) # 1 = forgotten, 5 = perfect

class MemorisationResponse(BaseModel):
    id: str
    surah_number: int
    ayah_number: int
    status: str
    next_review: date_type | None

class TafsirResponse(BaseModel):
    surah_number: int
    ayah_number: int
    source: str
    text: str

