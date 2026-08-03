import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException

from app.infrastructure.orm_models import FocusSessionORM
from app.domain.productivity.models import FocusSessionResponse, FocusSessionCreate

class ProductivityService:
    def __init__(self, db: Session):
        self.db = db

    def get_sessions(self, user_id: str) -> list[FocusSessionResponse]:
        sessions = self.db.execute(
            select(FocusSessionORM).where(FocusSessionORM.user_id == user_id).order_by(FocusSessionORM.completed_at.desc())
        ).scalars().all()
        return [self._to_response(s) for s in sessions]

    def log_session(self, user_id: str, req: FocusSessionCreate) -> FocusSessionResponse:
        now = datetime.now(timezone.utc)
        
        s = FocusSessionORM(
            id=str(uuid.uuid4()),
            user_id=user_id,
            task_id=req.task_id,
            duration_minutes=req.duration_minutes,
            focus_quality=req.focus_quality,
            completed_at=now,
            created_at=now
        )
        self.db.add(s)
        self.db.commit()
        self.db.refresh(s)
        return self._to_response(s)

    def _to_response(self, s: FocusSessionORM) -> FocusSessionResponse:
        return FocusSessionResponse(
            id=s.id,
            user_id=s.user_id,
            task_id=s.task_id,
            duration_minutes=s.duration_minutes,
            focus_quality=s.focus_quality,
            completed_at=s.completed_at,
            created_at=s.created_at
        )
