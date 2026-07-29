"""
Qur'an metadata loader.

Loads the bundled quran_meta.json once at import time and exposes an immutable
lookup table. This is pure domain-level data: no database, no network calls
(ADR-007, Article 9: Privacy Is Sacred — no external API calls that leak which
ayahs a user reads).
"""
from __future__ import annotations

import json
import pathlib

from app.domain.quran.entities import RevelationType, SurahInfo

_DATA_FILE = pathlib.Path(__file__).parent / "data" / "quran_meta.json"


def _load() -> dict[int, SurahInfo]:
    raw = json.loads(_DATA_FILE.read_text(encoding="utf-8"))
    return {
        item["number"]: SurahInfo(
            number=item["number"],
            arabic_name=item["arabic_name"],
            transliterated_name=item["transliterated_name"],
            meaning=item["meaning"],
            ayah_count=item["ayah_count"],
            revelation_type=RevelationType(item["revelation_type"]),
        )
        for item in raw
    }


# Loaded once at import time; effectively immutable.
SURAHS: dict[int, SurahInfo] = _load()


def get_surah(number: int) -> SurahInfo | None:
    return SURAHS.get(number)


def list_surahs() -> list[SurahInfo]:
    return list(SURAHS.values())
