import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException

from app.infrastructure.orm_models import GoalORM, GoalMilestoneORM
from app.domain.goal.models import (
    GoalResponse, GoalCreate, GoalUpdate,
    GoalMilestoneResponse, GoalMilestoneCreate, GoalMilestoneUpdate
)

class GoalService:
    def __init__(self, db: Session):
        self.db = db

    def get_goals(self, user_id: str) -> list[GoalResponse]:
        goals = self.db.execute(
            select(GoalORM).where(GoalORM.user_id == user_id).order_by(GoalORM.created_at.desc())
        ).scalars().all()
        return [self._to_goal_response(g) for g in goals]

    def create_goal(self, user_id: str, req: GoalCreate) -> GoalResponse:
        now = datetime.now(timezone.utc)
        g = GoalORM(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title=req.title,
            category=req.category,
            target_date=req.target_date,
            linked_tasks=req.linked_tasks,
            progress=0.0,
            created_at=now,
            updated_at=now
        )
        self.db.add(g)
        self.db.commit()
        self.db.refresh(g)
        return self._to_goal_response(g)

    def update_goal(self, user_id: str, goal_id: str, req: GoalUpdate) -> GoalResponse:
        g = self.db.execute(select(GoalORM).where(GoalORM.id == goal_id)).scalar_one_or_none()
        if not g or g.user_id != user_id:
            raise HTTPException(status_code=404, detail="Goal not found")

        if req.title is not None: g.title = req.title
        if req.category is not None: g.category = req.category
        if req.target_date is not None: g.target_date = req.target_date
        if req.linked_tasks is not None: g.linked_tasks = req.linked_tasks

        g.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(g)
        return self._to_goal_response(g)

    def delete_goal(self, user_id: str, goal_id: str) -> None:
        g = self.db.execute(select(GoalORM).where(GoalORM.id == goal_id)).scalar_one_or_none()
        if not g or g.user_id != user_id:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        milestones = self.db.execute(select(GoalMilestoneORM).where(GoalMilestoneORM.goal_id == goal_id)).scalars().all()
        for m in milestones:
            self.db.delete(m)
            
        self.db.delete(g)
        self.db.commit()

    def add_milestone(self, user_id: str, goal_id: str, req: GoalMilestoneCreate) -> GoalMilestoneResponse:
        g = self.db.execute(select(GoalORM).where(GoalORM.id == goal_id)).scalar_one_or_none()
        if not g or g.user_id != user_id:
            raise HTTPException(status_code=404, detail="Goal not found")

        now = datetime.now(timezone.utc)
        m = GoalMilestoneORM(
            id=str(uuid.uuid4()),
            goal_id=g.id,
            title=req.title,
            completed=req.completed,
            created_at=now,
            updated_at=now
        )
        self.db.add(m)
        self.db.commit()
        self.db.refresh(m)
        
        self._update_goal_progress(g)
        
        return self._to_milestone_response(m)

    def update_milestone(self, user_id: str, milestone_id: str, req: GoalMilestoneUpdate) -> GoalMilestoneResponse:
        m = self.db.execute(select(GoalMilestoneORM).where(GoalMilestoneORM.id == milestone_id)).scalar_one_or_none()
        if not m:
            raise HTTPException(status_code=404, detail="Milestone not found")
            
        g = self.db.execute(select(GoalORM).where(GoalORM.id == m.goal_id)).scalar_one_or_none()
        if not g or g.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        if req.title is not None: m.title = req.title
        if req.completed is not None: m.completed = req.completed

        m.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(m)
        
        self._update_goal_progress(g)
        
        return self._to_milestone_response(m)

    def delete_milestone(self, user_id: str, milestone_id: str) -> None:
        m = self.db.execute(select(GoalMilestoneORM).where(GoalMilestoneORM.id == milestone_id)).scalar_one_or_none()
        if not m:
            raise HTTPException(status_code=404, detail="Milestone not found")
            
        g = self.db.execute(select(GoalORM).where(GoalORM.id == m.goal_id)).scalar_one_or_none()
        if not g or g.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        self.db.delete(m)
        self.db.commit()
        
        self._update_goal_progress(g)

    def _update_goal_progress(self, g: GoalORM) -> None:
        milestones = self.db.execute(
            select(GoalMilestoneORM).where(GoalMilestoneORM.goal_id == g.id)
        ).scalars().all()
        
        if not milestones:
            g.progress = 0.0
        else:
            completed_count = sum(1 for m in milestones if m.completed)
            g.progress = completed_count / len(milestones)
            
        g.updated_at = datetime.now(timezone.utc)
        self.db.commit()

    def _to_goal_response(self, g: GoalORM) -> GoalResponse:
        milestones = self.db.execute(
            select(GoalMilestoneORM).where(GoalMilestoneORM.goal_id == g.id).order_by(GoalMilestoneORM.created_at.asc())
        ).scalars().all()
        
        return GoalResponse(
            id=g.id,
            user_id=g.user_id,
            title=g.title,
            category=g.category,
            target_date=g.target_date,
            linked_tasks=g.linked_tasks,
            progress=g.progress,
            milestones=[self._to_milestone_response(m) for m in milestones],
            created_at=g.created_at,
            updated_at=g.updated_at
        )
        
    def _to_milestone_response(self, m: GoalMilestoneORM) -> GoalMilestoneResponse:
        return GoalMilestoneResponse(
            id=m.id,
            goal_id=m.goal_id,
            title=m.title,
            completed=m.completed,
            created_at=m.created_at,
            updated_at=m.updated_at
        )
