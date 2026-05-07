# Florana Payment System Guide

This repository currently contains two payment-related paths:

- the main Florana checkout flow used by the `mobile/` app and the FastAPI backend
- an optional legacy Stripe Checkout demo backend in `backend/flask_payment_app.py`

The primary project flow is the first one. There is no separate `frontend/` payment app in this repository.

## Current Repo Payment Architecture

Main files in the active checkout flow:

- `mobile/src/screens/CartScreen.tsx`
- `mobile/src/lib/api/payment.ts`
- `backend/routes/payment.py`
- `backend/orders.local.json` for local fallback order storage when MongoDB is unavailable

Optional legacy demo files:

- `backend/flask_payment_app.py`
- `backend/payment_store.py`
- `backend/requirements-payment.txt`

## How The Active Checkout Flow Works

1. The mobile cart collects delivery details and the selected payment method.
2. The app calls `POST /payments/intent` on the FastAPI backend.
3. For cash on delivery, the backend returns a `cod_ready` response.
4. For card checkout, the backend creates a Stripe PaymentIntent and returns its identifiers.
5. The app then calls `POST /payments/confirm` to save the final Florana order record.
6. Orders are written to MongoDB when available, otherwise to `backend/orders.local.json`.

Current FastAPI payment endpoints:

- `POST /payments/intent`
- `POST /payments/confirm`
- `POST /payments/payment-notify`

## Important Note About Stripe In The Current Mobile Flow

The current `mobile/` checkout screen prepares a Stripe PaymentIntent through the backend and records the order in Florana, but it does not include a full Stripe React Native SDK card collection flow in this repository.

That means:

- cash on delivery works fully within the current repo flow
- Stripe backend configuration is supported
- the card form shown in the mobile UI is a project-side checkout step, not a complete native Stripe SDK integration

If you later want fully native Stripe card collection, you would add the Stripe React Native client SDK on top of the existing backend endpoints.

## Required Environment Variables

Copy the example files first:

```bash
copy backend\.env.example backend\.env
copy mobile\.env.example mobile\.env
```

The backend runner automatically loads `backend/.env`.

Recommended backend variables:

```env
MONGO_URL=mongodb://localhost:27017
JWT_SECRET_KEY=replace_with_a_long_random_secret
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
PUBLIC_BASE_URL=http://YOUR_LAN_IP:5000
DEFAULT_RETURN_URL=florana-payments://checkout-result
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=http://localhost:8081,http://127.0.0.1:8081,http://localhost:8083,http://127.0.0.1:8083,http://YOUR_LAN_IP:8083
ALLOWED_RETURN_URL_PREFIXES=exp://,exps://,florana-payments://,https://auth.expo.io/
```

Mobile API variable:

```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:8000
```

## Running The Main Florana Payment Flow

Install project dependencies:

```bash
npm install
npm --prefix mobile install
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

Start the FastAPI backend:

```bash
npm run backend:start
```

Start the mobile app:

```bash
npm run payment:mobile
```

Useful shortcuts:

```bash
npm run payment:android
npm run payment:ios
npm run mobile:typecheck
```

## Testing The Main Flow

Cash on delivery:

- open the cart in the mobile app
- choose `Cash on Delivery`
- complete delivery details
- confirm the order

Stripe test setup:

- add `STRIPE_SECRET_KEY` to `backend/.env`
- optionally add `STRIPE_PUBLISHABLE_KEY`
- restart the backend
- use the cart checkout flow again

The FastAPI backend will create a Stripe PaymentIntent and save the order confirmation record through `/payments/confirm`.

## Optional Legacy Stripe Checkout Demo

`backend/flask_payment_app.py` is still available as a standalone Stripe Checkout demo backend. It is not the primary mobile checkout path anymore.

Install its extra dependencies if you want to run it:

```bash
.\.venv\Scripts\python.exe -m pip install -r backend\requirements-payment.txt
```

Start it from the repository root:

```bash
npm run payment:backend
```

Health check:

```bash
http://127.0.0.1:5000/health
```

This legacy backend expects `backend/.env` and uses:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PUBLIC_BASE_URL`
- `DEFAULT_RETURN_URL`

## Verification

Recommended checks after payment-related changes:

```bash
npm run mobile:typecheck
npm run admin:build
.\.venv\Scripts\python.exe -m py_compile backend\main.py backend\routes\payment.py backend\flask_payment_app.py
```
