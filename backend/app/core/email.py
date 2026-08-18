"""
Transactional email via Resend (https://resend.com).

If RESEND_API_KEY is not set the email body is logged to console —
this makes development and testing work without an email service.
"""

import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_verification_email(email: str, username: str, token: str) -> None:
    """Send an email-verification link to the user."""
    link = f"{settings.app_base_url}/verify-email?token={token}"
    await _send(
        to=email,
        subject="Verify your Vault email address",
        html=(
            f"<p>Hi {username},</p>"
            f"<p>Click the link below to verify your email address:</p>"
            f"<p><a href='{link}'>{link}</a></p>"
            f"<p>This link expires in 24 hours. If you didn't sign up, ignore this email.</p>"
        ),
    )


async def send_password_reset_email(email: str, username: str, token: str) -> None:
    """Send a password-reset link to the user."""
    link = f"{settings.app_base_url}/reset-password?token={token}"
    await _send(
        to=email,
        subject="Reset your Vault password",
        html=(
            f"<p>Hi {username},</p>"
            f"<p>Click the link below to reset your password:</p>"
            f"<p><a href='{link}'>{link}</a></p>"
            f"<p>This link expires in 1 hour. If you didn't request a reset, ignore this email.</p>"
        ),
    )


async def _send(to: str, subject: str, html: str) -> None:
    if not settings.resend_api_key:
        # Dev mode: log the email body instead of sending it
        logger.info("[EMAIL DEV] To: %s | Subject: %s\n%s", to, subject, html)
        return

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": settings.email_from,
                "to": [to],
                "subject": subject,
                "html": html,
            },
        )
        if resp.status_code not in (200, 201):
            logger.error("Failed to send email to %s: %s", to, resp.text)
