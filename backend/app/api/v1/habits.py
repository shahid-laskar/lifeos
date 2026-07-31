from typing import Annotated
from datetime import date as date_type, datetime

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

