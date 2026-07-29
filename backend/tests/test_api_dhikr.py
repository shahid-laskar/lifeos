"""
API integration tests for the Dhikr endpoints.
"""
import uuid
from datetime import date as date_type

import pytest
from fastapi.testclient import TestClient

from tests.test_api_auth import _register


@pytest.fixture
def auth_headers(client: TestClient) -> dict:
    email = f"dhikruser_{uuid.uuid4().hex}@example.com"
    tokens = _register(client, email)
    
    # Set timezone for the user
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    client.patch(
        "/api/v1/users/me/profile",
        json={"timezone": "UTC"},
        headers=headers,
    )
    
    return headers


# ── Catalogue endpoints ─────────────────────────────────────────────────────


def test_list_items(client: TestClient) -> None:
    resp = client.get("/api/v1/dhikr/items")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) > 0
    
    # Test filtering
    resp = client.get("/api/v1/dhikr/items?category=morning")
    assert resp.status_code == 200
    filtered_data = resp.json()
    assert len(filtered_data) > 0
    assert all(i["category"] == "morning" for i in filtered_data)


def test_get_item(client: TestClient) -> None:
    resp = client.get("/api/v1/dhikr/items/morning-01")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == "morning-01"
    assert data["category"] == "morning"


def test_get_item_not_found(client: TestClient) -> None:
    resp = client.get("/api/v1/dhikr/items/invalid-id")
    assert resp.status_code == 404


def test_items_require_no_auth(client: TestClient) -> None:
    resp = client.get("/api/v1/dhikr/items")
    assert resp.status_code == 200


# ── Logging endpoints ───────────────────────────────────────────────────────


def test_log_session_and_get_summary(client: TestClient, auth_headers: dict) -> None:
    # Log session
    resp = client.post(
        "/api/v1/dhikr/sessions",
        json={"dhikr_item_id": "morning-01", "count": 1},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["dhikr_item_id"] == "morning-01"
    assert data["count"] == 1
    assert data["category"] == "morning"
    
    # Log another session
    client.post(
        "/api/v1/dhikr/sessions",
        json={"dhikr_item_id": "general-01", "count": 33},
        headers=auth_headers,
    )

    # Get summary
    resp = client.get("/api/v1/dhikr/summary", headers=auth_headers)
    assert resp.status_code == 200
    summary = resp.json()
    assert summary["total_morning"] == 1
    assert summary["total_general"] == 33
    assert summary["total_evening"] == 0


def test_log_session_invalid_item(client: TestClient, auth_headers: dict) -> None:
    resp = client.post(
        "/api/v1/dhikr/sessions",
        json={"dhikr_item_id": "invalid-id", "count": 1},
        headers=auth_headers,
    )
    assert resp.status_code == 422


def test_logging_requires_auth(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/dhikr/sessions",
        json={"dhikr_item_id": "morning-01", "count": 1},
    )
    assert resp.status_code == 401
    
    resp = client.get("/api/v1/dhikr/summary")
    assert resp.status_code == 401
