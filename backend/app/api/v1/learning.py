from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user
from app.infrastructure.orm_models import UserORM
from app.domain.learning.models import (
    LearningPathResponse,
    LearningModuleResponse,
    LearningEnrollmentResponse,
    PathCreateRequest,
    ModuleCreateRequest,
    EnrollRequest,
    CompleteModuleRequest
)
from app.domain.learning.service import LearningService

router = APIRouter(prefix="/learning", tags=["Learning"])

@router.get("/paths", response_model=list[LearningPathResponse])
def list_paths(db: Session = Depends(get_db)):
    svc = LearningService(db)
    return svc.list_paths()

@router.get("/paths/{path_id}", response_model=LearningPathResponse)
def get_path(path_id: str, db: Session = Depends(get_db)):
    svc = LearningService(db)
    return svc.get_path(path_id)
    
@router.post("/paths", response_model=LearningPathResponse, status_code=201)
def create_path(req: PathCreateRequest, db: Session = Depends(get_db)):
    svc = LearningService(db)
    return svc.create_path(req)

@router.post("/paths/{path_id}/modules", response_model=LearningModuleResponse, status_code=201)
def add_module(path_id: str, req: ModuleCreateRequest, db: Session = Depends(get_db)):
    svc = LearningService(db)
    return svc.add_module(path_id, req)

@router.post("/enrollments", response_model=LearningEnrollmentResponse)
def enroll(req: EnrollRequest, user: UserORM = Depends(get_current_user), db: Session = Depends(get_db)):
    svc = LearningService(db)
    return svc.enroll(user.id, req.path_id)

@router.get("/enrollments", response_model=list[LearningEnrollmentResponse])
def get_enrollments(user: UserORM = Depends(get_current_user), db: Session = Depends(get_db)):
    svc = LearningService(db)
    return svc.get_enrollments(user.id)

@router.post("/enrollments/complete-module", response_model=LearningEnrollmentResponse)
def complete_module(req: CompleteModuleRequest, user: UserORM = Depends(get_current_user), db: Session = Depends(get_db)):
    svc = LearningService(db)
    return svc.complete_module(user.id, req.module_id)
