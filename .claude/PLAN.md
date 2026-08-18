# PUSAKA — Implementation Plan

## Overview

Rewrite the Django fullstack prototype into a clean-architecture app with a
**FastAPI backend** and a **Next.js 15 frontend**, using shadcn/ui as the
design system (based on the '@shadcn/ui - Design System (Community)' Figma file).

---

## Architecture

```
pusaka-app/
├── backend/          # FastAPI REST API (Python)
├── frontend/         # Next.js 15 App Router (TypeScript)
├── .claude/          # Planning docs (this file, DEVLOG.md, TROUBLESHOOT.md)
└── Makefile          # Dev convenience commands
```

### Backend (FastAPI)
- **Framework**: FastAPI + Uvicorn
- **ORM**: SQLAlchemy 2.x (async)
- **DB**: SQLite (dev) → PostgreSQL (prod)
- **Migrations**: Alembic
- **Auth**: JWT access tokens in httpOnly cookies
- **Encryption**: `cryptography.fernet` (same approach as Django prototype)
- **Validation**: Pydantic v2 schemas

### Frontend (Next.js 15)
- **Framework**: Next.js 15 App Router + React 19
- **Language**: TypeScript strict mode
- **Design system**: shadcn/ui (Radix UI + Tailwind CSS v4)
- **Server state**: TanStack Query (React Query v5)
- **Client state**: Zustand (auth state only)
- **API types**: Generated via `openapi-typescript` from FastAPI's `/openapi.json`
- **Forms**: react-hook-form + zod

---

## Data Models (from Django prototype)

### Credential
| Field | Type | Notes |
|---|---|---|
| id | int PK | auto |
| user_id | FK → User | |
| label | str 255 | descriptive name |
| type | enum | website/email/social/banking/work/personal/server/api/other |
| website_url | str? | optional |
| username | str? | optional |
| email | str? | optional |
| password_encrypted | text | Fernet encrypted |
| secret_key_encrypted | text? | 2FA / secret key |
| note | text? | plain text notes |
| is_favorite | bool | default false |
| tags | str? | comma-separated |
| created_at | datetime | |
| updated_at | datetime | |
| last_accessed | datetime? | |

### SecureNote
| Field | Type | Notes |
|---|---|---|
| id | int PK | |
| user_id | FK → User | |
| title | str 255 | |
| content_encrypted | text | Fernet encrypted |
| type | enum | personal/work/financial/medical/legal/technical/other |
| is_favorite | bool | |
| tags | str? | comma-separated |
| created_at | datetime | |
| updated_at | datetime | |
| last_accessed | datetime? | |

### ActivityLog
| Field | Type | Notes |
|---|---|---|
| id | int PK | |
| user_id | FK → User | |
| action | enum | login/logout/register/create_credential/view_credential/update_credential/delete_credential/create_note/view_note/update_note/delete_note/export_data |
| description | str 500 | |
| ip_address | str? | |
| user_agent | text? | |
| timestamp | datetime | auto |

---

## API Endpoints

### Auth  `/api/v1/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Register new user |
| POST | `/login` | Login → set httpOnly JWT cookie |
| POST | `/logout` | Clear JWT cookie |
| GET | `/me` | Current user profile |

### Credentials  `/api/v1/credentials`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List (with search/filter/pagination) |
| POST | `/` | Create |
| GET | `/{id}` | Detail (logs view activity) |
| PUT | `/{id}` | Update |
| DELETE | `/{id}` | Delete |
| POST | `/{id}/favorite` | Toggle favorite |

### Notes  `/api/v1/notes`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List (with search/filter/pagination) |
| POST | `/` | Create |
| GET | `/{id}` | Detail (logs view activity) |
| PUT | `/{id}` | Update |
| DELETE | `/{id}` | Delete |
| POST | `/{id}/favorite` | Toggle favorite |

### Dashboard & Misc  `/api/v1`
| Method | Path | Description |
|---|---|---|
| GET | `/dashboard` | Stats + recents |
| GET | `/search` | Cross-search credentials + notes |
| GET | `/activity` | Paginated activity log |
| GET | `/export` | CSV export (no passwords) |

---

## Frontend Routes

```
/                       → redirect to /dashboard or /login
/(auth)/
  login/                → Login page
  register/             → Register page
/(dashboard)/
  dashboard/            → Home dashboard (stats + recents)
  credentials/          → List credentials
  credentials/new/      → Create credential
  credentials/[id]/     → Credential detail
  credentials/[id]/edit → Edit credential
  notes/                → List secure notes
  notes/new/            → Create note
  notes/[id]/           → Note detail
  notes/[id]/edit/      → Edit note
  search/               → Global search
  activity/             → Activity log
  profile/              → User profile
```

---

## Phases

### Phase 1 — Project Scaffold
- [ ] Init backend: FastAPI project structure, venv, requirements.txt
- [ ] Init frontend: Next.js 15, TypeScript, Tailwind v4, shadcn/ui
- [ ] Makefile with `make dev-backend`, `make dev-frontend`, `make dev`
- [ ] `.env.example` for both services

### Phase 2 — Backend Core
- [ ] SQLAlchemy models (User, Credentials, SecureNote, ActivityLog)
- [ ] Alembic setup + initial migration
- [ ] Fernet encryption service
- [ ] JWT auth service (create/verify tokens)
- [ ] Auth endpoints (register, login, logout, /me)
- [ ] Auth middleware (require authenticated user)

### Phase 3 — Backend Business Logic
- [ ] Credential CRUD endpoints + service layer
- [ ] SecureNote CRUD endpoints + service layer
- [ ] Favorite toggle endpoints
- [ ] Dashboard stats endpoint
- [ ] Global search endpoint
- [ ] Activity log endpoint
- [ ] CSV export endpoint
- [ ] OpenAPI schema export → `frontend/src/types/api.ts`

### Phase 4 — Frontend Foundation
- [ ] shadcn/ui components installed (Button, Input, Card, Badge, Dialog, etc.)
- [ ] App layout: sidebar navigation + header
- [ ] Auth guard (middleware.ts redirects)
- [ ] API client (`src/lib/api.ts`) — typed fetch wrapper using generated types
- [ ] Auth store (Zustand)
- [ ] Login page
- [ ] Register page

### Phase 5 — Frontend Features
- [ ] Dashboard page
- [ ] Credentials list page (search, filter, pagination)
- [ ] Credential detail page (copy-to-clipboard for password)
- [ ] Create/Edit credential form
- [ ] Notes list page
- [ ] Note detail page
- [ ] Create/Edit note form
- [ ] Search page
- [ ] Activity log page
- [ ] Profile page
- [ ] Favorite toggle (optimistic update)
- [ ] CSV export button

### Phase 6 — Polish & Security
- [ ] Password strength indicator on forms
- [ ] Clipboard auto-clear after 30 seconds
- [ ] Confirm dialogs for delete actions
- [ ] Empty states for all list pages
- [ ] Loading skeletons
- [ ] Toast notifications (sonner)
- [ ] Keyboard shortcuts (Cmd+K for search)
- [ ] Responsive design (mobile sidebar)
- [ ] CORS + security headers hardening

---

## Tech Decisions

| Decision | Choice | Reason |
|---|---|---|
| Backend lang | Python/FastAPI | Preserve encryption logic from prototype, faster iteration |
| DB (dev) | SQLite | Zero-config local dev |
| Auth storage | httpOnly cookie (JWT) | Prevents XSS token theft |
| Encryption | Fernet (AES-128-CBC + HMAC) | Same as prototype, battle-tested |
| API types | openapi-typescript generated | Never hand-write types |
| Forms | react-hook-form + zod | Type-safe, performant |
| Server state | React Query | Caching, refetch, optimistic updates |
| Design tokens | shadcn/ui + Tailwind CSS variables | Matches Figma design system |
