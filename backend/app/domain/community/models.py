from pydantic import BaseModel
from datetime import date as date_type
from datetime import datetime

class DonationBase(BaseModel):
    donation_type: str
    amount: float
    date: date_type
    recipient: str | None = None
    category: str | None = None

class DonationCreate(DonationBase):
    pass

class DonationResponse(DonationBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

class ZakatCalculatorRequest(BaseModel):
    cash: float = 0
    gold_value: float = 0
    silver_value: float = 0
    investments: float = 0
    business_assets: float = 0
    debts: float = 0

class ZakatCalculatorResponse(BaseModel):
    total_assets: float
    net_assets: float
    zakat_due: float
    is_eligible: bool
