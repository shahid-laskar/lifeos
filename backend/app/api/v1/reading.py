from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.domain.user.entities import UserRecord
from app.domain.reading.models import BookResponse, BookCreate, BookUpdate
from app.domain.reading.service import ReadingService

router = APIRouter(prefix="/reading", tags=["Reading"])

@router.get("/books", response_model=list[BookResponse])
def get_books(
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = ReadingService(db)
    return svc.get_books(user.id)

@router.post("/books", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(
    req: BookCreate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = ReadingService(db)
    return svc.create_book(user.id, req)

@router.patch("/books/{book_id}", response_model=BookResponse)
def update_book(
    book_id: str,
    req: BookUpdate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = ReadingService(db)
    return svc.update_book(user.id, book_id, req)

@router.delete("/books/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(
    book_id: str,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = ReadingService(db)
    svc.delete_book(user.id, book_id)
