import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException

from app.infrastructure.orm_models import BookORM
from app.domain.reading.models import BookResponse, BookCreate, BookUpdate

class ReadingService:
    def __init__(self, db: Session):
        self.db = db

    def get_books(self, user_id: str) -> list[BookResponse]:
        books = self.db.execute(
            select(BookORM).where(BookORM.user_id == user_id).order_by(BookORM.created_at.desc())
        ).scalars().all()
        return [self._to_response(b) for b in books]

    def create_book(self, user_id: str, req: BookCreate) -> BookResponse:
        now = datetime.now(timezone.utc)
        b = BookORM(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title=req.title,
            author=req.author,
            category=req.category,
            total_pages=req.total_pages,
            current_page=req.current_page,
            status=req.status,
            notes=req.notes,
            created_at=now,
            updated_at=now
        )
        self.db.add(b)
        self.db.commit()
        self.db.refresh(b)
        return self._to_response(b)

    def update_book(self, user_id: str, book_id: str, req: BookUpdate) -> BookResponse:
        b = self.db.execute(select(BookORM).where(BookORM.id == book_id)).scalar_one_or_none()
        if not b or b.user_id != user_id:
            raise HTTPException(status_code=404, detail="Book not found")

        if req.title is not None: b.title = req.title
        if req.author is not None: b.author = req.author
        if req.category is not None: b.category = req.category
        if req.total_pages is not None: b.total_pages = req.total_pages
        if req.current_page is not None: b.current_page = req.current_page
        if req.status is not None: b.status = req.status
        if req.notes is not None: b.notes = req.notes

        b.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(b)
        return self._to_response(b)

    def delete_book(self, user_id: str, book_id: str) -> None:
        b = self.db.execute(select(BookORM).where(BookORM.id == book_id)).scalar_one_or_none()
        if not b or b.user_id != user_id:
            raise HTTPException(status_code=404, detail="Book not found")
            
        self.db.delete(b)
        self.db.commit()

    def _to_response(self, b: BookORM) -> BookResponse:
        return BookResponse(
            id=b.id,
            user_id=b.user_id,
            title=b.title,
            author=b.author,
            category=b.category,
            total_pages=b.total_pages,
            current_page=b.current_page,
            status=b.status,
            notes=b.notes,
            created_at=b.created_at,
            updated_at=b.updated_at
        )
