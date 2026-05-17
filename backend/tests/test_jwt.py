from uuid import uuid4

import pytest

from app.auth.jwt_tokens import TokenError, mint_session_token, verify_session_token


def test_mint_and_verify_roundtrip():
    user_id = uuid4()
    token = mint_session_token(user_id, "ana@example.mx", "trial")
    payload = verify_session_token(token)
    assert payload.user_id == user_id
    assert payload.email == "ana@example.mx"
    assert payload.plan == "trial"
    assert payload.exp > payload.iat


def test_verify_rejects_tampered_token():
    user_id = uuid4()
    token = mint_session_token(user_id, "ana@example.mx", "trial")
    tampered = token[:-4] + "XXXX"
    with pytest.raises(TokenError, match="Invalid"):
        verify_session_token(tampered)


def test_verify_rejects_expired_token():
    user_id = uuid4()
    token = mint_session_token(user_id, "ana@example.mx", "trial", expires_in_minutes=-1)
    with pytest.raises(TokenError, match="expired"):
        verify_session_token(token)


def test_verify_rejects_random_string():
    with pytest.raises(TokenError):
        verify_session_token("not.a.jwt")


def test_minted_token_contains_expected_plan():
    user_id = uuid4()
    token = mint_session_token(user_id, "agency@example.mx", "agency")
    payload = verify_session_token(token)
    assert payload.plan == "agency"
