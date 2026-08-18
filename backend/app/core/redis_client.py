"""
Async Redis client for caching per-user vault keys during a session.

The three public functions (set_vault_key, get_vault_key, delete_vault_key)
are top-level so they can be monkeypatched in tests without touching the
Redis connection.
"""

import logging

from redis.asyncio import Redis, from_url

from app.core.config import settings

logger = logging.getLogger(__name__)

_client: Redis | None = None

_VAULT_KEY_PREFIX = "vk:"


def _get_client() -> Redis:
    global _client
    if _client is None:
        _client = from_url(settings.redis_url, decode_responses=False)
    return _client


async def set_vault_key(user_id: int, vault_key: bytes, ttl: int) -> None:
    """Cache a user's vault key with a TTL (seconds)."""
    await _get_client().setex(f"{_VAULT_KEY_PREFIX}{user_id}", ttl, vault_key)


async def get_vault_key(user_id: int) -> bytes | None:
    """Return the cached vault key, or None if expired / not set."""
    return await _get_client().get(f"{_VAULT_KEY_PREFIX}{user_id}")


async def delete_vault_key(user_id: int) -> None:
    """Remove the vault key from cache (called on logout)."""
    await _get_client().delete(f"{_VAULT_KEY_PREFIX}{user_id}")
