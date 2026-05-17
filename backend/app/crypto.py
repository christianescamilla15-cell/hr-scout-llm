"""Fernet (AES-128-CBC + HMAC) wrapper for PII at rest.

Per spec §4 — candidates.full_name and candidates.email must be encrypted in DB
so a DB dump leak doesn't expose contact info. Encryption is application-layer
(not Postgres pgcrypto) so the data is opaque even to a DBA reading the table.

Key handling
------------
Reads `FERNET_KEY` from settings. If missing in development, we synthesize a
deterministic key from JWT_SECRET so local devs don't need to generate one
just to get the app to boot. This is INTENTIONALLY NOT acceptable in
production — `Settings.environment != "development"` enforces a real key.
"""

import base64
import hashlib
import logging

from cryptography.fernet import Fernet, InvalidToken

from app import config as config_module

log = logging.getLogger(__name__)


class PIIEncryptionError(Exception):
    """Raised when encrypt/decrypt fails (bad key, tampered ciphertext)."""


def _get_fernet() -> Fernet:
    """Build a Fernet from current settings on every call. Cheap, and avoids
    cache invalidation pain when tests mutate FERNET_KEY/ENVIRONMENT between cases."""
    settings = config_module.get_settings()
    key = settings.fernet_key

    if not key:
        if settings.environment != "development":
            raise PIIEncryptionError(
                "FERNET_KEY env var is required in non-development environments"
            )
        # Dev-only fallback: derive a deterministic key from JWT_SECRET so the
        # local app boots without an extra setup step. Roundtrip works, but
        # ciphertexts won't decrypt across deployments — which is fine for dev.
        seed = hashlib.sha256(settings.jwt_secret.encode("utf-8")).digest()
        key = base64.urlsafe_b64encode(seed).decode("ascii")
        log.warning("FERNET_KEY missing — derived dev key from JWT_SECRET. Do not use in prod.")

    try:
        return Fernet(key.encode("utf-8") if isinstance(key, str) else key)
    except (ValueError, TypeError) as exc:
        raise PIIEncryptionError(f"Invalid FERNET_KEY: {exc}") from exc


def encrypt_pii(plaintext: str | None) -> str | None:
    if plaintext is None or plaintext == "":
        return None
    try:
        token = _get_fernet().encrypt(plaintext.encode("utf-8"))
        return token.decode("ascii")
    except Exception as exc:
        raise PIIEncryptionError(f"Encrypt failed: {exc}") from exc


def decrypt_pii(ciphertext: str | None) -> str | None:
    if ciphertext is None or ciphertext == "":
        return None
    try:
        plaintext = _get_fernet().decrypt(ciphertext.encode("ascii"))
        return plaintext.decode("utf-8")
    except InvalidToken as exc:
        raise PIIEncryptionError("Decrypt failed: invalid token (wrong key or tampered)") from exc
    except Exception as exc:
        raise PIIEncryptionError(f"Decrypt failed: {exc}") from exc


def reset_fernet_cache() -> None:
    """No-op now that _get_fernet is computed per call. Kept for test API stability."""
    return None
