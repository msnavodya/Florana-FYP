# Florana - Smart Flower Plant Care & Disease Detection Mobile Application ( Plymouth ID-10953498)

<div align="center">

## Smart Plant Care, Disease Detection, and Seasonal Flower Shopping

Florana is a final-year project that combines a mobile plant-care experience, AI-assisted disease prediction, growth tracking, reminders, shopping, and admin management in one connected platform.

[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?style=flat&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![TensorFlow / Keras](https://img.shields.io/badge/TensorFlow%20%2F%20Keras-AI%20Model-FF6F00?style=flat&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/)
[![Admin Dashboard](https://img.shields.io/badge/Admin-Dashboard-2563EB?style=flat&logoColor=white)](#)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Status](https://img.shields.io/badge/Status-Academic%20Complete-65A30D?style=flat)](#)

</div>

## Project Showcase

Florana is a final-year project for flower plant care, flower plant disease detection, growth tracking, and flower plant shopping. It combines an Expo React Native mobile app, a FastAPI backend, a TensorFlow/Keras disease prediction model, an admin dashboard, and a legacy React web client.

## 1. Project Title

Project name:

```text
Florana - Smart Flower Plant Care & Disease Detection Mobile Application
```

Tagline:

```text
AI-powered flower plant health monitoring, care management, and seasonal flower shopping platform.
```

## 2. Project Overview / Description

Florana helps flower plant owners identify flower plant diseases from uploaded images, register and monitor their flowering plants, manage care reminders, and browse or sell seasonal flower plants through a built-in shop.

The project is designed for home gardeners, flower plant collectors, small flower plant sellers, and students who need a practical flower plant health management system. It solves common problems such as delayed disease identification, missed flower care tasks, disconnected flower plant records, and manual flower shop/order handling.

Main capabilities:

- AI-powered flower plant disease detection from image uploads
- Flower plant health monitoring and flower profile management
- Growth tracking with charts
- Care reminders, quick tips, and a local Quick Tip community space
- Seasonal flower plant shop with cart and checkout flow
- Admin dashboard for managing users, flower plants, products, feedback, and orders

## Project Completion Status

Florana is structured as a multi-module final-year project with the main mobile application, backend API, admin dashboard, legacy web client, and ML training workflow included in one repository.

Completed project areas:

- Mobile application screens and navigation are implemented in `mobile/src/screens/`.
- Backend API routes are implemented in `backend/routes/` and `backend/main.py`.
- Disease prediction model files are included in `backend/ai/`.
- Admin dashboard pages are implemented in `admin-dashboard/src/pages/`.
- ML dataset download and training workflow is documented and scripted in `ml_pipeline/`.
- Root npm scripts are available for running the backend, mobile app, admin dashboard, and legacy web client.

## Documentation Map

Use these files depending on what you need:

- `README.md`
  Full repository overview, architecture, setup, backend routes, and module summary
- `backend/README.md`
  Detailed guide for the FastAPI backend, storage fallback behavior, route coverage, and backend verification
- `mobile/README.md`
  Detailed guide for the Expo mobile app, screens, translations, reminders, and Expo startup flow
- `florana/README.md`
  Legacy web client overview, local startup steps, and when to use that module
- `ml_pipeline/README.md`
  Dataset, training, Cloudinary download, and backend model refresh workflow
- `PAYMENT_SYSTEM_GUIDE.md`
  Payment-specific implementation notes
- `USER_TESTING_GUIDE.md`
  Manual user testing checklist, acceptance scenarios, and bug report template

Important root scripts:

- `npm run setup` — install dependencies and configure local environment files
- `npm run verify` — run the main project verification suite across mobile, backend, and dashboard
- `npm run backend:start` — start the FastAPI backend locally
- `npm start` — start the mobile Expo app from the repository root
- `npm run admin:start` — start the admin dashboard locally

## Testing Commands

Run these commands from the repository root:

- `npm run backend:test`
  Run the backend `pytest` suite only
- `npm run verify`
  Run the main verification suite for mobile typecheck, admin build, Python syntax, and backend tests
- `npm run verify:full`
  Run the full verification suite including the legacy web build
- `.\\.venv\\Scripts\\python.exe -m pytest backend\\tests -q`
  Run backend `pytest` directly without the npm wrapper

Backend test notes:

- Install Python dependencies first with `npm run setup:python` or `python -m pip install -r backend/requirements.txt`
- The backend `pytest` suite is isolated from MongoDB and is expected to pass with local JSON fallback behavior
- The same `npm run verify` command is used by the GitHub Actions `Verify` workflow on `main`

## Repository Modules

Top-level modules in this repository:

| Folder | Purpose |
| --- | --- |
| `mobile/` | Main Expo React Native application |
| `backend/` | FastAPI backend, auth, AI model runtime, storage, payments, and reminder APIs |
| `admin-dashboard/` | React + Vite admin management dashboard |
| `florana/` | Older legacy React web client kept for reference |
| `ml_pipeline/` | Dataset download and model training workflow |
| `uploads/` | Local development upload storage |

## Current Mobile Notes

The mobile app currently includes:

- Expo Router-based entry routes in `mobile/app/`
- Screen implementations in `mobile/src/screens/`
- Shared providers in `mobile/src/context/`
- Shared translations in `mobile/src/utils/translations.ts`
- Translation fixes and newer mobile copy in `mobile/src/utils/translationOverrides.ts`

Recent mobile documentation points:

- Care Reminder language content now uses the shared translation system instead of isolated page-only copy
- Supported mobile language choices are English, Sinhala, Tamil, Spanish, French, Arabic, Hindi, and Chinese
- Mobile-specific setup and troubleshooting are documented in `mobile/README.md`
- Catalog browsing and plant selling now use separate mobile screens for a cleaner user flow
- The mobile cart now includes a more polished payment UI with structured delivery fields, payment method cards, and improved Stripe/COD checkout states
- Mobile shop prices now use a live currency conversion flow with cached fallback rates and shared formatting across catalog, product, sell, season, cart, and checkout screens

## 3. Features

### Core Features

- User registration and login
- Flower plant disease prediction from image upload with supported-class validation
- Flower plant registration with image, city, sunlight, soil, climate, and care details
- My Flower Plants dashboard with flower profile view and delete support
- Flower plant care tracking and growth history
- Care reminders and custom care notes
- Quick Tip community for sharing seeds, posting care ideas, liking posts, commenting, chatting locally, and deleting owned items
- Flower plant shop with seasonal catalog, product details, cart, and checkout
- Dedicated Sell Flower Plants flow for adding shop listings with photo upload and preview
- Live currency conversion for LKR, USD, and EUR with app-wide synchronized pricing
- Feedback, profile, settings, help, and about screens
- Local JSON fallback storage when MongoDB is not connected

### Advanced Features

- Location-aware flower plant registration using Sri Lankan city options
- Seasonal catalog for Spring, Summer, Autumn, and Winter flower plants
- Personalized quick tips based on time, season, and tracked flower plants
- Device-saved Quick Tip community posts, likes, comments, and chat messages using AsyncStorage
- Quick Tip sender names persist with each saved post, reply, and chat message even after switching accounts
- Quick Tip community supports deleting owned posts, replies, and chat messages with immediate local updates
- Diagnose flow rejects unrelated or unclear images instead of showing a false disease result when confidence is too low or the uploaded image is unsupported
- Growth tracking charts for registered flower plants
- Multi-language app text support
- Real-time currency switching for shop prices with cached rate fallback and shared checkout totals
- Admin analytics summary for users, flower plants, products, feedback, payments, and revenue
- Optional Cloudinary dataset download workflow for ML training

### Planned / Future Advanced Features

- Live weather API integration for flower care recommendations
- Push notification improvements
- Chatbot flower care assistant
- Flower plant doctor consultation workflow
- IoT sensor integration for soil moisture and environment tracking

### Implemented Mobile Screens

- Welcome
- Login and registration
- Home dashboard
- Disease prediction
- My Flower Plants
- Register Flower Plant
- Flower plant profile / flower profile
- Growth chart view
- Quick Tips with community posts, likes, comments, chat, sender persistence, and delete controls
- Care Reminder
- Catalog
- Sell
- Season catalog
- Product details
- Cart
- Feedback
- Profile
- Settings
- Help
- About

### Implemented Admin Dashboard Pages

- Dashboard summary
- Users
- Flower Plants
- Orders / payments
- Feedback

The repository still contains additional admin page components under `admin-dashboard/src/pages/`, but the current routed dashboard navigation exposes only the pages listed above.

## 4. Tech Stack

Version snapshot below is based on the current repository manifests and the verified local workspace on May 14, 2026.

### Workspace and CI Tooling

| Technology | Version | Source |
| --- | --- | --- |
| Node.js local verification runtime | `24.11.1` | local environment |
| npm local verification runtime | `11.6.4` | local environment |
| Python local verification runtime | `3.11.9` | local environment |
| GitHub Actions Node.js runtime for `Verify` | `20` | `.github/workflows/verify.yml` |
| GitHub Actions Python runtime for `Verify` | `3.11` | `.github/workflows/verify.yml` |

### Mobile App

| Technology | Version |
| --- | --- |
| Expo | `~54.0.34` |
| Expo Router | `~6.0.23` |
| React | `19.1.0` |
| React Native | `0.81.5` |
| TypeScript | `~5.9.2` |
| Axios | `^1.13.6` |
| AsyncStorage | `^2.2.0` |
| React Native SVG | `15.12.1` |
| React Native Chart Kit | `^6.12.0` |
| React Native Web | `^0.21.0` |

### Admin Dashboard

| Technology | Version |
| --- | --- |
| React | `^19.2.0` |
| React Router DOM | `^7.10.1` |
| Vite | `^7.2.7` |
| Tailwind CSS | `^3.4.18` |
| Axios | `^1.15.0` |
| Recharts | `^3.5.1` |
| Lucide React | `^0.561.0` |

### Legacy Web Client

| Technology | Version |
| --- | --- |
| React | `19.2.0` |
| React Router DOM | `^6.28.1` |
| React Scripts | `5.0.1` |
| Axios | `^1.16.0` |
| Chart.js | `^4.5.1` |
| Framer Motion | `^12.38.0` |
| Stripe JS | `^9.0.1` |
| PayPal React SDK | `^9.1.0` |

### Backend API and Data Layer

| Technology | Version |
| --- | --- |
| FastAPI | `0.128.1` |
| Uvicorn | `0.40.0` |
| Starlette | `0.50.0` |
| Pydantic | `2.12.5` |
| PyMongo | `4.15.4` |
| SQLAlchemy | `2.0.46` |
| python-jose | `3.5.0` |
| Passlib | `1.7.4` |
| pytest | `8.4.1` |
| httpx | `0.28.1` |

### AI and ML Runtime

| Technology | Version |
| --- | --- |
| TensorFlow | `2.20.0` |
| Keras | `3.13.2` |
| NumPy | `2.4.2` |
| OpenCV Python | `4.13.0.92` |
| Pillow | `12.1.0` |
| pandas | `3.0.0` |
| scikit-learn | `1.8.0` |
| SciPy | `1.17.0` |

### ML Pipeline Tooling

| Technology | Version |
| --- | --- |
| Cloudinary SDK | `1.35.0` |
| TensorFlow | `2.14.0` |
| NumPy | `1.24.3` |
| OpenCV Python | `4.8.0.74` |
| Pillow | `10.0.0` |
| Matplotlib | `3.7.2` |
| Requests | `2.31.0` |

### Database and Cloud Services

| Technology | Version / Notes |
| --- | --- |
| MongoDB | runtime service, version not pinned in repo |
| Local JSON fallback storage | built into backend routes and utilities |
| Stripe integration | configured through backend env vars and `@stripe/stripe-js@^9.0.1` in `florana/` |
| PayPal integration | `@paypal/react-paypal-js@^9.1.0` in `florana/` |
| Firebase Admin SDK | optional backend integration when configured at runtime |

## Prerequisites

- Node.js 20+ recommended, with local verification currently run on `24.11.1`
- npm, with local verification currently run on `11.6.4`
- Python 3.11 recommended, with local verification currently run on `3.11.9`
- Expo Go or Android/iOS emulator for mobile testing
- MongoDB for persistent storage
- Optional Cloudinary account for ML dataset download workflow
- Optional Stripe keys for live card payment testing

> Tip: Review `mobile/README.md` and `admin-dashboard/README.md` for module-specific configuration before running the full stack.

## Quick Start For Viewers

Use this path if you want someone new to the repository to get the whole project running with the fewest surprises.

### Fastest First Run

From a fresh clone in the repository root:

```powershell
npm run setup
npm run verify
```

If you want to start the backend and mobile app directly after setup, use separate terminals for `npm run backend:start` and `npm start`.

`npm run setup` does all of the following:

- installs root, mobile, admin dashboard, and legacy web dependencies
- creates `backend/.env` and `mobile/.env` from the example files if they are missing
- creates `.venv/` if needed
- installs the backend Python requirements into `.venv`

### Configure Local API URL For Mobile

If you are using a real phone with Expo Go, update `mobile/.env` before starting Expo:

```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:8000
```

Common local addresses:

- Real phone on same Wi-Fi: `http://192.168.x.x:8000`
- Android emulator: `http://10.0.2.2:8000`
- iOS simulator: `http://127.0.0.1:8000`
- Web on the same computer: `http://127.0.0.1:8000`

Required local ports:

- backend API: `8000`
- admin dashboard: `5173`
- legacy web client: `3000`
- Expo dev server: usually `8081`

If ports are already in use, stop the conflicting service or configure the port in the corresponding module start script.

### Start The Full Local Stack

Use separate terminals from the repository root:

Terminal 1:

```powershell
npm run backend:start
```

Terminal 2:

```powershell
npm start
```

Terminal 3:

```powershell
npm run admin:start
```

Optional Terminal 4 for the older web client:

```powershell
npm run legacy:web:start
```

### Local URLs

- Backend API: `http://127.0.0.1:8000`
- Backend docs: `http://127.0.0.1:8000/docs`
- Admin dashboard: `http://127.0.0.1:5173`
- Legacy web client: `http://127.0.0.1:3000`
- Expo dev server: usually `http://127.0.0.1:8081` or the next free Expo port

MongoDB is recommended for persistent storage but is not required for a first run. If MongoDB is unavailable, the backend falls back to local JSON storage.

## 5. System Architecture

```text
Mobile App / Admin Dashboard / Legacy Web Client
                |
                v
        FastAPI Backend API
                |
   --------------------------------
   |              |               |
MongoDB     Local JSON       TensorFlow Model
Database    Fallback         Disease Prediction
   |
   v
Uploads served from /uploads during development
```

Main flow:

- Users interact with the Expo mobile app.
- The mobile app sends auth, flower plant, prediction, shop, payment, feedback, and reminder requests to the FastAPI API.
- The backend stores records in MongoDB when available.
- If MongoDB is unavailable, the backend falls back to local JSON storage.
- Uploaded images are saved locally and served through `/uploads`.
- Disease prediction uses the trained TensorFlow/Keras model in `backend/ai/`.
- The mobile diagnose flow accepts only supported leaf predictions and shows an explicit unsupported-image error for unrelated or low-confidence uploads.
- The admin dashboard uses protected `/admin` endpoints to manage the system.
- The ML pipeline can download datasets from Cloudinary and train/export model artifacts.

## 6. Folder Structure

```bash
Florana-FYP/
|-- admin-dashboard/        # Vite React admin dashboard
|-- backend/                # FastAPI backend, routes, auth, uploads, payments, AI model
|-- florana/                # Legacy React web client
|-- ml_pipeline/            # Dataset download and TensorFlow model training workflow
|-- mobile/                 # Expo React Native mobile application
|-- uploads/                # Local development uploads, ignored by Git
|-- PAYMENT_SYSTEM_GUIDE.md # Payment flow documentation
|-- README.md
`-- package.json            # Root scripts for backend, mobile, admin, and web
```

## 7. Installation

### 1. Clone The Repository

```powershell
git clone https://github.com/msnavodya/Florana-FYP.git
cd Florana-FYP
```

### 2. Recommended One-Command Setup

```powershell
npm run setup
```

Optional setup variants:

```powershell
npm run setup:js
npm run setup:python
```

### 3. Configure Environment Files

`npm run setup` creates these automatically if they do not exist:

- `backend/.env`
- `mobile/.env`

Review and adjust them before running on real devices or shared networks.

Minimum values for local development:

`backend/.env`

```env
MONGO_URL=mongodb://localhost:27017
JWT_SECRET_KEY=replace_with_a_long_random_secret
HOST=0.0.0.0
PORT=8000
```

`mobile/.env`

```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:8000
```

### 4. Manual Dependency Install Commands

Use these if you want to install parts of the workspace manually instead of `npm run setup`.

#### JavaScript Dependencies

```powershell
npm install
npm --prefix mobile install
npm --prefix admin-dashboard install
npm --prefix florana install
```

#### Backend Python Dependencies

Using the project virtual environment path:

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

Or create a new virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

These Python requirements include the packages needed for the backend API, the backend `pytest` suite, and the FastAPI test client used by CI verification.

#### ML Pipeline Dependencies

The ML pipeline uses different TensorFlow-related versions from the backend, so use a separate virtual environment inside `ml_pipeline/`.

```powershell
cd ml_pipeline
python -m venv .venv-ml
.\.venv-ml\Scripts\Activate.ps1
pip install -r requirements.txt
```

## 8. Running the Project

### Recommended Run Order

For day-to-day mobile development:

```powershell
npm run backend:start
npm start
```

For the full local project:

```powershell
npm run backend:start
npm start
npm run admin:start
npm run legacy:web:start
```

### MongoDB

MongoDB is optional for a first run because the backend falls back to local JSON storage. If you want persistent database-backed storage, start MongoDB before the backend.

If MongoDB is installed as a Windows service:

```powershell
Get-Service MongoDB
Start-Service MongoDB
```

If you run MongoDB manually:

```powershell
mongod --dbpath C:\data\db
```

Default backend connection string:

```text
mongodb://localhost:27017
```

If MongoDB is not available, the app can still run with local JSON fallback storage for many flows.

### Backend

Start the FastAPI backend from the repository root:

```powershell
npm run backend:start
```

This command is safe to run every day. If the Florana backend is already using
port `8000`, it will reuse that server instead of starting a second Uvicorn
process.

Run with reload only during development:

```powershell
npm run backend:start:reload
```

Check or restart the backend:

```powershell
npm run backend:status
npm run backend:restart
npm run backend:stop
```

Type only the command itself. Do not add explanation text after the command.
For example, use `npm run backend:restart`, not
`npm run backend:restart to start fresh`.

Avoid starting the backend with raw `uvicorn main:app --port 8000` while another
backend is already open, because Uvicorn will try to bind the same port again
and Windows will raise `[Errno 10048]`.

Backend default URL:

```text
http://localhost:8000
```

API docs:

```text
http://localhost:8000/docs
```

### Mobile App

The mobile app uses `mobile/scripts/start-expo.js`. This helper starts Expo and
also checks the backend before Expo opens:

- If a healthy Florana backend is already running on port `8000`, Expo reuses it.
- If no backend is running, the helper tries to start the backend automatically.
- If another service is using the backend port, the helper chooses the next
  available backend port and passes that URL to Expo for the current session.

Start the Expo app:

```powershell
npm start
```

Run Android:

```powershell
npm run android
```

Run iOS:

```powershell
npm run ios
```

Run mobile app in the browser:

```powershell
npm run web
```

For Expo Go on a real phone, set `EXPO_PUBLIC_API_BASE_URL` to your computer LAN IP and keep both devices on the same Wi-Fi network.

Recommended daily startup:

```powershell
npm run backend:start
npm start
```

If you need a fresh backend, run this exact command:

```powershell
npm run backend:restart
```

If you only run `npm start`, backend messages may appear in the same terminal
because the Expo helper is checking or starting the backend for you. That is
expected behavior in this project.

Do not use raw `uvicorn main:app --host 0.0.0.0 --port 8000` for daily startup.
Use the npm backend scripts so duplicate backend processes are handled safely.

### Admin Dashboard

Start the admin dashboard:

```powershell
npm run admin:start
```

Build the admin dashboard:

```powershell
npm run admin:build
```

### Legacy Web Client

Start the legacy React web client:

```powershell
npm run legacy:web:start
```

Build the legacy React web client:

```powershell
npm run legacy:web:build
```

### Model / Prediction

The production prediction endpoint is served by the backend:

```text
POST /predict
POST /diagnose
```

The model files used by the backend are:

```text
backend/ai/plant_disease_model.keras
backend/ai/class_names.json
```

#### Train Or Refresh The Model

The current recommended training script is `ml_pipeline/train.py`. It saves the updated model directly into `backend/ai/`.

1. Prepare the ML environment:

```powershell
cd ml_pipeline
python -m venv .venv-ml
.\.venv-ml\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. If you want to download images from Cloudinary, create a local config first:

```powershell
Copy-Item config_template.py config.py
```

Then add your Cloudinary credentials to `ml_pipeline/config.py`.

3. Optional dataset download:

```powershell
python download_dataset.py
```

4. Arrange your dataset into class folders under `ml_pipeline/dataset/`.

Expected structure:

```text
ml_pipeline/dataset/
  Botrytis/
  Fresh Leaf/
  Leaf_Spot/
  Powdery_Mildew/
  Rust/
```

5. Train the backend model artifact:

```powershell
python train.py
```

Outputs written by `train.py`:

- `backend/ai/plant_disease_model.keras`
- `backend/ai/class_names.json`
- `ml_pipeline/best_model.keras`
- `ml_pipeline/training_history.png`

`train_model.py` is still included as an alternate/manual training workflow that saves local model files based on `ml_pipeline/config.py`, but `train.py` is the best choice when you want to refresh the exact model used by the current backend.

Current mobile prediction behavior:

- Supported backend classes are `Botrytis`, `Fresh Leaf`, `Leaf Spot`, `Powdery Mildew`, and `Rust`
- `Fresh Leaf` is preserved as its own prediction label in the backend
- Low-confidence predictions return `Needs closer inspection`
- The mobile app treats unsupported labels, low-confidence results, or narrow top-prediction margins as unsupported image uploads
- Unrelated or unnecessary images show an error instead of a disease alert

### Root Scripts

| Script | Purpose |
| --- | --- |
| `npm run backend:start` | Start FastAPI backend on port `8000` |
| `npm run backend:start:reload` | Start backend with reload |
| `npm run backend:status` | Check whether backend is healthy |
| `npm run backend:restart` | Stop the old backend and start a fresh backend |
| `npm run backend:stop` | Stop the backend on port `8000` |
| `npm start` | Start Expo mobile app and reuse/start backend if needed |
| `npm run android` | Start Expo Android target and reuse/start backend if needed |
| `npm run ios` | Start Expo iOS target and reuse/start backend if needed |
| `npm run web` | Start Expo web target |
| `npm run admin:start` | Start admin dashboard |
| `npm run admin:build` | Build admin dashboard |
| `npm run payment:mobile` | Start the mobile checkout flow in the Expo app |
| `npm run payment:backend` | Start the optional legacy Flask Stripe checkout backend |
| `npm run legacy:web:start` | Start legacy React web client |
| `npm run legacy:web:build` | Build legacy React web client |
| `npm run mobile:typecheck` | Run mobile TypeScript check |

## 9. Environment Variables

Copy the example files before running locally:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item mobile\.env.example mobile\.env
```

The FastAPI backend runner and the optional Flask payment backend both load
`backend/.env` automatically.

### Backend `.env`

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

`JWT_SECRET_KEY` is read by `backend/utils/security.py` and should be set in any shared or production environment. `STRIPE_PUBLISHABLE_KEY` is optional for the current API response payload but is useful if you extend the mobile checkout with Stripe client-side SDK support.

### Mobile `.env`

```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:8000
```

Choose the value based on where the mobile app is running:

- Real phone with Expo Go: use your computer LAN IP
- Android emulator: `http://10.0.2.2:8000`
- iOS simulator: `http://127.0.0.1:8000`
- Expo web on the same computer: `http://127.0.0.1:8000`

### ML Pipeline Cloudinary Config

The ML pipeline uses `ml_pipeline/config_template.py`. Copy it to `config.py` and add:

```python
CLOUDINARY_CONFIG = {
    "cloud_name": "your_cloud_name",
    "api_key": "your_api_key",
    "api_secret": "your_api_secret"
}
```

Do not commit real credentials, `.env` files, `config.py`, local uploads, datasets, or generated caches.

## 10. API Endpoints

Important backend routes:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Check backend, database, and AI model status |
| `POST` | `/auth/signup` | Register user |
| `POST` | `/auth/login` | Login user |
| `POST` | `/predict` | Predict flower plant disease from uploaded image |
| `GET` | `/history` | Get prediction history |
| `GET` | `/plants` | Get legacy/simple flower plant list |
| `GET` | `/plants/` | Get registered flower plants |
| `POST` | `/plants/` | Register flower plant |
| `DELETE` | `/plants/{plant_id}` | Delete flower plant |
| `GET` | `/plants/by-name/{name}` | Get flower plant profile by name |
| `POST` | `/growth/` | Add growth record |
| `GET` | `/growth/{plant_id}` | Get growth records |
| `GET` | `/quick-tips` | Get personalized care tips |
| `GET` | `/shop/products` | Get shop products |
| `POST` | `/shop/products` | Add shop product |
| `DELETE` | `/shop/products/{product_id}` | Delete shop product |
| `POST` | `/payments/intent` | Create payment intent |
| `POST` | `/payments/confirm` | Save confirmed order/payment |
| `POST` | `/payments/payment-notify` | Legacy payment notification route |
| `POST` | `/feedback/` | Submit feedback |
| `GET` | `/feedback/` | Get feedback |
| `DELETE` | `/feedback/` | Clear feedback |
| `GET` | `/care-reminders/` | Get care reminder settings |
| `PUT` | `/care-reminders/` | Save care reminder settings |
| `POST` | `/care-reminder` | Legacy reminder scheduling route |

Admin routes are protected and use the `/admin` prefix:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/admin/summary` | Admin dashboard summary |
| `GET` | `/admin/users` | Manage users |
| `GET` | `/admin/plants` | Manage flower plants |
| `GET` | `/admin/products` | Manage shop products |
| `GET` | `/admin/feedback` | Manage feedback |
| `GET` | `/admin/payments` | Manage orders/payments |
| `DELETE` | `/admin/plants/{plant_id}` | Delete flower plant as admin |
| `DELETE` | `/admin/products/{product_id}` | Delete product as admin |
| `DELETE` | `/admin/payments/{payment_id}` | Delete payment record as admin |

Uploaded images are served from:

```text
/uploads/<filename>
```

## 11. Screenshots

The preview images below are embedded directly in the README using commit-pinned image URLs, so the current branch does not need to keep the screenshot files tracked.

### Mobile App Preview

| Screen | Preview |
| --- | --- |
| Welcome screen | <img src="https://raw.githubusercontent.com/msnavodya/Florana-FYP/147a44601e892f8f08afb827ce199cbeb73d4a1a/docs/screenshots/welcome-screen.png" alt="Welcome screen" width="220" /> |
| Home dashboard | <img src="https://raw.githubusercontent.com/msnavodya/Florana-FYP/147a44601e892f8f08afb827ce199cbeb73d4a1a/docs/screenshots/home-dashboard.png" alt="Home dashboard" width="220" /> |
| Disease diagnosis result | <img src="https://raw.githubusercontent.com/msnavodya/Florana-FYP/147a44601e892f8f08afb827ce199cbeb73d4a1a/docs/screenshots/diagnosis-result.png" alt="Disease diagnosis result" width="220" /> |
| Plant profile | <img src="https://raw.githubusercontent.com/msnavodya/Florana-FYP/147a44601e892f8f08afb827ce199cbeb73d4a1a/docs/screenshots/plant-profile.png" alt="Plant profile" width="220" /> |
| Growth tracker and history | <img src="https://raw.githubusercontent.com/msnavodya/Florana-FYP/147a44601e892f8f08afb827ce199cbeb73d4a1a/docs/screenshots/growth-tracker.png" alt="Growth tracker and history" width="220" /> |
| Community screen | <img src="https://raw.githubusercontent.com/msnavodya/Florana-FYP/147a44601e892f8f08afb827ce199cbeb73d4a1a/docs/screenshots/community.png" alt="Community screen" width="220" /> |
| Seasonal catalog | <img src="https://raw.githubusercontent.com/msnavodya/Florana-FYP/147a44601e892f8f08afb827ce199cbeb73d4a1a/docs/screenshots/catalog.png" alt="Seasonal catalog" width="220" /> |
| Checkout and payment method | <img src="https://raw.githubusercontent.com/msnavodya/Florana-FYP/147a44601e892f8f08afb827ce199cbeb73d4a1a/docs/screenshots/checkout.png" alt="Checkout and payment method" width="220" /> |

### Admin Dashboard Preview

| Screen | Preview |
| --- | --- |
| Admin dashboard | <img src="https://raw.githubusercontent.com/msnavodya/Florana-FYP/147a44601e892f8f08afb827ce199cbeb73d4a1a/docs/screenshots/admin-dashboard.png" alt="Admin dashboard" width="520" /> |

## 12. Dataset Information

The ML pipeline supports downloading image datasets from Cloudinary, organizing them by class folders, and training a CNN image classifier.

Current backend class labels:

- Botrytis
- Fresh Leaf
- Leaf Spot
- Powdery Mildew
- Rust

Current mobile diagnosis guardrails:

- The backend returns `Needs closer inspection` when confidence is below the configured threshold
- The mobile app only accepts supported class labels from the trained model
- Unsupported, unrelated, or unclear uploads are shown as an error instead of a disease result

Image preprocessing:

- Convert uploaded image to RGB
- Resize image to `224x224`
- Convert image to array
- Normalize pixel values to `0-1`
- Run TensorFlow/Keras model prediction

Dataset workflow:

- Configure Cloudinary credentials in `ml_pipeline/config.py`
- Download images with `download_dataset.py`
- Organize images into class folders
- Train using `train_model.py` or `train.py`
- Export model artifacts for backend use

## 13. Model Details

- Model type: CNN image classification model
- Framework: TensorFlow / Keras
- Input size: `224x224x3`
- Output: multi-class disease prediction
- Backend model file: `backend/ai/plant_disease_model.keras`
- Class labels file: `backend/ai/class_names.json`
- Confidence threshold: backend returns `Needs closer inspection` for low-confidence predictions
- Current backend class count: 5
- Current classes: Botrytis, Fresh Leaf, Leaf Spot, Powdery Mildew, Rust
- Mobile-side guardrails also check supported labels, prediction confidence, and top-prediction margin before showing a disease result

Accuracy depends on the dataset used for the latest training run. The repository includes the trained backend model artifact and the full training pipeline, so final validation accuracy and confusion matrix results can be recorded from the training output.

## Current Repository Status

- Main branch: `main`
- GitHub repository: `https://github.com/msnavodya/Florana-FYP.git`
- Main client: `mobile/`
- Backend default port: `8000`
- Database: MongoDB with local JSON fallback
- Upload storage during development: local `/uploads`
- AI model runtime files: `backend/ai/plant_disease_model.keras` and `backend/ai/class_names.json`

## 14. Future Enhancements

- Live weather-based flower plant care recommendations
- Push notifications through Firebase for scheduled reminders
- Chatbot assistant for flower care questions
- Flower plant doctor consultation booking
- Community forum or shared flower plant posts
- IoT soil moisture and temperature integration
- Cloud deployment for backend, admin dashboard, and database
- Cloud image storage for uploaded flower plant and product images
- More disease classes and larger training dataset

## 15. Contributors

- GitHub: [msnavodya](https://github.com/msnavodya)

## 16. License

This project is prepared for academic/final-year project submission. No separate open-source license file is currently included in the repository.

## 17. Contact

- GitHub Repository: [Florana-FYP](https://github.com/msnavodya/Florana-FYP)
- GitHub Profile: [msnavodya](https://github.com/msnavodya)
- Email: sadininavodya@gmail.com
- LinkedIn: www.linkedin.com/in/sadini-navodya-0305362ab
- Project contact can be made through the GitHub repository profile and issues.

## Verification

Useful checks before pushing changes:

```bash
npm run verify
npm run verify:full
npm run mobile:typecheck
npm run admin:build
.\.venv\Scripts\python.exe -m py_compile backend\main.py backend\routes\plant.py backend\routes\shop.py backend\routes\admin.py
```

`npm run verify` is the recommended main pre-push check. It runs the mobile typecheck, admin dashboard build, Python syntax compilation for the backend and ML scripts, and the backend `pytest` suite.

`npm run verify:full` adds the legacy React web production build on top of the standard verification steps.

Backend verification does not require MongoDB to be running. The API and tests are expected to work with the repository's local JSON fallback behavior when MongoDB is unavailable.

The GitHub Actions workflow in `.github/workflows/verify.yml` installs `backend/requirements.txt` and runs the same `npm run verify` command used locally, so a passing local verify run is the closest match to CI.

## Git Notes

Ignored local files include virtual environments, `node_modules`, environment files, local uploads, generated caches, and large local datasets. Commit source code, configuration examples, documentation, and intended static assets only.
