# Florana FYP

Florana is a my final-year project  plant care and plant shop system. It combines a FastAPI backend, an Expo React Native mobile app, a legacy React web client, and an ML pipeline for plant disease image classification.

The main product experience is the `mobile/` app. The backend exposes authentication, plant management, growth tracking, disease prediction, catalog, cart/payment, feedback, and reminder APIs.

## Features

- User registration and login
- Plant disease prediction from uploaded images
- Plant registration with image upload, city, sunlight, soil, climate, tracking, and care details
- My Plants dashboard with plant profile view and deletion
- Flower profile pages with uploaded images and growth charts
- Seasonal shop catalog for Spring, Summer, Autumn, and Winter plants
- Sell Plants flow with product validation, image upload, listing preview, and catalog updates
- Product deletion from catalog and season screens
- Cart with saved items, remove confirmation, currency switching, and checkout flow
- Care reminders, quick tips, feedback, profile, settings, help, and about screens
- Local JSON fallback storage when MongoDB is not configured

## Project Structure

- `mobile/` - active Expo React Native app
- `backend/` - FastAPI API, auth, local storage, MongoDB support, uploads, prediction, plants, growth, shop, payment, feedback, and reminders
- `florana/` - legacy React web client
- `ml_pipeline/` - TensorFlow image classification training and dataset tooling
- `uploads/` - local uploaded images served by the backend during development
- `PAYMENT_SYSTEM_GUIDE.md` - payment flow documentation

## Requirements

- Node.js and npm
- Python 3.10+ recommended
- Expo Go or an Android/iOS emulator for mobile testing
- Optional MongoDB connection for persistent database storage

## Installation

Install root, mobile, and legacy web dependencies:

```bash
npm install
npm --prefix mobile install
npm --prefix florana install
```

Install backend Python dependencies inside the project virtual environment:

```bash
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

If you are not using the existing `.venv`, create and activate one first:

```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

## Environment Setup

Backend environment example:

```bash
copy backend\.env.example backend\.env
```

Mobile environment example:

```bash
copy mobile\.env.example mobile\.env
```

For Expo Go on a real phone, set the mobile API URL to your computer LAN IP:

```text
EXPO_PUBLIC_API_BASE_URL=http://YOUR_LAN_IP:8001
```

Keep the phone and computer on the same Wi-Fi network. If you run the backend on a different port, update `EXPO_PUBLIC_API_BASE_URL` to match.

## Running The Project

Start the backend from the repository root:

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

Build the legacy React web client:

```bash
npm run legacy:web:build
```

## API Overview

The backend runs on port `8001` by default when started with the root npm scripts.

Important endpoints include:

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

## ML Pipeline

The `ml_pipeline/` folder contains scripts and documentation for downloading image datasets, training a TensorFlow model, and exporting model artifacts. See `ml_pipeline/README.md` for the full workflow.

Do not commit generated datasets, local credentials, or large generated model outputs unless they are intentionally part of a release.

## Verification

Run the mobile TypeScript check:

```bash
npm run mobile:typecheck
```

Run a backend syntax check:

```bash
.\.venv\Scripts\python.exe -m py_compile backend\main.py backend\routes\plant.py backend\routes\shop.py
```

Build the legacy web client:

```bash
npm run legacy:web:build
```

## Git Notes

Ignored local files include virtual environments, `node_modules`, environment files, local uploads, generated caches, and large local datasets. Commit source code, configuration examples, documentation, and intended static assets only.

## Current Status

- Main branch: `main`
- GitHub remote: `https://github.com/msnavodya/Florana-FYP.git`
- Active client: `mobile/`
- Backend default port: `8001`
