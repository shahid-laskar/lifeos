from __future__ import annotations

from app.domain.dua.data import get_dua_catalogue
from app.domain.dua.entities import DuaItem

class DuaService:
    def __init__(self) -> None:
        self._catalogue = get_dua_catalogue()

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
