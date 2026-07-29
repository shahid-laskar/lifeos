"""
Qur'an domain service.

Orchestrates surah/ayah lookups (via the in-memory quran_data module) and
user-specific state (bookmarks, reading progress) via the QuranRepository.

No AI, no network calls, no engagement metrics (ADR-007, Article 8, ADR-003).
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app.domain.quran.entities import (
    QuranBookmark,
    QuranReadingProgress,
    SurahInfo,
)
from app.domain.quran.quran_data import get_surah, list_surahs
from app.domain.quran.repository import QuranRepository


class SurahNotFoundError(ValueError):
    pass


class AyahOutOfRangeError(ValueError):
    pass


class BookmarkNotFoundError(LookupError):
    pass


class QuranService:
    def __init__(self, repository: QuranRepository) -> None:
        self._repo = repository

    # ── Surah / text ─────────────────────────────────────────────────────────

    def list_surahs(self) -> list[SurahInfo]:
        return list_surahs()

    def get_surah(self, surah_number: int) -> SurahInfo:
        surah = get_surah(surah_number)
        if surah is None:
            raise SurahNotFoundError(f"Surah {surah_number} does not exist.")
        return surah

    def _validate_ayah(self, surah_number: int, ayah_number: int) -> SurahInfo:
        surah = self.get_surah(surah_number)
        if not (1 <= ayah_number <= surah.ayah_count):
            raise AyahOutOfRangeError(
                f"Surah {surah_number} has {surah.ayah_count} ayahs; "
                f"ayah {ayah_number} is out of range."
            )
        return surah

    # ── Bookmarks ─────────────────────────────────────────────────────────────

    def add_bookmark(
        self,
        user_id: str,
        surah_number: int,
        ayah_number: int,
        note: str | None = None,
    ) -> QuranBookmark:
        self._validate_ayah(surah_number, ayah_number)

        # Idempotent: if the bookmark already exists, update the note and return.
        existing = self._repo.get_bookmark(user_id, surah_number, ayah_number)
        if existing:
            if existing.note != note:
                existing.note = note
                return self._repo.add_bookmark(existing)
            return existing

        bookmark = QuranBookmark(
            id=str(uuid.uuid4()),
            user_id=user_id,
            surah_number=surah_number,
            ayah_number=ayah_number,
            note=note,
            created_at=datetime.now(timezone.utc),
        )
        return self._repo.add_bookmark(bookmark)

    def remove_bookmark(
        self, user_id: str, surah_number: int, ayah_number: int
    ) -> None:
        removed = self._repo.remove_bookmark(user_id, surah_number, ayah_number)
        if not removed:
            raise BookmarkNotFoundError(
                f"No bookmark found for surah {surah_number}:{ayah_number}."
            )

    def list_bookmarks(self, user_id: str) -> list[QuranBookmark]:
        return self._repo.get_bookmarks(user_id)

    # ── Reading progress ──────────────────────────────────────────────────────

    def update_reading_progress(
        self, user_id: str, surah_number: int, last_ayah_number: int
    ) -> QuranReadingProgress:
        self._validate_ayah(surah_number, last_ayah_number)

        existing = self._repo.get_reading_progress(user_id, surah_number)
        if existing:
            existing.last_ayah_number = last_ayah_number
            existing.updated_at = datetime.now(timezone.utc)
            return self._repo.upsert_reading_progress(existing)

        progress = QuranReadingProgress(
            id=str(uuid.uuid4()),
            user_id=user_id,
            surah_number=surah_number,
            last_ayah_number=last_ayah_number,
            updated_at=datetime.now(timezone.utc),
        )
        return self._repo.upsert_reading_progress(progress)

    def get_reading_progress(
        self, user_id: str, surah_number: int
    ) -> QuranReadingProgress | None:
        self.get_surah(surah_number)  # validate surah exists
        return self._repo.get_reading_progress(user_id, surah_number)

    def get_all_reading_progress(self, user_id: str) -> list[QuranReadingProgress]:
        return self._repo.get_all_reading_progress(user_id)

    def get_weekly_summary(
        self, user_id: str, as_of: datetime | None = None
    ) -> dict[str, int]:
        from datetime import timedelta
        
        now = as_of or datetime.now(timezone.utc)
        seven_days_ago = now - timedelta(days=7)
        
        all_progress = self.get_all_reading_progress(user_id)
        
        # Filter to progress updated in the last 7 days
        recent_progress = [
            p for p in all_progress 
            if (p.updated_at.tzinfo is None and p.updated_at.replace(tzinfo=timezone.utc) >= seven_days_ago) or
               (p.updated_at.tzinfo is not None and p.updated_at >= seven_days_ago)
        ]
        
        # Unique surahs read
        surahs_read = len(set(p.surah_number for p in recent_progress))
        
        # Unique days active (using the user's local timezone would be better, 
        # but UTC date is an acceptable approximation for a simple 7-day window)
        active_dates = set(p.updated_at.date() for p in recent_progress)
        
        return {
            "surahs_read_last_7_days": surahs_read,
            "active_days_last_7_days": len(active_dates),
        }

