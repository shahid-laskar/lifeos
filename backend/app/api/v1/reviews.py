from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.domain.user.entities import UserRecord
from app.domain.review.models import WeeklyReviewResponse, WeeklyReviewCreate
from app.domain.review.service import ReviewService

router = APIRouter(prefix="/reviews", tags=["Reviews"])

@router.get("/weekly", response_model=list[WeeklyReviewResponse])
def get_reviews(
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = ReviewService(db)
    return svc.get_reviews(user.id)

@router.get("/weekly/current", response_model=WeeklyReviewResponse | dict)
def get_current_review(
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = ReviewService(db)
    review = svc.get_current_week_review(user.id)
    if review:
        return review
    return {} # Empty object if no review exists

@router.post("/weekly", response_model=WeeklyReviewResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_review(
    req: WeeklyReviewCreate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = ReviewService(db)
    return svc.create_or_update_review(user.id, req)
