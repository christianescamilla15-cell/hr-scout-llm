import base64

import pytest

from app.crypto import PIIEncryptionError, decrypt_pii, encrypt_pii, reset_fernet_cache


def setup_function():
    reset_fernet_cache()


def test_roundtrip_ascii():
    cipher = encrypt_pii("Christian Hernandez")
    assert cipher is not None
    assert cipher != "Christian Hernandez"
    assert decrypt_pii(cipher) == "Christian Hernandez"


def test_roundtrip_email():
    cipher = encrypt_pii("ana@example.mx")
    assert decrypt_pii(cipher) == "ana@example.mx"


def test_roundtrip_unicode_mx():
    cipher = encrypt_pii("María José Núñez")
    assert decrypt_pii(cipher) == "María José Núñez"


def test_encrypt_returns_none_for_none():
    assert encrypt_pii(None) is None


def test_encrypt_returns_none_for_empty_string():
    assert encrypt_pii("") is None


def test_decrypt_returns_none_for_none():
    assert decrypt_pii(None) is None


def test_decrypt_raises_on_tampered_ciphertext():
    cipher = encrypt_pii("secret")
    tampered = cipher[:-4] + "XXXX"
    with pytest.raises(PIIEncryptionError, match="Decrypt failed"):
        decrypt_pii(tampered)


def test_ciphertext_is_base64_safe():
    """Spec §4 — ciphertext is stored as Text; must be ASCII-safe."""
    cipher = encrypt_pii("a" * 1000)
    cipher.encode("ascii")  # raises if not ASCII
    # Fernet wraps the ciphertext in urlsafe base64
    try:
        base64.urlsafe_b64decode(cipher.encode("ascii"))
    except Exception as exc:  # pragma: no cover
        pytest.fail(f"Ciphertext not urlsafe-base64: {exc}")


def test_two_encrypts_of_same_plaintext_differ():
    """Fernet includes an IV — same plaintext should produce different ciphertext."""
    a = encrypt_pii("test")
    b = encrypt_pii("test")
    assert a != b
    assert decrypt_pii(a) == decrypt_pii(b) == "test"


def test_prod_environment_requires_fernet_key(monkeypatch):
    monkeypatch.setenv("FERNET_KEY", "")
    monkeypatch.setenv("ENVIRONMENT", "production")
    from app.config import get_settings

    get_settings.cache_clear()
    reset_fernet_cache()
    with pytest.raises(PIIEncryptionError, match="required"):
        encrypt_pii("anything")

    # Restore for subsequent tests
    monkeypatch.setenv("ENVIRONMENT", "development")
    get_settings.cache_clear()
    reset_fernet_cache()
