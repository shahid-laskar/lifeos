"""Hadith catalogue and bookmark service."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app.domain.hadith.data import get_hadith_catalogue
from app.domain.hadith.entities import (
    HadithBookmark,
    HadithBookmarkRepository,
    HadithChapter,
    HadithCollection,
    HadithItem,
)


class HadithNotFoundError(LookupError):
    pass


class BookmarkNotFoundError(LookupError):
    pass


class HadithService:
    def __init__(
        self,
        bookmark_repo: HadithBookmarkRepository | None = None,
    ) -> None:
        self._catalogue = get_hadith_catalogue()
        self._bookmarks = bookmark_repo

    # ── Catalogue ────────────────────────────────────────────────────────────

    def list_collections(self) -> list[HadithCollection]:
        return self._catalogue.list_collections()

    def get_collection(self, slug: str) -> HadithCollection:
        collection = self._catalogue.get_collection(slug)
        if collection is None:
            raise HadithNotFoundError(f"Collection {slug!r} not found.")
        return collection

    def list_chapters(self, slug: str) -> list[HadithChapter]:
        self.get_collection(slug)
        return self._catalogue.list_chapters(slug)

    def list_hadiths(
        self,
        slug: str,
        *,
        chapter_id: int | None = None,
    ) -> list[HadithItem]:
        self.get_collection(slug)
        return self._catalogue.list_hadiths(slug, chapter_id=chapter_id)

    def get_hadith(self, hadith_id: str) -> HadithItem:
        item = self._catalogue.get_hadith(hadith_id)
        if item is None:
            raise HadithNotFoundError(f"Hadith {hadith_id!r} not found.")
        return item

    def search(
        self,
        query: str,
        *,
        collection: str | None = None,
        limit: int = 50,
    ) -> list[HadithItem]:
        if collection:
            self.get_collection(collection)
        return self._catalogue.search(
            query, collection=collection, limit=limit
        )

    # ── Bookmarks ────────────────────────────────────────────────────────────

    def add_bookmark(
        self,
        user_id: str,
        hadith_id: str,
        note: str | None = None,
    ) -> HadithBookmark:
        if self._bookmarks is None:
            raise RuntimeError("Bookmark repository is not configured.")
        # Validate hadith exists.
        self.get_hadith(hadith_id)
        existing = self._bookmarks.get(user_id, hadith_id)
        if existing is not None:
            if note is not None and note != existing.note:
                updated = HadithBookmark(
                    id=existing.id,
                    user_id=existing.user_id,
                    hadith_id=existing.hadith_id,
                    note=note,
                    created_at=existing.created_at,
                )
                return self._bookmarks.add(updated)
            return existing
        bookmark = HadithBookmark(
            id=str(uuid.uuid4()),
            user_id=user_id,
            hadith_id=hadith_id,
            note=note,
            created_at=datetime.now(timezone.utc),
        )
        return self._bookmarks.add(bookmark)

    def remove_bookmark(self, user_id: str, hadith_id: str) -> None:
        if self._bookmarks is None:
            raise RuntimeError("Bookmark repository is not configured.")
        removed = self._bookmarks.remove(user_id, hadith_id)
        if not removed:
            raise BookmarkNotFoundError(
                f"No bookmark for hadith {hadith_id!r}."
            )

    def list_bookmarks(self, user_id: str) -> list[HadithBookmark]:
        if self._bookmarks is None:
            raise RuntimeError("Bookmark repository is not configured.")
        return self._bookmarks.list_for_user(user_id)
