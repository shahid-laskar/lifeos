"""
Application configuration.

Per 060_Backend_Design_Principles.md ("Principle 15 - Automation First" and
Volume 03 configuration guidance): configuration is externalised, never
hard-coded, and environment-aware.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="MLOS_")

    app_name: str = "Muslim Life OS API"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"

    # Privacy-by-default (Article 9): no telemetry endpoint is enabled
    # unless explicitly configured. There is deliberately no DAU/session
    # tracking field here - see ADR-003 in docs/decision-log.md.
    enable_diagnostic_logging: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
