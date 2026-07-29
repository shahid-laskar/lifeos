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

from app.domain.quran.entities import AyahInfo, RevelationType, SurahInfo

_DATA_FILE = pathlib.Path(__file__).parent / "data" / "quran_meta.json"
_TEXT_FILE = pathlib.Path(__file__).parent / "data" / "quran_uthmani.txt"


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


def _load_ayahs() -> dict[int, tuple[AyahInfo, ...]]:
    by_surah: dict[int, list[AyahInfo]] = {}
    for raw_line in _TEXT_FILE.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split("|", 2)
        if len(parts) != 3:
            raise ValueError("Invalid Tanzil Quran text line")
        surah_number, ayah_number, text = parts
        by_surah.setdefault(int(surah_number), []).append(
            AyahInfo(number_in_surah=int(ayah_number), text=text)
        )

    if set(by_surah) != set(SURAHS):
        raise ValueError("Bundled Quran text does not contain all 114 surahs")
    for number, surah in SURAHS.items():
        ayahs = by_surah[number]
        if len(ayahs) != surah.ayah_count:
            raise ValueError(
                f"Bundled Quran text has {len(ayahs)} ayahs for surah {number}; "
                f"expected {surah.ayah_count}"
            )
        if [ayah.number_in_surah for ayah in ayahs] != list(range(1, surah.ayah_count + 1)):
            raise ValueError(f"Bundled Quran text has invalid ayah numbering for surah {number}")
    return {number: tuple(ayahs) for number, ayahs in by_surah.items()}


AYAHS: dict[int, tuple[AyahInfo, ...]] = _load_ayahs()


def get_surah(number: int) -> SurahInfo | None:
    return SURAHS.get(number)


def list_surahs() -> list[SurahInfo]:
    return list(SURAHS.values())


def get_ayahs(surah_number: int) -> tuple[AyahInfo, ...] | None:
    return AYAHS.get(surah_number)
