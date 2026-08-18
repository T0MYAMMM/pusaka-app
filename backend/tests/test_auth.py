"""Integration tests for /api/v1/auth endpoints."""

import os
from unittest.mock import patch

from httpx import AsyncClient

BASE = "/api/v1/auth"

VALID_USER = {
    "username": "alice",
    "email": "alice@example.com",
    "first_name": "Alice",
    "last_name": "Smith",
    "password": "password123",
}


class TestRegister:
    async def test_success_returns_201_with_user(self, client: AsyncClient):
        resp = await client.post(f"{BASE}/register", json=VALID_USER)
        assert resp.status_code == 201
        body = resp.json()
        assert body["username"] == "alice"
        assert body["email"] == "alice@example.com"
        assert "hashed_password" not in body

    async def test_sets_auth_cookie(self, client: AsyncClient):
        resp = await client.post(f"{BASE}/register", json=VALID_USER)
        assert resp.status_code == 201
        assert "access_token" in client.cookies

    async def test_duplicate_username_returns_400(self, client: AsyncClient):
        await client.post(f"{BASE}/register", json=VALID_USER)
        resp = await client.post(f"{BASE}/register", json={**VALID_USER, "email": "other@example.com"})
        assert resp.status_code == 400
        assert "Username" in resp.json()["detail"]

    async def test_duplicate_email_returns_400(self, client: AsyncClient):
        await client.post(f"{BASE}/register", json=VALID_USER)
        resp = await client.post(f"{BASE}/register", json={**VALID_USER, "username": "otheralice"})
        assert resp.status_code == 400
        assert "Email" in resp.json()["detail"]

    async def test_short_password_rejected(self, client: AsyncClient):
        resp = await client.post(f"{BASE}/register", json={**VALID_USER, "password": "short"})
        assert resp.status_code == 422

    async def test_invalid_username_characters_rejected(self, client: AsyncClient):
        resp = await client.post(f"{BASE}/register", json={**VALID_USER, "username": "bad user!"})
        assert resp.status_code == 422


class TestLogin:
    async def test_success_returns_200_with_user(self, client: AsyncClient):
        await client.post(f"{BASE}/register", json=VALID_USER)
        resp = await client.post(f"{BASE}/login", json={"username": "alice", "password": "password123"})
        assert resp.status_code == 200
        assert resp.json()["username"] == "alice"

    async def test_sets_auth_cookie(self, client: AsyncClient):
        await client.post(f"{BASE}/register", json=VALID_USER)
        client.cookies.clear()
        resp = await client.post(f"{BASE}/login", json={"username": "alice", "password": "password123"})
        assert resp.status_code == 200
        assert "access_token" in client.cookies

    async def test_wrong_password_returns_401(self, client: AsyncClient):
        await client.post(f"{BASE}/register", json=VALID_USER)
        resp = await client.post(f"{BASE}/login", json={"username": "alice", "password": "wrongpass"})
        assert resp.status_code == 401

    async def test_unknown_user_returns_401(self, client: AsyncClient):
        resp = await client.post(f"{BASE}/login", json={"username": "nobody", "password": "password123"})
        assert resp.status_code == 401


class TestMe:
    async def test_authenticated_returns_current_user(self, auth_client: AsyncClient):
        resp = await auth_client.get(f"{BASE}/me")
        assert resp.status_code == 200
        assert resp.json()["username"] == "testuser"

    async def test_unauthenticated_returns_401(self, client: AsyncClient):
        resp = await client.get(f"{BASE}/me")
        assert resp.status_code == 401


class TestLogout:
    async def test_success_returns_204(self, auth_client: AsyncClient):
        resp = await auth_client.post(f"{BASE}/logout")
        assert resp.status_code == 204

    async def test_unauthenticated_logout_returns_401(self, client: AsyncClient):
        resp = await client.post(f"{BASE}/logout")
        assert resp.status_code == 401


class TestChangePassword:
    async def test_success(self, auth_client: AsyncClient):
        resp = await auth_client.post(f"{BASE}/change-password", json={
            "current_password": "testpass123",
            "new_password": "newpassword456",
        })
        assert resp.status_code == 200

    async def test_wrong_current_password_returns_400(self, auth_client: AsyncClient):
        resp = await auth_client.post(f"{BASE}/change-password", json={
            "current_password": "wrongpassword",
            "new_password": "newpassword456",
        })
        assert resp.status_code == 400

    async def test_new_password_too_short_returns_422(self, auth_client: AsyncClient):
        resp = await auth_client.post(f"{BASE}/change-password", json={
            "current_password": "testpass123",
            "new_password": "short",
        })
        assert resp.status_code == 422

    async def test_can_login_with_new_password_after_change(self, auth_client: AsyncClient):
        await auth_client.post(f"{BASE}/change-password", json={
            "current_password": "testpass123",
            "new_password": "newpassword456",
        })
        auth_client.cookies.clear()
        resp = await auth_client.post(f"{BASE}/login", json={
            "username": "testuser",
            "password": "newpassword456",
        })
        assert resp.status_code == 200

    async def test_unauthenticated_returns_401(self, client: AsyncClient):
        resp = await client.post(f"{BASE}/change-password", json={
            "current_password": "testpass123",
            "new_password": "newpassword456",
        })
        assert resp.status_code == 401


class TestEmailVerification:
    async def test_verify_email_success(self, client: AsyncClient, db_session):
        """Register a user; extract verification token from DB; verify via endpoint."""
        from app.models.models import User
        from sqlalchemy import select

        resp = await client.post(f"{BASE}/register", json=VALID_USER)
        assert resp.status_code == 201

        await db_session.refresh(await db_session.scalar(select(User).where(User.username == "alice")))
        user = await db_session.scalar(select(User).where(User.username == "alice"))
        assert user is not None
        token = user.email_verification_token

        assert token is not None
        resp = await client.post(f"{BASE}/verify-email", params={"token": token})
        assert resp.status_code == 200
        assert "verified" in resp.json()["detail"].lower()

    async def test_verify_email_invalid_token_returns_400(self, client: AsyncClient, db_session):
        resp = await client.post(f"{BASE}/verify-email", params={"token": "notavalidtoken"})
        assert resp.status_code == 400

    async def test_verify_email_token_consumed_after_verification(self, client: AsyncClient, db_session):
        """Token is cleared after first verification; second call returns 400."""
        from app.models.models import User
        from sqlalchemy import select

        await client.post(f"{BASE}/register", json=VALID_USER)
        user = await db_session.scalar(select(User).where(User.username == "alice"))
        token = user.email_verification_token

        await client.post(f"{BASE}/verify-email", params={"token": token})
        resp = await client.post(f"{BASE}/verify-email", params={"token": token})
        assert resp.status_code == 400

    async def test_resend_verification_success(self, auth_client: AsyncClient, db_session):
        resp = await auth_client.post(f"{BASE}/resend-verification")
        assert resp.status_code == 200

    async def test_resend_verification_already_verified_returns_400(self, client: AsyncClient, db_session):
        """If user is already verified, resend should return 400."""
        from app.models.models import User
        from sqlalchemy import select

        await client.post(f"{BASE}/register", json=VALID_USER)
        user = await db_session.scalar(select(User).where(User.username == "alice"))
        token = user.email_verification_token

        await client.post(f"{BASE}/verify-email", params={"token": token})
        resp = await client.post(f"{BASE}/resend-verification")
        assert resp.status_code == 400

    async def test_login_blocked_when_require_email_verification_enabled(self, client: AsyncClient, db_session):
        """With REQUIRE_EMAIL_VERIFICATION=true, unverified users cannot login."""
        await client.post(f"{BASE}/register", json=VALID_USER)
        client.cookies.clear()

        with patch("app.api.v1.auth.settings.require_email_verification", True):
            resp = await client.post(f"{BASE}/login", json={
                "username": "alice",
                "password": "password123",
            })
        assert resp.status_code == 403


class TestPasswordReset:
    async def test_forgot_password_always_returns_200(self, client: AsyncClient, db_session):
        """Returns 200 for both registered and unregistered emails (no enumeration)."""
        resp = await client.post(f"{BASE}/forgot-password", json={"email": "nobody@example.com"})
        assert resp.status_code == 200

        await client.post(f"{BASE}/register", json=VALID_USER)
        resp = await client.post(f"{BASE}/forgot-password", json={"email": "alice@example.com"})
        assert resp.status_code == 200

    async def test_reset_password_invalid_token_returns_400(self, client: AsyncClient, db_session):
        resp = await client.post(f"{BASE}/reset-password", json={
            "token": "notavalidtoken",
            "new_password": "newpassword123",
        })
        assert resp.status_code == 400

    async def test_reset_password_success(self, client: AsyncClient, db_session):
        """Full flow: register → forgot → reset → login with new password."""
        from app.models.models import User
        from sqlalchemy import select

        await client.post(f"{BASE}/register", json=VALID_USER)
        await client.post(f"{BASE}/forgot-password", json={"email": "alice@example.com"})

        user = await db_session.scalar(select(User).where(User.username == "alice"))
        token = user.password_reset_token
        assert token is not None

        resp = await client.post(f"{BASE}/reset-password", json={
            "token": token,
            "new_password": "brandnewpassword",
        })
        assert resp.status_code == 200

        # Can now login with new password
        client.cookies.clear()
        resp = await client.post(f"{BASE}/login", json={
            "username": "alice",
            "password": "brandnewpassword",
        })
        assert resp.status_code == 200

    async def test_reset_password_too_short_returns_422(self, client: AsyncClient, db_session):
        resp = await client.post(f"{BASE}/reset-password", json={
            "token": "sometoken",
            "new_password": "short",
        })
        assert resp.status_code == 422

    async def test_response_has_is_email_verified_field(self, client: AsyncClient, db_session):
        resp = await client.post(f"{BASE}/register", json=VALID_USER)
        assert resp.status_code == 201
        assert "is_email_verified" in resp.json()
