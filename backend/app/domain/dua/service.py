from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app.domain.dua.data import get_dua_catalogue
from app.domain.dua.entities import DuaItem, DuaBookmark, DuaBookmarkRepository


class BookmarkNotFoundError(LookupError):
    pass


class DuaService:
    def __init__(self, bookmark_repo: DuaBookmarkRepository | None = None) -> None:
        self._catalogue = get_dua_catalogue()
        self._bookmarks = bookmark_repo

    def get_all_categories(self) -> list[str]:
        categories = set(item.category for item in self._catalogue)
        return sorted(list(categories))

    def get_all_duas(self, category: str | None = None) -> list[DuaItem]:
        if category:
            return [item for item in self._catalogue if item.category.lower() == category.lower()]
        return self._catalogue

    def get_dua_by_id(self, dua_id: str) -> DuaItem | None:
        for item in self._catalogue:
            if item.id == dua_id:
                return item
        return None

    def get_daily_dua(self) -> DuaItem | None:
        import datetime
        if not self._catalogue:
            return None
        day_index = datetime.date.today().toordinal()
        return self._catalogue[day_index % len(self._catalogue)]

    def add_bookmark(self, user_id: str, dua_id: str) -> DuaBookmark:
        if self._bookmarks is None:
            raise RuntimeError("Bookmark repository is not configured.")
        existing = self._bookmarks.get(user_id, dua_id)
        if existing is not None:
            return existing
        bookmark = DuaBookmark(
            id=str(uuid.uuid4()),
            user_id=user_id,
            dua_id=dua_id,
            created_at=datetime.now(timezone.utc),
        )
        return self._bookmarks.add(bookmark)

    def remove_bookmark(self, user_id: str, dua_id: str) -> None:
        if self._bookmarks is None:
            raise RuntimeError("Bookmark repository is not configured.")
        removed = self._bookmarks.remove(user_id, dua_id)
        if not removed:
            raise BookmarkNotFoundError(f"No bookmark for dua {dua_id!r}.")

    def list_bookmarks(self, user_id: str) -> list[DuaBookmark]:
        if self._bookmarks is None:
            raise RuntimeError("Bookmark repository is not configured.")
        return self._bookmarks.list_for_user(user_id)
