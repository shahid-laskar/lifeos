import uuid
import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException

from app.infrastructure.orm_models import LearningPathORM, LearningModuleORM, LearningEnrollmentORM
from app.domain.learning.models import (
    LearningPathResponse,
    LearningModuleResponse,
    LearningEnrollmentResponse,
    PathCreateRequest,
    ModuleCreateRequest
)

class LearningService:
    def __init__(self, db: Session):
        self.db = db

    def list_paths(self) -> list[LearningPathResponse]:
        paths = self.db.execute(select(LearningPathORM)).scalars().all()
        return [
            LearningPathResponse(
                id=p.id,
                title=p.title,
                description=p.description,
                created_at=p.created_at,
                updated_at=p.updated_at
            ) for p in paths
        ]
        
    def get_path(self, path_id: str) -> LearningPathResponse:
        p = self.db.execute(select(LearningPathORM).where(LearningPathORM.id == path_id)).scalar_one_or_none()
        if not p:
            raise HTTPException(status_code=404, detail="Path not found")
            
        modules = self.db.execute(select(LearningModuleORM).where(LearningModuleORM.path_id == path_id).order_by(LearningModuleORM.order)).scalars().all()
        
        return LearningPathResponse(
            id=p.id,
            title=p.title,
            description=p.description,
            created_at=p.created_at,
            updated_at=p.updated_at,
            modules=[
                LearningModuleResponse(
                    id=m.id,
                    path_id=m.path_id,
                    title=m.title,
                    order=m.order,
                    content=m.content,
                    type=m.type,
                    created_at=m.created_at
                ) for m in modules
            ]
        )
        
    def create_path(self, req: PathCreateRequest) -> LearningPathResponse:
        now = datetime.datetime.now(datetime.timezone.utc)
        p = LearningPathORM(
            id=str(uuid.uuid4()),
            title=req.title,
            description=req.description,
            created_at=now,
            updated_at=now
        )
        self.db.add(p)
        self.db.commit()
        self.db.refresh(p)
        
        return LearningPathResponse(
            id=p.id,
            title=p.title,
            description=p.description,
            created_at=p.created_at,
            updated_at=p.updated_at
        )

    def add_module(self, path_id: str, req: ModuleCreateRequest) -> LearningModuleResponse:
        p = self.db.execute(select(LearningPathORM).where(LearningPathORM.id == path_id)).scalar_one_or_none()
        if not p:
            raise HTTPException(status_code=404, detail="Path not found")
            
        now = datetime.datetime.now(datetime.timezone.utc)
        m = LearningModuleORM(
            id=str(uuid.uuid4()),
            path_id=path_id,
            title=req.title,
            order=req.order,
            content=req.content,
            type=req.type,
            created_at=now
        )
        self.db.add(m)
        self.db.commit()
        self.db.refresh(m)
        
        return LearningModuleResponse(
            id=m.id,
            path_id=m.path_id,
            title=m.title,
            order=m.order,
            content=m.content,
            type=m.type,
            created_at=m.created_at
        )

    def enroll(self, user_id: str, path_id: str) -> LearningEnrollmentResponse:
        p = self.db.execute(select(LearningPathORM).where(LearningPathORM.id == path_id)).scalar_one_or_none()
        if not p:
            raise HTTPException(status_code=404, detail="Path not found")
            
        existing = self.db.execute(
            select(LearningEnrollmentORM)
            .where(LearningEnrollmentORM.user_id == user_id, LearningEnrollmentORM.path_id == path_id)
        ).scalar_one_or_none()
        
        if existing:
            return self._build_enrollment_response(existing, p)
            
        now = datetime.datetime.now(datetime.timezone.utc)
        e = LearningEnrollmentORM(
            id=str(uuid.uuid4()),
            user_id=user_id,
            path_id=path_id,
            progress=0.0,
            completed_modules=[],
            created_at=now,
            updated_at=now
        )
        self.db.add(e)
        self.db.commit()
        self.db.refresh(e)
        
        return self._build_enrollment_response(e, p)
        
    def get_enrollments(self, user_id: str) -> list[LearningEnrollmentResponse]:
        enrollments = self.db.execute(
            select(LearningEnrollmentORM).where(LearningEnrollmentORM.user_id == user_id)
        ).scalars().all()
        
        res = []
        for e in enrollments:
            p = self.db.execute(select(LearningPathORM).where(LearningPathORM.id == e.path_id)).scalar_one_or_none()
            res.append(self._build_enrollment_response(e, p))
        return res
        
    def complete_module(self, user_id: str, module_id: str) -> LearningEnrollmentResponse:
        m = self.db.execute(select(LearningModuleORM).where(LearningModuleORM.id == module_id)).scalar_one_or_none()
        if not m:
            raise HTTPException(status_code=404, detail="Module not found")
            
        e = self.db.execute(
            select(LearningEnrollmentORM)
            .where(LearningEnrollmentORM.user_id == user_id, LearningEnrollmentORM.path_id == m.path_id)
        ).scalar_one_or_none()
        
        if not e:
            raise HTTPException(status_code=404, detail="Not enrolled in this path")
            
        completed = list(e.completed_modules)
        if module_id not in completed:
            completed.append(module_id)
            e.completed_modules = completed
            
            # Update progress
            total_modules = self.db.execute(
                select(LearningModuleORM).where(LearningModuleORM.path_id == m.path_id)
            ).scalars().all()
            if total_modules:
                e.progress = len(completed) / len(total_modules)
            
            e.updated_at = datetime.datetime.now(datetime.timezone.utc)
            self.db.commit()
            self.db.refresh(e)
            
        p = self.db.execute(select(LearningPathORM).where(LearningPathORM.id == e.path_id)).scalar_one_or_none()
        return self._build_enrollment_response(e, p)

    def _build_enrollment_response(self, e: LearningEnrollmentORM, p: LearningPathORM | None) -> LearningEnrollmentResponse:
        path_res = None
        if p:
            path_res = LearningPathResponse(
                id=p.id,
                title=p.title,
                description=p.description,
                created_at=p.created_at,
                updated_at=p.updated_at
            )
        return LearningEnrollmentResponse(
            id=e.id,
            user_id=e.user_id,
            path_id=e.path_id,
            progress=e.progress,
            completed_modules=e.completed_modules,
            created_at=e.created_at,
            updated_at=e.updated_at,
            path=path_res
        )
