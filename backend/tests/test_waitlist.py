"""Tests for Phase 12 — waitlist endpoint."""

from httpx import AsyncClient

WAITLIST_BASE = "/api/v1/waitlist"


class TestWaitlist:
    async def test_join_waitlist(self, client: AsyncClient, db_session):
        resp = await client.post(f"{WAITLIST_BASE}/", json={"email": "hello@example.com"})
        assert resp.status_code == 201
        assert "list" in resp.json()["detail"].lower()

    async def test_duplicate_email_is_idempotent(self, client: AsyncClient, db_session):
        await client.post(f"{WAITLIST_BASE}/", json={"email": "dup@example.com"})
        resp = await client.post(f"{WAITLIST_BASE}/", json={"email": "dup@example.com"})
        assert resp.status_code == 201
        assert "already" in resp.json()["detail"].lower()

    async def test_invalid_email_returns_422(self, client: AsyncClient, db_session):
        resp = await client.post(f"{WAITLIST_BASE}/", json={"email": "not-an-email"})
        assert resp.status_code == 422

    async def test_missing_email_returns_422(self, client: AsyncClient, db_session):
        resp = await client.post(f"{WAITLIST_BASE}/", json={})
        assert resp.status_code == 422
