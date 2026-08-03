import uuid
from datetime import date as date_type, datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException

from app.infrastructure.orm_models import PlannerDayORM, PlannerTimeBlockORM
from app.domain.planner.models import (
    PlannerDayResponse,
    TimeBlockResponse,
    TimeBlockCreate,
    TimeBlockUpdate
)

class PlannerService:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_day(self, user_id: str, target_date: date_type) -> PlannerDayORM:
        day = self.db.execute(
            select(PlannerDayORM)
            .where(PlannerDayORM.user_id == user_id, PlannerDayORM.date == target_date)
        ).scalar_one_or_none()

        if not day:
            now = datetime.now(timezone.utc)
            day = PlannerDayORM(
                id=str(uuid.uuid4()),
                user_id=user_id,
                date=target_date,
                created_at=now,
                updated_at=now
            )
            self.db.add(day)
            self.db.commit()
            self.db.refresh(day)
        
        return day

    def get_day(self, user_id: str, target_date: date_type) -> PlannerDayResponse:
        day = self.get_or_create_day(user_id, target_date)
        blocks = self.db.execute(
            select(PlannerTimeBlockORM)
            .where(PlannerTimeBlockORM.day_id == day.id)
            .order_by(PlannerTimeBlockORM.start_time.asc())
        ).scalars().all()

        return PlannerDayResponse(
            id=day.id,
            user_id=day.user_id,
            date=day.date,
            created_at=day.created_at,
            updated_at=day.updated_at,
            blocks=[
                TimeBlockResponse(
                    id=b.id,
                    day_id=b.day_id,
                    start_time=b.start_time,
                    end_time=b.end_time,
                    title=b.title,
                    description=b.description,
                    completed=b.completed,
                    created_at=b.created_at,
                    updated_at=b.updated_at
                ) for b in blocks
            ]
        )

    def add_time_block(self, user_id: str, target_date: date_type, req: TimeBlockCreate) -> TimeBlockResponse:
        day = self.get_or_create_day(user_id, target_date)
        
        now = datetime.now(timezone.utc)
        block = PlannerTimeBlockORM(
            id=str(uuid.uuid4()),
            day_id=day.id,
            start_time=req.start_time,
            end_time=req.end_time,
            title=req.title,
            description=req.description,
            completed=req.completed,
            created_at=now,
            updated_at=now
        )
        self.db.add(block)
        self.db.commit()
        self.db.refresh(block)

        return TimeBlockResponse(
            id=block.id,
            day_id=block.day_id,
            start_time=block.start_time,
            end_time=block.end_time,
            title=block.title,
            description=block.description,
            completed=block.completed,
            created_at=block.created_at,
            updated_at=block.updated_at
        )

    def update_time_block(self, user_id: str, block_id: str, req: TimeBlockUpdate) -> TimeBlockResponse:
        block = self.db.execute(
            select(PlannerTimeBlockORM).where(PlannerTimeBlockORM.id == block_id)
        ).scalar_one_or_none()

        if not block:
            raise HTTPException(status_code=404, detail="Time block not found")

        # Verify ownership
        day = self.db.execute(
            select(PlannerDayORM).where(PlannerDayORM.id == block.day_id)
        ).scalar_one_or_none()
        
        if not day or day.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        if req.start_time is not None: block.start_time = req.start_time
        if req.end_time is not None: block.end_time = req.end_time
        if req.title is not None: block.title = req.title
        if req.description is not None: block.description = req.description
        if req.completed is not None: block.completed = req.completed

        block.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(block)

        return TimeBlockResponse(
            id=block.id,
            day_id=block.day_id,
            start_time=block.start_time,
            end_time=block.end_time,
            title=block.title,
            description=block.description,
            completed=block.completed,
            created_at=block.created_at,
            updated_at=block.updated_at
        )

    def delete_time_block(self, user_id: str, block_id: str) -> None:
        block = self.db.execute(
            select(PlannerTimeBlockORM).where(PlannerTimeBlockORM.id == block_id)
        ).scalar_one_or_none()

        if not block:
            raise HTTPException(status_code=404, detail="Time block not found")

        day = self.db.execute(
            select(PlannerDayORM).where(PlannerDayORM.id == block.day_id)
        ).scalar_one_or_none()
        
        if not day or day.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        self.db.delete(block)
        self.db.commit()
