"""
Security utilities: password hashing, JWT tokens, Fernet encryption.

Encryption model (per-user vault keys):
  - Each user has a unique random vault_key (32 bytes).
  - vault_key is wrapped (encrypted) with a wrapping_key derived from the
    user's password via PBKDF2-SHA256. Stored as vault_key_encrypted in DB.
  - On login the vault_key is unwrapped and cached in Redis for the session.
  - All credential/note encryption uses the user's vault_key, not a global key.
"""

import base64
import hashlib
import hmac
import logging
import os
from datetime import UTC, datetime, timedelta

import bcrypt
from cryptography.fernet import Fernet
from jose import JWTError, jwt

from app.core.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Password hashing (bcrypt direct — passlib 1.7.x incompatible with bcrypt>=4)
# ---------------------------------------------------------------------------


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ---------------------------------------------------------------------------
# JWT tokens
# ---------------------------------------------------------------------------


def create_access_token(subject: int) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(subject), "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        return int(user_id)
    except JWTError:
        return None


# ---------------------------------------------------------------------------
# Per-user vault key management
# ---------------------------------------------------------------------------


def generate_vault_salt() -> str:
    """Return a random 32-byte salt as a hex string (64 chars)."""
    return os.urandom(32).hex()


def generate_vault_key() -> bytes:
    """Return a random 32-byte vault key (raw bytes)."""
    return os.urandom(32)


def _fernet(key_bytes: bytes) -> Fernet:
    """Build a Fernet instance from raw 32-byte key material."""
    return Fernet(base64.urlsafe_b64encode(key_bytes))


def derive_wrapping_key(password: str, salt_hex: str) -> bytes:
    """
    Derive a 32-byte wrapping key from user password + salt via PBKDF2-SHA256.
    The iteration count is controlled by settings.pbkdf2_iterations so tests
    can use a low value without touching production config.
    """
    salt = bytes.fromhex(salt_hex)
    return hashlib.pbkdf2_hmac(
        "sha256",
        password.encode(),
        salt,
        settings.pbkdf2_iterations,
    )


def wrap_vault_key(vault_key: bytes, password: str, salt_hex: str) -> str:
    """Encrypt vault_key with a wrapping key derived from password + salt."""
    wrapping_key = derive_wrapping_key(password, salt_hex)
    return _fernet(wrapping_key).encrypt(vault_key).decode()


def unwrap_vault_key(vault_key_encrypted: str, password: str, salt_hex: str) -> bytes:
    """Decrypt vault_key using a wrapping key derived from password + salt."""
    wrapping_key = derive_wrapping_key(password, salt_hex)
    return _fernet(wrapping_key).decrypt(vault_key_encrypted.encode())


# ---------------------------------------------------------------------------
# Per-user data encryption (used in services)
# ---------------------------------------------------------------------------


def encrypt_for_user(vault_key: bytes, plaintext: str) -> str:
    """Encrypt a string with the user's vault key."""
    if not plaintext:
        return plaintext
    return _fernet(vault_key).encrypt(plaintext.encode()).decode()


def decrypt_for_user(vault_key: bytes, ciphertext: str) -> str:
    """Decrypt a string with the user's vault key."""
    if not ciphertext:
        return ciphertext
    try:
        return _fernet(vault_key).decrypt(ciphertext.encode()).decode()
    except Exception:
        logger.exception("Failed to decrypt data")
        return "[Decryption Error]"


def encrypt_bytes_for_user(vault_key: bytes, data: bytes) -> str:
    """Encrypt raw bytes with the user's vault key; returns base64 string."""
    return _fernet(vault_key).encrypt(data).decode()


def decrypt_bytes_for_user(vault_key: bytes, ciphertext: str) -> bytes:
    """Decrypt a base64 ciphertext back to raw bytes."""
    try:
        return _fernet(vault_key).decrypt(ciphertext.encode())
    except Exception:
        logger.exception("Failed to decrypt bytes")
        raise


# ---------------------------------------------------------------------------
# Vault key recovery (used ONLY during password reset)
#
# Stores a second copy of vault_key encrypted with a key derived from
# SECRET_KEY. This allows password reset without losing vault data.
# Trade-off: if SECRET_KEY is compromised the vault key can be recovered.
# ---------------------------------------------------------------------------


def _get_recovery_fernet() -> Fernet:
    """Recovery Fernet key derived from SECRET_KEY (distinct from vault use)."""
    key = hashlib.sha256(f"recovery:{settings.secret_key}".encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key))


def encrypt_vault_key_for_recovery(vault_key: bytes) -> str:
    """Encrypt vault_key with server SECRET_KEY for password-reset recovery."""
    return _get_recovery_fernet().encrypt(vault_key).decode()


def decrypt_vault_key_for_recovery(vault_key_recovery_encrypted: str) -> bytes:
    """Decrypt vault_key using server SECRET_KEY during password reset."""
    return _get_recovery_fernet().decrypt(vault_key_recovery_encrypted.encode())


# ---------------------------------------------------------------------------
# Shared vault key (Phase 9)
#
# Each SharedVault gets a deterministic key derived from SECRET_KEY + vault ID.
# This is a server-assisted sharing model: the server is trusted to hold the
# derivation material. All vault members can decrypt shared items via this key.
# ---------------------------------------------------------------------------


def get_shared_vault_key(vault_id: int) -> bytes:
    """Derive a 32-byte key for a shared vault. Deterministic — never stored in DB."""
    return hmac.new(
        settings.secret_key.encode(),
        f"vault:{vault_id}".encode(),
        hashlib.sha256,
    ).digest()


def encrypt_for_vault(vault_id: int, plaintext: str) -> str:
    """Encrypt a string with the shared vault key."""
    return encrypt_for_user(get_shared_vault_key(vault_id), plaintext)


def decrypt_for_vault(vault_id: int, ciphertext: str) -> str:
    """Decrypt a string with the shared vault key."""
    return decrypt_for_user(get_shared_vault_key(vault_id), ciphertext)


# ---------------------------------------------------------------------------
# Legacy global encryption — used ONLY by scripts/migrate_encryption.py
# ---------------------------------------------------------------------------


def _get_global_fernet() -> Fernet:
    key = hashlib.sha256(settings.encryption_key.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key))


def encrypt_data(plaintext: str) -> str:
    """Encrypt with the global ENCRYPTION_KEY. Legacy — migration use only."""
    if not plaintext:
        return plaintext
    return _get_global_fernet().encrypt(plaintext.encode()).decode()


def decrypt_data(ciphertext: str) -> str:
    """Decrypt with the global ENCRYPTION_KEY. Legacy — migration use only."""
    if not ciphertext:
        return ciphertext
    try:
        return _get_global_fernet().decrypt(ciphertext.encode()).decode()
    except Exception:
        logger.exception("Failed to decrypt data (global key)")
        return "[Decryption Error]"
