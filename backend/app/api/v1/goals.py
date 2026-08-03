from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.domain.user.entities import UserRecord
from app.domain.goal.models import (
    GoalResponse,
    GoalCreate,
    GoalUpdate,
    GoalMilestoneResponse,
    GoalMilestoneCreate,
    GoalMilestoneUpdate
)
from app.domain.goal.service import GoalService

router = APIRouter(prefix="/goals", tags=["Goals"])

@router.get("", response_model=list[GoalResponse])
def get_goals(
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = GoalService(db)
    return svc.get_goals(user.id)

@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    req: GoalCreate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = GoalService(db)
    return svc.create_goal(user.id, req)

@router.patch("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: str,
    req: GoalUpdate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = GoalService(db)
    return svc.update_goal(user.id, goal_id, req)

@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: str,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = GoalService(db)
    svc.delete_goal(user.id, goal_id)

@router.post("/{goal_id}/milestones", response_model=GoalMilestoneResponse, status_code=status.HTTP_201_CREATED)
def add_milestone(
    goal_id: str,
    req: GoalMilestoneCreate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = GoalService(db)
    return svc.add_milestone(user.id, goal_id, req)

@router.patch("/milestones/{milestone_id}", response_model=GoalMilestoneResponse)
def update_milestone(
    milestone_id: str,
    req: GoalMilestoneUpdate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = GoalService(db)
    return svc.update_milestone(user.id, milestone_id, req)

@router.delete("/milestones/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_milestone(
    milestone_id: str,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = GoalService(db)
    svc.delete_milestone(user.id, milestone_id)
