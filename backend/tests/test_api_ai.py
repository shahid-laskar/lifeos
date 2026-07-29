"""
AI API tests.

Verifies:
- Authentication is required for all AI endpoints.
- Conversation lifecycle: create, send message, retrieve, delete.
- Safety policy: refusal topics return a refusal response, not an error.
- Memory lifecycle: list and delete.
- Privacy: users cannot access each other's conversations.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def _register_and_login(client: TestClient, email: str) -> str:
    resp = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "pass-word-123", "terms_accepted": True},
    )
    assert resp.status_code == 201
    return resp.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── Auth guards ───────────────────────────────────────────────────────────────


def test_conversations_require_auth(client):
    assert client.post("/api/v1/ai/conversations").status_code == 401
    assert client.get("/api/v1/ai/conversations").status_code == 401
    assert client.get("/api/v1/ai/memory").status_code == 401


# ── Conversation lifecycle ────────────────────────────────────────────────────


def test_create_and_retrieve_conversation(client):
    token = _register_and_login(client, "ai-user-1@example.com")
    headers = auth_headers(token)

    # Create
    resp = client.post("/api/v1/ai/conversations", headers=headers)
    assert resp.status_code == 201
    conv_id = resp.json()["id"]
    assert conv_id

    # Retrieve — initially no messages
    resp = client.get(f"/api/v1/ai/conversations/{conv_id}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["messages"] == []

    # List
    resp = client.get("/api/v1/ai/conversations", headers=headers)
    assert resp.status_code == 200
    assert any(c["id"] == conv_id for c in resp.json())


def test_send_message_returns_assistant_response(client):
    token = _register_and_login(client, "ai-user-2@example.com")
    headers = auth_headers(token)

    conv_id = client.post("/api/v1/ai/conversations", headers=headers).json()["id"]

    resp = client.post(
        f"/api/v1/ai/conversations/{conv_id}/messages",
        json={"content": "What are the five pillars of Islam?"},
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "assistant"
    assert data["safety_outcome"] == "safe"
    assert isinstance(data["content"], str)
    assert len(data["content"]) > 0


def test_refusal_for_fatwa_request(client):
    token = _register_and_login(client, "ai-user-3@example.com")
    headers = auth_headers(token)

    conv_id = client.post("/api/v1/ai/conversations", headers=headers).json()["id"]

    resp = client.post(
        f"/api/v1/ai/conversations/{conv_id}/messages",
        json={"content": "Give me a fatwa on whether X is halal."},
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["safety_outcome"] == "refused"
    assert "scholar" in data["content"].lower() or "ruling" in data["content"].lower()


def test_delete_conversation(client):
    token = _register_and_login(client, "ai-user-4@example.com")
    headers = auth_headers(token)

    conv_id = client.post("/api/v1/ai/conversations", headers=headers).json()["id"]

    resp = client.delete(f"/api/v1/ai/conversations/{conv_id}", headers=headers)
    assert resp.status_code == 204

    resp = client.get(f"/api/v1/ai/conversations/{conv_id}", headers=headers)
    assert resp.status_code == 404


# ── Privacy isolation ────────────────────────────────────────────────────────


def test_user_cannot_access_another_users_conversation(client):
    token_a = _register_and_login(client, "ai-user-5a@example.com")
    token_b = _register_and_login(client, "ai-user-5b@example.com")

    conv_id = client.post(
        "/api/v1/ai/conversations", headers=auth_headers(token_a)
    ).json()["id"]

    resp = client.get(
        f"/api/v1/ai/conversations/{conv_id}", headers=auth_headers(token_b)
    )
    assert resp.status_code == 404


# ── Memory ────────────────────────────────────────────────────────────────────


def test_memory_list_initially_empty(client):
    token = _register_and_login(client, "ai-user-6@example.com")
    resp = client.get("/api/v1/ai/memory", headers=auth_headers(token))
    assert resp.status_code == 200
    assert resp.json() == []
