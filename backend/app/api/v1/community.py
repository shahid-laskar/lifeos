from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
import uuid
from datetime import datetime, timezone

from app.api.deps import get_db, get_current_user
from app.domain.user.entities import UserRecord
from app.infrastructure.orm_models import DonationORM
from app.domain.community.models import (
    DonationResponse, DonationCreate,
    ZakatCalculatorRequest, ZakatCalculatorResponse
)

router = APIRouter(prefix="/community", tags=["community"])

@router.get("/donations", response_model=List[DonationResponse])
def get_donations(
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    donations = db.execute(select(DonationORM).where(DonationORM.user_id == user.id).order_by(DonationORM.date.desc())).scalars().all()
    return donations

@router.post("/donations", response_model=DonationResponse, status_code=status.HTTP_201_CREATED)
def create_donation(
    req: DonationCreate,
    user: UserRecord = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    donation = DonationORM(
        id=str(uuid.uuid4()),
        user_id=user.id,
        donation_type=req.donation_type,
        amount=req.amount,
        date=req.date,
        recipient=req.recipient,
        category=req.category,
        created_at=now,
        updated_at=now
    )
    db.add(donation)
    db.commit()
    db.refresh(donation)
    return donation

@router.post("/zakat-calculator", response_model=ZakatCalculatorResponse)
def calculate_zakat(req: ZakatCalculatorRequest):
    # Simplified Nisab threshold logic for demonstration (in a real app, this should fetch live gold/silver prices)
    NISAB_THRESHOLD = 500.0 # Placeholder
    
    total_assets = req.cash + req.gold_value + req.silver_value + req.investments + req.business_assets
    net_assets = total_assets - req.debts
    
    is_eligible = net_assets >= NISAB_THRESHOLD
    zakat_due = net_assets * 0.025 if is_eligible else 0.0
    
    return ZakatCalculatorResponse(
        total_assets=total_assets,
        net_assets=net_assets,
        zakat_due=zakat_due,
        is_eligible=is_eligible
    )
