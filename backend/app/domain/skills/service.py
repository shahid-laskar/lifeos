import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException

from app.infrastructure.orm_models import SkillORM, SkillMilestoneORM
from app.domain.skills.models import (
    SkillResponse, SkillCreate, SkillUpdate,
    SkillMilestoneResponse, SkillMilestoneCreate, SkillMilestoneUpdate
)

class SkillService:
    def __init__(self, db: Session):
        self.db = db

    def get_skills(self, user_id: str) -> list[SkillResponse]:
        skills = self.db.execute(
            select(SkillORM).where(SkillORM.user_id == user_id).order_by(SkillORM.created_at.desc())
        ).scalars().all()
        return [self._to_response(s) for s in skills]

    def create_skill(self, user_id: str, req: SkillCreate) -> SkillResponse:
        now = datetime.now(timezone.utc)
        s = SkillORM(
            id=str(uuid.uuid4()),
            user_id=user_id,
            name=req.name,
            description=req.description,
            target_date=req.target_date,
            is_completed=req.is_completed,
            created_at=now,
            updated_at=now
        )
        self.db.add(s)
        
        for i, m_req in enumerate(req.milestones):
            m = SkillMilestoneORM(
                id=str(uuid.uuid4()),
                skill_id=s.id,
                title=m_req.title,
                is_completed=m_req.is_completed,
                order_index=m_req.order_index or i,
                created_at=now,
                updated_at=now
            )
            self.db.add(m)
            
        self.db.commit()
        self.db.refresh(s)
        return self._to_response(s)

    def update_skill(self, user_id: str, skill_id: str, req: SkillUpdate) -> SkillResponse:
        s = self.db.execute(select(SkillORM).where(SkillORM.id == skill_id)).scalar_one_or_none()
        if not s or s.user_id != user_id:
            raise HTTPException(status_code=404, detail="Skill not found")

        if req.name is not None: s.name = req.name
        if req.description is not None: s.description = req.description
        if req.target_date is not None: s.target_date = req.target_date
        if req.is_completed is not None: s.is_completed = req.is_completed

        s.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(s)
        return self._to_response(s)

    def delete_skill(self, user_id: str, skill_id: str) -> None:
        s = self.db.execute(select(SkillORM).where(SkillORM.id == skill_id)).scalar_one_or_none()
        if not s or s.user_id != user_id:
            raise HTTPException(status_code=404, detail="Skill not found")
            
        milestones = self.db.execute(select(SkillMilestoneORM).where(SkillMilestoneORM.skill_id == skill_id)).scalars().all()
        for m in milestones:
            self.db.delete(m)
            
        self.db.delete(s)
        self.db.commit()

    def update_milestone(self, user_id: str, milestone_id: str, req: SkillMilestoneUpdate) -> SkillMilestoneResponse:
        m = self.db.execute(select(SkillMilestoneORM).where(SkillMilestoneORM.id == milestone_id)).scalar_one_or_none()
        if not m:
            raise HTTPException(status_code=404, detail="Milestone not found")
            
        s = self.db.execute(select(SkillORM).where(SkillORM.id == m.skill_id)).scalar_one_or_none()
        if not s or s.user_id != user_id:
            raise HTTPException(status_code=404, detail="Skill not found")

        if req.title is not None: m.title = req.title
        if req.is_completed is not None: m.is_completed = req.is_completed
        if req.order_index is not None: m.order_index = req.order_index

        m.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(m)
        
        return SkillMilestoneResponse(
            id=m.id,
            skill_id=m.skill_id,
            title=m.title,
            is_completed=m.is_completed,
            order_index=m.order_index,
            created_at=m.created_at,
            updated_at=m.updated_at
        )

    def _to_response(self, s: SkillORM) -> SkillResponse:
        milestones = self.db.execute(
            select(SkillMilestoneORM).where(SkillMilestoneORM.skill_id == s.id).order_by(SkillMilestoneORM.order_index.asc())
        ).scalars().all()
        
        m_responses = [
            SkillMilestoneResponse(
                id=m.id,
                skill_id=m.skill_id,
                title=m.title,
                is_completed=m.is_completed,
                order_index=m.order_index,
                created_at=m.created_at,
                updated_at=m.updated_at
            ) for m in milestones
        ]

        return SkillResponse(
            id=s.id,
            user_id=s.user_id,
            name=s.name,
            description=s.description,
            target_date=s.target_date,
            is_completed=s.is_completed,
            milestones=m_responses,
            created_at=s.created_at,
            updated_at=s.updated_at
        )
