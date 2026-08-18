"""Integration tests for Phase 10 — developer features.

Covers:
- env label filtering on credentials list
- expiry tracking and /expiring endpoint
- duplicate password detection
- API key CRUD (create, list, revoke)
- API key authentication (read + write scope)
"""

from httpx import AsyncClient

AUTH_BASE = "/api/v1/auth"
CREDS_BASE = "/api/v1/credentials"
KEYS_BASE = "/api/v1/api-keys"


# ---------------------------------------------------------------------------
# env label
# ---------------------------------------------------------------------------

class TestEnvLabel:
    async def test_create_with_env(self, auth_client: AsyncClient, db_session):
        resp = await auth_client.post(f"{CREDS_BASE}/", json={
            "label": "Prod DB", "password": "secret", "env": "prod"
        })
        assert resp.status_code == 201
        assert resp.json()["env"] == "prod"

    async def test_env_defaults_to_global(self, auth_client: AsyncClient, db_session):
        resp = await auth_client.post(f"{CREDS_BASE}/", json={
            "label": "No Env", "password": "secret",
        })
        assert resp.status_code == 201
        assert resp.json()["env"] == "global"

    async def test_filter_by_env(self, auth_client: AsyncClient, db_session):
        await auth_client.post(f"{CREDS_BASE}/", json={"label": "Dev Key", "password": "x", "env": "dev"})
        await auth_client.post(f"{CREDS_BASE}/", json={"label": "Prod Key", "password": "y", "env": "prod"})

        resp = await auth_client.get(f"{CREDS_BASE}/", params={"env": "dev"})
        assert resp.status_code == 200
        items = resp.json()["items"]
        assert len(items) == 1
        assert items[0]["label"] == "Dev Key"

    async def test_filter_all_env_returns_all(self, auth_client: AsyncClient, db_session):
        await auth_client.post(f"{CREDS_BASE}/", json={"label": "A", "password": "x", "env": "dev"})
        await auth_client.post(f"{CREDS_BASE}/", json={"label": "B", "password": "y", "env": "prod"})

        resp = await auth_client.get(f"{CREDS_BASE}/")
        assert len(resp.json()["items"]) == 2


# ---------------------------------------------------------------------------
# Expiry
# ---------------------------------------------------------------------------

class TestExpiry:
    async def test_create_with_expiry(self, auth_client: AsyncClient, db_session):
        resp = await auth_client.post(f"{CREDS_BASE}/", json={
            "label": "Expiring", "password": "x",
            "expires_at": "2026-04-01T00:00:00Z",
        })
        assert resp.status_code == 201
        assert resp.json()["expires_at"] is not None

    async def test_expiring_endpoint_returns_creds_within_window(self, auth_client: AsyncClient, db_session):
        # Create one expiring soon (within 30 days from now=2026-03-08)
        await auth_client.post(f"{CREDS_BASE}/", json={
            "label": "Soon", "password": "x", "expires_at": "2026-03-20T00:00:00Z"
        })
        # Create one far future
        await auth_client.post(f"{CREDS_BASE}/", json={
            "label": "Far", "password": "x", "expires_at": "2030-01-01T00:00:00Z"
        })

        resp = await auth_client.get(f"{CREDS_BASE}/expiring", params={"days": 30})
        assert resp.status_code == 200
        labels = [c["label"] for c in resp.json()]
        assert "Soon" in labels
        assert "Far" not in labels

    async def test_expiring_endpoint_no_creds_returns_empty(self, auth_client: AsyncClient, db_session):
        resp = await auth_client.get(f"{CREDS_BASE}/expiring")
        assert resp.status_code == 200
        assert resp.json() == []


# ---------------------------------------------------------------------------
# Duplicate detection
# ---------------------------------------------------------------------------

class TestDuplicates:
    async def test_no_duplicates_returns_empty(self, auth_client: AsyncClient, db_session):
        await auth_client.post(f"{CREDS_BASE}/", json={"label": "A", "password": "pass1"})
        await auth_client.post(f"{CREDS_BASE}/", json={"label": "B", "password": "pass2"})

        resp = await auth_client.get(f"{CREDS_BASE}/duplicates")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_detects_shared_password(self, auth_client: AsyncClient, db_session):
        same_pw = "reused_password_123"
        await auth_client.post(f"{CREDS_BASE}/", json={"label": "Site A", "password": same_pw})
        await auth_client.post(f"{CREDS_BASE}/", json={"label": "Site B", "password": same_pw})
        await auth_client.post(f"{CREDS_BASE}/", json={"label": "Site C", "password": "unique!"})

        resp = await auth_client.get(f"{CREDS_BASE}/duplicates")
        assert resp.status_code == 200
        groups = resp.json()
        assert len(groups) == 1
        assert len(groups[0]["credential_ids"]) == 2
        assert set(groups[0]["label_hints"]) == {"Site A", "Site B"}


# ---------------------------------------------------------------------------
# API key management
# ---------------------------------------------------------------------------

class TestAPIKeys:
    async def test_create_api_key(self, auth_client: AsyncClient, db_session):
        resp = await auth_client.post(f"{KEYS_BASE}/", json={"name": "Test Key", "scope": "read"})
        assert resp.status_code == 201
        body = resp.json()
        assert body["scope"] == "read"
        assert body["key"].startswith("cmv1_")
        assert "key_prefix" in body
        # Full key only shown on creation
        assert len(body["key"]) > 40

    async def test_list_api_keys(self, auth_client: AsyncClient, db_session):
        await auth_client.post(f"{KEYS_BASE}/", json={"name": "Key 1", "scope": "read"})
        await auth_client.post(f"{KEYS_BASE}/", json={"name": "Key 2", "scope": "write"})

        resp = await auth_client.get(f"{KEYS_BASE}/")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    async def test_revoke_api_key(self, auth_client: AsyncClient, db_session):
        create_resp = await auth_client.post(f"{KEYS_BASE}/", json={"name": "Temp Key", "scope": "read"})
        key_id = create_resp.json()["id"]

        resp = await auth_client.delete(f"{KEYS_BASE}/{key_id}")
        assert resp.status_code == 204

        # Should no longer appear in list
        list_resp = await auth_client.get(f"{KEYS_BASE}/")
        assert not any(k["id"] == key_id for k in list_resp.json())

    async def test_invalid_scope_returns_422(self, auth_client: AsyncClient, db_session):
        resp = await auth_client.post(f"{KEYS_BASE}/", json={"name": "Bad", "scope": "superadmin"})
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# API key authentication
# ---------------------------------------------------------------------------

class TestAPIKeyAuth:
    async def test_read_key_can_list_credentials(self, client: AsyncClient, db_session):
        """A read-scoped API key can list credentials."""
        await client.post(f"{AUTH_BASE}/register", json={
            "username": "alice", "email": "alice@example.com",
            "first_name": "Alice", "last_name": "A", "password": "password123"
        })
        create_resp = await client.post(f"{KEYS_BASE}/", json={"name": "CI Key", "scope": "read"})
        assert create_resp.status_code == 201
        api_key = create_resp.json()["key"]

        # Clear cookie — use API key only
        client.cookies.clear()
        resp = await client.get(
            f"{CREDS_BASE}/",
            headers={"Authorization": f"Bearer {api_key}"},
        )
        assert resp.status_code == 200

    async def test_read_key_cannot_create_credential(self, client: AsyncClient, db_session):
        """A read-scoped API key is rejected for write operations."""
        await client.post(f"{AUTH_BASE}/register", json={
            "username": "alice", "email": "alice@example.com",
            "first_name": "Alice", "last_name": "A", "password": "password123"
        })
        create_resp = await client.post(f"{KEYS_BASE}/", json={"name": "Read Key", "scope": "read"})
        api_key = create_resp.json()["key"]

        client.cookies.clear()
        resp = await client.post(
            f"{CREDS_BASE}/",
            json={"label": "Sneaky", "password": "secret"},
            headers={"Authorization": f"Bearer {api_key}"},
        )
        assert resp.status_code == 403

    async def test_write_key_can_create_credential(self, client: AsyncClient, db_session):
        """A write-scoped API key can create credentials."""
        await client.post(f"{AUTH_BASE}/register", json={
            "username": "alice", "email": "alice@example.com",
            "first_name": "Alice", "last_name": "A", "password": "password123"
        })
        create_resp = await client.post(f"{KEYS_BASE}/", json={"name": "Write Key", "scope": "write"})
        api_key = create_resp.json()["key"]

        client.cookies.clear()
        resp = await client.post(
            f"{CREDS_BASE}/",
            json={"label": "CI Secret", "password": "hunter2", "env": "prod"},
            headers={"Authorization": f"Bearer {api_key}"},
        )
        assert resp.status_code == 201
        assert resp.json()["label"] == "CI Secret"

    async def test_invalid_api_key_returns_401(self, client: AsyncClient, db_session):
        resp = await client.get(
            f"{CREDS_BASE}/",
            headers={"Authorization": "Bearer cmv1_notarealkey1234567890"},
        )
        assert resp.status_code == 401

    async def test_revoked_key_returns_401(self, client: AsyncClient, db_session):
        await client.post(f"{AUTH_BASE}/register", json={
            "username": "alice", "email": "alice@example.com",
            "first_name": "Alice", "last_name": "A", "password": "password123"
        })
        create_resp = await client.post(f"{KEYS_BASE}/", json={"name": "Temp", "scope": "read"})
        body = create_resp.json()
        api_key = body["key"]
        key_id = body["id"]

        await client.delete(f"{KEYS_BASE}/{key_id}")

        client.cookies.clear()
        resp = await client.get(
            f"{CREDS_BASE}/",
            headers={"Authorization": f"Bearer {api_key}"},
        )
        assert resp.status_code == 401
