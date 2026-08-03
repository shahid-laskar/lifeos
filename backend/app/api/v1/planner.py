from datetime import date as date_type
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.domain.user.entities import UserRecord
from app.domain.planner.models import (
    PlannerDayResponse,
    TimeBlockResponse,
    TimeBlockCreate,
    TimeBlockUpdate
)
from app.domain.planner.service import PlannerService

router = APIRouter(prefix="/planner", tags=["Planner"])

@router.get("/days/{date}", response_model=PlannerDayResponse)
def get_planner_day(
    date: date_type,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = PlannerService(db)
    return svc.get_day(user.id, date)

@router.post("/days/{date}/blocks", response_model=TimeBlockResponse, status_code=status.HTTP_201_CREATED)
def add_time_block(
    date: date_type,
    req: TimeBlockCreate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = PlannerService(db)
    return svc.add_time_block(user.id, date, req)

@router.patch("/blocks/{block_id}", response_model=TimeBlockResponse)
def update_time_block(
    block_id: str,
    req: TimeBlockUpdate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = PlannerService(db)
    return svc.update_time_block(user.id, block_id, req)

@router.delete("/blocks/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_time_block(
    block_id: str,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = PlannerService(db)
    svc.delete_time_block(user.id, block_id)
