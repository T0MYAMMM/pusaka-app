from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    secret_key: str = "dev-secret-key-change-in-production"
    encryption_key: str = "dev-encryption-key-change-in-production"

    database_url: str = "sqlite+aiosqlite:///./pusaka.db"

    access_token_expire_minutes: int = 60
    algorithm: str = "HS256"

    frontend_origin: str = "http://localhost:3000"

    redis_url: str = "redis://localhost:6379/0"
    vault_key_cache_ttl_seconds: int = 3600  # matches access_token_expire_minutes
    pbkdf2_iterations: int = 600_000  # OWASP minimum; lower in test via env var

    # Email (Resend)
    resend_api_key: str = ""  # empty = log to console (dev mode)
    email_from: str = "PUSAKA <noreply@pusaka.app>"
    app_base_url: str = "http://localhost:3000"

    # Auth hardening
    require_email_verification: bool = False  # set True in production
    rate_limiting_enabled: bool = True        # set False in tests via env var

    default_page_size: int = 12
    max_page_size: int = 100

    enable_activity_logging: bool = True
    activity_log_retention_days: int = 90

    # Stripe (Phase 11)
    stripe_secret_key: str = ""          # empty = billing disabled (dev mode)
    stripe_webhook_secret: str = ""
    stripe_pro_price_id: str = ""
    stripe_team_price_id: str = ""
    stripe_team_growth_price_id: str = ""


settings = Settings()
