"""Integration tests for Phase 11 — Billing.

Covers:
- Free tier credential limit (100 cap, 402 on exceed)
- Billing endpoint stubs when Stripe is not configured
- Plan-gate dependency
- Webhook handler (subscription updated / deleted)
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient

AUTH_BASE = "/api/v1/auth"
CREDS_BASE = "/api/v1/credentials"
BILLING_BASE = "/api/v1/billing"

REGISTER_PAYLOAD = {
    "username": "alice",
    "email": "alice@example.com",
    "first_name": "Alice",
    "last_name": "A",
    "password": "password123",
}


# ---------------------------------------------------------------------------
# Free tier credential limit
# ---------------------------------------------------------------------------

class TestFreeTierLimit:
    async def test_under_limit_creates_ok(self, auth_client: AsyncClient, db_session):
        resp = await auth_client.post(f"{CREDS_BASE}/", json={"label": "Test", "password": "x"})
        assert resp.status_code == 201

    async def test_at_limit_returns_402(self, auth_client: AsyncClient, db_session):
        """After 100 credentials, the 101st should return 402."""
        from app.core.plan_gate import FREE_CREDENTIAL_LIMIT
        from app.services import credential_service as svc
        from app.core.security import encrypt_for_user
        from app.models.models import Credential
        from sqlalchemy import select

        # Get user id
        me_resp = await auth_client.get("/api/v1/auth/me")
        user_id = me_resp.json()["id"]

        # Bulk-insert credentials directly to avoid test being slow
        # We need the vault key — get it from Redis mock via a login
        # Instead: patch list_credentials to simulate being at the limit
        with patch("app.api.v1.credentials.svc.list_credentials", new_callable=AsyncMock) as mock_list:
            mock_list.return_value = ([], FREE_CREDENTIAL_LIMIT)

            resp = await auth_client.post(
                f"{CREDS_BASE}/",
                json={"label": "Over limit", "password": "secret"},
            )
            assert resp.status_code == 402
            assert "limit" in resp.json()["detail"].lower()

    async def test_pro_user_not_limited(self, auth_client: AsyncClient, db_session):
        """A user with plan=pro should never hit the 402 cap."""
        from app.core.plan_gate import FREE_CREDENTIAL_LIMIT
        from app.models.models import User
        from sqlalchemy import select

        me_resp = await auth_client.get("/api/v1/auth/me")
        user_id = me_resp.json()["id"]

        # Upgrade user to pro in DB
        result = await db_session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()
        user.plan = "pro"
        await db_session.commit()

        with patch("app.api.v1.credentials.svc.list_credentials", new_callable=AsyncMock) as mock_list:
            mock_list.return_value = ([], FREE_CREDENTIAL_LIMIT)  # at limit

            resp = await auth_client.post(
                f"{CREDS_BASE}/",
                json={"label": "Unlimited", "password": "secret"},
            )
            # The mock returns an empty list — create_credential will be called
            # and succeed (we patch at the right level)
            assert resp.status_code != 402


# ---------------------------------------------------------------------------
# Billing endpoints (Stripe not configured → stub mode)
# ---------------------------------------------------------------------------

class TestBillingStubMode:
    """With no STRIPE_SECRET_KEY configured, endpoints return stub responses."""

    async def test_checkout_stub_returns_success_url(self, auth_client: AsyncClient, db_session):
        resp = await auth_client.post(f"{BILLING_BASE}/checkout", json={
            "price_id": "price_test",
            "success_url": "http://localhost:3000/settings/billing?success=1",
            "cancel_url": "http://localhost:3000/settings/billing",
        })
        assert resp.status_code == 200
        assert resp.json()["url"] == "http://localhost:3000/settings/billing?success=1"

    async def test_portal_stub_returns_return_url(self, auth_client: AsyncClient, db_session):
        resp = await auth_client.post(f"{BILLING_BASE}/portal", json={
            "return_url": "http://localhost:3000/settings/billing",
        })
        assert resp.status_code == 200
        assert resp.json()["url"] == "http://localhost:3000/settings/billing"

    async def test_webhook_stub_returns_received(self, auth_client: AsyncClient, db_session):
        resp = await auth_client.post(f"{BILLING_BASE}/webhook", content=b'{"type":"test"}')
        assert resp.status_code == 200
        assert resp.json()["received"] is True

    async def test_checkout_requires_auth(self, client: AsyncClient, db_session):
        resp = await client.post(f"{BILLING_BASE}/checkout", json={
            "price_id": "price_test",
            "success_url": "http://localhost:3000/ok",
            "cancel_url": "http://localhost:3000/cancel",
        })
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Webhook handler logic (mocked Stripe)
# ---------------------------------------------------------------------------

class TestWebhookHandlers:
    """Test webhook handler logic by calling handlers directly."""

    async def test_subscription_deleted_downgrades_user(self, auth_client: AsyncClient, db_session):
        from app.models.models import User
        from sqlalchemy import select
        from app.api.v1.billing import _handle_subscription_deleted

        me_resp = await auth_client.get("/api/v1/auth/me")
        user_id = me_resp.json()["id"]

        # Set user to pro + fake stripe customer
        result = await db_session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()
        user.plan = "pro"
        user.stripe_customer_id = "cus_test_123"
        await db_session.commit()

        # Simulate subscription deleted webhook
        await _handle_subscription_deleted({"customer": "cus_test_123"}, db_session)

        await db_session.refresh(user)
        assert user.plan == "free"

    async def test_subscription_updated_upgrades_user(self, auth_client: AsyncClient, db_session):
        from app.models.models import User
        from sqlalchemy import select
        from app.api.v1.billing import _handle_subscription_updated
        from app.core.config import settings

        me_resp = await auth_client.get("/api/v1/auth/me")
        user_id = me_resp.json()["id"]

        result = await db_session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()
        user.stripe_customer_id = "cus_test_456"
        await db_session.commit()

        # Build subscription-updated payload with pro price
        payload = {
            "id": "sub_test",
            "customer": "cus_test_456",
            "items": {"data": [{"price": {"id": settings.stripe_pro_price_id or "price_pro"}}]},
        }

        # Patch _price_to_plan to return "pro" for our test price
        with patch("app.api.v1.billing._price_to_plan", return_value="pro"):
            await _handle_subscription_updated(payload, db_session)

        await db_session.refresh(user)
        assert user.plan == "pro"


# ---------------------------------------------------------------------------
# Plan gate
# ---------------------------------------------------------------------------

class TestPlanGate:
    async def test_free_user_cannot_access_pro_feature(self, auth_client: AsyncClient, db_session):
        """Verify require_personal_plan raises 402 for free users."""
        from app.core.plan_gate import require_personal_plan
        from app.core.deps import get_current_user
        from fastapi import FastAPI
        from httpx import ASGITransport, AsyncClient as HxClient

        # Create a tiny test app with a pro-gated endpoint
        test_app = FastAPI()

        @test_app.get("/pro-only")
        async def _pro_only(_: None = __import__('fastapi').Depends(require_personal_plan("pro"))):
            return {"ok": True}

        # Reuse the db override from conftest
        from app.core.database import get_db
        from main import app as main_app
        test_app.dependency_overrides[get_db] = main_app.dependency_overrides.get(get_db, get_db)
        test_app.dependency_overrides[get_current_user] = main_app.dependency_overrides.get(
            get_current_user, get_current_user
        )

        async with HxClient(transport=ASGITransport(test_app), base_url="http://test") as tc:
            # Copy cookies from auth_client
            tc.cookies.update(auth_client.cookies)
            resp = await tc.get("/pro-only")

        assert resp.status_code == 402
        assert "pro" in resp.json()["detail"].lower()
