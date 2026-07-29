"""
Dhikr catalogue loader.

Loads dhikr_items.json once at import time into an immutable dict.
No database, no network — same pattern as ADR-007 (Qur'an data).
Article 9: Privacy Is Sacred — user's dhikr practice never leaves the device
unless the user explicitly chooses to sync.
"""
from __future__ import annotations

import json
import pathlib

from app.domain.dhikr.entities import DhikrCategory, DhikrItem

_DATA_FILE = pathlib.Path(__file__).parent / "data" / "dhikr_items.json"


def _load() -> dict[str, DhikrItem]:
    raw = json.loads(_DATA_FILE.read_text(encoding="utf-8"))
    return {
        item["id"]: DhikrItem(
            id=item["id"],
            category=DhikrCategory(item["category"]),
            arabic_text=item["arabic_text"],
            transliteration=item["transliteration"],
            meaning=item["meaning"],
            recommended_count=item["recommended_count"],
            source=item["source"],
        )
        for item in raw
    }


# Loaded once at import time; effectively immutable.
DHIKR_ITEMS: dict[str, DhikrItem] = _load()


def get_item(item_id: str) -> DhikrItem | None:
    return DHIKR_ITEMS.get(item_id)


def list_items(category: DhikrCategory | None = None) -> list[DhikrItem]:
    items = list(DHIKR_ITEMS.values())
    if category is not None:
        items = [i for i in items if i.category == category]
    return items
