"""
Plan enforcement dependencies and limits.

Personal plan (user.plan): free → pro
Org plan (org.plan):       free → team → team_growth

Free tier hard limits (per user):
  - 100 credentials maximum
"""

from fastapi import Depends, HTTPException

from app.core.deps import get_current_user
from app.models.models import User

FREE_CREDENTIAL_LIMIT = 100

# Higher index = more permissions
_PLAN_RANK: dict[str, int] = {
    "free": 0,
    "pro": 1,
    "team": 2,
    "team_growth": 3,
}


def _plan_gte(user_plan: str, minimum_plan: str) -> bool:
    return _PLAN_RANK.get(user_plan, 0) >= _PLAN_RANK.get(minimum_plan, 99)


def require_personal_plan(minimum_plan: str):
    """
    Dependency factory — raises 402 if the current user's personal plan is
    below `minimum_plan`.

    Usage::

        @router.get("/pro-only")
        async def endpoint(_: None = Depends(require_personal_plan("pro"))):
            ...
    """
    async def _dep(current_user: User = Depends(get_current_user)) -> None:
        if not _plan_gte(current_user.plan, minimum_plan):
            raise HTTPException(
                status_code=402,
                detail=f"This feature requires the {minimum_plan} plan. Please upgrade.",
            )

    return _dep
