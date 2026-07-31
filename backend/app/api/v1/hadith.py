"""
Hadith library API.

Per Phase 3 / 008_Islamic_Knowledge_Framework.md:
- GET  /api/v1/hadith/collections
- GET  /api/v1/hadith/collections/{slug}
- GET  /api/v1/hadith/collections/{slug}/chapters
- GET  /api/v1/hadith/collections/{slug}/chapters/{chapter_id}
- GET  /api/v1/hadith/search
- GET  /api/v1/hadith/bookmarks
- POST /api/v1/hadith/bookmarks
- DELETE /api/v1/hadith/bookmarks/{hadith_id}
- GET  /api/v1/hadith/{hadith_id}
"""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user, get_hadith_service
from app.domain.hadith.entities import HadithItem
from app.domain.hadith.models import (
    HadithBookmarkRequest,
    HadithBookmarkResponse,
    HadithChapterResponse,
    HadithCollectionResponse,
    HadithItemResponse,
    HadithSearchResponse,
)
from app.domain.hadith.service import (
    BookmarkNotFoundError,
    HadithNotFoundError,
    HadithService,
)
from app.domain.user.entities import UserRecord

router = APIRouter(prefix="/hadith", tags=["hadith"])


def _item_to_response(item: HadithItem) -> HadithItemResponse:
    return HadithItemResponse(
        id=item.id,
        collection_slug=item.collection_slug,
        collection_name=item.collection_name,
        chapter_id=item.chapter_id,
        chapter_name_english=item.chapter_name_english,
        chapter_name_arabic=item.chapter_name_arabic,
        hadith_number=item.hadith_number,
        arabic_text=item.arabic_text,
        narrator=item.narrator,
        translation=item.translation,
        grade=item.grade,
    )


@router.get("/collections", response_model=list[HadithCollectionResponse])
def list_collections(
    service: Annotated[HadithService, Depends(get_hadith_service)],
) -> list[HadithCollectionResponse]:
    return [
        HadithCollectionResponse(
            slug=c.slug,
            name_english=c.name_english,
            name_arabic=c.name_arabic,
            author_english=c.author_english,
            author_arabic=c.author_arabic,
            hadith_count=c.hadith_count,
            chapter_count=c.chapter_count,
        )
        for c in service.list_collections()
    ]


@router.get("/collections/{slug}", response_model=HadithCollectionResponse)
def get_collection(
    slug: str,
    service: Annotated[HadithService, Depends(get_hadith_service)],
) -> HadithCollectionResponse:
    try:
        c = service.get_collection(slug)
    except HadithNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return HadithCollectionResponse(
        slug=c.slug,
        name_english=c.name_english,
        name_arabic=c.name_arabic,
        author_english=c.author_english,
        author_arabic=c.author_arabic,
        hadith_count=c.hadith_count,
        chapter_count=c.chapter_count,
    )


@router.get(
    "/collections/{slug}/chapters",
    response_model=list[HadithChapterResponse],
)
def list_chapters(
    slug: str,
    service: Annotated[HadithService, Depends(get_hadith_service)],
) -> list[HadithChapterResponse]:
    try:
        chapters = service.list_chapters(slug)
    except HadithNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return [
        HadithChapterResponse(
            collection_slug=ch.collection_slug,
            chapter_id=ch.chapter_id,
            name_english=ch.name_english,
            name_arabic=ch.name_arabic,
            hadith_count=ch.hadith_count,
        )
        for ch in chapters
    ]


@router.get(
    "/collections/{slug}/chapters/{chapter_id}",
    response_model=list[HadithItemResponse],
)
def list_chapter_hadiths(
    slug: str,
    chapter_id: int,
    service: Annotated[HadithService, Depends(get_hadith_service)],
) -> list[HadithItemResponse]:
    try:
        items = service.list_hadiths(slug, chapter_id=chapter_id)
    except HadithNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    if not items:
        raise HTTPException(
            status_code=404,
            detail=f"Chapter {chapter_id} not found in collection {slug!r}.",
        )
    return [_item_to_response(i) for i in items]


@router.get("/search", response_model=HadithSearchResponse)
def search_hadiths(
    service: Annotated[HadithService, Depends(get_hadith_service)],
    q: str = Query(..., min_length=1, max_length=200),
    collection: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
) -> HadithSearchResponse:
    try:
        results = service.search(q, collection=collection, limit=limit)
    except HadithNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return HadithSearchResponse(
        query=q,
        total=len(results),
        results=[_item_to_response(i) for i in results],
    )


@router.get("/bookmarks", response_model=list[HadithBookmarkResponse])
def list_bookmarks(
    user: Annotated[UserRecord, Depends(get_current_user)],
    service: Annotated[HadithService, Depends(get_hadith_service)],
) -> list[HadithBookmarkResponse]:
    bookmarks = service.list_bookmarks(user.id)
    responses: list[HadithBookmarkResponse] = []
    for b in bookmarks:
        hadith = None
        try:
            hadith = _item_to_response(service.get_hadith(b.hadith_id))
        except HadithNotFoundError:
            hadith = None
        responses.append(
            HadithBookmarkResponse(
                id=b.id,
                hadith_id=b.hadith_id,
                note=b.note,
                created_at=b.created_at,
                hadith=hadith,
            )
        )
    return responses


@router.post(
    "/bookmarks",
    response_model=HadithBookmarkResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_bookmark(
    body: HadithBookmarkRequest,
    user: Annotated[UserRecord, Depends(get_current_user)],
    service: Annotated[HadithService, Depends(get_hadith_service)],
) -> HadithBookmarkResponse:
    try:
        bookmark = service.add_bookmark(user.id, body.hadith_id, body.note)
        hadith = _item_to_response(service.get_hadith(bookmark.hadith_id))
    except HadithNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return HadithBookmarkResponse(
        id=bookmark.id,
        hadith_id=bookmark.hadith_id,
        note=bookmark.note,
        created_at=bookmark.created_at,
        hadith=hadith,
    )


@router.delete(
    "/bookmarks/{hadith_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
)
def remove_bookmark(
    hadith_id: str,
    user: Annotated[UserRecord, Depends(get_current_user)],
    service: Annotated[HadithService, Depends(get_hadith_service)],
) -> None:
    try:
        service.remove_bookmark(user.id, hadith_id)
    except BookmarkNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{hadith_id}", response_model=HadithItemResponse)
def get_hadith(
    hadith_id: str,
    service: Annotated[HadithService, Depends(get_hadith_service)],
) -> HadithItemResponse:
    try:
        item = service.get_hadith(hadith_id)
    except HadithNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return _item_to_response(item)
