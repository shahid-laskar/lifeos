"""
Tests for the password reset flow.
"""
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.domain.user.entities import PasswordResetToken, UserRecord
from app.domain.user.service import UserService
from tests.test_api_auth import _register


def test_request_password_reset_success(client: TestClient) -> None:
    # 1. Register a user
    email = "reset_user@example.com"
    _register(client, email)

    # 2. Request reset
    resp = client.post(
        "/api/v1/auth/request-password-reset",
        json={"email": email}
    )
    assert resp.status_code == 200
    assert "password reset link has been sent" in resp.json()["message"]


def test_request_password_reset_unregistered_email_is_silent(client: TestClient) -> None:
    # 1. Request reset for non-existent email
    resp = client.post(
        "/api/v1/auth/request-password-reset",
        json={"email": "nobody@example.com"}
    )
    # 2. Assert response is IDENTICAL to success case (no enumeration)
    assert resp.status_code == 200
    assert "password reset link has been sent" in resp.json()["message"]


def test_reset_password_success(client: TestClient, capsys: pytest.CaptureFixture) -> None:
    # 1. Register
    email = "real_reset@example.com"
    _register(client, email)

    # 2. Request reset
    client.post(
        "/api/v1/auth/request-password-reset",
        json={"email": email}
    )

    # 3. Capture the token from stdout (ConsoleEmailService)
    captured = capsys.readouterr().out
    import re
    # The token is printed between blank lines, after "to complete the reset:"
    match = re.search(r"to complete the reset:\n\n([a-zA-Z0-9_-]+)\n", captured)
    assert match is not None
    token = match.group(1)

    # 4. Use token to reset password
    new_password = "NewSecurePassword123!"
    resp = client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": new_password}
    )
    assert resp.status_code == 200

    # 5. Verify old password no longer works
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "SecurePassword123!"}  # old password from _register
    )
    assert login_resp.status_code == 401

    # 6. Verify new password works
    login_resp2 = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": new_password}
    )
    assert login_resp2.status_code == 200


def test_reset_password_invalid_token(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/auth/reset-password",
        json={"token": "invalid_or_fake_token_string", "new_password": "NewSecurePassword123!"}
    )
    assert resp.status_code == 400
    assert "Invalid or expired reset token" in resp.json()["detail"]


def test_reset_password_token_is_single_use(client: TestClient, capsys: pytest.CaptureFixture) -> None:
    email = "single_use@example.com"
    _register(client, email)

    client.post(
        "/api/v1/auth/request-password-reset",
        json={"email": email}
    )
    
    captured = capsys.readouterr().out
    import re
    match = re.search(r"to complete the reset:\n\n([a-zA-Z0-9_-]+)\n", captured)
    token = match.group(1)

    # First reset works
    resp1 = client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "NewSecurePassword123!"}
    )
    assert resp1.status_code == 200

    # Second reset with same token fails
    resp2 = client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "AnotherPassword456!"}
    )
    assert resp2.status_code == 400
