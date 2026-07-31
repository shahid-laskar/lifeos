from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.domain.dua.models import DuaItemResponse
from app.domain.dua.service import DuaService

router = APIRouter(prefix="/duas", tags=["Duas"])

def get_dua_service() -> DuaService:
    return DuaService()

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
