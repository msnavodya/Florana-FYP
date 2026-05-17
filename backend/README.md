# Florana Backend

The `backend/` folder contains the main Florana FastAPI API, local JSON fallback storage helpers, AI disease prediction runtime, admin endpoints, and payment-related backend logic.

## Overview

This backend is built with:

- FastAPI
- Pydantic
- PyMongo
- Local JSON fallback utilities
- TensorFlow / Keras
- pytest

The backend supports:

- user signup and login
- plant diagnosis from uploaded leaf images
- plant registration and lookup
- growth history tracking
- care reminder persistence
- feedback storage
- shop product management
- payment intent and order confirmation APIs
- admin dashboard APIs

## Main Files

Important files inside `backend/`:

```text
backend/
|-- ai/                     Trained model and class labels used by prediction endpoints
|-- models/                 Data model modules kept with the backend
|-- routes/                 FastAPI route modules
|-- schemas/                Request payload schemas
|-- tests/                  Backend pytest suite
|-- utils/                  Auth, paths, fallback storage, and JWT helpers
|-- .env.example
|-- database.py             MongoDB connection helpers and collection accessors
|-- main.py                 Main FastAPI app, health routes, AI routes, and quick tips
|-- run_backend.py          Safe backend runner used by npm scripts
|-- flask_payment_app.py    Optional legacy Flask payment helper
|-- payment_store.py        Legacy payment store helper
|-- requirements.txt
`-- requirements-payment.txt
```

## Route Coverage

Main backend route modules:

- `main.py`
  App startup, `/health`, `/`, `/predict`, `/diagnose`, `/history`, legacy `/plants`, `/quick-tips`, and legacy `/care-reminder`.
- `routes/auth.py`
  `/auth/signup` and `/auth/login`.
- `routes/plant.py`
  `/plants/`, `/plants/by-name/{name}`, and `/plants/{plant_id}`.
- `routes/growth.py`
  `/growth/` and `/growth/{plant_id}`.
- `routes/care_reminder.py`
  `/care-reminders/`.
- `routes/feedback.py`
  feedback create, list, and clear APIs.
- `routes/shop.py`
  `/shop/products` and `/shop/products/{product_id}`.
- `routes/payment.py`
  `/payments/intent`, `/payments/confirm`, and `/payments/payment-notify`.
- `routes/admin.py`
  protected `/admin` summary, users, plants, products, feedback, and payments APIs.

Compatibility aliases still included in the backend:

- `/api/health`
- `/api/predict`
- `/api/diagnose`
- `/api/history`
- `/api/plants`
- `/api/quick-tips`
- `/api/care-reminder`

## Storage Behavior

Current backend storage behavior:

- MongoDB is used when available through `MONGO_URL`.
- Local JSON fallback is used automatically when MongoDB is unavailable.
- Uploaded files are stored in the shared local `uploads/` area and served from `/uploads`.
- Plant diagnosis history, local users, feedback, reminder data, growth records, products, and orders can all fall back to local files during development.

Main supporting files:

- `backend/database.py`
- `backend/utils/local_store.py`
- `backend/utils/auth_store.py`
- `backend/utils/paths.py`

## AI Runtime

Prediction runtime files:

- `backend/ai/plant_disease_model.keras`
- `backend/ai/class_names.json`
- `backend/ai/predict.py`

Current prediction notes:

- The backend accepts `.jpg`, `.jpeg`, and `.png` uploads for the main diagnose route.
- Unsupported or unclear images return `Needs closer inspection`.
- The health endpoint reports whether the AI model is loaded.

## Environment

Copy the example file before local backend development:

```powershell
Copy-Item backend\.env.example backend\.env
```

Minimum common local values:

```env
MONGO_URL=mongodb://localhost:27017
JWT_SECRET_KEY=replace_with_a_long_random_secret
HOST=0.0.0.0
PORT=8000
```

Payment and checkout-related variables are also documented in the root [`README.md`](../README.md).

## Run

From the repository root:

```powershell
npm run backend:start
```

Useful backend commands from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run backend:start` | Start or reuse the FastAPI backend |
| `npm run backend:start:reload` | Start the backend with reload |
| `npm run backend:status` | Check backend health |
| `npm run backend:restart` | Restart the backend |
| `npm run backend:stop` | Stop the backend |
| `npm run backend:test` | Run backend pytest |

From inside `backend/`:

| Command | Purpose |
| --- | --- |
| `npm start` | Start the backend through `run_backend.py` |
| `npm run backend:start` | Start the backend |
| `npm run backend:restart` | Restart the backend |
| `npm run backend:status` | Check backend status |

## Verification

Recommended checks from the repository root:

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests -q
.\.venv\Scripts\python.exe -m py_compile backend\main.py backend\database.py backend\routes\auth.py backend\routes\plant.py backend\routes\shop.py backend\routes\payment.py backend\routes\admin.py backend\routes\care_reminder.py backend\routes\feedback.py backend\routes\growth.py
```

Current backend verification notes:

- The backend pytest suite lives in `backend/tests/`.
- Local tests are expected to pass without MongoDB because the test setup uses fallback behavior.
- The root `npm run verify` command includes backend validation as part of the full workspace check.

## Related Docs

- Root project guide: [`../README.md`](../README.md)
- Mobile app guide: [`../mobile/README.md`](../mobile/README.md)
- ML pipeline guide: [`../ml_pipeline/README.md`](../ml_pipeline/README.md)
- Payment notes: [`../PAYMENT_SYSTEM_GUIDE.md`](../PAYMENT_SYSTEM_GUIDE.md)
