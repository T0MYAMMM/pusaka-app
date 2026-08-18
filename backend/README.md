# Backend — PUSAKA API

FastAPI REST backend with async SQLAlchemy, Fernet encryption at rest, and JWT auth via httpOnly cookies.

## Directory Structure

```
backend/
├── main.py                  FastAPI app factory, CORS, router registration
├── alembic.ini
├── alembic/
│   └── env.py               Async Alembic config
├── requirements.txt
└── app/
    ├── core/
    │   ├── config.py        Pydantic Settings (reads .env)
    │   ├── database.py      Async engine, AsyncSessionLocal, get_db dep
    │   ├── security.py      bcrypt hashing, JWT, Fernet encrypt/decrypt
    │   └── deps.py          get_current_user FastAPI dependency
    ├── models/
    │   └── models.py        SQLAlchemy ORM: User, Credential, SecureNote, ActivityLog
    ├── schemas/
    │   └── schemas.py       Pydantic v2 request/response schemas
    ├── services/
    │   ├── credential_service.py
    │   ├── note_service.py
    │   ├── dashboard_service.py
    │   └── activity_service.py
    └── api/v1/
        ├── auth.py
        ├── credentials.py
        ├── notes.py
        └── dashboard.py
```

## Setup

```bash
# Create virtualenv and install deps
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

# Configure
cp .env.example .env
# Edit .env — set SECRET_KEY and ENCRYPTION_KEY

# Run migrations
.venv/bin/alembic upgrade head

# Start dev server
.venv/bin/uvicorn main:app --reload --port 8000
```

Or from the project root: `make dev-backend`

## Environment Variables

All variables are read from `backend/.env` via Pydantic Settings.

| Variable | Default | Required in prod | Description |
|---|---|---|---|
| `APP_ENV` | `development` | | Environment name |
| `SECRET_KEY` | dev value | **Yes** | JWT HMAC signing key |
| `ENCRYPTION_KEY` | dev value | **Yes** | Fernet key for credential/note encryption |
| `DATABASE_URL` | `sqlite+aiosqlite:///./pusaka.db` | | SQLAlchemy async URL |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | | JWT TTL |
| `ALGORITHM` | `HS256` | | JWT algorithm |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | **Yes** | Allowed CORS origin |
| `DEFAULT_PAGE_SIZE` | `12` | | List endpoint page size |
| `MAX_PAGE_SIZE` | `100` | | Maximum allowed page size |
| `ENABLE_ACTIVITY_LOGGING` | `true` | | Write to activity_logs table |
| `ACTIVITY_LOG_RETENTION_DAYS` | `90` | | Informational; not enforced automatically |

## API Endpoints

### Auth — `/api/v1/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | — | Create account; sets JWT cookie |
| `POST` | `/login` | — | Login; sets JWT cookie |
| `POST` | `/logout` | Required | Clears JWT cookie |
| `GET` | `/me` | Required | Returns current user |

### Credentials — `/api/v1/credentials`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Required | Paginated list (`?q=&type=&favorites_only=&page=`) |
| `POST` | `/` | Required | Create credential (password/secret_key encrypted) |
| `GET` | `/{id}` | Required | Detail with decrypted password + secret_key |
| `PUT` | `/{id}` | Required | Update credential |
| `DELETE` | `/{id}` | Required | Delete (204) |
| `POST` | `/{id}/favorite` | Required | Toggle favorite |

### Secure Notes — `/api/v1/notes`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Required | Paginated list (`?q=&favorites_only=&page=`) |
| `POST` | `/` | Required | Create note (content encrypted) |
| `GET` | `/{id}` | Required | Detail with decrypted content |
| `PUT` | `/{id}` | Required | Update note |
| `DELETE` | `/{id}` | Required | Delete (204) |
| `POST` | `/{id}/favorite` | Required | Toggle favorite |

### Dashboard — `/api/v1`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/dashboard` | Required | Stats: counts, recents, type breakdown |
| `GET` | `/search` | Required | Cross-search credentials + notes (`?q=`) |
| `GET` | `/activity` | Required | Paginated activity log |
| `GET` | `/export` | Required | CSV export (no passwords) |

## Auth Flow

1. Client `POST /api/v1/auth/login` with username + password.
2. Backend verifies bcrypt hash, creates a signed JWT, and sets it as an `access_token` httpOnly cookie (`SameSite=Lax`, `HttpOnly=True`).
3. All subsequent requests include the cookie automatically (browser + fetch `credentials: 'include'`).
4. The `get_current_user` dependency reads the cookie, decodes the JWT, and queries the `User` row. Returns 401 if missing or invalid.
5. `POST /logout` deletes the cookie and returns 204.

## Encryption

Credential passwords, secret keys, and note content are encrypted at rest using **Fernet** (AES-128-CBC + HMAC-SHA256 from the Python `cryptography` library).

```
ENCRYPTION_KEY (env)
       │
       ▼
  SHA-256 hash → 32 bytes → base64url → Fernet key
       │
       ▼
  Fernet.encrypt(plaintext) → stored ciphertext
```

The key derivation (`SHA-256(ENCRYPTION_KEY)`) ensures the env var does not need to be a valid Fernet key format. **If `ENCRYPTION_KEY` changes, all stored ciphertext becomes unreadable** — back up the key.

Decryption happens only inside service-layer `decrypt_*` functions, called exclusively by detail endpoints. List endpoints never return decrypted values.

## Data Models

### User
`id` · `username` (unique) · `email` (unique) · `first_name` · `last_name` · `hashed_password` · `created_at`

### Credential
`id` · `user_id` · `label` · `type` (enum) · `username` · `email` · `password` (encrypted) · `website_url` · `secret_key` (encrypted) · `totp_secret` · `tags` · `notes` · `is_favorite` · `last_accessed_at` · `created_at` · `updated_at`

**Credential types:** `website` · `email` · `social` · `banking` · `work` · `personal` · `server` · `api` · `other`

### SecureNote
`id` · `user_id` · `title` · `type` (enum) · `content` (encrypted) · `tags` · `is_favorite` · `created_at` · `updated_at`

**Note types:** `personal` · `work` · `financial` · `medical` · `legal` · `technical` · `other`

### ActivityLog
`id` · `user_id` · `action` (enum) · `resource_type` · `resource_id` · `resource_label` · `ip_address` · `user_agent` · `created_at`

**Actions:** `login` · `logout` · `create` · `read` · `update` · `delete` · `export` · `search`

## Migrations

```bash
# Apply all pending migrations
alembic upgrade head

# Create a new autogenerated migration
alembic revision --autogenerate -m "describe the change"

# Rollback one step
alembic downgrade -1
```

Or via Makefile: `make migrate`, `make migrate-create MSG="..."`

## Testing

```bash
.venv/bin/pytest tests/ -v
```

Or: `make test`

Tests live in `backend/tests/`. The test suite uses `pytest-asyncio` and an in-memory SQLite database to avoid touching the development database.

## Known Gotchas

**bcrypt + passlib incompatibility** — Do not add `passlib` to requirements. bcrypt 4.0 removed the `__about__` module that passlib 1.7.4 used for version detection. This project calls `bcrypt.hashpw` / `bcrypt.checkpw` directly.

**SQLAlchemy post-commit attribute expiry** — After any `db.commit()`, SQLAlchemy expires all ORM object attributes. Always call `await db.refresh(obj)` before accessing attributes post-commit, or use `model_validate(obj)` (which triggers per-field lazy-load via `from_attributes=True`) rather than `obj.__dict__`.
