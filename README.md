# PUSAKA

Brankas digital keluarga Indonesia — end-to-end encrypted vault for passwords, secure notes, and important documents.

## Architecture

```
pusaka-app/
├── backend/     FastAPI + SQLAlchemy + SQLite/PostgreSQL
└── frontend/    Next.js 16 + shadcn/ui + TanStack Query
```

The backend and frontend are fully decoupled. The backend exposes a REST API; the frontend communicates with it via fetch with `credentials: 'include'` (httpOnly cookie auth). No page-level SSR data fetching — the frontend is a static SPA shell with client-side data loading.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend framework | FastAPI 0.115 + Uvicorn |
| ORM | SQLAlchemy 2.x (async) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Migrations | Alembic |
| Auth | JWT in httpOnly cookie (python-jose) |
| Encryption | Fernet/AES-128 (cryptography) |
| Password hashing | bcrypt 4.x (direct, no passlib) |
| Frontend framework | Next.js 16.1 + React 19 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Server state | TanStack Query v5 |
| Client state | Zustand v5 (with persist) |
| Forms | react-hook-form + zod |
| API types | openapi-typescript (auto-generated) |

## Prerequisites

- Python 3.11+
- Node.js 20+
- `make`

## Quick Start

```bash
# 1. Install all dependencies
make install

# 2. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Edit both files — set SECRET_KEY and ENCRYPTION_KEY at minimum

# 3. Run database migrations
make migrate

# 4. Start both servers (backend :8000, frontend :3000)
make dev
```

Open http://localhost:3000 and register an account.

## Makefile Commands

| Command | Description |
|---|---|
| `make dev` | Start backend + frontend concurrently |
| `make dev-backend` | FastAPI only on :8000 |
| `make dev-frontend` | Next.js only on :3000 |
| `make install` | Install all dependencies |
| `make migrate` | Apply database migrations |
| `make migrate-create MSG="..."` | Create a new Alembic migration |
| `make generate-types` | Re-generate `frontend/src/types/api.ts` from live OpenAPI schema |
| `make test` | Run backend test suite |
| `make lint-backend` | Ruff lint + format backend |

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | dev value | JWT signing secret — **change in production** |
| `ENCRYPTION_KEY` | dev value | Fernet encryption key — **change in production** |
| `DATABASE_URL` | SQLite | Full SQLAlchemy URL (use `postgresql+asyncpg://...` for prod) |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | JWT lifetime |
| `ENABLE_ACTIVITY_LOGGING` | `true` | Log user actions to activity table |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend base URL |

## Security Model

- **Passwords and secret keys** are encrypted with Fernet (AES-128-CBC + HMAC) before being stored. The `ENCRYPTION_KEY` env var is the only key that can decrypt them.
- **Auth tokens** are stored in httpOnly, SameSite=Lax cookies — never accessible from JavaScript.
- **User passwords** are hashed with bcrypt (cost factor 12).
- **Decrypted fields** are returned only on detail endpoints (`GET /credentials/{id}`, `GET /notes/{id}`) — list endpoints return ciphertext-free responses.
- **CSV export** never includes passwords or secret keys.

## Production Checklist

- [ ] Set `SECRET_KEY` and `ENCRYPTION_KEY` to unique random values (32+ chars each)
- [ ] Set `DATABASE_URL` to a PostgreSQL connection string
- [ ] Set `FRONTEND_ORIGIN` to your deployed frontend URL
- [ ] Set `NEXT_PUBLIC_API_URL` to your deployed backend URL
- [ ] Run behind HTTPS — the auth cookie is `SameSite=Lax` and requires HTTPS in production
- [ ] Run `make migrate` against the production database before first deploy

## API Documentation

With the backend running, interactive API docs are available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

See [backend/README.md](backend/README.md) for the full endpoint reference.
