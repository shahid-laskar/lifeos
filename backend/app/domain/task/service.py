import uuid
from datetime import datetime, timezone, date as date_type
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException

from app.infrastructure.orm_models import TaskORM
from app.domain.task.models import TaskResponse, TaskCreate, TaskUpdate

class TaskService:
    def __init__(self, db: Session):
        self.db = db

    def get_tasks(self, user_id: str, project: str | None = None, due_before: date_type | None = None) -> list[TaskResponse]:
        query = select(TaskORM).where(TaskORM.user_id == user_id)
        if project:
            query = query.where(TaskORM.project == project)
        if due_before:
            query = query.where(TaskORM.due_date <= due_before)

        query = query.order_by(TaskORM.due_date.asc().nulls_last(), TaskORM.created_at.desc())
        
        tasks = self.db.execute(query).scalars().all()
        return [self._to_response(t) for t in tasks]

    def create_task(self, user_id: str, req: TaskCreate) -> TaskResponse:
        now = datetime.now(timezone.utc)
        t = TaskORM(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title=req.title,
            description=req.description,
            priority=req.priority,
            due_date=req.due_date,
            project=req.project,
            recurrence=req.recurrence,
            niyyah=req.niyyah,
            completed=req.completed,
            created_at=now,
            updated_at=now
        )
        self.db.add(t)
        self.db.commit()
        self.db.refresh(t)
        return self._to_response(t)

    def update_task(self, user_id: str, task_id: str, req: TaskUpdate) -> TaskResponse:
        t = self.db.execute(select(TaskORM).where(TaskORM.id == task_id)).scalar_one_or_none()
        if not t or t.user_id != user_id:
            raise HTTPException(status_code=404, detail="Task not found")

        if req.title is not None: t.title = req.title
        if req.description is not None: t.description = req.description
        if req.priority is not None: t.priority = req.priority
        if req.due_date is not None: t.due_date = req.due_date
        if req.project is not None: t.project = req.project
        if req.recurrence is not None: t.recurrence = req.recurrence
        if req.niyyah is not None: t.niyyah = req.niyyah
        if req.completed is not None: t.completed = req.completed

        t.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(t)
        return self._to_response(t)

    def delete_task(self, user_id: str, task_id: str) -> None:
        t = self.db.execute(select(TaskORM).where(TaskORM.id == task_id)).scalar_one_or_none()
        if not t or t.user_id != user_id:
            raise HTTPException(status_code=404, detail="Task not found")
        self.db.delete(t)
        self.db.commit()

    def _to_response(self, t: TaskORM) -> TaskResponse:
        return TaskResponse(
            id=t.id,
            user_id=t.user_id,
            title=t.title,
            description=t.description,
            priority=t.priority,
            due_date=t.due_date,
            project=t.project,
            recurrence=t.recurrence,
            niyyah=t.niyyah,
            completed=t.completed,
            created_at=t.created_at,
            updated_at=t.updated_at
        )
