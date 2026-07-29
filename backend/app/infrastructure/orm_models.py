"""
SQLAlchemy ORM model for User.

This lives in the infrastructure layer deliberately - app/domain/user/ never
imports from here. Only user_repository_sqlalchemy.py bridges the two,
translating between this ORM row and the framework-agnostic UserRecord
dataclass (app/domain/user/entities.py).
"""
from __future__ import annotations

from datetime import datetime, date as date_type

from sqlalchemy import JSON, Boolean, DateTime, String, Date
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class UserORM(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    preferred_language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    country: Mapped[str | None] = mapped_column(String(2), nullable=True)
    timezone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    latitude: Mapped[float | None] = mapped_column(nullable=True)
    longitude: Mapped[float | None] = mapped_column(nullable=True)
    prayer_calculation_method: Mapped[str | None] = mapped_column(String(32), nullable=True)
    asr_method: Mapped[str | None] = mapped_column(String(16), nullable=True)
    goals: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    terms_accepted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class PrayerLogORM(Base):
    __tablename__ = "prayer_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    date: Mapped[date_type] = mapped_column(Date, index=True, nullable=False)
    prayer_name: Mapped[str] = mapped_column(String(16), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

