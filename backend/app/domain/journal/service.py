import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException

from app.infrastructure.orm_models import JournalEntryORM
from app.domain.journal.models import JournalEntryResponse, JournalEntryCreate, JournalEntryUpdate

class JournalService:
    def __init__(self, db: Session):
        self.db = db

    def get_entries(self, user_id: str) -> list[JournalEntryResponse]:
        entries = self.db.execute(
            select(JournalEntryORM).where(JournalEntryORM.user_id == user_id).order_by(JournalEntryORM.date.desc(), JournalEntryORM.created_at.desc())
        ).scalars().all()
        return [self._to_response(e) for e in entries]

    def create_entry(self, user_id: str, req: JournalEntryCreate) -> JournalEntryResponse:
        now = datetime.now(timezone.utc)
        e = JournalEntryORM(
            id=str(uuid.uuid4()),
            user_id=user_id,
            date=req.date,
            entry_type=req.entry_type,
            mood=req.mood,
            content=req.content,
            prompts_used=req.prompts_used,
            is_private=req.is_private,
            created_at=now,
            updated_at=now
        )
        self.db.add(e)
        self.db.commit()
        self.db.refresh(e)
        return self._to_response(e)

    def update_entry(self, user_id: str, entry_id: str, req: JournalEntryUpdate) -> JournalEntryResponse:
        e = self.db.execute(select(JournalEntryORM).where(JournalEntryORM.id == entry_id)).scalar_one_or_none()
        if not e or e.user_id != user_id:
            raise HTTPException(status_code=404, detail="Journal entry not found")

        if req.entry_type is not None: e.entry_type = req.entry_type
        if req.mood is not None: e.mood = req.mood
        if req.content is not None: e.content = req.content
        if req.prompts_used is not None: e.prompts_used = req.prompts_used
        if req.is_private is not None: e.is_private = req.is_private

        e.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(e)
        return self._to_response(e)

    def delete_entry(self, user_id: str, entry_id: str) -> None:
        e = self.db.execute(select(JournalEntryORM).where(JournalEntryORM.id == entry_id)).scalar_one_or_none()
        if not e or e.user_id != user_id:
            raise HTTPException(status_code=404, detail="Journal entry not found")
            
        self.db.delete(e)
        self.db.commit()

    def _to_response(self, e: JournalEntryORM) -> JournalEntryResponse:
        return JournalEntryResponse(
            id=e.id,
            user_id=e.user_id,
            date=e.date,
            entry_type=e.entry_type,
            mood=e.mood,
            content=e.content,
            prompts_used=e.prompts_used,
            is_private=e.is_private,
            created_at=e.created_at,
            updated_at=e.updated_at
        )
