from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.domain.user.entities import UserRecord
from app.domain.skills.models import (
    SkillResponse, SkillCreate, SkillUpdate,
    SkillMilestoneResponse, SkillMilestoneUpdate
)
from app.domain.skills.service import SkillService

router = APIRouter(prefix="/skills", tags=["Skills"])

@router.get("", response_model=list[SkillResponse])
def get_skills(
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = SkillService(db)
    return svc.get_skills(user.id)

@router.post("", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
def create_skill(
    req: SkillCreate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = SkillService(db)
    return svc.create_skill(user.id, req)

@router.patch("/{skill_id}", response_model=SkillResponse)
def update_skill(
    skill_id: str,
    req: SkillUpdate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = SkillService(db)
    return svc.update_skill(user.id, skill_id, req)

@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(
    skill_id: str,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = SkillService(db)
    svc.delete_skill(user.id, skill_id)

@router.patch("/milestones/{milestone_id}", response_model=SkillMilestoneResponse)
def update_milestone(
    milestone_id: str,
    req: SkillMilestoneUpdate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = SkillService(db)
    return svc.update_milestone(user.id, milestone_id, req)
