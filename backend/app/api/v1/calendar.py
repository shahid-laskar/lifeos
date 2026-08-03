from datetime import datetime
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.domain.user.entities import UserRecord
from app.domain.calendar.models import EventResponse, EventCreate, EventUpdate
from app.domain.calendar.service import CalendarService

router = APIRouter(prefix="/calendar/events", tags=["Calendar"])

@router.get("", response_model=list[EventResponse])
def get_events(
    start_time: datetime | None = Query(None),
    end_time: datetime | None = Query(None),
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = CalendarService(db)
    return svc.get_events(user.id, start_time, end_time)

@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    req: EventCreate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = CalendarService(db)
    return svc.create_event(user.id, req)

@router.patch("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: str,
    req: EventUpdate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = CalendarService(db)
    return svc.update_event(user.id, event_id, req)

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: str,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = CalendarService(db)
    svc.delete_event(user.id, event_id)
