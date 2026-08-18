"""Unit tests for security utilities (no DB, no HTTP)."""

import pytest
from app.core.security import (
    create_access_token,
    decode_access_token,
    decrypt_data,
    decrypt_for_user,
    encrypt_data,
    encrypt_for_user,
    generate_vault_key,
    generate_vault_salt,
    hash_password,
    unwrap_vault_key,
    verify_password,
    wrap_vault_key,
)


class TestPasswordHashing:
    def test_hashed_differs_from_plain(self):
        hashed = hash_password("secret123")
        assert hashed != "secret123"

    def test_hash_is_bcrypt_format(self):
        hashed = hash_password("secret123")
        assert hashed.startswith("$2b$")

    def test_verify_correct_password(self):
        hashed = hash_password("correct-horse-battery")
        assert verify_password("correct-horse-battery", hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("correct-horse-battery")
        assert verify_password("wrong-password", hashed) is False

    def test_two_hashes_of_same_password_differ(self):
        """bcrypt uses random salt — same input produces different hashes."""
        h1 = hash_password("same")
        h2 = hash_password("same")
        assert h1 != h2
        assert verify_password("same", h1)
        assert verify_password("same", h2)


class TestJWT:
    def test_roundtrip(self):
        user_id = 42
        token = create_access_token(user_id)
        decoded = decode_access_token(token)
        assert decoded == user_id

    def test_invalid_token_returns_none(self):
        assert decode_access_token("not.a.valid.token") is None

    def test_empty_token_returns_none(self):
        assert decode_access_token("") is None

    def test_tampered_token_returns_none(self):
        token = create_access_token(1)
        tampered = token[:-5] + "XXXXX"
        assert decode_access_token(tampered) is None


class TestLegacyEncryption:
    """Tests for the global-key encrypt/decrypt (used only by migration script)."""

    def test_roundtrip(self):
        plain = "my-super-secret-password"
        cipher = encrypt_data(plain)
        assert decrypt_data(cipher) == plain

    def test_ciphertext_differs_from_plaintext(self):
        plain = "hunter2"
        cipher = encrypt_data(plain)
        assert cipher != plain

    def test_empty_string_passthrough(self):
        assert encrypt_data("") == ""
        assert decrypt_data("") == ""


class TestVaultKey:
    """Tests for per-user vault key generation and wrapping."""

    def test_generate_vault_salt_is_64_hex_chars(self):
        salt = generate_vault_salt()
        assert len(salt) == 64
        int(salt, 16)  # raises ValueError if not valid hex

    def test_generate_vault_key_is_32_bytes(self):
        key = generate_vault_key()
        assert isinstance(key, bytes)
        assert len(key) == 32

    def test_two_salts_differ(self):
        assert generate_vault_salt() != generate_vault_salt()

    def test_two_vault_keys_differ(self):
        assert generate_vault_key() != generate_vault_key()


class TestVaultKeyWrap:
    """Tests for wrap_vault_key / unwrap_vault_key."""

    def test_wrap_unwrap_roundtrip(self):
        salt = generate_vault_salt()
        key = generate_vault_key()
        wrapped = wrap_vault_key(key, "my-password", salt)
        assert unwrap_vault_key(wrapped, "my-password", salt) == key

    def test_wrapped_is_string(self):
        salt = generate_vault_salt()
        wrapped = wrap_vault_key(generate_vault_key(), "pass", salt)
        assert isinstance(wrapped, str)

    def test_wrong_password_raises(self):
        salt = generate_vault_salt()
        wrapped = wrap_vault_key(generate_vault_key(), "correct", salt)
        with pytest.raises(Exception):
            unwrap_vault_key(wrapped, "wrong", salt)

    def test_wrong_salt_raises(self):
        key = generate_vault_key()
        wrapped = wrap_vault_key(key, "pass", generate_vault_salt())
        with pytest.raises(Exception):
            unwrap_vault_key(wrapped, "pass", generate_vault_salt())

    def test_different_passwords_produce_different_wrapped_keys(self):
        salt = generate_vault_salt()
        key = generate_vault_key()
        w1 = wrap_vault_key(key, "pass1", salt)
        w2 = wrap_vault_key(key, "pass2", salt)
        assert w1 != w2


class TestPerUserEncryption:
    """Tests for encrypt_for_user / decrypt_for_user."""

    def test_roundtrip(self):
        key = generate_vault_key()
        plain = "my-super-secret-password"
        assert decrypt_for_user(key, encrypt_for_user(key, plain)) == plain

    def test_ciphertext_differs_from_plaintext(self):
        key = generate_vault_key()
        plain = "hunter2"
        assert encrypt_for_user(key, plain) != plain

    def test_two_encryptions_of_same_value_differ(self):
        """Fernet uses a random IV per encryption."""
        key = generate_vault_key()
        plain = "same-secret"
        c1 = encrypt_for_user(key, plain)
        c2 = encrypt_for_user(key, plain)
        assert c1 != c2
        assert decrypt_for_user(key, c1) == plain
        assert decrypt_for_user(key, c2) == plain

    def test_empty_string_passthrough(self):
        key = generate_vault_key()
        assert encrypt_for_user(key, "") == ""
        assert decrypt_for_user(key, "") == ""

    def test_wrong_key_returns_decryption_error(self):
        key1 = generate_vault_key()
        key2 = generate_vault_key()
        cipher = encrypt_for_user(key1, "secret")
        result = decrypt_for_user(key2, cipher)
        assert result == "[Decryption Error]"

    def test_special_characters(self):
        key = generate_vault_key()
        plain = "p@$$w0rd!#%^&*()_+-=[]{}|;':\",./<>?"
        assert decrypt_for_user(key, encrypt_for_user(key, plain)) == plain
