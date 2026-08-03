from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user, get_dua_service
from app.domain.user.entities import UserRecord
from app.domain.dua.models import (
    DuaItemResponse, BookmarkRequest, BookmarkResponse, BookmarkItemResponse
)
from app.domain.dua.service import DuaService, BookmarkNotFoundError

router = APIRouter(prefix="/duas", tags=["Duas"])

@router.get("/categories", response_model=list[str])
def get_categories(
    service: DuaService = Depends(get_dua_service),
) -> list[str]:
    return service.get_all_categories()

@router.get("", response_model=list[DuaItemResponse])
def get_duas(
    category: str | None = Query(None, description="Filter by category"),
    service: DuaService = Depends(get_dua_service),
) -> list[DuaItemResponse]:
    items = service.get_all_duas(category)
    return [
        DuaItemResponse(
            id=item.id,
            category=item.category,
            arabic_text=item.arabic_text,
            transliteration=item.transliteration,
            translation=item.translation,
            reference=item.reference,
            when_to_recite=item.when_to_recite,
        )
        for item in items
    ]

@router.get("/daily", response_model=DuaItemResponse)
def get_daily_dua(
    service: DuaService = Depends(get_dua_service),
) -> DuaItemResponse:
    item = service.get_daily_dua()
    if not item:
        raise HTTPException(status_code=404, detail="No duas found")
    return DuaItemResponse(
        id=item.id,
        category=item.category,
        arabic_text=item.arabic_text,
        transliteration=item.transliteration,
        translation=item.translation,
        reference=item.reference,
        when_to_recite=item.when_to_recite,
    )

@router.get("/{dua_id}", response_model=DuaItemResponse)
def get_dua(
    dua_id: str,
    service: DuaService = Depends(get_dua_service),
) -> DuaItemResponse:
    item = service.get_dua_by_id(dua_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dua not found",
        )
    return DuaItemResponse(
        id=item.id,
        category=item.category,
        arabic_text=item.arabic_text,
        transliteration=item.transliteration,
        translation=item.translation,
        reference=item.reference,
        when_to_recite=item.when_to_recite,
    )


@router.get("/favourites/bookmarks", response_model=list[BookmarkItemResponse])
def list_dua_bookmarks(
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    service: Annotated[DuaService, Depends(get_dua_service)],
) -> list[BookmarkItemResponse]:
    bookmarks = service.list_bookmarks(current_user.id)
    responses = []
    for b in bookmarks:
        dua = service.get_dua_by_id(b.dua_id)
        responses.append(
            BookmarkItemResponse(
                id=b.id,
                dua_id=b.dua_id,
                created_at=b.created_at,
                dua=DuaItemResponse(**dua.__dict__) if dua else None,
            )
        )
    return responses


@router.post("/favourites", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED)
def add_dua_bookmark(
    request: BookmarkRequest,
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    service: Annotated[DuaService, Depends(get_dua_service)],
) -> BookmarkResponse:
    b = service.add_bookmark(current_user.id, request.dua_id)
    return BookmarkResponse(id=b.id, dua_id=b.dua_id, created_at=b.created_at)


@router.delete("/favourites/{dua_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_dua_bookmark(
    dua_id: str,
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    service: Annotated[DuaService, Depends(get_dua_service)],
) -> None:
    try:
        service.remove_bookmark(current_user.id, dua_id)
    except BookmarkNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
