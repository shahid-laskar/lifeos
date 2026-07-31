"""Hadith domain entities.

Catalogue entries are immutable reference data (sourced from open Sunnah.com
JSON dumps). User bookmarks are mutable and stored per-user.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Protocol


@dataclass(frozen=True)
class HadithCollection:
    slug: str
    name_english: str
    name_arabic: str
    author_english: str
    author_arabic: str
    hadith_count: int
    chapter_count: int


@dataclass(frozen=True)
class HadithChapter:
    collection_slug: str
    chapter_id: int
    name_english: str
    name_arabic: str
    hadith_count: int


@dataclass(frozen=True)
class HadithItem:
    """Immutable hadith catalogue entry.

    Fields required by 008_Islamic_Knowledge_Framework.md for Sunnah content:
    source collection, book/chapter, hadith number, and grade.
    """

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


@dataclass(frozen=True)
class HadithBookmark:
    id: str
    user_id: str
    hadith_id: str
    note: str | None
    created_at: datetime


class HadithBookmarkRepository(Protocol):
    def add(self, bookmark: HadithBookmark) -> HadithBookmark: ...

    def remove(self, user_id: str, hadith_id: str) -> bool: ...

    def list_for_user(self, user_id: str) -> list[HadithBookmark]: ...

    def get(self, user_id: str, hadith_id: str) -> HadithBookmark | None: ...
