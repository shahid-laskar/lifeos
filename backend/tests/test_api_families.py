"""
Family API tests.

Verifies:
- Authentication required for all endpoints.
- Family CRUD lifecycle.
- Invitation flow: owner invites, invited user accepts.
- Authorization: only owner can invite/remove; members can remove themselves.
- Privacy: non-members cannot retrieve family data.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def _register(client: TestClient, email: str) -> str:
    resp = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "pass-word-123", "terms_accepted": True},
    )
    assert resp.status_code == 201
    return resp.json()["access_token"]


def h(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── Auth guards ───────────────────────────────────────────────────────────────


def test_family_endpoints_require_auth(client):
    assert client.post("/api/v1/families", json={"name": "x"}).status_code == 401
    assert client.get("/api/v1/families").status_code == 401


# ── Family lifecycle ──────────────────────────────────────────────────────────


def test_create_and_list_family(client):
    token = _register(client, "family-1@example.com")
    resp = client.post("/api/v1/families", json={"name": "Al-Rashid Family"}, headers=h(token))
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Al-Rashid Family"
    assert len(data["members"]) == 1
    assert data["members"][0]["role"] == "owner"

    resp = client.get("/api/v1/families", headers=h(token))
    assert resp.status_code == 200
    assert any(f["name"] == "Al-Rashid Family" for f in resp.json())


# ── Invitation and acceptance ─────────────────────────────────────────────────


def test_owner_can_invite_and_member_can_accept(client):
    owner_token = _register(client, "family-owner-1@example.com")
    member_token = _register(client, "family-member-1@example.com")

    # Create family
    family_id = client.post(
        "/api/v1/families", json={"name": "Invite Test Family"}, headers=h(owner_token)
    ).json()["id"]

    # Owner invites
    resp = client.post(
        f"/api/v1/families/{family_id}/invitations",
        json={"email": "family-member-1@example.com"},
        headers=h(owner_token),
    )
    assert resp.status_code == 201
    inv_id = resp.json()["id"]

    # Member accepts
    resp = client.post(
        f"/api/v1/families/invitations/{inv_id}/accept",
        json={"email": "family-member-1@example.com"},
        headers=h(member_token),
    )
    assert resp.status_code == 200
    members = resp.json()["members"]
    assert len(members) == 2
    roles = {m["role"] for m in members}
    assert "owner" in roles and "adult" in roles


def test_non_owner_cannot_invite(client):
    owner_token = _register(client, "family-owner-2@example.com")
    member_token = _register(client, "family-member-2@example.com")

    family_id = client.post(
        "/api/v1/families", json={"name": "Perm Test Family"}, headers=h(owner_token)
    ).json()["id"]

    # Add member first
    inv_id = client.post(
        f"/api/v1/families/{family_id}/invitations",
        json={"email": "family-member-2@example.com"},
        headers=h(owner_token),
    ).json()["id"]
    client.post(
        f"/api/v1/families/invitations/{inv_id}/accept",
        json={"email": "family-member-2@example.com"},
        headers=h(member_token),
    )

    # Member tries to invite a third party — must be rejected
    resp = client.post(
        f"/api/v1/families/{family_id}/invitations",
        json={"email": "outsider@example.com"},
        headers=h(member_token),
    )
    assert resp.status_code == 403


# ── Remove member ─────────────────────────────────────────────────────────────


def test_member_can_remove_themselves(client):
    owner_token = _register(client, "family-owner-3@example.com")
    member_token = _register(client, "family-member-3@example.com")

    family_id = client.post(
        "/api/v1/families", json={"name": "Self-Remove Family"}, headers=h(owner_token)
    ).json()["id"]

    inv_id = client.post(
        f"/api/v1/families/{family_id}/invitations",
        json={"email": "family-member-3@example.com"},
        headers=h(owner_token),
    ).json()["id"]

    member_user_id = client.post(
        f"/api/v1/families/invitations/{inv_id}/accept",
        json={"email": "family-member-3@example.com"},
        headers=h(member_token),
    ).json()["members"][-1]["user_id"]

    resp = client.delete(
        f"/api/v1/families/{family_id}/members/{member_user_id}",
        headers=h(member_token),
    )
    assert resp.status_code == 204


# ── Privacy isolation ─────────────────────────────────────────────────────────


def test_non_member_cannot_retrieve_family(client):
    owner_token = _register(client, "family-owner-4@example.com")
    outsider_token = _register(client, "family-outsider-4@example.com")

    family_id = client.post(
        "/api/v1/families", json={"name": "Private Family"}, headers=h(owner_token)
    ).json()["id"]

    # Non-member list should be empty
    resp = client.get("/api/v1/families", headers=h(outsider_token))
    assert resp.status_code == 200
    assert not any(f["id"] == family_id for f in resp.json())
