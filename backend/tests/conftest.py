"""
Test configuration.

Sets an isolated temp-file SQLite database and a fixed test JWT secret
*before* any `app.*` module is imported anywhere in the test session - this
matters because app.core.config.get_settings() is lru_cached and
app.core.db builds its engine at import time from those settings.
"""
import os
import tempfile

_db_fd, _db_path = tempfile.mkstemp(suffix=".db")
os.close(_db_fd)
os.environ["MLOS_DATABASE_URL"] = f"sqlite:///{_db_path}"
os.environ["MLOS_JWT_SECRET_KEY"] = "test-only-secret-never-use-in-production"
# Disable slowapi rate limiting in the test suite so tests that hit auth
# endpoints many times don't trip the per-IP limits.
os.environ["RATELIMIT_ENABLED"] = "0"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.db import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _prepare_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    try:
        os.remove(_db_path)
    except OSError:
        pass


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
