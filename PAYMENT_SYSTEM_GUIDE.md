# Stripe Checkout Mobile Payment System

This repo now includes a standalone mobile payment flow built with:

- `frontend/`: Expo React Native
- `backend/`: Flask + Stripe Checkout + webhook verification

## Folder Structure

```text
frontend/
  App.tsx
  app.json
  babel.config.js
  package.json
  tsconfig.json
  .env.example

backend/
  flask_payment_app.py
  payment_store.py
  requirements-payment.txt
  .env.example
  data/
    payment_orders.json   # created automatically on first run
```

## Backend Code

### `backend/flask_payment_app.py`

```python
from __future__ import annotations

import html
import json
import os
import uuid
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
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
        raise ValueError("Unsupported return_url value.")

    return return_url


def _amount_to_minor_units(amount: Decimal) -> int:
    return int((amount * 100).to_integral_value(rounding=ROUND_HALF_UP))


def _build_redirect_target(return_url: str, status: str, order_id: str, session_id: str | None = None) -> str:
    separator = "&" if "?" in return_url else "?"
    params = {"status": status, "order_id": order_id}
    if session_id:
        params["session_id"] = session_id
    return f"{return_url}{separator}{urlencode(params)}"


def _redirect_page(title: str, body: str, redirect_url: str) -> str:
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
    load_dotenv()

    app = Flask(__name__)

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

        encoded_return_url = quote(return_url, safe="")
        success_url = (
            f"{public_base_url}/checkout/success?"
            f"order_id={order_id}&return_url={encoded_return_url}&session_id={{CHECKOUT_SESSION_ID}}"
        )
        cancel_url = f"{public_base_url}/checkout/cancel?order_id={order_id}&return_url={encoded_return_url}"

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

        order = create_order(
            {
                "id": order_id,
                "amount": float(amount),
                "currency": "PKR",
                "status": "pending",
                "checkout_session_id": session.id,
            }
        )

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

    @app.post("/webhook")
    def stripe_webhook() -> tuple[Response, int] | Response:
        webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "").strip()
        payload = request.get_data()
        signature = request.headers.get("Stripe-Signature", "")
        event = stripe.Webhook.construct_event(payload, signature, webhook_secret)

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            metadata = session.get("metadata", {})
            order_id = metadata.get("order_id")
            amount_total = Decimal(session.get("amount_total", 0)) / 100

            if order_id:
                update_order(
                    order_id,
                    {
                        "amount": float(amount_total),
                        "status": "paid",
                        "checkout_session_id": session.get("id"),
                        "payment_intent_id": session.get("payment_intent"),
                    },
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

    @app.get("/orders/<order_id>")
    def fetch_order(order_id: str) -> tuple[Response, int] | Response:
        order = get_order(order_id)
        if order is None:
            return jsonify({"error": "Order not found."}), 404
        return jsonify({"order": order})

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=True)
```

### `backend/payment_store.py`

```python
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any


DATA_DIR = Path(__file__).resolve().parent / "data"
ORDERS_FILE = DATA_DIR / "payment_orders.json"
_LOCK = Lock()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ensure_store() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not ORDERS_FILE.exists():
        ORDERS_FILE.write_text("[]", encoding="utf-8")


def _read_orders() -> list[dict[str, Any]]:
    _ensure_store()
    with ORDERS_FILE.open("r", encoding="utf-8") as handle:
        raw = json.load(handle)
    if not isinstance(raw, list):
        return []
    return [item for item in raw if isinstance(item, dict)]


def _write_orders(orders: list[dict[str, Any]]) -> None:
    _ensure_store()
    with ORDERS_FILE.open("w", encoding="utf-8") as handle:
        json.dump(orders, handle, indent=2)


def create_order(order: dict[str, Any]) -> dict[str, Any]:
    with _LOCK:
        orders = _read_orders()
        timestamp = _now_iso()
        stored = {
            **order,
            "created_at": order.get("created_at", timestamp),
            "updated_at": timestamp,
        }
        orders.append(stored)
        _write_orders(orders)
        return stored


def get_order(order_id: str) -> dict[str, Any] | None:
    with _LOCK:
        orders = _read_orders()
    for order in orders:
        if order.get("id") == order_id:
            return order
    return None


def update_order(order_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
    with _LOCK:
        orders = _read_orders()
        for index, order in enumerate(orders):
            if order.get("id") != order_id:
                continue
            next_order = {
                **order,
                **updates,
                "updated_at": _now_iso(),
            }
            orders[index] = next_order
            _write_orders(orders)
            return next_order
    return None
```

## Frontend Code

### `frontend/App.tsx`

```tsx
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";


WebBrowser.maybeCompleteAuthSession();

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000").replace(/\/+$/, "");

type Order = {
  id: string;
  amount: number;
  status: string;
};

type CheckoutResponse = {
  checkoutUrl: string;
  order: Order;
};

type OrderResponse = {
  order: Order;
};

type LineItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

const initialItems: LineItem[] = [
  { id: "rose-bouquet", name: "Rose Bouquet", price: 2499, quantity: 1 },
  { id: "lily-bundle", name: "Lily Bundle", price: 1899, quantity: 1 },
];


function formatPkr(amount: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(amount);
}


async function createCheckoutSession(amount: number, returnUrl: string): Promise<CheckoutResponse> {
  const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      return_url: returnUrl,
    }),
  });

  const payload = (await response.json()) as CheckoutResponse & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Unable to create a checkout session.");
  }

  return payload;
}


async function fetchOrder(orderId: string): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
  const payload = (await response.json()) as OrderResponse & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || "Unable to verify the order.");
  }

  return payload.order;
}


export default function App() {
  const [items, setItems] = useState<LineItem[]>(initialItems);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Tap Pay Securely to open Stripe Checkout.");
  const [orderStatus, setOrderStatus] = useState<string>("idle");
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      void handleReturnUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  async function handleReturnUrl(url: string) {
    const parsed = Linking.parse(url);
    const params = parsed.queryParams || {};
    const status = typeof params.status === "string" ? params.status : "";
    const orderId = typeof params.order_id === "string" ? params.order_id : "";

    if (status === "cancel") {
      setOrderStatus("cancelled");
      setMessage("Payment was cancelled before completion.");
      return;
    }

    if (status !== "success" || !orderId) {
      return;
    }

    try {
      setOrderStatus("verifying");
      setMessage("Stripe returned successfully. Verifying payment status with the backend...");
      const order = await fetchOrder(orderId);
      setCurrentOrder(order);

      if (order.status === "paid") {
        setOrderStatus("paid");
        setMessage("Payment successful. The webhook confirmed your order.");
        return;
      }

      setOrderStatus("pending");
      setMessage("Checkout finished, but the webhook has not confirmed payment yet. Please refresh in a few seconds.");
    } catch (error) {
      setOrderStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to verify the payment result.");
    }
  }

  async function refreshOrderStatus() {
    if (!currentOrder?.id) {
      return;
    }

    try {
      setBusy(true);
      const order = await fetchOrder(currentOrder.id);
      setCurrentOrder(order);
      setOrderStatus(order.status);
      setMessage(
        order.status === "paid"
          ? "Payment successful. The backend confirmed the order."
          : `Latest backend status: ${order.status}.`
      );
    } finally {
      setBusy(false);
    }
  }

  async function paySecurely() {
    if (totalPrice <= 0) {
      Alert.alert("Cart is empty", "Add at least one item before paying.");
      return;
    }

    const returnUrl = Linking.createURL("checkout-result");
    setBusy(true);
    setOrderStatus("creating");
    setMessage("Creating a secure Stripe Checkout session...");

    try {
      const checkout = await createCheckoutSession(totalPrice, returnUrl);
      setCurrentOrder(checkout.order);

      const browserResult = await WebBrowser.openAuthSessionAsync(checkout.checkoutUrl, returnUrl);

      if (browserResult.type === "cancel" || browserResult.type === "dismiss") {
        setOrderStatus("cancelled");
        setMessage("Payment window closed before confirmation.");
        return;
      }

      if (browserResult.type === "success" && browserResult.url) {
        await handleReturnUrl(browserResult.url);
        return;
      }

      setOrderStatus("pending");
      setMessage("Returned from Stripe without a final state. Check the backend order status.");
    } catch (error) {
      setOrderStatus("error");
      setMessage(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      setBusy(false);
    }
  }

  function changeQuantity(id: string, delta: number) {
    setItems((current) =>
      current
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: Math.max(0, item.quantity + delta),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Florana Secure Payment</Text>
          <Text style={styles.subtitle}>Expo React Native + Flask + Stripe Checkout hosted page.</Text>

          {items.map((item) => (
            <View key={item.id} style={styles.lineItem}>
              <View>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>{formatPkr(item.price)} each</Text>
              </View>

              <View style={styles.stepper}>
                <Pressable onPress={() => changeQuantity(item.id, -1)} style={styles.stepperButton}>
                  <Text>-</Text>
                </Pressable>
                <Text>{item.quantity}</Text>
                <Pressable onPress={() => changeQuantity(item.id, 1)} style={styles.stepperButton}>
                  <Text>+</Text>
                </Pressable>
              </View>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text>Total price</Text>
            <Text>{formatPkr(totalPrice)}</Text>
          </View>

          <Pressable disabled={busy} onPress={paySecurely} style={styles.payButton}>
            {busy ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.payButtonText}>Pay Securely</Text>}
          </Pressable>

          <Text style={styles.statusText}>{message}</Text>
          {currentOrder ? <Text style={styles.statusText}>Order: {currentOrder.id} ({currentOrder.status})</Text> : null}

          <Pressable disabled={!currentOrder || busy} onPress={refreshOrderStatus} style={styles.secondaryButton}>
            <Text>Refresh order status</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f3ea",
  },
  container: {
    padding: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 20,
  },
  title: {
    color: "#173228",
    fontSize: 30,
    fontWeight: "900",
  },
  subtitle: {
    color: "#52635c",
    fontSize: 15,
    marginTop: 10,
  },
  lineItem: {
    alignItems: "center",
    borderBottomColor: "#eef1ed",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  itemName: {
    color: "#173228",
    fontSize: 17,
    fontWeight: "800",
  },
  itemMeta: {
    color: "#6f7d78",
    fontSize: 13,
    marginTop: 4,
  },
  stepper: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  stepperButton: {
    alignItems: "center",
    backgroundColor: "#eef7f1",
    borderRadius: 12,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  totalRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  payButton: {
    alignItems: "center",
    backgroundColor: "#165c46",
    borderRadius: 18,
    marginTop: 20,
    minHeight: 56,
    justifyContent: "center",
  },
  payButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  statusText: {
    color: "#52635c",
    fontSize: 15,
    marginTop: 14,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#f1ede3",
    borderRadius: 16,
    marginTop: 16,
    minHeight: 50,
    justifyContent: "center",
  },
});
```

## Environment Variables

### Backend `.env`

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
PUBLIC_BASE_URL=http://192.168.1.10:5000
DEFAULT_RETURN_URL=florana-payments://checkout-result
ALLOWED_ORIGINS=http://localhost:8081,http://127.0.0.1:8081,http://192.168.1.10:8081
ALLOWED_RETURN_URL_PREFIXES=exp://,exps://,florana-payments://,https://auth.expo.io/
PORT=5000
```

### Frontend `.env`

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:5000
```

## Installation Steps

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-payment.txt
copy .env.example .env
python flask_payment_app.py
```

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm start
```

## How To Run Both

Open terminal 1:

```bash
cd backend
.venv\Scripts\activate
python flask_payment_app.py
```

Open terminal 2:

```bash
cd frontend
npm start
```

## Stripe Webhook

Forward Stripe webhooks to the Flask backend:

```bash
stripe listen --forward-to http://192.168.1.10:5000/webhook
```

Copy the webhook signing secret printed by Stripe CLI into:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Example Test Request

```bash
curl -X POST http://127.0.0.1:5000/create-checkout-session \
  -H "Content-Type: application/json" \
  -d "{\"amount\": 4398}"
```

Example response:

```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
  "order": {
    "id": "6a4c7c0f-6b0f-471f-b742-e45f0c9b6184",
    "amount": 4398.0,
    "status": "pending"
  }
}
```

## Stripe Test Card

```text
Card number: 4242 4242 4242 4242
Expiry date: Any future date
CVC: Any 3 digits
ZIP/Postal code: Any value
```

## Networking For Expo

Replace `localhost` with your computer's local IP address when testing on a real phone.

Example:

```text
Backend laptop IP: 192.168.1.10
Flask backend URL: http://192.168.1.10:5000
Expo API env var: EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:5000
Stripe PUBLIC_BASE_URL: http://192.168.1.10:5000
```

### How to find your local IP

Windows:

```bash
ipconfig
```

Look for the IPv4 address on your active Wi-Fi or Ethernet adapter.

## Security Notes

- Secret keys stay on the backend only.
- The frontend never collects card details manually.
- Stripe Checkout handles the payment page.
- Webhook verification uses `STRIPE_WEBHOOK_SECRET`.
- The mobile app does not trust the browser return alone. It fetches the order from the backend after Stripe redirects back.

## Bonus Order Object

Orders are stored as:

```json
{
  "id": "6a4c7c0f-6b0f-471f-b742-e45f0c9b6184",
  "amount": 4398.0,
  "status": "pending"
}
```
