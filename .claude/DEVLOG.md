# Development Log — PUSAKA

> Format: `[YYYY-MM-DD] Phase N — Checkpoint: description`
> Status markers: `[DONE]` `[IN PROGRESS]` `[BLOCKED]` `[SKIPPED]`

---

## Phase 1 — Project Scaffold

| # | Checkpoint | Status | Date | Notes |
|---|---|---|---|---|
| 1.1 | Backend project structure created | [DONE] | 2026-03-06 | `backend/` dir, venv, requirements.txt |
| 1.2 | FastAPI app boots (`uvicorn main:app`) | [DONE] | 2026-03-06 | Health check at `/health` returns `{"status":"ok"}` |
| 1.3 | Frontend project created | [DONE] | 2026-03-06 | Next.js 16.1.6 + React 19.2.3 |
| 1.4 | Tailwind CSS v4 configured | [DONE] | 2026-03-06 | Auto-configured by create-next-app |
| 1.5 | shadcn/ui initialized | [DONE] | 2026-03-06 | Neutral base color; 15 components installed |
| 1.6 | Makefile commands working | [DONE] | 2026-03-06 | `make dev`, `make migrate`, `make generate-types`, `make test` |
| 1.7 | `.env.example` files created | [DONE] | 2026-03-06 | Both backend + frontend |

---

## Phase 2 — Backend Core

| # | Checkpoint | Status | Date | Notes |
|---|---|---|---|---|
| 2.1 | SQLAlchemy models defined | [DONE] | 2026-03-06 | User, Credential, SecureNote, ActivityLog with mapped_column |
| 2.2 | Alembic initialized + first migration | [DONE] | 2026-03-06 | `alembic upgrade head` creates all 4 tables |
| 2.3 | EncryptionService working | [DONE] | 2026-03-06 | Fernet encrypt/decrypt in `core/security.py` |
| 2.4 | JWTService working | [DONE] | 2026-03-06 | `create_access_token` / `decode_access_token` |
| 2.5 | POST /api/v1/auth/register | [DONE] | 2026-03-06 | Returns 201 + sets httpOnly JWT cookie |
| 2.6 | POST /api/v1/auth/login | [DONE] | 2026-03-06 | Returns 200 + sets JWT cookie; wrong pw → 401 |
| 2.7 | POST /api/v1/auth/logout | [DONE] | 2026-03-06 | Returns 204, clears cookie |
| 2.8 | GET /api/v1/auth/me | [DONE] | 2026-03-06 | Returns current user from cookie |
| 2.9 | Auth dependency (require_current_user) | [DONE] | 2026-03-06 | 401 on missing/invalid token |

---

## Phase 3 — Backend Business Logic

| # | Checkpoint | Status | Date | Notes |
|---|---|---|---|---|
| 3.1 | Credential CRUD endpoints | [DONE] | 2026-03-06 | GET list, POST, GET detail, PUT, DELETE |
| 3.2 | Credential search + filter | [DONE] | 2026-03-06 | `?q=&type=&favorites_only=` case-insensitive |
| 3.3 | Credential pagination | [DONE] | 2026-03-06 | `?page=&limit=` with pages count returned |
| 3.4 | Credential favorite toggle | [DONE] | 2026-03-06 | POST `/{id}/favorite` |
| 3.5 | SecureNote CRUD endpoints | [DONE] | 2026-03-06 | GET list, POST, GET detail, PUT, DELETE |
| 3.6 | SecureNote search + filter | [DONE] | 2026-03-06 | `?q=&favorites_only=` |
| 3.7 | SecureNote favorite toggle | [DONE] | 2026-03-06 | POST `/{id}/favorite` |
| 3.8 | ActivityLog writes on every action | [DONE] | 2026-03-06 | login/logout/CRUD/export all logged |
| 3.9 | GET /api/v1/dashboard | [DONE] | 2026-03-06 | Stats + recents + credential_types breakdown |
| 3.10 | GET /api/v1/search | [DONE] | 2026-03-06 | Cross-search credentials + notes |
| 3.11 | GET /api/v1/activity | [DONE] | 2026-03-06 | Paginated activity log |
| 3.12 | GET /api/v1/export | [DONE] | 2026-03-06 | CSV (no passwords), activity logged |
| 3.13 | OpenAPI JSON exported | [DONE] | 2026-03-06 | 15 paths from live FastAPI schema |
| 3.14 | Types generated for frontend | [DONE] | 2026-03-06 | `frontend/src/types/api.ts` (1339 lines) |

---

## Phase 4 — Frontend Foundation

| # | Checkpoint | Status | Date | Notes |
|---|---|---|---|---|
| 4.1 | Core shadcn/ui components installed | [DONE] | 2026-03-06 | 15 components: Button, Input, Card, Badge, Dialog, DropdownMenu, Avatar, Skeleton, Sonner, AlertDialog, Tooltip, etc. |
| 4.2 | App sidebar layout built | [DONE] | 2026-03-06 | Fixed sidebar with nav links, user avatar, logout button |
| 4.3 | Auth proxy (proxy.ts) | [DONE] | 2026-03-06 | Next.js 16 uses `proxy.ts`; redirects unauthenticated → /login, authenticated on public → /dashboard |
| 4.4 | API client (`lib/api.ts`) | [DONE] | 2026-03-06 | Typed fetch wrapper, cookie forwarding, all endpoints covered |
| 4.5 | Auth Zustand store | [DONE] | 2026-03-06 | `useAuthStore` with persist; setUser() |
| 4.6 | Login page renders + submits | [DONE] | 2026-03-06 | react-hook-form + zod validation, toast on error |
| 4.7 | Register page renders + submits | [DONE] | 2026-03-06 | All fields + confirm password + zod validation |
| 4.8 | Auth redirect flow working | [DONE] | 2026-03-06 | Login → /dashboard, logout → /login; build ✓ |

---

## Phase 5 — Frontend Features

| # | Checkpoint | Status | Date | Notes |
|---|---|---|---|---|
| 5.1 | Dashboard page | [DONE] | 2026-03-06 | Stats cards + recent lists + type breakdown |
| 5.2 | Credentials list page | [DONE] | 2026-03-06 | Cards grid, search bar, type filter, pagination |
| 5.3 | Credential detail page | [DONE] | 2026-03-06 | Show all fields, password reveal, copy, favorite |
| 5.4 | Create credential page | [DONE] | 2026-03-06 | Form with all fields, zod validation |
| 5.5 | Edit credential page | [DONE] | 2026-03-06 | Pre-filled form from API |
| 5.6 | Delete credential | [DONE] | 2026-03-06 | AlertDialog confirm before delete |
| 5.7 | Notes list page | [DONE] | 2026-03-06 | Cards grid, search bar, pagination |
| 5.8 | Note detail page | [DONE] | 2026-03-06 | Decrypted content in monospace pre |
| 5.9 | Create note page | [DONE] | 2026-03-06 | Textarea for content, zod validation |
| 5.10 | Edit note page | [DONE] | 2026-03-06 | Pre-filled form from API |
| 5.11 | Delete note | [DONE] | 2026-03-06 | AlertDialog confirm before delete |
| 5.12 | Favorite toggle | [DONE] | 2026-03-06 | Optimistic update with onMutate/onError rollback |
| 5.13 | Search page | [DONE] | 2026-03-06 | Debounced unified search across creds + notes |
| 5.14 | Activity log page | [DONE] | 2026-03-06 | Paginated timeline with icons + Badge variants |
| 5.15 | Profile page | [DONE] | 2026-03-06 | User info + vault stats + recent activity |
| 5.16 | CSV export button | [DONE] | 2026-03-06 | Download link on profile page |

---

## Phase 6 — Polish & Security

| # | Checkpoint | Status | Date | Notes |
|---|---|---|---|---|
| 6.1 | Password strength indicator | [DONE] | 2026-03-07 | 4-segment bar on credential form password field; Weak/Fair/Good/Strong |
| 6.2 | Clipboard auto-clear (30s) | [DONE] | 2026-03-06 | CopyButton clears clipboard after 30s; 2s copied feedback |
| 6.3 | Loading skeletons everywhere | [DONE] | 2026-03-06 | Skeleton grids on list pages; Skeleton h-8/h-96 on edit pages |
| 6.4 | Empty states for all lists | [DONE] | 2026-03-06 | Credentials + Notes lists show icon + message + CTA when empty |
| 6.5 | Toast notifications | [DONE] | 2026-03-06 | Sonner richColors toasts on all create/update/delete/error |
| 6.6 | Mobile responsive sidebar | [DONE] | 2026-03-07 | Sheet drawer with hamburger; MobileNav component; header bar on mobile |
| 6.7 | Keyboard shortcut: Cmd+K search | [DONE] | 2026-03-07 | KeyboardShortcuts client component in dashboard layout |
| 6.8 | CORS hardened | [DONE] | 2026-03-06 | Backend CORS uses `settings.frontend_origin` (env-configurable) |
| 6.9 | Security headers (Next.js) | [DONE] | 2026-03-07 | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |

---

---

## Phase 7 — Per-User Encryption

| # | Checkpoint | Status | Date | Notes |
|---|---|---|---|---|
| 7.1 | vault_salt + vault_key_encrypted columns on User | [DONE] | 2026-03-08 | String(64) + Text, nullable=False, server_default='' |
| 7.2 | Alembic migration (14bba3c95e51) | [DONE] | 2026-03-08 | Fixed SQLite NOT NULL + server_default constraint |
| 7.3 | security.py: generate_vault_salt/key, derive_wrapping_key, wrap/unwrap_vault_key, encrypt/decrypt_for_user | [DONE] | 2026-03-08 | PBKDF2-SHA256, configurable iterations via settings |
| 7.4 | register endpoint: generate vault_key, wrap, cache in Redis | [DONE] | 2026-03-08 | |
| 7.5 | redis_client.py: set/get/delete_vault_key | [DONE] | 2026-03-08 | Module-level functions for easy test mocking |
| 7.6 | login endpoint: unwrap vault_key, cache in Redis | [DONE] | 2026-03-08 | |
| 7.7 | logout endpoint: delete vault_key from Redis | [DONE] | 2026-03-08 | |
| 7.8 | encrypt_for_user / decrypt_for_user replace global encrypt_data/decrypt_data | [DONE] | 2026-03-08 | Legacy functions kept for migration script only |
| 7.9 | get_vault_key_dep FastAPI dependency | [DONE] | 2026-03-08 | Returns 401 "Session expired" if key not in Redis |
| 7.10 | credential_service + note_service use per-user vault_key | [DONE] | 2026-03-08 | vault_key param on create/update/decrypt functions |
| 7.11 | POST /auth/change-password endpoint | [DONE] | 2026-03-08 | Re-wraps vault_key; vault data itself unchanged |
| 7.12 | scripts/migrate_encryption.py | [DONE] | 2026-03-08 | Re-encrypts existing data per-user; prompts for passwords |
| 7.13 | Tests updated: Redis mock, PBKDF2_ITERATIONS=1000, new vault key + change_password tests | [DONE] | 2026-03-08 | 76/76 passing |

---

## Summary

| Phase | Total | Done | In Progress | Blocked |
|---|---|---|---|---|
| 1 — Scaffold | 7 | 7 | 0 | 0 |
| 2 — Backend Core | 9 | 9 | 0 | 0 |
| 3 — Backend Logic | 14 | 14 | 0 | 0 |
| 4 — Frontend Foundation | 8 | 8 | 0 | 0 |
| 5 — Frontend Features | 16 | 16 | 0 | 0 |
| 6 — Polish | 9 | 9 | 0 | 0 |
| 7 — Per-User Encryption | 13 | 13 | 0 | 0 |
| **Total** | **76** | **76** | **0** | **0** |
