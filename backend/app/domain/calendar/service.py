import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException

from app.infrastructure.orm_models import EventORM
from app.domain.calendar.models import EventResponse, EventCreate, EventUpdate

class CalendarService:
    def __init__(self, db: Session):
        self.db = db

    def get_events(self, user_id: str, start_time: datetime | None = None, end_time: datetime | None = None) -> list[EventResponse]:
        query = select(EventORM).where(EventORM.user_id == user_id)
        if start_time:
            query = query.where(EventORM.end_time >= start_time)
        if end_time:
            query = query.where(EventORM.start_time <= end_time)
            
        query = query.order_by(EventORM.start_time.asc())
        events = self.db.execute(query).scalars().all()
        return [self._to_response(e) for e in events]

    def create_event(self, user_id: str, req: EventCreate) -> EventResponse:
        now = datetime.now(timezone.utc)
        e = EventORM(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title=req.title,
            description=req.description,
            start_time=req.start_time,
            end_time=req.end_time,
            is_all_day=req.is_all_day,
            recurrence=req.recurrence,
            created_at=now,
            updated_at=now
        )
        self.db.add(e)
        self.db.commit()
        self.db.refresh(e)
        return self._to_response(e)

    def update_event(self, user_id: str, event_id: str, req: EventUpdate) -> EventResponse:
        e = self.db.execute(select(EventORM).where(EventORM.id == event_id)).scalar_one_or_none()
        if not e or e.user_id != user_id:
            raise HTTPException(status_code=404, detail="Event not found")

        if req.title is not None: e.title = req.title
        if req.description is not None: e.description = req.description
        if req.start_time is not None: e.start_time = req.start_time
        if req.end_time is not None: e.end_time = req.end_time
        if req.is_all_day is not None: e.is_all_day = req.is_all_day
        if req.recurrence is not None: e.recurrence = req.recurrence

        e.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(e)
        return self._to_response(e)

    def delete_event(self, user_id: str, event_id: str) -> None:
        e = self.db.execute(select(EventORM).where(EventORM.id == event_id)).scalar_one_or_none()
        if not e or e.user_id != user_id:
            raise HTTPException(status_code=404, detail="Event not found")
            
        self.db.delete(e)
        self.db.commit()

    def _to_response(self, e: EventORM) -> EventResponse:
        return EventResponse(
            id=e.id,
            user_id=e.user_id,
            title=e.title,
            description=e.description,
            start_time=e.start_time,
            end_time=e.end_time,
            is_all_day=e.is_all_day,
            recurrence=e.recurrence,
            created_at=e.created_at,
            updated_at=e.updated_at
        )
