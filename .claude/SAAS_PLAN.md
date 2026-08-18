# SaaS Implementation Plan — PUSAKA

> Built on top of the completed v1 (63/63 checkpoints).
> Target model: **Team Vault for Dev Teams** — free tier → Pro → Team subscription.
> Estimated total: 6–8 focused weeks.

---

## Product Vision

A password and secrets vault designed for developers and small technical teams.
Not another generic password manager — specifically designed for the way devs work:
API keys with environment labels, SSH credentials, TOTP secrets, CLI access, and team sharing with an audit trail.

**Pricing target:**
| Plan | Price | Limits |
|---|---|---|
| Free | $0 | 1 user, 100 credentials, 30-day activity log |
| Pro | $6/month | 1 user, unlimited, full activity log |
| Team | $8/user/month | 2–25 users, shared vaults, RBAC |
| Team Growth | $12/user/month | 26–100 users, SSO-ready, priority support |

---

## Phase 7 — Per-User Encryption (Security Prerequisite)

> **Why first:** The current single `ENCRYPTION_KEY` means every user's vault is protected by the same server secret. A server compromise exposes all vaults. This is the highest trust-risk before any public launch.

**Approach:** Each user gets a unique random vault key, which is itself encrypted by a key derived from the user's password. The server never stores the vault key in plaintext.

```
Registration:
  vault_key    = random_bytes(32)                          # the real encryption key
  wrapping_key = PBKDF2(password, vault_salt, 600_000, SHA-256)
  vault_key_enc = Fernet(wrapping_key).encrypt(vault_key)

Login:
  wrapping_key = PBKDF2(password, vault_salt, 600_000, SHA-256)
  vault_key    = Fernet(wrapping_key).decrypt(vault_key_enc)
  → cache vault_key in Redis with TTL = session lifetime

Password change:
  re-derive new wrapping_key → re-encrypt vault_key → store
  (vault data itself doesn't need re-encryption)
```

| # | Task | Files |
|---|---|---|
| 7.1 | Add `vault_salt` + `vault_key_encrypted` columns to User model | `models/models.py` |
| 7.2 | New Alembic migration | `alembic/versions/` |
| 7.3 | Update `security.py`: `derive_wrapping_key(password, salt)`, `wrap_vault_key()`, `unwrap_vault_key()` | `core/security.py` |
| 7.4 | Update `register` endpoint: generate vault_key + vault_salt, wrap, store | `api/v1/auth.py` |
| 7.5 | Add Redis client (`core/redis.py`): `set_vault_key(user_id, key, ttl)`, `get_vault_key(user_id)` | `core/redis.py` |
| 7.6 | Update `login` endpoint: unwrap vault_key on login, cache in Redis | `api/v1/auth.py` |
| 7.7 | Update `logout` endpoint: delete vault_key from Redis | `api/v1/auth.py` |
| 7.8 | Replace global `encrypt_data`/`decrypt_data` with `encrypt_for_user(vault_key, data)` / `decrypt_for_user(vault_key, data)` | `core/security.py` |
| 7.9 | Update `get_current_user` dep to also resolve vault_key from Redis | `core/deps.py` |
| 7.10 | Update credential_service + note_service to use per-user vault_key | `services/` |
| 7.11 | Add `change_password` endpoint (re-wraps vault_key) | `api/v1/auth.py` |
| 7.12 | Migration script to re-encrypt existing data (one-time, dev use) | `scripts/migrate_encryption.py` |
| 7.13 | Update tests for new encryption model | `tests/` |

**Dependencies to add:**
- `redis[hiredis]` — async Redis client
- Upstash Redis (prod) or local Redis (dev)

---

## Phase 8 — Auth Hardening

> Rate limiting and email flows are required before exposing a public registration endpoint.

| # | Task | Files |
|---|---|---|
| 8.1 | Add `slowapi` rate limiter to FastAPI app | `main.py`, `requirements.txt` |
| 8.2 | Rate limit `/login`: 10 attempts per minute per IP | `api/v1/auth.py` |
| 8.3 | Rate limit `/register`: 5 per hour per IP | `api/v1/auth.py` |
| 8.4 | Add `is_email_verified` + `email_verification_token` + `email_verification_sent_at` to User | `models/models.py` |
| 8.5 | Alembic migration | `alembic/versions/` |
| 8.6 | Add email service (`core/email.py`): `send_verification_email()`, `send_password_reset_email()` via Resend API | `core/email.py` |
| 8.7 | POST `/auth/verify-email?token=` endpoint | `api/v1/auth.py` |
| 8.8 | POST `/auth/resend-verification` endpoint | `api/v1/auth.py` |
| 8.9 | Gate login behind email verification (return 403 with message if unverified) | `api/v1/auth.py` |
| 8.10 | Add `password_reset_token` + `password_reset_expires_at` to User | `models/models.py` |
| 8.11 | POST `/auth/forgot-password` — sends reset email | `api/v1/auth.py` |
| 8.12 | POST `/auth/reset-password` — validates token, updates password, re-wraps vault_key | `api/v1/auth.py` |
| 8.13 | Frontend: email verification banner/page | `frontend/app/(auth)/verify-email/` |
| 8.14 | Frontend: forgot password page | `frontend/app/(auth)/forgot-password/` |
| 8.15 | Frontend: reset password page (token from email link) | `frontend/app/(auth)/reset-password/` |
| 8.16 | Add `RESEND_API_KEY` + `APP_BASE_URL` to settings + `.env.example` | `core/config.py` |
| 8.17 | Tests for rate limiting, email verification flow, password reset flow | `tests/test_auth.py` |

**Dependencies to add:**
- `slowapi` — rate limiting middleware for FastAPI
- `resend` — transactional email (or `httpx` with Resend REST API directly)

---

## Phase 9 — Team & Organization Model

> The feature that converts this from a personal tool to a recurring revenue product.

### Data model additions

```
Organization
  id, name, slug (unique), plan, stripe_customer_id, stripe_subscription_id
  created_at, owner_id

OrganizationMember
  id, org_id, user_id, role (owner/admin/member/viewer)
  invited_email, invite_token, invite_accepted_at, created_at

SharedVault
  id, org_id, name, description
  created_at, created_by

SharedVaultMember
  id, vault_id, user_id, can_write (bool)

SharedCredential    ← credential visible to a SharedVault
  id, vault_id, credential_id

SharedNote          ← note visible to a SharedVault
  id, vault_id, note_id
```

| # | Task | Notes |
|---|---|---|
| 9.1 | Add Organization, OrganizationMember, SharedVault models | `models/models.py` |
| 9.2 | Alembic migration | |
| 9.3 | Organization CRUD endpoints (`/api/v1/orgs`) | create, get, update, delete |
| 9.4 | Member invite endpoint: POST `/orgs/{id}/invite` — sends email with token | |
| 9.5 | Accept invite endpoint: POST `/orgs/accept-invite?token=` | |
| 9.6 | Member list + remove member endpoints | |
| 9.7 | Role update endpoint (owner/admin only) | |
| 9.8 | SharedVault CRUD endpoints (`/api/v1/orgs/{id}/vaults`) | |
| 9.9 | Add credential/note to vault, remove from vault | |
| 9.10 | List vault members endpoint | |
| 9.11 | Vault-scoped credential list endpoint (shows shared creds from org vaults) | |
| 9.12 | RBAC enforcement: decorator/dep that checks org membership + role | `core/rbac.py` |
| 9.13 | Activity log: log all org-level actions with org_id | |
| 9.14 | Frontend: Organization settings page | `/settings/organization` |
| 9.15 | Frontend: Member management UI (invite, list, role badge, remove) | |
| 9.16 | Frontend: Shared Vaults list + vault detail | `/vaults`, `/vaults/[id]` |
| 9.17 | Frontend: Add credential/note to vault from detail page | |
| 9.18 | Frontend: Sidebar section for shared vaults | |
| 9.19 | Tests: org creation, invite flow, RBAC enforcement | |

**Key RBAC rules:**
```
owner  → all actions including billing, delete org, promote members
admin  → manage members, create/delete vaults, add/remove creds from vaults
member → read/write their own credentials, read shared vaults they belong to
viewer → read-only on shared vaults they belong to
```

---

## Phase 10 — Developer-Specific Features

> The competitive moat. No existing product does this well.

| # | Task | Notes |
|---|---|---|
| 10.1 | Environment label on Credential: `env` enum (dev/staging/prod/global) | Model + migration + API |
| 10.2 | Expiry tracking: `expires_at` datetime on Credential | Model + migration |
| 10.3 | Expiry notifications endpoint: `GET /api/v1/credentials/expiring?days=30` | Returns creds expiring soon |
| 10.4 | Secret injection endpoint: `GET /api/v1/orgs/{id}/vaults/{id}/env` | Returns `.env` formatted blob — gated by API key auth (not cookie) |
| 10.5 | API key management for machine auth: `UserAPIKey` model | For CLI + CI/CD |
| 10.6 | `POST /api/v1/api-keys` — generate scoped API key | `read-only` or `write` scope |
| 10.7 | CLI tool (`cm` command): `cm login`, `cm get <label>`, `cm list`, `cm set <label> <value>` | Python Click app, separate package or `backend/cli/` |
| 10.8 | Frontend: environment label filter on credentials list | |
| 10.9 | Frontend: expiry badge (shows "Expires in 14 days" in amber) | |
| 10.10 | Frontend: API key management page | `/profile/api-keys` |
| 10.11 | Duplicate detection: warn when same password is stored in >1 credential | Backend service + frontend warning badge |

---

## Phase 11 — Billing with Stripe

> Gate team features. Revenue starts here.

| # | Task | Notes |
|---|---|---|
| 11.1 | Add Stripe dependency (`stripe`) to requirements | |
| 11.2 | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, `STRIPE_TEAM_PRICE_ID` to settings | |
| 11.3 | Plan enum on Organization: `free / pro / team / team_growth` | Model column |
| 11.4 | `POST /api/v1/billing/checkout` — create Stripe Checkout session | |
| 11.5 | `POST /api/v1/billing/portal` — customer portal URL for self-service billing | |
| 11.6 | `POST /api/v1/billing/webhook` — handle `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` | |
| 11.7 | Plan enforcement middleware: check org plan before allowing team actions | `core/plan_gate.py` |
| 11.8 | Free tier limits: 100 credential hard cap (return 402 on exceeding limit) | `services/credential_service.py` |
| 11.9 | Frontend: upgrade prompt when hitting free tier limits | |
| 11.10 | Frontend: billing settings page (current plan, manage subscription button) | `/settings/billing` |
| 11.11 | Frontend: pricing page or upgrade modal | |

**Plan gates:**
```
free        → max 100 credentials, 1 user, 30-day activity log
pro         → unlimited credentials, 1 user, full activity log
team        → unlimited credentials, 2–25 users, shared vaults, RBAC
team_growth → 26–100 users, all team features + priority support
```

---

## Phase 12 — Landing Page & Launch

| # | Task | Notes |
|---|---|---|
| 12.1 | Create `landing/` Next.js app (or dedicated route group in frontend) | Separate from dashboard |
| 12.2 | Hero section: problem statement + product screenshot | |
| 12.3 | Feature sections: security model, team sharing, developer workflow | |
| 12.4 | Pricing table (Free / Pro / Team cards) | Links to `/register` or Stripe Checkout |
| 12.5 | FAQ section (security model, encryption, self-hosting option) | |
| 12.6 | Email capture for waitlist (before launch) | Resend audience or simple DB table |
| 12.7 | SEO metadata, OG image, favicon | |
| 12.8 | Production deployment | Vercel (frontend) + Cloud Run or Railway (backend) |
| 12.9 | Custom domain + SSL | |
| 12.10 | Error monitoring (Sentry) on both frontend + backend | |
| 12.11 | Uptime monitoring (Better Stack or similar) | |
| 12.12 | HN "Show HN" post: draft + timing (Tuesday 9am ET) | |
| 12.13 | Product Hunt launch post | |

---

## Dependency Map

```
Phase 7 (Encryption)
    │
    ▼
Phase 8 (Auth Hardening)
    │
    ├──► Phase 9 (Teams)
    │         │
    │         ▼
    │    Phase 10 (Dev Features) ─── can run in parallel with Phase 11
    │         │
    └──► Phase 11 (Billing)
              │
              ▼
         Phase 12 (Launch)
```

Phase 7 and 8 must be completed before any public launch.
Phase 9 and 10 can overlap.
Phase 11 can begin when Phase 9 is 70% complete.
Phase 12 begins when 11 is merged and staging is validated.

---

## New Stack Additions

| Service | Purpose | Dev | Prod |
|---|---|---|---|
| Redis | Vault key cache, rate limit counters | Local Redis or Docker | Upstash Redis |
| Resend | Transactional email | Test mode | Resend production |
| Stripe | Billing | Test mode (no charges) | Live mode |
| Sentry | Error tracking | Optional | Required |

---

## New Environment Variables

```bash
# Phase 7 (encryption)
REDIS_URL=redis://localhost:6379/0
VAULT_KEY_CACHE_TTL_SECONDS=3600

# Phase 8 (email)
RESEND_API_KEY=re_xxxxxxxxxxxxx
APP_BASE_URL=http://localhost:3000

# Phase 11 (billing)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_TEAM_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_TEAM_GROWTH_PRICE_ID=price_xxxxxxxxxxxxx
```

---

## Summary Checklist

| Phase | Focus | Est. Effort | Blocker for launch? |
|---|---|---|---|
| 7 — Per-User Encryption | Security model fix | 1 week | **Yes — critical** |
| 8 — Auth Hardening | Rate limiting, email flows | 4–5 days | **Yes — required** |
| 9 — Teams & Orgs | Core product differentiator | 2 weeks | For team tier |
| 10 — Dev Features | Competitive moat | 1 week | No (nice-to-have v1) |
| 11 — Billing | Revenue | 4–5 days | For paid tiers |
| 12 — Landing + Launch | Go-to-market | 1 week | For public launch |
