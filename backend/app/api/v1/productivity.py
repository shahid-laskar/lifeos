from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.domain.user.entities import UserRecord
from app.domain.productivity.models import FocusSessionResponse, FocusSessionCreate
from app.domain.productivity.service import ProductivityService

router = APIRouter(prefix="/productivity", tags=["Productivity"])

@router.get("/focus-sessions", response_model=list[FocusSessionResponse])
def get_sessions(
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = ProductivityService(db)
    return svc.get_sessions(user.id)

@router.post("/focus-sessions", response_model=FocusSessionResponse, status_code=status.HTTP_201_CREATED)
def log_session(
    req: FocusSessionCreate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = ProductivityService(db)
    return svc.log_session(user.id, req)
