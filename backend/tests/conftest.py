"""
Shared test fixtures.

Key test-environment overrides (set before any app import):
  - PBKDF2_ITERATIONS=1000  — makes PBKDF2 fast in tests (~1ms vs ~300ms)

Each test function gets:
  - A fresh in-memory SQLite database (fully isolated)
  - An in-memory mock replacing the Redis vault key cache
"""

import os

# Must be set BEFORE any app module is imported so Pydantic Settings picks it up.
os.environ.setdefault("PBKDF2_ITERATIONS", "1000")
os.environ.setdefault("RATE_LIMITING_ENABLED", "false")
os.environ.setdefault("REQUIRE_EMAIL_VERIFICATION", "false")

from unittest.mock import AsyncMock, patch, MagicMock  # noqa: E402

import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.core.database import Base, get_db  # noqa: E402
from main import app  # noqa: E402

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


# ---------------------------------------------------------------------------
# Redis mock — in-memory dict replacing the three redis_client functions
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(autouse=True)
async def mock_email_sends():
    """Suppress all outgoing emails in tests."""
    with (
        patch("app.core.email.send_verification_email", new_callable=AsyncMock),
        patch("app.core.email.send_password_reset_email", new_callable=AsyncMock),
        patch("app.api.v1.auth.send_verification_email", new_callable=AsyncMock),
        patch("app.api.v1.auth.send_password_reset_email", new_callable=AsyncMock),
    ):
        yield


@pytest_asyncio.fixture(autouse=True)
async def mock_redis_cache():
    """
    Replace Redis vault key cache with an in-memory dict for every test.
    autouse=True means every test gets this automatically.
    """
    vault_keys: dict[int, bytes] = {}

    async def _set(user_id: int, vault_key: bytes, ttl: int) -> None:
        vault_keys[user_id] = vault_key

    async def _get(user_id: int) -> bytes | None:
        return vault_keys.get(user_id)

    async def _delete(user_id: int) -> None:
        vault_keys.pop(user_id, None)

    with (
        patch("app.core.redis_client.set_vault_key", side_effect=_set),
        patch("app.core.redis_client.get_vault_key", side_effect=_get),
        patch("app.core.redis_client.delete_vault_key", side_effect=_delete),
        # deps.py imports redis_client as a module reference — patch there too
        patch("app.core.deps.redis_client.set_vault_key", side_effect=_set),
        patch("app.core.deps.redis_client.get_vault_key", side_effect=_get),
        patch("app.core.deps.redis_client.delete_vault_key", side_effect=_delete),
    ):
        yield


# ---------------------------------------------------------------------------
# Base client — fresh in-memory DB per test, no auth cookie
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def client(db_session):
    """Unauthenticated AsyncClient sharing the same in-memory database as db_session."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def db_session():
    """Raw AsyncSession for direct DB inspection in tests. Shared with the `client` fixture."""
    engine = create_async_engine(
        TEST_DB_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestSession = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async def override_get_db():
        async with TestSession() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with TestSession() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


# ---------------------------------------------------------------------------
# Authenticated client — registers a test user, cookie is set automatically
# ---------------------------------------------------------------------------

TEST_USER = {
    "username": "testuser",
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User",
    "password": "testpass123",
}


@pytest_asyncio.fixture
async def auth_client(client: AsyncClient, db_session: AsyncSession) -> AsyncClient:
    """AsyncClient with a valid auth cookie (test user registered + logged in)."""
    resp = await client.post("/api/v1/auth/register", json=TEST_USER)
    assert resp.status_code == 201, resp.text
    return client
