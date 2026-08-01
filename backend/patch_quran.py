import re

def insert_after(filepath, target, insert):
    with open(filepath, 'r') as f:
        content = f.read()
    if insert not in content:
        content = content.replace(target, target + "\n" + insert)
        with open(filepath, 'w') as f:
            f.write(content)

# Update orm_models.py
orm_models_path = "/opt/lifeos/mlos/backend/app/infrastructure/orm_models.py"
insert_orm = """
class QuranMemorisationORM(Base):
    __tablename__ = "quran_memorisation"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    surah_number: Mapped[int] = mapped_column(nullable=False)
    ayah_number: Mapped[int] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False) # 'memorised', 'review', 'learning'
    last_reviewed: Mapped[date_type] = mapped_column(Date, nullable=True)
    next_review: Mapped[date_type] = mapped_column(Date, nullable=True)
    strength: Mapped[int] = mapped_column(nullable=False, default=0) # SM2-like strength
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
"""
insert_after(orm_models_path, 'class QuranReadingProgressORM(Base):', insert_orm)


# Create memorisation.py in quran domain
memorisation_path = "/opt/lifeos/mlos/backend/app/domain/quran/memorisation.py"
memorisation_content = """
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Optional

@dataclass
class MemorisationRecord:
    id: str
    user_id: str
    surah_number: int
    ayah_number: int
    status: str
    last_reviewed: Optional[date]
    next_review: Optional[date]
    strength: int
    created_at: datetime
    updated_at: datetime

def calculate_next_review(strength: int, current_date: date, quality: int) -> tuple[int, date]:
    # Simplified spaced repetition algorithm
    if quality < 3:
        new_strength = 0
    else:
        new_strength = strength + 1
        
    interval = 1
    if new_strength == 1:
        interval = 1
    elif new_strength == 2:
        interval = 3
    elif new_strength > 2:
        interval = max(3, int(strength * 1.5))
        
    return new_strength, current_date + timedelta(days=interval)
"""
with open(memorisation_path, 'w') as f:
    f.write(memorisation_content)

# Update models.py in quran domain
quran_models_path = "/opt/lifeos/mlos/backend/app/domain/quran/models.py"
insert_quran_models = """
class MemorisationMarkRequest(BaseModel):
    surah_number: int
    ayah_number: int
    quality: int = Field(..., ge=1, le=5) # 1 = forgotten, 5 = perfect

class MemorisationResponse(BaseModel):
    id: str
    surah_number: int
    ayah_number: int
    status: str
    next_review: date_type | None

class TafsirResponse(BaseModel):
    surah_number: int
    ayah_number: int
    source: str
    text: str
"""
insert_after(quran_models_path, "class QuranWeeklySummaryResponse(BaseModel):", "from datetime import date as date_type")
insert_after(quran_models_path, "    active_days_last_7_days: int", insert_quran_models)

# Update quran_repository_sqlalchemy.py
quran_repo_path = "/opt/lifeos/mlos/backend/app/infrastructure/quran_repository_sqlalchemy.py"
insert_quran_repo = """
    def get_memorisation(self, user_id: str, surah_number: int, ayah_number: int) -> MemorisationRecord | None:
        from app.infrastructure.orm_models import QuranMemorisationORM
        row = (
            self._session.query(QuranMemorisationORM)
            .filter(
                and_(
                    QuranMemorisationORM.user_id == user_id,
                    QuranMemorisationORM.surah_number == surah_number,
                    QuranMemorisationORM.ayah_number == ayah_number
                )
            )
            .first()
        )
        if not row:
            return None
        return MemorisationRecord(
            id=row.id,
            user_id=row.user_id,
            surah_number=row.surah_number,
            ayah_number=row.ayah_number,
            status=row.status,
            last_reviewed=row.last_reviewed,
            next_review=row.next_review,
            strength=row.strength,
            created_at=row.created_at,
            updated_at=row.updated_at
        )

    def save_memorisation(self, record: MemorisationRecord) -> MemorisationRecord:
        from app.infrastructure.orm_models import QuranMemorisationORM
        row = self._session.get(QuranMemorisationORM, record.id)
        if not row:
            row = QuranMemorisationORM()
            self._session.add(row)
            
        row.id = record.id
        row.user_id = record.user_id
        row.surah_number = record.surah_number
        row.ayah_number = record.ayah_number
        row.status = record.status
        row.last_reviewed = record.last_reviewed
        row.next_review = record.next_review
        row.strength = record.strength
        row.created_at = record.created_at
        row.updated_at = record.updated_at
        
        self._session.commit()
        return record

    def get_memorisation_review_queue(self, user_id: str, date_until: date_type) -> list[MemorisationRecord]:
        from app.infrastructure.orm_models import QuranMemorisationORM
        rows = (
            self._session.query(QuranMemorisationORM)
            .filter(
                and_(
                    QuranMemorisationORM.user_id == user_id,
                    QuranMemorisationORM.next_review <= date_until,
                    QuranMemorisationORM.status == 'memorised'
                )
            )
            .all()
        )
        return [
            MemorisationRecord(
                id=r.id,
                user_id=r.user_id,
                surah_number=r.surah_number,
                ayah_number=r.ayah_number,
                status=r.status,
                last_reviewed=r.last_reviewed,
                next_review=r.next_review,
                strength=r.strength,
                created_at=r.created_at,
                updated_at=r.updated_at
            ) for r in rows
        ]
"""
insert_after(quran_repo_path, "from app.domain.quran.entities import QuranBookmark, QuranReadingProgress", "from app.domain.quran.memorisation import MemorisationRecord\nfrom datetime import date as date_type")
insert_after(quran_repo_path, "class SqlAlchemyQuranRepository:", insert_quran_repo)

# Update repository.py
repo_path = "/opt/lifeos/mlos/backend/app/domain/quran/repository.py"
insert_repo_quran = """
    def get_memorisation(self, user_id: str, surah_number: int, ayah_number: int) -> 'MemorisationRecord' | None:
        pass
    def save_memorisation(self, record: 'MemorisationRecord') -> 'MemorisationRecord':
        pass
    def get_memorisation_review_queue(self, user_id: str, date_until: date_type) -> list['MemorisationRecord']:
        pass
"""
insert_after(repo_path, "class QuranRepository(Protocol):", "    from datetime import date as date_type\n    from app.domain.quran.memorisation import MemorisationRecord")
insert_after(repo_path, "def get_weekly_summary(self, user_id: str, since: datetime) -> tuple[int, int]:\n        ...", insert_repo_quran)


# Update service.py
service_path = "/opt/lifeos/mlos/backend/app/domain/quran/service.py"
insert_service_quran = """
    def mark_memorisation(self, user_id: str, surah_number: int, ayah_number: int, quality: int, current_date: date_type) -> MemorisationRecord:
        from app.domain.quran.memorisation import MemorisationRecord, calculate_next_review
        import uuid
        from datetime import datetime, timezone
        record = self._repository.get_memorisation(user_id, surah_number, ayah_number)
        now = datetime.now(timezone.utc)
        
        if not record:
            strength, next_review = calculate_next_review(0, current_date, quality)
            record = MemorisationRecord(
                id=str(uuid.uuid4()),
                user_id=user_id,
                surah_number=surah_number,
                ayah_number=ayah_number,
                status="memorised" if quality >= 3 else "learning",
                last_reviewed=current_date,
                next_review=next_review,
                strength=strength,
                created_at=now,
                updated_at=now
            )
        else:
            strength, next_review = calculate_next_review(record.strength, current_date, quality)
            record.strength = strength
            record.next_review = next_review
            record.last_reviewed = current_date
            record.status = "memorised" if quality >= 3 else "learning"
            record.updated_at = now
            
        return self._repository.save_memorisation(record)

    def get_memorisation_review_queue(self, user_id: str, today: date_type) -> list[MemorisationRecord]:
        return self._repository.get_memorisation_review_queue(user_id, today)

    def get_tafsir(self, surah_number: int, ayah_number: int) -> dict:
        # Stub for tafsir data
        return {
            "surah_number": surah_number,
            "ayah_number": ayah_number,
            "source": "Ibn Kathir (Stub)",
            "text": f"Tafsir for Surah {surah_number} Ayah {ayah_number}. This is a stubbed response since actual tafsir dataset is not fully integrated."
        }
"""
insert_after(service_path, "from app.domain.quran.entities import QuranBookmark, QuranReadingProgress", "from app.domain.quran.memorisation import MemorisationRecord\nfrom datetime import date as date_type")
insert_after(service_path, "class QuranService:", insert_service_quran)

# Update quran.py
api_path = "/opt/lifeos/mlos/backend/app/api/v1/quran.py"
insert_api_quran = """
@router.post("/memorisation/mark", response_model=MemorisationResponse)
def mark_memorisation(
    request: MemorisationMarkRequest,
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    quran_service: Annotated[QuranService, Depends(get_quran_service)],
):
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).date()
    record = quran_service.mark_memorisation(
        current_user.id,
        request.surah_number,
        request.ayah_number,
        request.quality,
        now
    )
    return MemorisationResponse(
        id=record.id,
        surah_number=record.surah_number,
        ayah_number=record.ayah_number,
        status=record.status,
        next_review=record.next_review
    )

@router.get("/memorisation/today-review", response_model=list[MemorisationResponse])
def get_today_review(
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    quran_service: Annotated[QuranService, Depends(get_quran_service)],
):
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).date()
    records = quran_service.get_memorisation_review_queue(current_user.id, now)
    return [
        MemorisationResponse(
            id=r.id,
            surah_number=r.surah_number,
            ayah_number=r.ayah_number,
            status=r.status,
            next_review=r.next_review
        ) for r in records
    ]

@router.get("/surahs/{surah_number}/ayahs/{ayah_number}/tafsir", response_model=TafsirResponse)
def get_tafsir(
    surah_number: int,
    ayah_number: int,
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    quran_service: Annotated[QuranService, Depends(get_quran_service)]
):
    res = quran_service.get_tafsir(surah_number, ayah_number)
    return TafsirResponse(**res)
"""
insert_after(api_path, "from app.domain.quran.models import (", "    MemorisationMarkRequest,\n    MemorisationResponse,\n    TafsirResponse,")
insert_after(api_path, "router = APIRouter(prefix=\"/quran\", tags=[\"quran\"])", insert_api_quran)
