# Provide the legacy Flask-based payment callback and status flow.
from __future__ import annotations

import html
import json
import os
import uuid
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path
from typing import Any
from urllib.parse import urlencode, quote

import stripe
from dotenv import load_dotenv
from flask import Flask, Response, jsonify, request
from flask_cors import CORS

try:
    from .payment_store import create_order, get_order, list_orders, update_order
except ImportError:
    from payment_store import create_order, get_order, list_orders, update_order


PKR_DECIMAL_PLACES = Decimal("0.01")
MAX_AMOUNT_PKR = Decimal("1000000.00")
DEFAULT_RETURN_URL = "florana-payments://checkout-result"


def _env_list(name: str, default: str) -> list[str]:
    # Convert comma-separated environment values into clean Python lists.
    raw = os.getenv(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


def _now_return_url() -> str:
    configured = os.getenv("DEFAULT_RETURN_URL", DEFAULT_RETURN_URL).strip()
    return configured or DEFAULT_RETURN_URL


def _public_base_url() -> str:
    return os.getenv("PUBLIC_BASE_URL", "http://127.0.0.1:5000").rstrip("/")


def _validate_amount(raw_amount: Any) -> Decimal:
    if raw_amount is None:
        raise ValueError("The 'amount' field is required.")

    try:
        # Normalize currency math through Decimal so Stripe totals stay precise.
        amount = Decimal(str(raw_amount)).quantize(PKR_DECIMAL_PLACES, rounding=ROUND_HALF_UP)
    except (InvalidOperation, ValueError) as exc:
        raise ValueError("Amount must be a valid number.") from exc

    if amount <= 0:
        raise ValueError("Amount must be greater than 0.")

    if amount > MAX_AMOUNT_PKR:
        raise ValueError(f"Amount must not exceed {MAX_AMOUNT_PKR} PKR.")

    return amount


def _normalize_return_url(raw_return_url: Any) -> str:
    if not raw_return_url:
        return _now_return_url()

    return_url = str(raw_return_url).strip()
    allowed_prefixes = _env_list(
        "ALLOWED_RETURN_URL_PREFIXES",
        "exp://,exps://,florana-payments://,https://auth.expo.io/",
    )

    if not any(return_url.startswith(prefix) for prefix in allowed_prefixes):
        # Only allow trusted deep-link prefixes back into the app.
        raise ValueError("Unsupported return_url value.")

    return return_url


def _amount_to_minor_units(amount: Decimal) -> int:
    # Stripe expects minor currency units, so PKR 10.50 becomes 1050.
    return int((amount * 100).to_integral_value(rounding=ROUND_HALF_UP))


def _build_redirect_target(return_url: str, status: str, order_id: str, session_id: str | None = None) -> str:
    # Preserve the original return target and append checkout result details for the app to read.
    separator = "&" if "?" in return_url else "?"
    params = {"status": status, "order_id": order_id}
    if session_id:
        params["session_id"] = session_id
    return f"{return_url}{separator}{urlencode(params)}"


def _redirect_page(title: str, body: str, redirect_url: str) -> str:
    # This small HTML page bridges a browser-based Stripe redirect back into the mobile deep link.
    safe_title = html.escape(title)
    safe_body = html.escape(body)
    safe_href = html.escape(redirect_url, quote=True)
    js_target = json.dumps(redirect_url)
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{safe_title}</title>
    <style>
      body {{
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: linear-gradient(160deg, #f7f3ea 0%, #f2fbf7 52%, #e4f0ff 100%);
        color: #20352c;
        font-family: Arial, sans-serif;
      }}
      main {{
        width: min(92vw, 30rem);
        padding: 2rem;
        border-radius: 1.5rem;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 16px 48px rgba(32, 53, 44, 0.14);
        text-align: center;
      }}
      a {{
        color: #165c46;
        font-weight: 700;
      }}
    </style>
  </head>
  <body>
    <main>
      <h1>{safe_title}</h1>
      <p>{safe_body}</p>
      <p><a href="{safe_href}">Return to the app</a></p>
    </main>
    <script>
      window.setTimeout(function () {{
        window.location.replace({js_target});
      }}, 400);
    </script>
  </body>
</html>"""


def create_app() -> Flask:
    load_dotenv(Path(__file__).resolve().with_name(".env"))

    app = Flask(__name__)

    # Limit browser access to the mobile/web origins that are expected to call this payment helper.
    allowed_origins = _env_list(
        "ALLOWED_ORIGINS",
        "http://localhost:8081,http://127.0.0.1:8081,http://localhost:19006,http://127.0.0.1:19006",
    )
    CORS(
        app,
        resources={
            r"/create-checkout-session": {"origins": allowed_origins},
            r"/orders/*": {"origins": allowed_origins},
            r"/health": {"origins": allowed_origins},
        },
        methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

    @app.get("/")
    def root() -> Response:
        return jsonify(
            {
                "service": "Florana Stripe Checkout Backend",
                "status": "ok",
                "endpoints": [
                    "POST /create-checkout-session",
                    "POST /webhook",
                    "GET /orders/<order_id>",
                    "GET /health",
                ],
            }
        )

    @app.get("/health")
    def health() -> Response:
        return jsonify(
            {
                "status": "ok",
                "stripeConfigured": bool(os.getenv("STRIPE_SECRET_KEY")),
                "webhookConfigured": bool(os.getenv("STRIPE_WEBHOOK_SECRET")),
                "ordersCount": len(list_orders()),
            }
        )

    @app.post("/create-checkout-session")
    def create_checkout_session() -> tuple[Response, int] | Response:
        if not stripe.api_key:
            return jsonify({"error": "Missing STRIPE_SECRET_KEY on the backend."}), 500

        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify({"error": "Request body must be valid JSON."}), 400

        try:
            amount = _validate_amount(payload.get("amount"))
            return_url = _normalize_return_url(payload.get("return_url"))
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400

        order_id = str(uuid.uuid4())
        amount_minor_units = _amount_to_minor_units(amount)
        public_base_url = _public_base_url()

        # Stripe returns to these helper URLs first, and they then deep-link the user back into the app.
        encoded_return_url = quote(return_url, safe="")
        success_url = (
            f"{public_base_url}/checkout/success?"
            f"order_id={order_id}&return_url={encoded_return_url}&session_id={{CHECKOUT_SESSION_ID}}"
        )
        cancel_url = f"{public_base_url}/checkout/cancel?order_id={order_id}&return_url={encoded_return_url}"

        try:
            # Use one checkout line item because the final total has already been prepared upstream.
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                mode="payment",
                line_items=[
                    {
                        "price_data": {
                            "currency": "pkr",
                            "product_data": {
                                "name": "Florana mobile order",
                            },
                            "unit_amount": amount_minor_units,
                        },
                        "quantity": 1,
                    }
                ],
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    "order_id": order_id,
                    "amount_pkr": str(amount_minor_units),
                },
            )
        except stripe.error.StripeError as exc:
            return jsonify({"error": str(exc.user_message or str(exc))}), 502

        order = create_order(
            {
                "id": order_id,
                "amount": float(amount),
                "currency": "PKR",
                "status": "pending",
                "checkout_session_id": session.id,
            }
        )

        # Return both the hosted Stripe URL and the locally tracked order summary to the client.
        return (
            jsonify(
                {
                    "checkoutUrl": session.url,
                    "order": {
                        "id": order["id"],
                        "amount": order["amount"],
                        "status": order["status"],
                    },
                }
            ),
            201,
        )

    @app.get("/orders/<order_id>")
    def fetch_order(order_id: str) -> tuple[Response, int] | Response:
        order = get_order(order_id)
        if order is None:
            return jsonify({"error": "Order not found."}), 404
        return jsonify({"order": order})

    @app.get("/checkout/success")
    def checkout_success() -> Response:
        order_id = request.args.get("order_id", "").strip()
        session_id = request.args.get("session_id", "").strip() or None
        return_url = request.args.get("return_url", _now_return_url()).strip()

        target = _build_redirect_target(return_url, "success", order_id, session_id)
        page = _redirect_page(
            "Payment submitted",
            "Stripe sent you back successfully. The app will verify the order status with the backend.",
            target,
        )
        return Response(page, mimetype="text/html")

    @app.get("/checkout/cancel")
    def checkout_cancel() -> Response:
        order_id = request.args.get("order_id", "").strip()
        return_url = request.args.get("return_url", _now_return_url()).strip()

        if order_id:
            existing = get_order(order_id)
            # Only downgrade still-pending orders so a later paid webhook is not overwritten.
            if existing and existing.get("status") == "pending":
                update_order(order_id, {"status": "cancelled"})

        target = _build_redirect_target(return_url, "cancel", order_id)
        page = _redirect_page(
            "Checkout cancelled",
            "The payment flow was cancelled before confirmation. You can safely return to the app.",
            target,
        )
        return Response(page, mimetype="text/html")

    @app.post("/webhook")
    def stripe_webhook() -> tuple[Response, int] | Response:
        webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "").strip()
        if not webhook_secret:
            return jsonify({"error": "Missing STRIPE_WEBHOOK_SECRET on the backend."}), 500

        payload = request.get_data()
        signature = request.headers.get("Stripe-Signature", "")

        try:
            event = stripe.Webhook.construct_event(payload, signature, webhook_secret)
        except ValueError:
            return jsonify({"error": "Invalid webhook payload."}), 400
        except stripe.error.SignatureVerificationError:
            return jsonify({"error": "Invalid Stripe signature."}), 400

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            metadata = session.get("metadata", {})
            order_id = metadata.get("order_id")
            amount_total = Decimal(session.get("amount_total", 0)) / 100

            if order_id:
                # Update the pending order when it exists, or recreate it if Stripe finishes first.
                updated = update_order(
                    order_id,
                    {
                        "amount": float(amount_total),
                        "status": "paid",
                        "checkout_session_id": session.get("id"),
                        "payment_intent_id": session.get("payment_intent"),
                    },
                )
                if updated is None:
                    create_order(
                        {
                            "id": order_id,
                            "amount": float(amount_total),
                            "currency": "PKR",
                            "status": "paid",
                            "checkout_session_id": session.get("id"),
                            "payment_intent_id": session.get("payment_intent"),
                        }
                    )

            print("Payment successful")
            print(
                {
                    "order_id": order_id,
                    "amount": float(amount_total),
                    "status": "paid",
                    "session_id": session.get("id"),
                }
            )

        return jsonify({"received": True})

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=True)
