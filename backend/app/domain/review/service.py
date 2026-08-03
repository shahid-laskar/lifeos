import uuid
from datetime import datetime, timezone, date as date_type, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException

from app.infrastructure.orm_models import WeeklyReviewORM
from app.domain.review.models import WeeklyReviewResponse, WeeklyReviewCreate, WeeklyReviewUpdate

class ReviewService:
    def __init__(self, db: Session):
        self.db = db

    def get_current_week_review(self, user_id: str) -> WeeklyReviewResponse | None:
        today = datetime.now(timezone.utc).date()
        week_start = today - timedelta(days=today.weekday())
        
        review = self.db.execute(
            select(WeeklyReviewORM)
            .where(WeeklyReviewORM.user_id == user_id, WeeklyReviewORM.week_start == week_start)
        ).scalar_one_or_none()
        
        if review:
            return self._to_response(review)
        return None
        
    def get_reviews(self, user_id: str) -> list[WeeklyReviewResponse]:
        reviews = self.db.execute(
            select(WeeklyReviewORM).where(WeeklyReviewORM.user_id == user_id).order_by(WeeklyReviewORM.week_start.desc())
        ).scalars().all()
        return [self._to_response(r) for r in reviews]

    def create_or_update_review(self, user_id: str, req: WeeklyReviewCreate) -> WeeklyReviewResponse:
        today = datetime.now(timezone.utc).date()
        week_start = today - timedelta(days=today.weekday())
        now = datetime.now(timezone.utc)
        
        r = self.db.execute(
            select(WeeklyReviewORM)
            .where(WeeklyReviewORM.user_id == user_id, WeeklyReviewORM.week_start == week_start)
        ).scalar_one_or_none()
        
        if r:
            if req.worship_quality is not None: r.worship_quality = req.worship_quality
            if req.task_completion is not None: r.task_completion = req.task_completion
            if req.habit_consistency is not None: r.habit_consistency = req.habit_consistency
            if req.intentions is not None: r.intentions = req.intentions
            r.updated_at = now
        else:
            r = WeeklyReviewORM(
                id=str(uuid.uuid4()),
                user_id=user_id,
                week_start=week_start,
                worship_quality=req.worship_quality,
                task_completion=req.task_completion,
                habit_consistency=req.habit_consistency,
                intentions=req.intentions,
                created_at=now,
                updated_at=now
            )
            self.db.add(r)
            
        self.db.commit()
        self.db.refresh(r)
        return self._to_response(r)

    def _to_response(self, r: WeeklyReviewORM) -> WeeklyReviewResponse:
        return WeeklyReviewResponse(
            id=r.id,
            user_id=r.user_id,
            week_start=r.week_start,
            worship_quality=r.worship_quality,
            task_completion=r.task_completion,
            habit_consistency=r.habit_consistency,
            intentions=r.intentions,
            created_at=r.created_at,
            updated_at=r.updated_at
        )
