"""Load and index open hadith JSON datasets into an in-memory catalogue.

Data source: AhmedBaset/hadith-json v1.2.0 (Sunnah.com scrapes), pinned and
vendored under data/raw/. Full collections can be added later by dropping
additional chapter JSON files into that directory.
"""
from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

from app.domain.hadith.entities import HadithChapter, HadithCollection, HadithItem

_RAW_DIR = Path(__file__).resolve().parent / "raw"

# Filename prefix → collection slug. Order is display order.
_COLLECTION_META: dict[str, dict[str, str]] = {
    "bukhari": {
        "name_english": "Sahih al-Bukhari",
        "name_arabic": "صحيح البخاري",
        "author_english": "Imam Muhammad ibn Ismail al-Bukhari",
        "author_arabic": "الإمام محمد بن إسماعيل البخاري",
        "default_grade": "Sahih",
    },
    "muslim": {
        "name_english": "Sahih Muslim",
        "name_arabic": "صحيح مسلم",
        "author_english": "Imam Muslim ibn al-Hajjaj",
        "author_arabic": "الإمام مسلم بن الحجاج",
        "default_grade": "Sahih",
    },
    "abudawud": {
        "name_english": "Sunan Abi Dawud",
        "name_arabic": "سنن أبي داود",
        "author_english": "Imam Abu Dawud al-Sijistani",
        "author_arabic": "الإمام أبو داود السجستاني",
        "default_grade": "See collection",
    },
    "tirmidhi": {
        "name_english": "Jami' at-Tirmidhi",
        "name_arabic": "جامع الترمذي",
        "author_english": "Imam Abu Isa al-Tirmidhi",
        "author_arabic": "الإمام أبو عيسى الترمذي",
        "default_grade": "See collection",
    },
    "nasai": {
        "name_english": "Sunan an-Nasa'i",
        "name_arabic": "سنن النسائي",
        "author_english": "Imam Ahmad an-Nasa'i",
        "author_arabic": "الإمام أحمد النسائي",
        "default_grade": "See collection",
    },
    "ibnmajah": {
        "name_english": "Sunan Ibn Majah",
        "name_arabic": "سنن ابن ماجه",
        "author_english": "Imam Ibn Majah",
        "author_arabic": "الإمام ابن ماجه",
        "default_grade": "See collection",
    },
    "nawawi40": {
        "name_english": "Forty Hadith of Imam Nawawi",
        "name_arabic": "الأربعون النووية",
        "author_english": "Imam Yahya ibn Sharaf al-Nawawi",
        "author_arabic": "الإمام يحيى بن شرف النووي",
        "default_grade": "Compiled (Nawawi)",
    },
}

_FILE_SLUG_RE = re.compile(
    r"^(bukhari|muslim|abudawud|tirmidhi|nasai|ibnmajah|nawawi40)(?:_(\d+))?\.json$"
)


def _clean(text: str) -> str:
    return re.sub(r"[ \t]+", " ", text.replace("\n", " ")).strip()


def _english_parts(raw_english: object) -> tuple[str, str]:
    if isinstance(raw_english, dict):
        narrator = _clean(str(raw_english.get("narrator") or ""))
        text = _clean(str(raw_english.get("text") or ""))
        return narrator, text
    return "", _clean(str(raw_english or ""))


class HadithCatalogue:
    def __init__(self) -> None:
        self._items: dict[str, HadithItem] = {}
        self._by_collection: dict[str, list[HadithItem]] = {}
        self._chapters: dict[str, dict[int, HadithChapter]] = {}
        self._collections: dict[str, HadithCollection] = {}
        self._load()

    def _load(self) -> None:
        if not _RAW_DIR.is_dir():
            return

        chapter_names: dict[str, dict[int, tuple[str, str]]] = {
            slug: {} for slug in _COLLECTION_META
        }

        for path in sorted(_RAW_DIR.glob("*.json")):
            match = _FILE_SLUG_RE.match(path.name)
            if not match:
                continue
            slug = match.group(1)
            meta = _COLLECTION_META[slug]
            payload = json.loads(path.read_text(encoding="utf-8"))
            file_meta = payload.get("metadata") or {}
            en_meta = file_meta.get("english") or {}
            ar_meta = file_meta.get("arabic") or {}

            # Chapter index from by_book files (e.g. nawawi40).
            for ch in payload.get("chapters") or []:
                cid = int(ch["id"])
                chapter_names[slug][cid] = (
                    _clean(str(ch.get("english") or f"Chapter {cid}")),
                    _clean(str(ch.get("arabic") or "")),
                )

            # by_chapter files carry the chapter title in metadata.introduction
            # and optionally a "chapter" object.
            chapter_obj = payload.get("chapter") or {}
            intro_en = _clean(
                str(
                    chapter_obj.get("english")
                    or en_meta.get("introduction")
                    or ""
                )
            )
            intro_ar = _clean(
                str(
                    chapter_obj.get("arabic")
                    or ar_meta.get("introduction")
                    or ""
                )
            )

            for raw in payload.get("hadiths") or []:
                chapter_id = int(raw.get("chapterId") or 0)
                if chapter_id not in chapter_names[slug]:
                    chapter_names[slug][chapter_id] = (
                        intro_en or f"Chapter {chapter_id}",
                        intro_ar,
                    )
                ch_en, ch_ar = chapter_names[slug][chapter_id]
                narrator, translation = _english_parts(raw.get("english"))
                source_id = int(raw["id"])
                item_id = f"{slug}-{source_id}"
                item = HadithItem(
                    id=item_id,
                    collection_slug=slug,
                    collection_name=meta["name_english"],
                    chapter_id=chapter_id,
                    chapter_name_english=ch_en,
                    chapter_name_arabic=ch_ar,
                    hadith_number=int(raw.get("idInBook") or source_id),
                    arabic_text=_clean(str(raw.get("arabic") or "")),
                    narrator=narrator,
                    translation=translation,
                    grade=meta["default_grade"],
                )
                self._items[item_id] = item
                self._by_collection.setdefault(slug, []).append(item)

        for slug, meta in _COLLECTION_META.items():
            items = self._by_collection.get(slug, [])
            if not items:
                continue
            # Stable order within a collection.
            items.sort(key=lambda h: (h.chapter_id, h.hadith_number, h.id))
            self._by_collection[slug] = items

            chapters: dict[int, HadithChapter] = {}
            for item in items:
                existing = chapters.get(item.chapter_id)
                if existing is None:
                    chapters[item.chapter_id] = HadithChapter(
                        collection_slug=slug,
                        chapter_id=item.chapter_id,
                        name_english=item.chapter_name_english,
                        name_arabic=item.chapter_name_arabic,
                        hadith_count=1,
                    )
                else:
                    chapters[item.chapter_id] = HadithChapter(
                        collection_slug=slug,
                        chapter_id=item.chapter_id,
                        name_english=existing.name_english,
                        name_arabic=existing.name_arabic,
                        hadith_count=existing.hadith_count + 1,
                    )
            self._chapters[slug] = chapters
            self._collections[slug] = HadithCollection(
                slug=slug,
                name_english=meta["name_english"],
                name_arabic=meta["name_arabic"],
                author_english=meta["author_english"],
                author_arabic=meta["author_arabic"],
                hadith_count=len(items),
                chapter_count=len(chapters),
            )

    def list_collections(self) -> list[HadithCollection]:
        order = list(_COLLECTION_META.keys())
        return [
            self._collections[slug]
            for slug in order
            if slug in self._collections
        ]

    def get_collection(self, slug: str) -> HadithCollection | None:
        return self._collections.get(slug)

    def list_chapters(self, slug: str) -> list[HadithChapter]:
        chapters = self._chapters.get(slug, {})
        return [chapters[cid] for cid in sorted(chapters)]

    def list_hadiths(
        self,
        slug: str,
        *,
        chapter_id: int | None = None,
    ) -> list[HadithItem]:
        items = self._by_collection.get(slug, [])
        if chapter_id is None:
            return list(items)
        return [h for h in items if h.chapter_id == chapter_id]

    def get_hadith(self, hadith_id: str) -> HadithItem | None:
        return self._items.get(hadith_id)

    def search(
        self,
        query: str,
        *,
        collection: str | None = None,
        limit: int = 50,
    ) -> list[HadithItem]:
        q = query.strip().lower()
        if not q:
            return []
        pool = (
            self._by_collection.get(collection, [])
            if collection
            else list(self._items.values())
        )
        hits: list[HadithItem] = []
        for item in pool:
            haystack = " ".join(
                [
                    item.translation,
                    item.narrator,
                    item.arabic_text,
                    item.chapter_name_english,
                    item.collection_name,
                    item.grade,
                ]
            ).lower()
            if q in haystack:
                hits.append(item)
                if len(hits) >= limit:
                    break
        return hits


@lru_cache(maxsize=1)
def get_hadith_catalogue() -> HadithCatalogue:
    return HadithCatalogue()
