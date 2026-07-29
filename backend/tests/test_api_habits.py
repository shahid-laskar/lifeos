import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.domain.habit.entities import PrayerName, PrayerStatus
from tests.test_api_auth import _register

import uuid
from typing import Generator

@pytest.fixture
def auth_headers(client: TestClient) -> dict:
    email = f"habituser_{uuid.uuid4().hex}@example.com"
    tokens = _register(client, email)
    
    # Set timezone for the user
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    client.patch(
        "/api/v1/users/me/profile",
        json={"timezone": "UTC"},
        headers=headers,
    )
    
    return headers

def test_log_prayer_and_get_status(client: TestClient, auth_headers: dict):
    # Log Fajr
    resp = client.post(
        "/api/v1/habits/prayers/log",
        json={"prayer_name": "fajr", "status": "completed"},
        headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "completed"
    
    # Check status
    resp = client.get("/api/v1/habits/prayers/status", headers=auth_headers)
    assert resp.status_code == 200
    status_data = resp.json()
    assert status_data["fajr"] == "completed"
    assert status_data["dhuhr"] is None
    
    # Update Fajr to missed
    resp = client.post(
        "/api/v1/habits/prayers/log",
        json={"prayer_name": "fajr", "status": "missed"},
        headers=auth_headers
    )
    assert resp.status_code == 200
    
    # Check status
    resp = client.get("/api/v1/habits/prayers/status", headers=auth_headers)
    assert resp.status_code == 200
    status_data = resp.json()
    assert status_data["fajr"] == "missed"

def test_consistency_metrics(client: TestClient, auth_headers: dict):
    # Complete 5 prayers for today
    for prayer in ["fajr", "dhuhr", "asr", "maghrib", "isha"]:
        client.post(
            "/api/v1/habits/prayers/log",
            json={"prayer_name": prayer, "status": "completed"},
            headers=auth_headers
        )
        
    resp = client.get("/api/v1/habits/prayers/consistency", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["days_completed_last_30"] == 1
    assert data["total_prayers_logged_last_30"] == 5
