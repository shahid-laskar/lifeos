from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.domain.user.entities import UserRecord
from app.domain.journal.models import JournalEntryResponse, JournalEntryCreate, JournalEntryUpdate
from app.domain.journal.service import JournalService

router = APIRouter(prefix="/journal", tags=["Journal"])

@router.get("/entries", response_model=list[JournalEntryResponse])
def get_entries(
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = JournalService(db)
    return svc.get_entries(user.id)

@router.post("/entries", response_model=JournalEntryResponse, status_code=status.HTTP_201_CREATED)
def create_entry(
    req: JournalEntryCreate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = JournalService(db)
    return svc.create_entry(user.id, req)

@router.patch("/entries/{entry_id}", response_model=JournalEntryResponse)
def update_entry(
    entry_id: str,
    req: JournalEntryUpdate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = JournalService(db)
    return svc.update_entry(user.id, entry_id, req)

@router.delete("/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_entry(
    entry_id: str,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = JournalService(db)
    svc.delete_entry(user.id, entry_id)
