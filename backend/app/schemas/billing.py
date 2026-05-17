from typing import Literal

from pydantic import BaseModel


class CheckoutRequest(BaseModel):
    plan: Literal["individual", "agency"]
    interval: Literal["monthly", "yearly"] = "monthly"


class CheckoutResponse(BaseModel):
    session_id: str
    url: str


class PortalResponse(BaseModel):
    url: str


class WebhookAckResponse(BaseModel):
    received: bool
    event_type: str | None = None
    action: str | None = None  # what we did about it (for debugging)
