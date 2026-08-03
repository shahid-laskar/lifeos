from typing import Annotated, List
from datetime import date as date_type, datetime, timedelta

from fastapi import APIRouter, Depends, Query, HTTPException

from app.api.deps import get_current_user, get_habit_service
from app.core.timezones import resolve_timezone
from app.domain.user.entities import UserRecord
from app.domain.habit.service import HabitService
from app.domain.habit.models import (
    PrayerLogRequest,
    PrayerLogResponse,
    DailyPrayerStatus,
    ConsistencyMetrics
,
    PrayerJournalRequest,
    PrayerJournalResponse,
    PrayerInsightsResponse,
    PrayerName
)

router = APIRouter(prefix="/habits", tags=["habits"])

@router.post("/prayers/log", response_model=PrayerLogResponse)
def log_prayer(
    request: PrayerLogRequest,
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    habit_service: Annotated[HabitService, Depends(get_habit_service)],
    date: date_type | None = Query(None, description="Date of the prayer. Defaults to today in user's timezone.")
) -> PrayerLogResponse:
    if not current_user.timezone:
        raise HTTPException(status_code=400, detail="User timezone must be set to log prayers.")
        
    tz = resolve_timezone(current_user.timezone)
    target_date = date or datetime.now(tz).date()

    record = habit_service.log_prayer(
        user_id=current_user.id,
        date=target_date,
        prayer_name=request.prayer_name,
        status=request.status
    )
    
    return PrayerLogResponse(
        id=record.id,
        date=record.date,
        prayer_name=record.prayer_name,
        status=record.status
    )

@router.get("/prayers/status", response_model=DailyPrayerStatus)
def get_daily_status(
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    habit_service: Annotated[HabitService, Depends(get_habit_service)],
    date: date_type | None = Query(None, description="Date to check status. Defaults to today in user's timezone.")
) -> DailyPrayerStatus:
    if not current_user.timezone:
        raise HTTPException(status_code=400, detail="User timezone must be set to get prayer status.")
        
    tz = resolve_timezone(current_user.timezone)
    target_date = date or datetime.now(tz).date()
    
    return habit_service.get_daily_status(current_user.id, target_date)

@router.get("/prayers/consistency", response_model=ConsistencyMetrics)
def get_consistency_metrics(
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    habit_service: Annotated[HabitService, Depends(get_habit_service)]
) -> ConsistencyMetrics:
    if not current_user.timezone:
        raise HTTPException(status_code=400, detail="User timezone must be set to get metrics.")
        
    tz = resolve_timezone(current_user.timezone)
    today = datetime.now(tz).date()
    
    return habit_service.get_consistency_metrics(current_user.id, today)


@router.post("/fasting/log")
def log_fasting(
    body: dict,
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    habit_service: Annotated[HabitService, Depends(get_habit_service)],
):
    fasting_type = body.get("type", "voluntary")
    date_str = body.get("date")
    if not current_user.timezone:
        raise HTTPException(status_code=400, detail="User timezone must be set.")
    tz = resolve_timezone(current_user.timezone)
    target_date = date_type.fromisoformat(date_str) if date_str else datetime.now(tz).date()
    
    return habit_service.log_fasting(current_user.id, target_date, fasting_type)


@router.get("/fasting/status")
def get_fasting_status(
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    habit_service: Annotated[HabitService, Depends(get_habit_service)],
    date: date_type | None = Query(None),
):
    if not current_user.timezone:
        raise HTTPException(status_code=400, detail="User timezone must be set.")
    tz = resolve_timezone(current_user.timezone)
    target_date = date or datetime.now(tz).date()
    return habit_service.get_fasting_status(current_user.id, target_date)


@router.post("/prayers/journal", response_model=PrayerJournalResponse)
def log_prayer_journal(
    request: PrayerJournalRequest,
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    habit_service: Annotated[HabitService, Depends(get_habit_service)],
    date: date_type | None = Query(None, description="Date of the prayer. Defaults to today in user's timezone.")
) -> PrayerJournalResponse:
    if not current_user.timezone:
        raise HTTPException(status_code=400, detail="User timezone must be set.")
        
    tz = resolve_timezone(current_user.timezone)
    target_date = date or datetime.now(tz).date()

    record = habit_service.log_prayer_journal(
        user_id=current_user.id,
        date=target_date,
        prayer_name=request.prayer_name,
        khushoo_rating=request.khushoo_rating,
        notes=request.notes,
        distractions=request.distractions
    )
    
    return PrayerJournalResponse(
        id=record.id,
        date=record.date,
        prayer_name=record.prayer_name,
        khushoo_rating=record.khushoo_rating,
        notes=record.notes,
        distractions=record.distractions
    )

@router.get("/prayers/journal", response_model=List[PrayerJournalResponse])
def get_prayer_journal(
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    habit_service: Annotated[HabitService, Depends(get_habit_service)],
    prayer_name: PrayerName | None = Query(None, description="Optional prayer name filter."),
    date: date_type | None = Query(None, description="Date of the prayer.")
) -> List[PrayerJournalResponse]:
    if not current_user.timezone:
        raise HTTPException(status_code=400, detail="User timezone must be set.")
        
    tz = resolve_timezone(current_user.timezone)
    
    if prayer_name and date:
        record = habit_service.get_prayer_journal(current_user.id, date, prayer_name)
        if not record:
            return []
        return [PrayerJournalResponse(
            id=record.id, date=record.date, prayer_name=record.prayer_name,
            khushoo_rating=record.khushoo_rating, notes=record.notes, distractions=record.distractions
        )]
    else:
        # Return recent journals
        today = datetime.now(tz).date()
        start_date = today - timedelta(days=30)
        journals = habit_service.get_prayer_journals(current_user.id, start_date, today)
        return [PrayerJournalResponse(
            id=record.id, date=record.date, prayer_name=record.prayer_name,
            khushoo_rating=record.khushoo_rating, notes=record.notes, distractions=record.distractions
        ) for record in journals]

@router.get("/prayers/insights", response_model=PrayerInsightsResponse)
def get_prayer_insights(
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    habit_service: Annotated[HabitService, Depends(get_habit_service)]
) -> PrayerInsightsResponse:
    if not current_user.timezone:
        raise HTTPException(status_code=400, detail="User timezone must be set.")
        
    tz = resolve_timezone(current_user.timezone)
    today = datetime.now(tz).date()
    
    return habit_service.get_prayer_insights(current_user.id, today)

# ---------------------------------------------------------------------------
# GENERIC HABITS (PHASE 5A)
# ---------------------------------------------------------------------------

from app.domain.habit.models import GenericHabitResponse, GenericHabitCreate, GenericHabitUpdate
from app.domain.habit.generic_service import GenericHabitService
from app.api.deps import get_db
from sqlalchemy.orm import Session

@router.get("/custom", response_model=list[GenericHabitResponse])
def get_custom_habits(
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = GenericHabitService(db)
    return svc.get_habits(user.id)

@router.post("/custom", response_model=GenericHabitResponse)
def create_custom_habit(
    req: GenericHabitCreate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = GenericHabitService(db)
    return svc.create_habit(user.id, req)

@router.patch("/custom/{habit_id}", response_model=GenericHabitResponse)
def update_custom_habit(
    habit_id: str,
    req: GenericHabitUpdate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = GenericHabitService(db)
    return svc.update_habit(user.id, habit_id, req)

@router.delete("/custom/{habit_id}")
def delete_custom_habit(
    habit_id: str,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = GenericHabitService(db)
    svc.delete_habit(user.id, habit_id)

@router.post("/custom/{habit_id}/toggle", response_model=GenericHabitResponse)
def toggle_custom_habit_completion(
    habit_id: str,
    date: date_type,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = GenericHabitService(db)
    return svc.toggle_completion(user.id, habit_id, date)

