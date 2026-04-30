# Florana FYP

Florana is a plant-care and plant-shop system with a FastAPI backend, an Expo mobile app, and a legacy React web client. The current main client is the `mobile/` app.

## Main Features

- User signup and login
- Plant disease prediction from uploaded images
- Plant registration with image upload, location, sunlight, soil, climate, tracking, and care details
- My Plants dashboard with plant profile deletion
- Flower profile with uploaded image display and growth tracking charts
- Seasonal shop catalog for Spring, Summer, Autumn, and Winter plants
- Sell Plants flow with validated product saving, image upload, listing preview, and season catalog display
- Product listing deletion from catalog and season screens
- Cart with persistent items, remove confirmation, currency switching, and checkout flow
- Care reminders, feedback, quick tips, profile, settings, help, and about screens

## Project Structure

- `mobile/` - main Expo mobile app
- `backend/` - FastAPI backend, local JSON fallback storage, MongoDB support, uploads, prediction, plants, growth, shop, payment, feedback, and reminders routes
- `florana/` - legacy React web client
- `frontend/` - separate Expo payment demo
- `uploads/` - uploaded plant/product images served by the backend

## Quick Start

Install dependencies where needed:

```bash
npm install
npm --prefix mobile install
npm --prefix florana install
```

Start the backend:

```bash
npm run backend:start
```

Start the main mobile app:

```bash
npm start
```

Run the mobile app in a browser:

```bash
npm run web
```

Run the legacy React web client:

```bash
npm run legacy:web:start
```

## Backend

The backend starts through `backend/run_backend.py` and serves the API on port `8001` by default from the root scripts.

Useful endpoints include:

- `GET /health`
- `POST /auth/signup`
- `POST /auth/login`
- `GET /plants/`
- `POST /plants/`
- `DELETE /plants/{plant_id}`
- `GET /plants/by-name/{name}`
- `POST /growth/`
- `GET /growth/{plant_id}`
- `GET /shop/products`
- `POST /shop/products`
- `DELETE /shop/products/{product_id}`
- `POST /predict`

Uploaded images are served from:

```text
/uploads/<filename>
```

## Mobile Environment

Copy:

```bash
mobile/.env.example
```

to:

```bash
mobile/.env
```

For Expo Go on a real phone, set the backend URL to your computer LAN IP:

```text
EXPO_PUBLIC_API_BASE_URL=http://YOUR_LAN_IP:8001
```

Keep the phone and computer on the same Wi-Fi network.

## Verification

Mobile typecheck:

```bash
npm run mobile:typecheck
```

Legacy web build:

```bash
npm run legacy:web:build
```

Backend route syntax check:

```bash
python -m py_compile backend/routes/plant.py backend/routes/shop.py
```

## Notes

- The mobile app is the active product experience.
- The backend supports MongoDB when configured, and falls back to local JSON files when MongoDB is unavailable.
- Shop listings now return full saved product data, so mobile and web catalog screens can update immediately after saving.
