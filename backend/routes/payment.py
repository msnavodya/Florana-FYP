# Define backend API routes for Payment features.
import os
from typing import Literal

import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

try:
    from .. import database
    from ..utils import local_store
except ImportError:
    import database
    from utils import local_store


router = APIRouter(prefix="/payments", tags=["payments"])

ORDERS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "orders.local.json")
SUPPORTED_CURRENCIES = {"LKR", "USD", "EUR"}
STRIPE_API_BASE = "https://api.stripe.com/v1"


class CheckoutItem(BaseModel):
    id: str
    name: str
    quantity: int = Field(..., ge=1)
    price: float = Field(..., ge=0)


class DeliveryDetails(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    phone: str = Field(..., min_length=7, max_length=24)
    email: str | None = Field(default=None, max_length=120)
    address: str = Field(..., min_length=6, max_length=240)
    note: str | None = Field(default=None, max_length=240)


class PaymentIntentRequest(BaseModel):
    amount: float = Field(..., gt=0)
    currency: Literal["LKR", "USD", "EUR"]
    method: Literal["card", "cod"]
    item_count: int = Field(..., ge=1)
    items: list[CheckoutItem]
    delivery: DeliveryDetails


class PaymentNotifyRequest(PaymentIntentRequest):
    payment_intent_id: str | None = None
    status: Literal["pending", "requires_action", "succeeded", "cod_confirmed", "failed"] = "pending"


def _orders_collection():
    database.ensure_db_connection()
    if getattr(database, "db", None) is None:
      return None
    return database.db["orders"]


def _save_order(record: dict):
    orders_collection = _orders_collection()
    if orders_collection is None:
        return local_store.create_item(ORDERS_FILE, record)
    result = orders_collection.insert_one(record)
    return {**record, "_id": str(result.inserted_id)}


def _currency_multiplier(currency: str):
    return 100 if currency in {"USD", "EUR", "LKR"} else 100


def _create_stripe_payment_intent(payload: PaymentIntentRequest):
    secret_key = os.getenv("STRIPE_SECRET_KEY")
    if not secret_key:
        return {
            "enabled": False,
            "provider": "manual",
            "status": "configuration_required",
            "message": "Stripe is not configured on the backend. Add STRIPE_SECRET_KEY to enable live card payments.",
        }

    amount_in_minor = int(round(payload.amount * _currency_multiplier(payload.currency)))
    description = f"Florana order for {payload.delivery.name} ({payload.item_count} items)"
    metadata = {
        "customer_name": payload.delivery.name,
        "customer_phone": payload.delivery.phone,
        "item_count": str(payload.item_count),
        "address": payload.delivery.address[:120],
    }

    try:
        response = requests.post(
            f"{STRIPE_API_BASE}/payment_intents",
            headers={"Authorization": f"Bearer {secret_key}"},
            data={
                "amount": amount_in_minor,
                "currency": payload.currency.lower(),
                "automatic_payment_methods[enabled]": "true",
                "description": description,
                **{f"metadata[{key}]": value for key, value in metadata.items()},
            },
            timeout=20,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Stripe request failed: {exc}") from exc

    if response.status_code >= 400:
        try:
            error_payload = response.json()
        except ValueError:
            error_payload = {"error": {"message": response.text or "Stripe error"}}
        detail = error_payload.get("error", {}).get("message", "Stripe rejected the payment request.")
        raise HTTPException(status_code=502, detail=detail)

    data = response.json()
    return {
        "enabled": True,
        "provider": "stripe",
        "status": data.get("status", "requires_payment_method"),
        "payment_intent_id": data.get("id"),
        "client_secret": data.get("client_secret"),
        "publishable_key": os.getenv("STRIPE_PUBLISHABLE_KEY", ""),
        "message": "Stripe payment intent created successfully.",
    }


@router.post("/intent")
def create_payment_intent(payload: PaymentIntentRequest):
    if payload.currency not in SUPPORTED_CURRENCIES:
        raise HTTPException(status_code=400, detail="Unsupported currency.")

    if payload.method == "cod":
        return {
            "enabled": True,
            "provider": "cod",
            "status": "cod_ready",
            "message": "Cash on delivery is ready for confirmation.",
        }

    return _create_stripe_payment_intent(payload)


@router.post("/confirm")
def confirm_payment(payload: PaymentNotifyRequest):
    order_record = {
        "amount": payload.amount,
        "currency": payload.currency,
        "method": payload.method,
        "item_count": payload.item_count,
        "items": [item.model_dump() for item in payload.items],
        "delivery": payload.delivery.model_dump(),
        "payment_intent_id": payload.payment_intent_id,
        "status": payload.status,
        "created_at": local_store.now_iso(),
    }
    stored = _save_order(order_record)
    return {"status": "ok", "order": stored}


@router.post("/payment-notify")
def legacy_payment_notify(payload: PaymentNotifyRequest):
    return confirm_payment(payload)
