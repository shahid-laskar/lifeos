"""SQLAlchemy implementation of the dua domain repositories."""
from __future__ import annotations

from typing import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.dua.entities import DuaBookmark, DuaBookmarkRepository
from app.infrastructure.orm_models import DuaBookmarkORM


class DuaBookmarkRepositorySqlAlchemy(DuaBookmarkRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    def add(self, bookmark: DuaBookmark) -> DuaBookmark:
        orm = DuaBookmarkORM(
            id=bookmark.id,
            user_id=bookmark.user_id,
            dua_id=bookmark.dua_id,
            created_at=bookmark.created_at,
        )
        self.session.add(orm)
        self.session.flush()
        return bookmark

    def get(self, user_id: str, dua_id: str) -> DuaBookmark | None:
        stmt = select(DuaBookmarkORM).where(
            DuaBookmarkORM.user_id == user_id,
            DuaBookmarkORM.dua_id == dua_id,
        )
        orm = self.session.execute(stmt).scalar_one_or_none()
        if orm is None:
            return None
        return DuaBookmark(
            id=orm.id,
            user_id=orm.user_id,
            dua_id=orm.dua_id,
            created_at=orm.created_at,
        )

    def remove(self, user_id: str, dua_id: str) -> bool:
        stmt = select(DuaBookmarkORM).where(
            DuaBookmarkORM.user_id == user_id,
            DuaBookmarkORM.dua_id == dua_id,
        )
        orm = self.session.execute(stmt).scalar_one_or_none()
        if orm is None:
            return False
        self.session.delete(orm)
        self.session.flush()
        return True

    def list_for_user(self, user_id: str) -> list[DuaBookmark]:
        stmt = (
            select(DuaBookmarkORM)
            .where(DuaBookmarkORM.user_id == user_id)
            .order_by(DuaBookmarkORM.created_at.desc())
        )
        orms: Sequence[DuaBookmarkORM] = self.session.execute(stmt).scalars().all()
        return [
            DuaBookmark(
                id=orm.id,
                user_id=orm.user_id,
                dua_id=orm.dua_id,
                created_at=orm.created_at,
            )
            for orm in orms
        ]
