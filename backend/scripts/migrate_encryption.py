"""
One-time migration script: re-encrypt all credential/note data from the
legacy global ENCRYPTION_KEY to per-user vault keys.

Run once after deploying Phase 7:
    cd backend && .venv/bin/python scripts/migrate_encryption.py

Requires:
  - DATABASE_URL, ENCRYPTION_KEY, SECRET_KEY set in .env
  - A plaintext password for each user (prompted interactively)

The script:
1. Finds all users with empty vault_salt (not yet migrated)
2. Prompts for the user's current password to wrap the new vault key
3. Generates vault_salt + vault_key, wraps with PBKDF2(password)
4. Re-encrypts all credentials/notes for that user with the new vault key
5. Updates the database row-by-row (safe to re-run: skips already migrated users)
"""

import asyncio
import getpass
import sys
from pathlib import Path

# Add project root to sys.path so app imports work
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.security import (
    decrypt_data,          # legacy global-key decrypt
    encrypt_for_user,      # new per-user encrypt
    generate_vault_key,
    generate_vault_salt,
    hash_password,
    verify_password,
    wrap_vault_key,
)
from app.models.models import Credential, SecureNote, User


async def migrate_user(session: AsyncSession, user: User, password: str) -> None:
    """Re-encrypt all data for a single user."""
    vault_salt = generate_vault_salt()
    vault_key = generate_vault_key()
    vault_key_enc = wrap_vault_key(vault_key, password, vault_salt)

    # Re-encrypt credentials
    creds = (await session.execute(select(Credential).where(Credential.user_id == user.id))).scalars().all()
    for cred in creds:
        if cred.password_encrypted:
            plain = decrypt_data(cred.password_encrypted)
            cred.password_encrypted = encrypt_for_user(vault_key, plain)
        if cred.secret_key_encrypted:
            plain = decrypt_data(cred.secret_key_encrypted)
            cred.secret_key_encrypted = encrypt_for_user(vault_key, plain)

    # Re-encrypt notes
    notes = (await session.execute(select(SecureNote).where(SecureNote.user_id == user.id))).scalars().all()
    for note in notes:
        if note.content_encrypted:
            plain = decrypt_data(note.content_encrypted)
            note.content_encrypted = encrypt_for_user(vault_key, plain)

    user.vault_salt = vault_salt
    user.vault_key_encrypted = vault_key_enc

    await session.commit()
    print(f"  ✓ Migrated {len(creds)} credentials, {len(notes)} notes for @{user.username}")


async def main() -> None:
    engine = create_async_engine(settings.database_url, echo=False)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as session:
        # Only process users not yet migrated (vault_salt is empty)
        result = await session.execute(select(User).where(User.vault_salt == ""))
        users = result.scalars().all()

        if not users:
            print("No users need migration. All users already have per-user vault keys.")
            return

        print(f"Found {len(users)} user(s) to migrate.\n")
        print("You will be prompted for each user's current password.")
        print("This is needed to wrap their vault key. Passwords are NOT stored.\n")

        for user in users:
            print(f"User: @{user.username} ({user.email})")
            for attempt in range(3):
                password = getpass.getpass(f"  Password for @{user.username}: ")
                if verify_password(password, user.hashed_password):
                    await migrate_user(session, user, password)
                    break
                print(f"  ✗ Wrong password (attempt {attempt + 1}/3)")
            else:
                print(f"  Skipping @{user.username} — could not verify password\n")

    await engine.dispose()
    print("\nMigration complete.")


if __name__ == "__main__":
    asyncio.run(main())
