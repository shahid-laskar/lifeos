"""
Integration tests for the /api/v1/prayer/times endpoint.
"""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_prayer_times_endpoint_happy_path():
    payload = {
        "latitude": 24.4667,
        "longitude": 39.6111,
        "date": "2026-05-01",
        "timezone_offset_hours": 3.0,
        "method": "UMM_AL_QURA",
        "asr_method": "STANDARD",
    }
    resp = client.post("/api/v1/prayer/times", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert set(body["times"].keys()) == {
        "fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"
    }
    # every value must look like HH:MM
    for v in body["times"].values():
        assert len(v) == 5 and v[2] == ":"


def test_prayer_times_endpoint_rejects_invalid_latitude():
    payload = {
        "latitude": 200.0,  # out of range
        "longitude": 39.6111,
        "date": "2026-05-01",
        "timezone_offset_hours": 3.0,
    }
    resp = client.post("/api/v1/prayer/times", json=payload)
    assert resp.status_code == 422


def test_prayer_times_endpoint_polar_day_returns_friendly_error():
    payload = {
        "latitude": 69.6492,
        "longitude": 18.9553,
        "date": "2026-06-21",
        "timezone_offset_hours": 2.0,
    }
    resp = client.post("/api/v1/prayer/times", json=payload)
    assert resp.status_code == 422
    detail = resp.json()["detail"]
    assert "polar" in detail["suggested_action"].lower()
    # must not leak a raw Python traceback to the client
    assert "Traceback" not in resp.text
