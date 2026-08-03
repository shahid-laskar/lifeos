from __future__ import annotations

from pydantic import BaseModel
import datetime

class LearningModuleResponse(BaseModel):
    id: str
    path_id: str
    title: str
    order: int
    content: str
    type: str
    created_at: datetime.datetime

class LearningPathResponse(BaseModel):
    id: str
    title: str
    description: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    modules: list[LearningModuleResponse] | None = None

class LearningEnrollmentResponse(BaseModel):
    id: str
    user_id: str
    path_id: str
    progress: float
    completed_modules: list[str]
    created_at: datetime.datetime
    updated_at: datetime.datetime
    path: LearningPathResponse | None = None

class PathCreateRequest(BaseModel):
    title: str
    description: str

class ModuleCreateRequest(BaseModel):
    title: str
    order: int
    content: str
    type: str

class EnrollRequest(BaseModel):
    path_id: str

class CompleteModuleRequest(BaseModel):
    module_id: str
