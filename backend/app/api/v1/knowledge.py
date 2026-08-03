from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import List
import uuid
import json
from datetime import datetime, timezone

from app.api.deps import get_db, get_current_user
from app.domain.user.entities import UserRecord
from app.infrastructure.orm_models import NoteORM, FlashcardDeckORM, FlashcardORM
from app.domain.knowledge.models import (
    NoteResponse, NoteCreate,
    FlashcardDeckResponse, FlashcardDeckCreate,
    FlashcardResponse, FlashcardCreate
)

router = APIRouter(prefix="/knowledge", tags=["knowledge"])

# ── Notes ──────────────────────────────────────────────────────────────

@router.get("/notes", response_model=List[NoteResponse])
def get_notes(
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notes_orm = db.execute(select(NoteORM).where(NoteORM.user_id == user.id).order_by(NoteORM.updated_at.desc())).scalars().all()
    
    result = []
    for note in notes_orm:
        result.append(NoteResponse(
            id=note.id,
            user_id=note.user_id,
            title=note.title,
            content=note.content,
            reference_type=note.reference_type,
            reference_id=note.reference_id,
            tags=json.loads(note.tags) if note.tags else [],
            created_at=note.created_at,
            updated_at=note.updated_at
        ))
    return result

@router.post("/notes", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(
    req: NoteCreate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    note = NoteORM(
        id=str(uuid.uuid4()),
        user_id=user.id,
        title=req.title,
        content=req.content,
        reference_type=req.reference_type,
        reference_id=req.reference_id,
        tags=json.dumps(req.tags) if req.tags else None,
        created_at=now,
        updated_at=now
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    
    return NoteResponse(
        id=note.id,
        user_id=note.user_id,
        title=note.title,
        content=note.content,
        reference_type=note.reference_type,
        reference_id=note.reference_id,
        tags=json.loads(note.tags) if note.tags else [],
        created_at=note.created_at,
        updated_at=note.updated_at
    )

# ── Flashcards ─────────────────────────────────────────────────────────

@router.get("/decks", response_model=List[FlashcardDeckResponse])
def get_decks(
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    decks_orm = db.execute(select(FlashcardDeckORM).where(FlashcardDeckORM.user_id == user.id).order_by(FlashcardDeckORM.created_at.desc())).scalars().all()
    
    result = []
    for deck in decks_orm:
        count = db.scalar(select(func.count(FlashcardORM.id)).where(FlashcardORM.deck_id == deck.id))
        result.append(FlashcardDeckResponse(
            id=deck.id,
            user_id=deck.user_id,
            title=deck.title,
            description=deck.description,
            created_at=deck.created_at,
            updated_at=deck.updated_at,
            cards_count=count or 0
        ))
    return result

@router.post("/decks", response_model=FlashcardDeckResponse, status_code=status.HTTP_201_CREATED)
def create_deck(
    req: FlashcardDeckCreate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    deck = FlashcardDeckORM(
        id=str(uuid.uuid4()),
        user_id=user.id,
        title=req.title,
        description=req.description,
        created_at=now,
        updated_at=now
    )
    db.add(deck)
    db.commit()
    db.refresh(deck)
    
    return FlashcardDeckResponse(
        id=deck.id,
        user_id=deck.user_id,
        title=deck.title,
        description=deck.description,
        created_at=deck.created_at,
        updated_at=deck.updated_at,
        cards_count=0
    )

@router.get("/decks/{deck_id}/cards", response_model=List[FlashcardResponse])
def get_cards_in_deck(
    deck_id: str,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    deck = db.scalar(select(FlashcardDeckORM).where(FlashcardDeckORM.id == deck_id, FlashcardDeckORM.user_id == user.id))
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
        
    cards = db.execute(select(FlashcardORM).where(FlashcardORM.deck_id == deck_id)).scalars().all()
    return cards

@router.post("/cards", response_model=FlashcardResponse, status_code=status.HTTP_201_CREATED)
def create_card(
    req: FlashcardCreate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    deck = db.scalar(select(FlashcardDeckORM).where(FlashcardDeckORM.id == req.deck_id, FlashcardDeckORM.user_id == user.id))
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
        
    now = datetime.now(timezone.utc)
    card = FlashcardORM(
        id=str(uuid.uuid4()),
        deck_id=req.deck_id,
        front=req.front,
        back=req.back,
        created_at=now,
        updated_at=now
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card
