"""
Billing endpoints — Stripe Checkout, Customer Portal, and Webhooks.

Flow:
  1. Frontend calls POST /billing/checkout with a price_id (and optional org_id).
  2. Backend creates (or reuses) a Stripe customer, creates a Checkout session,
     and returns the hosted URL.  Frontend redirects the user there.
  3. On success Stripe fires a webhook to POST /billing/webhook.
  4. Webhook handler updates user.plan (personal) or org.plan (team).
  5. Frontend calls POST /billing/portal to get a self-service billing portal URL.

When STRIPE_SECRET_KEY is empty (dev mode) all endpoints return a stub 200
response so the rest of the app is still usable without a Stripe account.
"""

import logging

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import Organization, User

logger = logging.getLogger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_PLAN_BY_PRICE: dict[str, str] = {}  # populated lazily from settings


def _price_to_plan(price_id: str) -> str:
    """Map a Stripe price ID to an internal plan name."""
    mapping = {
        settings.stripe_pro_price_id: "pro",
        settings.stripe_team_price_id: "team",
        settings.stripe_team_growth_price_id: "team_growth",
    }
    return mapping.get(price_id, "free")


def _stripe_enabled() -> bool:
    return bool(settings.stripe_secret_key)


def _get_stripe():
    """Return the stripe module with the API key configured."""
    stripe.api_key = settings.stripe_secret_key
    return stripe


async def _get_or_create_customer(
    stripe_mod,
    entity_type: str,  # "user" or "org"
    entity: User | Organization,
    db: AsyncSession,
) -> str:
    """Return the existing Stripe customer ID or create a new one."""
    if entity.stripe_customer_id:
        return entity.stripe_customer_id

    # Determine email for the customer record
    email = entity.email if isinstance(entity, User) else None

    customer = stripe_mod.Customer.create(
        email=email,
        metadata={"entity_type": entity_type, "entity_id": str(entity.id)},
    )
    entity.stripe_customer_id = customer["id"]
    await db.commit()
    return customer["id"]


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class CheckoutRequest(BaseModel):
    price_id: str
    org_id: int | None = None
    success_url: str
    cancel_url: str


class CheckoutResponse(BaseModel):
    url: str


class PortalRequest(BaseModel):
    org_id: int | None = None
    return_url: str


class PortalResponse(BaseModel):
    url: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout_session(
    body: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Checkout session and return the hosted URL."""
    if not _stripe_enabled():
        logger.info("Stripe not configured — returning stub checkout URL")
        return CheckoutResponse(url=body.success_url)

    s = _get_stripe()

    if body.org_id is not None:
        # Team plan — customer attached to org
        result = await db.execute(select(Organization).where(Organization.id == body.org_id))
        org = result.scalar_one_or_none()
        if org is None:
            raise HTTPException(status_code=404, detail="Organization not found")
        if org.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the org owner can manage billing")
        customer_id = await _get_or_create_customer(s, "org", org, db)
        metadata = {"entity_type": "org", "entity_id": str(org.id)}
    else:
        # Personal plan
        customer_id = await _get_or_create_customer(s, "user", current_user, db)
        metadata = {"entity_type": "user", "entity_id": str(current_user.id)}

    session = s.checkout.Session.create(
        customer=customer_id,
        mode="subscription",
        line_items=[{"price": body.price_id, "quantity": 1}],
        success_url=body.success_url,
        cancel_url=body.cancel_url,
        metadata=metadata,
    )
    return CheckoutResponse(url=session["url"])


@router.post("/portal", response_model=PortalResponse)
async def create_billing_portal(
    body: PortalRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Customer Portal session for self-service billing."""
    if not _stripe_enabled():
        return PortalResponse(url=body.return_url)

    s = _get_stripe()

    if body.org_id is not None:
        result = await db.execute(select(Organization).where(Organization.id == body.org_id))
        org = result.scalar_one_or_none()
        if org is None:
            raise HTTPException(status_code=404, detail="Organization not found")
        if org.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the org owner can manage billing")
        customer_id = org.stripe_customer_id
    else:
        customer_id = current_user.stripe_customer_id

    if not customer_id:
        raise HTTPException(status_code=400, detail="No billing account found. Subscribe first.")

    portal = s.billing_portal.Session.create(
        customer=customer_id,
        return_url=body.return_url,
    )
    return PortalResponse(url=portal["url"])


@router.post("/webhook", status_code=200)
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="stripe-signature"),
    db: AsyncSession = Depends(get_db),
):
    """
    Handle Stripe webhook events.

    Supported events:
    - checkout.session.completed
    - customer.subscription.updated
    - customer.subscription.deleted
    """
    if not _stripe_enabled():
        return {"received": True}

    payload = await request.body()
    s = _get_stripe()

    try:
        if settings.stripe_webhook_secret and stripe_signature:
            event = s.Webhook.construct_event(
                payload, stripe_signature, settings.stripe_webhook_secret
            )
        else:
            # Dev mode without signature verification
            import json
            event = s.Event.construct_from(json.loads(payload), s.api_key)
    except (ValueError, stripe.error.SignatureVerificationError) as exc:
        logger.warning("Webhook signature verification failed: %s", exc)
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        await _handle_checkout_completed(data, db)
    elif event_type == "customer.subscription.updated":
        await _handle_subscription_updated(data, db)
    elif event_type == "customer.subscription.deleted":
        await _handle_subscription_deleted(data, db)
    else:
        logger.debug("Unhandled webhook event: %s", event_type)

    return {"received": True}


# ---------------------------------------------------------------------------
# Webhook event handlers
# ---------------------------------------------------------------------------

async def _handle_checkout_completed(data: dict, db: AsyncSession) -> None:
    """Upgrade plan after a successful checkout."""
    metadata = data.get("metadata", {})
    entity_type = metadata.get("entity_type")
    entity_id = metadata.get("entity_id")
    subscription_id = data.get("subscription")

    # Determine plan from the price in the subscription
    s = _get_stripe()
    plan = "free"
    if subscription_id:
        try:
            sub = s.Subscription.retrieve(subscription_id)
            price_id = sub["items"]["data"][0]["price"]["id"]
            plan = _price_to_plan(price_id)
        except Exception as exc:
            logger.error("Failed to retrieve subscription %s: %s", subscription_id, exc)

    if entity_type == "user" and entity_id:
        result = await db.execute(select(User).where(User.id == int(entity_id)))
        user = result.scalar_one_or_none()
        if user:
            user.plan = plan
            await db.commit()
            logger.info("User %s upgraded to plan %s", entity_id, plan)

    elif entity_type == "org" and entity_id:
        result = await db.execute(select(Organization).where(Organization.id == int(entity_id)))
        org = result.scalar_one_or_none()
        if org:
            org.plan = plan
            org.stripe_subscription_id = subscription_id
            await db.commit()
            logger.info("Org %s upgraded to plan %s", entity_id, plan)


async def _handle_subscription_updated(data: dict, db: AsyncSession) -> None:
    """Re-sync plan when a subscription changes (e.g. plan switch, renewal)."""
    subscription_id = data.get("id")
    customer_id = data.get("customer")
    price_id = data["items"]["data"][0]["price"]["id"]
    plan = _price_to_plan(price_id)

    # Try user first, then org
    result = await db.execute(select(User).where(User.stripe_customer_id == customer_id))
    user = result.scalar_one_or_none()
    if user:
        user.plan = plan
        await db.commit()
        logger.info("User %s plan updated to %s (sub %s)", user.id, plan, subscription_id)
        return

    result = await db.execute(select(Organization).where(Organization.stripe_customer_id == customer_id))
    org = result.scalar_one_or_none()
    if org:
        org.plan = plan
        await db.commit()
        logger.info("Org %s plan updated to %s (sub %s)", org.id, plan, subscription_id)


async def _handle_subscription_deleted(data: dict, db: AsyncSession) -> None:
    """Downgrade to free when a subscription is cancelled."""
    customer_id = data.get("customer")

    result = await db.execute(select(User).where(User.stripe_customer_id == customer_id))
    user = result.scalar_one_or_none()
    if user:
        user.plan = "free"
        await db.commit()
        logger.info("User %s downgraded to free (subscription cancelled)", user.id)
        return

    result = await db.execute(select(Organization).where(Organization.stripe_customer_id == customer_id))
    org = result.scalar_one_or_none()
    if org:
        org.plan = "free"
        org.stripe_subscription_id = None
        await db.commit()
        logger.info("Org %s downgraded to free (subscription cancelled)", org.id)
