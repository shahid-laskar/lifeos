"""
Data governance API tests.

Verifies:
- Data policy endpoint is public.
- My-data endpoint requires authentication.
- Policy includes all expected domains.
- Prohibited engagement metrics are absent from policy.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_data_policy_is_public(client):
    resp = client.get("/api/v1/governance/data-policy")
    assert resp.status_code == 200
    data = resp.json()
    assert "policies" in data
    assert len(data["policies"]) > 0


def test_data_policy_contains_expected_domains(client):
    resp = client.get("/api/v1/governance/data-policy")
    domains = {p["domain"] for p in resp.json()["policies"]}
    assert "prayer_logs" in domains
    assert "ai_conversations" in domains
    assert "family_data" in domains
    assert "operational_logs" in domains


def test_data_policy_has_no_engagement_domains(client):
    resp = client.get("/api/v1/governance/data-policy")
    domains = {p["domain"] for p in resp.json()["policies"]}
    prohibited = {"engagement_score", "piety_score", "worship_performance", "session_duration"}
    assert not domains.intersection(prohibited), "Prohibited telemetry domains found in policy"


def test_my_data_requires_auth(client):
    resp = client.get("/api/v1/governance/my-data")
    assert resp.status_code == 401


def test_my_data_returns_summary(client):
    token = client.post(
        "/api/v1/auth/register",
        json={"email": "gov-user@example.com", "password": "pass-123-word", "terms_accepted": True},
    ).json()["access_token"]

    resp = client.get(
        "/api/v1/governance/my-data",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "user_id" in data
    assert "data_domains" in data
    assert len(data["data_domains"]) > 0
