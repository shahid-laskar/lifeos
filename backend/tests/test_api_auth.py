"""
Integration tests for authentication, profile, and onboarding-status
endpoints - exercised end-to-end through FastAPI's TestClient against a real
(temp file) SQLite database, not mocks.
"""
from fastapi.testclient import TestClient


def _register(client: TestClient, email: str, password: str = "correct-horse-1") -> dict:
    resp = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "terms_accepted": True},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_register_returns_tokens(client: TestClient):
    tokens = _register(client, "layla@example.com")
    assert "access_token" in tokens
    assert "refresh_token" in tokens
    assert tokens["token_type"] == "bearer"


def test_register_rejects_missing_terms_acceptance(client: TestClient):
    resp = client.post(
        "/api/v1/auth/register",
        json={"email": "no-terms@example.com", "password": "correct-horse-1", "terms_accepted": False},
    )
    assert resp.status_code == 422


def test_register_rejects_duplicate_email_without_leaking_which_field(client: TestClient):
    _register(client, "duplicate@example.com")
    resp = client.post(
        "/api/v1/auth/register",
        json={"email": "duplicate@example.com", "password": "another-password-1", "terms_accepted": True},
    )
    assert resp.status_code == 400
    # generic message only - no confirmation of "email already exists"
    assert "already" not in resp.json()["detail"].lower()


def test_login_with_correct_credentials(client: TestClient):
    _register(client, "yusuf@example.com", password="my-secret-pw-1")
    resp = client.post(
        "/api/v1/auth/login", json={"email": "yusuf@example.com", "password": "my-secret-pw-1"}
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_with_wrong_password_fails(client: TestClient):
    _register(client, "maryam@example.com", password="my-secret-pw-1")
    resp = client.post(
        "/api/v1/auth/login", json={"email": "maryam@example.com", "password": "wrong-password"}
    )
    assert resp.status_code == 401


def test_me_requires_authentication(client: TestClient):
    resp = client.get("/api/v1/users/me")
    assert resp.status_code == 401


def test_me_returns_profile_with_valid_token(client: TestClient):
    tokens = _register(client, "ibrahim@example.com")
    resp = client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == "ibrahim@example.com"
    assert body["country"] is None
    assert body["goals"] == []


def test_me_rejects_garbage_token(client: TestClient):
    resp = client.get("/api/v1/users/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert resp.status_code == 401


def test_refresh_issues_new_access_token(client: TestClient):
    tokens = _register(client, "sara@example.com")
    resp = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert resp.status_code == 200
    new_tokens = resp.json()
    assert new_tokens["access_token"] != tokens["access_token"]


def test_refresh_rejects_an_access_token_used_as_refresh_token(client: TestClient):
    """An access token must not work where a refresh token is required -
    proves token-type checking in core/security.py actually functions."""
    tokens = _register(client, "khalid@example.com")
    resp = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["access_token"]})
    assert resp.status_code == 401


def test_progressive_profile_update_and_onboarding_status(client: TestClient):
    tokens = _register(client, "noor@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    # Onboarding status starts fully incomplete.
    status_resp = client.get("/api/v1/users/me/onboarding-status", headers=headers)
    assert status_resp.status_code == 200
    status_body = status_resp.json()
    assert status_body["location_set"] is False
    assert status_body["prayer_preferences_set"] is False
    assert status_body["first_meaningful_outcome_available"] is False

    # Set country + timezone + lat/lon.
    resp = client.patch(
        "/api/v1/users/me/profile",
        json={
            "country": "GB",
            "timezone": "Europe/London",
            "latitude": 51.5074,
            "longitude": -0.1278
        },
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["country"] == "GB"

    status_body = client.get("/api/v1/users/me/onboarding-status", headers=headers).json()
    assert status_body["location_set"] is True
    assert status_body["prayer_preferences_set"] is False  # still not set
    assert status_body["first_meaningful_outcome_available"] is False  # needs both

    # Now set prayer preferences too.
    resp = client.patch(
        "/api/v1/users/me/profile",
        json={"prayer_calculation_method": "MWL", "asr_method": "STANDARD"},
        headers=headers,
    )
    assert resp.status_code == 200

    status_body = client.get("/api/v1/users/me/onboarding-status", headers=headers).json()
    assert status_body["prayer_preferences_set"] is True
    assert status_body["first_meaningful_outcome_available"] is True  # FMO reached

    # Country set earlier must have survived this second, unrelated update.
    profile = client.get("/api/v1/users/me", headers=headers).json()
    assert profile["country"] == "GB"
    assert profile["prayer_calculation_method"] == "MWL"


def test_response_never_includes_engagement_metrics(client: TestClient):
    tokens = _register(client, "hamza@example.com")
    resp = client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )
    forbidden_fields = {"session_duration", "streak", "notifications_opened", "dau", "last_active_at"}
    assert forbidden_fields.isdisjoint(resp.json().keys())
