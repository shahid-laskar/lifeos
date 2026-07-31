"""Pydantic request/response models for the Hadith API."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class HadithCollectionResponse(BaseModel):
    slug: str
    name_english: str
    name_arabic: str
    author_english: str
    author_arabic: str
    hadith_count: int
    chapter_count: int


class HadithChapterResponse(BaseModel):
    collection_slug: str
    chapter_id: int
    name_english: str
    name_arabic: str
    hadith_count: int


class HadithItemResponse(BaseModel):
    id: str
    collection_slug: str
    collection_name: str
    chapter_id: int
    chapter_name_english: str
    chapter_name_arabic: str
    hadith_number: int
    arabic_text: str
    narrator: str
    translation: str
    grade: str


class HadithSearchResponse(BaseModel):
    query: str
    total: int
    results: list[HadithItemResponse]


class HadithBookmarkRequest(BaseModel):
    hadith_id: str = Field(..., min_length=1, max_length=64)
    note: str | None = Field(default=None, max_length=500)


class HadithBookmarkResponse(BaseModel):
    id: str
    hadith_id: str
    note: str | None
    created_at: datetime
    hadith: HadithItemResponse | None = None
