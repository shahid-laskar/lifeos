import re

def insert_after(filepath, target, insert):
    with open(filepath, 'r') as f:
        content = f.read()
    if insert not in content:
        content = content.replace(target, target + "\n" + insert)
        with open(filepath, 'w') as f:
            f.write(content)

# Update habit repository
repo_path = "/opt/lifeos/mlos/backend/app/domain/habit/repository.py"
insert_repo = """
    def log_prayer_journal(self, record: 'PrayerJournalRecord') -> 'PrayerJournalRecord':
        pass

    def get_prayer_journal(self, user_id: str, date: date_type, prayer_name: 'PrayerName') -> 'PrayerJournalRecord' | None:
        pass

    def get_prayer_journals_for_date_range(self, user_id: str, start_date: date_type, end_date: date_type) -> list['PrayerJournalRecord']:
        pass
"""
insert_after(repo_path, "def get_fasting_status(self, user_id: str, date: date_type) -> dict:\n        pass", insert_repo)

# Update sqlalchemy repository
sql_repo_path = "/opt/lifeos/mlos/backend/app/infrastructure/habit_repository_sqlalchemy.py"
insert_sql_repo = """
    def log_prayer_journal(self, record: PrayerJournalRecord) -> PrayerJournalRecord:
        from app.infrastructure.orm_models import PrayerJournalORM
        row = self._session.get(PrayerJournalORM, record.id)
        if row is None:
            row = PrayerJournalORM()
            self._session.add(row)
        
        row.id = record.id
        row.user_id = record.user_id
        row.date = record.date
        row.prayer_name = record.prayer_name.value
        row.khushoo_rating = record.khushoo_rating
        row.notes = record.notes
        row.distractions = record.distractions
        row.created_at = record.created_at
        row.updated_at = record.updated_at
        
        self._session.commit()
        self._session.refresh(row)
        return record

    def get_prayer_journal(self, user_id: str, date: date_type, prayer_name: PrayerName) -> PrayerJournalRecord | None:
        from app.infrastructure.orm_models import PrayerJournalORM
        row = (
            self._session.query(PrayerJournalORM)
            .filter(
                and_(
                    PrayerJournalORM.user_id == user_id,
                    PrayerJournalORM.date == date,
                    PrayerJournalORM.prayer_name == prayer_name.value,
                )
            )
            .first()
        )
        if not row:
            return None
        return PrayerJournalRecord(
            id=row.id,
            user_id=row.user_id,
            date=row.date,
            prayer_name=PrayerName(row.prayer_name),
            khushoo_rating=row.khushoo_rating,
            notes=row.notes,
            distractions=row.distractions,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    def get_prayer_journals_for_date_range(self, user_id: str, start_date: date_type, end_date: date_type) -> list[PrayerJournalRecord]:
        from app.infrastructure.orm_models import PrayerJournalORM
        rows = (
            self._session.query(PrayerJournalORM)
            .filter(
                and_(
                    PrayerJournalORM.user_id == user_id,
                    PrayerJournalORM.date >= start_date,
                    PrayerJournalORM.date <= end_date,
                )
            )
            .all()
        )
        return [
            PrayerJournalRecord(
                id=row.id,
                user_id=row.user_id,
                date=row.date,
                prayer_name=PrayerName(row.prayer_name),
                khushoo_rating=row.khushoo_rating,
                notes=row.notes,
                distractions=row.distractions,
                created_at=row.created_at,
                updated_at=row.updated_at,
            ) for row in rows
        ]
"""
insert_after(sql_repo_path, "from app.domain.habit.entities import PrayerLogRecord, PrayerName, PrayerStatus", ", PrayerJournalRecord")
insert_after(sql_repo_path, 'return {"date": str(row.date), "fasting": row.type != "none", "type": row.type}', insert_sql_repo)

# Update habit service
service_path = "/opt/lifeos/mlos/backend/app/domain/habit/service.py"
insert_service = """
    def log_prayer_journal(
        self, user_id: str, date: date_type, prayer_name: PrayerName, khushoo_rating: int, notes: str | None, distractions: str | None
    ) -> PrayerJournalRecord:
        now = datetime.now(timezone.utc)
        existing = self._repository.get_prayer_journal(user_id, date, prayer_name)
        if existing:
            existing.khushoo_rating = khushoo_rating
            existing.notes = notes
            existing.distractions = distractions
            existing.updated_at = now
            return self._repository.log_prayer_journal(existing)

        record = PrayerJournalRecord(
            id=str(uuid.uuid4()),
            user_id=user_id,
            date=date,
            prayer_name=prayer_name,
            khushoo_rating=khushoo_rating,
            notes=notes,
            distractions=distractions,
            created_at=now,
            updated_at=now,
        )
        return self._repository.log_prayer_journal(record)

    def get_prayer_journal(self, user_id: str, date: date_type, prayer_name: PrayerName) -> PrayerJournalRecord | None:
        return self._repository.get_prayer_journal(user_id, date, prayer_name)

    def get_prayer_insights(self, user_id: str, today: date_type) -> PrayerInsightsResponse:
        start_date = today - timedelta(days=29)
        journals = self._repository.get_prayer_journals_for_date_range(user_id, start_date, today)
        
        if not journals:
            return PrayerInsightsResponse(
                average_khushoo=0.0,
                common_distractions=[],
                encouragement="Start journaling your prayers to see insights."
            )
            
        avg_khushoo = sum(j.khushoo_rating for j in journals) / len(journals)
        distractions = []
        for j in journals:
            if j.distractions:
                distractions.extend([d.strip() for d in j.distractions.split(",") if d.strip()])
                
        # Get top 3 distractions
        from collections import Counter
        top_distractions = [d for d, _ in Counter(distractions).most_common(3)]
        
        return PrayerInsightsResponse(
            average_khushoo=round(avg_khushoo, 1),
            common_distractions=top_distractions,
            encouragement="May Allah accept your prayers and grant you khushoo."
        )
"""
insert_after(service_path, "from app.domain.habit.entities import PrayerLogRecord, PrayerName, PrayerStatus", ", PrayerJournalRecord")
insert_after(service_path, "from app.domain.habit.models import ConsistencyMetrics, DailyPrayerStatus", ", PrayerInsightsResponse")
insert_after(service_path, "return self._repository.get_fasting_status(user_id, date)", insert_service)


# Update habits.py API endpoint
api_path = "/opt/lifeos/mlos/backend/app/api/v1/habits.py"
insert_api = """
@router.post("/prayers/journal", response_model=PrayerJournalResponse)
def log_prayer_journal(
    request: PrayerJournalRequest,
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    habit_service: Annotated[HabitService, Depends(get_habit_service)],
    date: date_type | None = Query(None, description="Date of the prayer. Defaults to today in user's timezone.")
) -> PrayerJournalResponse:
    if not current_user.timezone:
        raise HTTPException(status_code=400, detail="User timezone must be set.")
        
    tz = resolve_timezone(current_user.timezone)
    target_date = date or datetime.now(tz).date()

    record = habit_service.log_prayer_journal(
        user_id=current_user.id,
        date=target_date,
        prayer_name=request.prayer_name,
        khushoo_rating=request.khushoo_rating,
        notes=request.notes,
        distractions=request.distractions
    )
    
    return PrayerJournalResponse(
        id=record.id,
        date=record.date,
        prayer_name=record.prayer_name,
        khushoo_rating=record.khushoo_rating,
        notes=record.notes,
        distractions=record.distractions
    )

@router.get("/prayers/journal", response_model=PrayerJournalResponse)
def get_prayer_journal(
    prayer_name: PrayerName,
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    habit_service: Annotated[HabitService, Depends(get_habit_service)],
    date: date_type | None = Query(None, description="Date of the prayer.")
) -> PrayerJournalResponse:
    if not current_user.timezone:
        raise HTTPException(status_code=400, detail="User timezone must be set.")
        
    tz = resolve_timezone(current_user.timezone)
    target_date = date or datetime.now(tz).date()
    
    record = habit_service.get_prayer_journal(current_user.id, target_date, prayer_name)
    if not record:
        raise HTTPException(status_code=404, detail="Journal entry not found.")
        
    return PrayerJournalResponse(
        id=record.id,
        date=record.date,
        prayer_name=record.prayer_name,
        khushoo_rating=record.khushoo_rating,
        notes=record.notes,
        distractions=record.distractions
    )

@router.get("/prayers/insights", response_model=PrayerInsightsResponse)
def get_prayer_insights(
    current_user: Annotated[UserRecord, Depends(get_current_user)],
    habit_service: Annotated[HabitService, Depends(get_habit_service)]
) -> PrayerInsightsResponse:
    if not current_user.timezone:
        raise HTTPException(status_code=400, detail="User timezone must be set.")
        
    tz = resolve_timezone(current_user.timezone)
    today = datetime.now(tz).date()
    
    return habit_service.get_prayer_insights(current_user.id, today)
"""
insert_after(api_path, "from app.domain.habit.entities import PrayerName", "\nfrom app.domain.habit.entities import PrayerName") # Ensure PrayerName is imported if not already... wait, we need to add PrayerJournalRequest, etc.
insert_after(api_path, "    ConsistencyMetrics", ",\n    PrayerJournalRequest,\n    PrayerJournalResponse,\n    PrayerInsightsResponse,\n    PrayerName")

with open(api_path, 'r') as f:
    content = f.read()
if "def log_prayer_journal(" not in content:
    with open(api_path, 'a') as f:
        f.write(insert_api)
