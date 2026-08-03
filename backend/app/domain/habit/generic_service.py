import uuid
from datetime import datetime, timezone, date as date_type, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException

from app.infrastructure.orm_models import GenericHabitORM, HabitCompletionORM
from app.domain.habit.models import GenericHabitResponse, GenericHabitCreate, GenericHabitUpdate

class GenericHabitService:
    def __init__(self, db: Session):
        self.db = db

    def get_habits(self, user_id: str) -> list[GenericHabitResponse]:
        habits = self.db.execute(
            select(GenericHabitORM).where(GenericHabitORM.user_id == user_id).order_by(GenericHabitORM.created_at.asc())
        ).scalars().all()
        return [self._to_response(h) for h in habits]

    def create_habit(self, user_id: str, req: GenericHabitCreate) -> GenericHabitResponse:
        now = datetime.now(timezone.utc)
        h = GenericHabitORM(
            id=str(uuid.uuid4()),
            user_id=user_id,
            name=req.name,
            frequency=req.frequency,
            icon=req.icon,
            category=req.category,
            created_at=now,
            updated_at=now
        )
        self.db.add(h)
        self.db.commit()
        self.db.refresh(h)
        return self._to_response(h)

    def update_habit(self, user_id: str, habit_id: str, req: GenericHabitUpdate) -> GenericHabitResponse:
        h = self.db.execute(select(GenericHabitORM).where(GenericHabitORM.id == habit_id)).scalar_one_or_none()
        if not h or h.user_id != user_id:
            raise HTTPException(status_code=404, detail="Habit not found")

        if req.name is not None: h.name = req.name
        if req.frequency is not None: h.frequency = req.frequency
        if req.icon is not None: h.icon = req.icon
        if req.category is not None: h.category = req.category

        h.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(h)
        return self._to_response(h)

    def delete_habit(self, user_id: str, habit_id: str) -> None:
        h = self.db.execute(select(GenericHabitORM).where(GenericHabitORM.id == habit_id)).scalar_one_or_none()
        if not h or h.user_id != user_id:
            raise HTTPException(status_code=404, detail="Habit not found")
            
        completions = self.db.execute(select(HabitCompletionORM).where(HabitCompletionORM.habit_id == habit_id)).scalars().all()
        for c in completions:
            self.db.delete(c)
            
        self.db.delete(h)
        self.db.commit()

    def toggle_completion(self, user_id: str, habit_id: str, date: date_type) -> GenericHabitResponse:
        h = self.db.execute(select(GenericHabitORM).where(GenericHabitORM.id == habit_id)).scalar_one_or_none()
        if not h or h.user_id != user_id:
            raise HTTPException(status_code=404, detail="Habit not found")
            
        existing = self.db.execute(
            select(HabitCompletionORM).where(HabitCompletionORM.habit_id == habit_id, HabitCompletionORM.completed_date == date)
        ).scalar_one_or_none()
        
        if existing:
            self.db.delete(existing)
        else:
            now = datetime.now(timezone.utc)
            c = HabitCompletionORM(
                id=str(uuid.uuid4()),
                habit_id=habit_id,
                completed_date=date,
                created_at=now
            )
            self.db.add(c)
            
        self.db.commit()
        return self._to_response(h)

    def _to_response(self, h: GenericHabitORM) -> GenericHabitResponse:
        completions = self.db.execute(
            select(HabitCompletionORM).where(HabitCompletionORM.habit_id == h.id).order_by(HabitCompletionORM.completed_date.desc())
        ).scalars().all()
        
        comp_dates = sorted([c.completed_date for c in completions], reverse=True)
        
        today = datetime.now(timezone.utc).date()
        completed_today = today in comp_dates
        
        streak = self._calculate_streak(comp_dates, h.frequency)

        return GenericHabitResponse(
            id=h.id,
            user_id=h.user_id,
            name=h.name,
            frequency=h.frequency,
            icon=h.icon,
            category=h.category,
            streak=streak,
            completed_today=completed_today,
            recent_completions=comp_dates[:90], # last 90 days for density grid
            created_at=h.created_at,
            updated_at=h.updated_at
        )

    def _calculate_streak(self, sorted_dates_desc: list[date_type], frequency: str) -> int:
        if not sorted_dates_desc:
            return 0
            
        streak = 0
        current_date = datetime.now(timezone.utc).date()
        
        # If daily, check consecutive days
        # If weekly, check consecutive weeks (not implementing full logic here, just approx for daily)
        if frequency == "daily":
            # if not completed today or yesterday, streak is 0
            if current_date not in sorted_dates_desc and (current_date - timedelta(days=1)) not in sorted_dates_desc:
                return 0
                
            check_date = sorted_dates_desc[0]
            if check_date < current_date - timedelta(days=1):
                return 0 # most recent is older than yesterday
                
            streak = 1
            for i in range(1, len(sorted_dates_desc)):
                diff = (sorted_dates_desc[i-1] - sorted_dates_desc[i]).days
                if diff == 1:
                    streak += 1
                elif diff == 0:
                    continue # duplicate entry?
                else:
                    break
        else:
            # simplified weekly streak
            streak = len(sorted_dates_desc)
            
        return streak
