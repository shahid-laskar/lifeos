from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
import uuid
from datetime import datetime, timezone

from app.api.deps import get_db, get_current_user
from app.domain.user.entities import UserRecord
from app.infrastructure.orm_models import SleepLogORM, ExerciseLogORM, EnergyLogORM
from app.domain.health.models import (
    SleepLogResponse, SleepLogCreate,
    ExerciseLogResponse, ExerciseLogCreate,
    EnergyLogResponse, EnergyLogCreate
)

router = APIRouter(prefix="/health", tags=["health"])

# ── Sleep ─────────────────────────────────────────────────────────────

@router.get("/sleep", response_model=List[SleepLogResponse])
def get_sleep_logs(
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = db.execute(select(SleepLogORM).where(SleepLogORM.user_id == user.id).order_by(SleepLogORM.date.desc())).scalars().all()
    return logs

@router.post("/sleep", response_model=SleepLogResponse, status_code=status.HTTP_201_CREATED)
def create_sleep_log(
    req: SleepLogCreate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    log = SleepLogORM(
        id=str(uuid.uuid4()),
        user_id=user.id,
        date=req.date,
        sleep_time=req.sleep_time,
        wake_time=req.wake_time,
        quality=req.quality,
        notes=req.notes,
        created_at=now,
        updated_at=now
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

# ── Exercise ──────────────────────────────────────────────────────────

@router.get("/exercise", response_model=List[ExerciseLogResponse])
def get_exercise_logs(
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = db.execute(select(ExerciseLogORM).where(ExerciseLogORM.user_id == user.id).order_by(ExerciseLogORM.date.desc())).scalars().all()
    return logs

@router.post("/exercise", response_model=ExerciseLogResponse, status_code=status.HTTP_201_CREATED)
def create_exercise_log(
    req: ExerciseLogCreate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    log = ExerciseLogORM(
        id=str(uuid.uuid4()),
        user_id=user.id,
        date=req.date,
        exercise_type=req.exercise_type,
        duration_minutes=req.duration_minutes,
        intensity=req.intensity,
        notes=req.notes,
        created_at=now,
        updated_at=now
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

# ── Energy ────────────────────────────────────────────────────────────

@router.get("/energy", response_model=List[EnergyLogResponse])
def get_energy_logs(
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = db.execute(select(EnergyLogORM).where(EnergyLogORM.user_id == user.id).order_by(EnergyLogORM.date.desc())).scalars().all()
    return logs

@router.post("/energy", response_model=EnergyLogResponse, status_code=status.HTTP_201_CREATED)
def create_energy_log(
    req: EnergyLogCreate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    log = EnergyLogORM(
        id=str(uuid.uuid4()),
        user_id=user.id,
        date=req.date,
        energy_level=req.energy_level,
        mood=req.mood,
        notes=req.notes,
        created_at=now,
        updated_at=now
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
