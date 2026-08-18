"""
Rate limiter singleton (slowapi).

`limit` is a decorator factory identical to `limiter.limit(...)` when
rate limiting is enabled. When RATE_LIMITING_ENABLED=false (tests, dev),
it is replaced with a no-op decorator so routes are unaffected.
"""

from typing import Callable

from app.core.config import settings


def _noop_limit(limit_string: str) -> Callable:
    """Pass-through decorator — applies no rate limit."""
    def decorator(func: Callable) -> Callable:
        return func
    return decorator


if settings.rate_limiting_enabled:
    from slowapi import Limiter
    from slowapi.util import get_remote_address

    limiter = Limiter(key_func=get_remote_address)
    limit = limiter.limit
else:
    limiter = None  # type: ignore[assignment]
    limit = _noop_limit
