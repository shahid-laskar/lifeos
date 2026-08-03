from datetime import date as date_type
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.domain.user.entities import UserRecord
from app.domain.task.models import (
    TaskResponse,
    TaskCreate,
    TaskUpdate
)
from app.domain.task.service import TaskService

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("", response_model=list[TaskResponse])
def get_tasks(
    project: str | None = Query(None),
    due_before: date_type | None = Query(None),
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = TaskService(db)
    return svc.get_tasks(user.id, project, due_before)

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    req: TaskCreate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = TaskService(db)
    return svc.create_task(user.id, req)

@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: str,
    req: TaskUpdate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = TaskService(db)
    return svc.update_task(user.id, task_id, req)

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: str,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = TaskService(db)
    svc.delete_task(user.id, task_id)
