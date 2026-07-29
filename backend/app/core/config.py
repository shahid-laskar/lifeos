"""
Application configuration.

Per 060_Backend_Design_Principles.md ("Principle 15 - Automation First" and
Volume 03 configuration guidance): configuration is externalised, never
hard-coded, and environment-aware.
"""
import secrets
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

    # --- Database (ADR-004: SQLite for development) ---
    database_url: str = "sqlite:///./muslim_life_os.db"

    # --- Auth (ADR-004: password + JWT, passkeys/OAuth deferred) ---
    # WARNING: this default is only safe because it is randomly generated
    # per-process in development. Production deployments MUST set
    # MLOS_JWT_SECRET_KEY explicitly via environment/secret manager - see
    # 052_AI_Security.md / 070_Backend_Security.md "Secrets Management".
    jwt_secret_key: str = secrets.token_urlsafe(32)
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30


@lru_cache
def get_settings() -> Settings:
    return Settings()
