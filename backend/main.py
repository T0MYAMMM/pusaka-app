from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.core.limiter import limiter


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup (dev convenience; use Alembic in prod)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="PUSAKA API",
    version="1.0.0",
    lifespan=lifespan,
)

# Register slowapi rate limiter (no-op when RATE_LIMITING_ENABLED=false)
if limiter is not None:
    from slowapi import _rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


from app.api.v1 import api_keys, auth, billing, credentials, dashboard, documents, notes, orgs, waitlist

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(credentials.router, prefix="/api/v1/credentials", tags=["credentials"])
app.include_router(notes.router, prefix="/api/v1/notes", tags=["notes"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["documents"])
app.include_router(dashboard.router, prefix="/api/v1", tags=["dashboard"])
app.include_router(orgs.router, prefix="/api/v1/orgs", tags=["organizations"])
app.include_router(api_keys.router, prefix="/api/v1/api-keys", tags=["api-keys"])
app.include_router(billing.router, prefix="/api/v1/billing", tags=["billing"])
app.include_router(waitlist.router, prefix="/api/v1/waitlist", tags=["waitlist"])
