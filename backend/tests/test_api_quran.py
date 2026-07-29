"""
API integration tests for the Qur'an endpoints.

Uses the FastAPI test client with a real (in-memory SQLite) database,
matching the conftest.py setup used by all other API test files.
"""
import uuid

import pytest
from fastapi.testclient import TestClient

from tests.test_api_auth import _register


@pytest.fixture
def auth_headers(client: TestClient) -> dict:
    email = f"quranuser_{uuid.uuid4().hex}@example.com"
    tokens = _register(client, email)
    return {"Authorization": f"Bearer {tokens['access_token']}"}


# ── Surah endpoints ─────────────────────────────────────────────────────────────


def test_list_surahs_returns_114(client: TestClient) -> None:
    resp = client.get("/api/v1/quran/surahs")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 114
    # Spot check first and last
    assert data[0]["number"] == 1
    assert data[0]["transliterated_name"] == "Al-Fatihah"
    assert data[0]["ayah_count"] == 7
    assert data[113]["number"] == 114
    assert data[113]["transliterated_name"] == "An-Nas"


def test_get_surah_al_baqarah(client: TestClient) -> None:
    resp = client.get("/api/v1/quran/surahs/2")
    assert resp.status_code == 200
    data = resp.json()
    assert data["number"] == 2
    assert data["ayah_count"] == 286
    assert data["revelation_type"] == "Medinan"


def test_get_surah_not_found(client: TestClient) -> None:
    resp = client.get("/api/v1/quran/surahs/115")
    assert resp.status_code == 404


def test_surah_list_requires_no_auth(client: TestClient) -> None:
    """Surah listing is public — no auth header required."""
    resp = client.get("/api/v1/quran/surahs")
    assert resp.status_code == 200


# ── Bookmarks ───────────────────────────────────────────────────────────────────


def test_add_and_list_bookmark(client: TestClient, auth_headers: dict) -> None:
    # Add bookmark
    resp = client.post(
        "/api/v1/quran/bookmarks",
        json={"surah_number": 36, "ayah_number": 1},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["surah_number"] == 36
    assert data["ayah_number"] == 1
    assert data["note"] is None

    # List bookmarks
    resp = client.get("/api/v1/quran/bookmarks", headers=auth_headers)
    assert resp.status_code == 200
    bookmarks = resp.json()
    assert len(bookmarks) == 1
    assert bookmarks[0]["surah_number"] == 36


def test_add_bookmark_with_note(client: TestClient, auth_headers: dict) -> None:
    resp = client.post(
        "/api/v1/quran/bookmarks",
        json={"surah_number": 2, "ayah_number": 255, "note": "Ayat Al-Kursi"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["note"] == "Ayat Al-Kursi"


def test_add_bookmark_invalid_ayah(client: TestClient, auth_headers: dict) -> None:
    # Al-Fatihah has 7 ayahs; ayah 8 is invalid
    resp = client.post(
        "/api/v1/quran/bookmarks",
        json={"surah_number": 1, "ayah_number": 8},
        headers=auth_headers,
    )
    assert resp.status_code == 422


def test_add_bookmark_invalid_surah(client: TestClient, auth_headers: dict) -> None:
    # surah_number=115 fails Pydantic's le=114 constraint before reaching the
    # service, so the response is 422 Unprocessable Entity, not 404.
    resp = client.post(
        "/api/v1/quran/bookmarks",
        json={"surah_number": 115, "ayah_number": 1},
        headers=auth_headers,
    )
    assert resp.status_code == 422



def test_remove_bookmark(client: TestClient, auth_headers: dict) -> None:
    # Add
    client.post(
        "/api/v1/quran/bookmarks",
        json={"surah_number": 18, "ayah_number": 1},
        headers=auth_headers,
    )
    # Remove
    resp = client.delete("/api/v1/quran/bookmarks/18/1", headers=auth_headers)
    assert resp.status_code == 204

    # Confirm gone
    resp = client.get("/api/v1/quran/bookmarks", headers=auth_headers)
    assert resp.json() == []


def test_remove_nonexistent_bookmark_returns_404(
    client: TestClient, auth_headers: dict
) -> None:
    resp = client.delete("/api/v1/quran/bookmarks/1/1", headers=auth_headers)
    assert resp.status_code == 404


def test_bookmarks_require_auth(client: TestClient) -> None:
    resp = client.get("/api/v1/quran/bookmarks")
    assert resp.status_code == 401


# ── Reading progress ─────────────────────────────────────────────────────────────


def test_update_and_get_reading_progress(
    client: TestClient, auth_headers: dict
) -> None:
    # Update progress
    resp = client.put(
        "/api/v1/quran/reading-progress",
        json={"surah_number": 18, "last_ayah_number": 10},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["surah_number"] == 18
    assert data["last_ayah_number"] == 10

    # Get progress for that surah
    resp = client.get("/api/v1/quran/reading-progress/18", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["last_ayah_number"] == 10


def test_reading_progress_upserts(client: TestClient, auth_headers: dict) -> None:
    client.put(
        "/api/v1/quran/reading-progress",
        json={"surah_number": 2, "last_ayah_number": 50},
        headers=auth_headers,
    )
    client.put(
        "/api/v1/quran/reading-progress",
        json={"surah_number": 2, "last_ayah_number": 100},
        headers=auth_headers,
    )
    resp = client.get("/api/v1/quran/reading-progress", headers=auth_headers)
    progress = resp.json()
    assert len(progress) == 1
    assert progress[0]["last_ayah_number"] == 100


def test_reading_progress_out_of_range(
    client: TestClient, auth_headers: dict
) -> None:
    resp = client.put(
        "/api/v1/quran/reading-progress",
        json={"surah_number": 1, "last_ayah_number": 99},
        headers=auth_headers,
    )
    assert resp.status_code == 422


def test_get_reading_progress_no_record_returns_404(
    client: TestClient, auth_headers: dict
) -> None:
    resp = client.get("/api/v1/quran/reading-progress/114", headers=auth_headers)
    assert resp.status_code == 404


def test_reading_progress_requires_auth(client: TestClient) -> None:
    resp = client.get("/api/v1/quran/reading-progress")
    assert resp.status_code == 401


def test_get_weekly_reading_summary(client: TestClient, auth_headers: dict) -> None:
    # Update progress for multiple surahs
    client.put(
        "/api/v1/quran/reading-progress",
        json={"surah_number": 1, "last_ayah_number": 2},
        headers=auth_headers,
    )
    client.put(
        "/api/v1/quran/reading-progress",
        json={"surah_number": 2, "last_ayah_number": 10},
        headers=auth_headers,
    )
    
    # Check the weekly summary
    resp = client.get("/api/v1/quran/reading-progress/summary/weekly", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["surahs_read_last_7_days"] == 2
    assert data["active_days_last_7_days"] == 1

