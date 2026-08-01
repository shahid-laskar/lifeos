from __future__ import annotations

from typing import Protocol

from app.domain.quran.entities import QuranBookmark, QuranReadingProgress


class QuranRepository(Protocol):
    from datetime import date as date_type
    from app.domain.quran.memorisation import MemorisationRecord
    # ── Bookmarks ────────────────────────────────────────────────────────────

    def add_bookmark(self, bookmark: QuranBookmark) -> QuranBookmark:
        ...

    def remove_bookmark(self, user_id: str, surah_number: int, ayah_number: int) -> bool:
        """Returns True if the bookmark existed and was removed, False otherwise."""
        ...

    def get_bookmarks(self, user_id: str) -> list[QuranBookmark]:
        ...

    def get_bookmark(
        self, user_id: str, surah_number: int, ayah_number: int
    ) -> QuranBookmark | None:
        ...

    # ── Reading progress ─────────────────────────────────────────────────────

    def upsert_reading_progress(
        self, progress: QuranReadingProgress
    ) -> QuranReadingProgress:
        ...

    def get_reading_progress(
        self, user_id: str, surah_number: int
    ) -> QuranReadingProgress | None:
        ...

    def get_all_reading_progress(self, user_id: str) -> list[QuranReadingProgress]:
        ...
