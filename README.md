# Florana - Smart Plant Care & Disease Detection Mobile Application

Florana is a final-year project for plant care, disease detection, growth tracking, and plant shopping. It combines an Expo React Native mobile app, a FastAPI backend, a TensorFlow/Keras disease prediction model, an admin dashboard, and a legacy React web client.

## 1. Project Title

Project name:

```text
Florana - Smart Plant Care & Disease Detection Mobile Application
```

Tagline:

```text
AI-powered plant health monitoring, care management, and seasonal plant shopping platform.
```

## 2. Project Overview / Description

Florana helps plant owners identify plant diseases from uploaded images, register and monitor their plants, manage care reminders, and browse or sell seasonal plants through a built-in shop.

The project is designed for home gardeners, plant collectors, small plant sellers, and students who need a practical plant health management system. It solves common problems such as delayed disease identification, missed plant care tasks, disconnected plant records, and manual plant shop/order handling.

Main capabilities:

- AI-powered plant disease detection from image uploads
- Plant health monitoring and plant profile management
- Growth tracking with charts
- Care reminders and quick tips
- Seasonal plant shop with cart and checkout flow
- Admin dashboard for managing users, plants, products, feedback, and orders

## 3. Features

### Core Features

- User registration and login
- Plant disease prediction from image upload
- Plant registration with image, city, sunlight, soil, climate, and care details
- My Plants dashboard with plant profile view and delete support
- Plant care tracking and growth history
- Care reminders and custom care notes
- Plant shop with seasonal catalog, product details, cart, and checkout
- Sell Plants flow for adding shop listings
- Feedback, profile, settings, help, and about screens
- Local JSON fallback storage when MongoDB is not connected

### Advanced Features

- Location-aware plant registration using Sri Lankan city options
- Seasonal catalog for Spring, Summer, Autumn, and Winter plants
- Personalized quick tips based on time, season, and tracked plants
- Growth tracking charts for registered plants
- Multi-language app text support
- Currency switching for shop prices
- Admin analytics summary for users, plants, products, feedback, payments, and revenue
- Optional Cloudinary dataset download workflow for ML training

### Planned / Future Advanced Features

- Live weather integration for care recommendations
- Community plant sharing features
- Push notification improvements
- Chatbot plant assistant
- Plant doctor consultation workflow
- IoT sensor integration for soil moisture and environment tracking

## 4. Tech Stack

### Frontend

- Expo
- React Native
- TypeScript
- React Native SVG
- React Native Chart Kit
- AsyncStorage

### Admin Dashboard

- React
- Vite
- JavaScript
- Tailwind CSS
- Recharts
- Axios

### Legacy Web Client

- React
- JavaScript
- React Router
- Axios
- Chart.js

### Backend

- FastAPI
- Python
- Uvicorn
- Pydantic
- JWT authentication utilities
- Local JSON fallback storage

### Database

- MongoDB
- Local JSON files for development fallback

### AI/ML

- TensorFlow
- Keras
- CNN image classification model
- Pillow / OpenCV image preprocessing
- NumPy

### Cloud Services

- Cloudinary for optional ML dataset download workflow
- Stripe configuration support for payment intent flow
- Firebase Admin SDK support for notification integration when configured

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
- The mobile app sends auth, plant, prediction, shop, payment, feedback, and reminder requests to the FastAPI API.
- The backend stores records in MongoDB when available.
- If MongoDB is unavailable, the backend falls back to local JSON storage.
- Uploaded images are saved locally and served through `/uploads`.
- Disease prediction uses the trained TensorFlow/Keras model in `backend/ai/`.
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

### Clone Repository

```bash
git clone https://github.com/msnavodya/Florana-FYP.git
cd Florana-FYP
```

### Install JavaScript Dependencies

```bash
npm install
npm --prefix mobile install
npm --prefix admin-dashboard install
npm --prefix florana install
```

### Install Backend Python Dependencies

Using the existing project virtual environment path:

```bash
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

Or create a new virtual environment:

```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

### Install ML Pipeline Dependencies

```bash
cd ml_pipeline
pip install -r requirements.txt
```

## 8. Running the Project

### Backend

Start the FastAPI backend from the repository root:

```bash
npm run backend:start
```

Run with reload only during development:

```bash
npm run backend:start:reload
```

Backend default URL:

```text
http://localhost:8000
```

API docs:

```text
http://localhost:8000/docs
```

### Mobile App

Start the Expo app:

```bash
npm start
```

Run Android:

```bash
npm run android
```

Run iOS:

```bash
npm run ios
```

Run mobile app in the browser:

```bash
npm run web
```

For Expo Go on a real phone, set `EXPO_PUBLIC_API_BASE_URL` to your computer LAN IP and keep both devices on the same Wi-Fi network.

### Admin Dashboard

Start the admin dashboard:

```bash
npm run admin:start
```

Build the admin dashboard:

```bash
npm run admin:build
```

### Legacy Web Client

Start the legacy React web client:

```bash
npm run legacy:web:start
```

Build the legacy React web client:

```bash
npm run legacy:web:build
```

### Model / Prediction

The production prediction endpoint is served by the backend:

```text
POST /predict
```

The model files used by the backend are:

```text
backend/ai/plant_disease_model.keras
backend/ai/class_names.json
```

To train or update the model, use the workflow in `ml_pipeline/`.

## 9. Environment Variables

Copy the example files before running locally:

```bash
copy backend\.env.example backend\.env
copy mobile\.env.example mobile\.env
```

### Backend `.env`

```env
MONGO_URL=mongodb://localhost:27017
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
PUBLIC_BASE_URL=http://YOUR_LAN_IP:5000
DEFAULT_RETURN_URL=florana-payments://checkout-result
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=http://localhost:8081,http://127.0.0.1:8081,http://localhost:8083,http://127.0.0.1:8083
ALLOWED_RETURN_URL_PREFIXES=exp://,exps://,florana-payments://,https://auth.expo.io/
```

JWT signing is currently configured in `backend/utils/security.py`. For production, move the secret into an environment variable such as `JWT_SECRET_KEY`.

### Mobile `.env`

```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:8000
```

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
| `POST` | `/predict` | Predict plant disease from uploaded image |
| `GET` | `/history` | Get prediction history |
| `GET` | `/plants` | Get legacy/simple plant list |
| `GET` | `/plants/` | Get registered plants |
| `POST` | `/plants/` | Register plant |
| `DELETE` | `/plants/{plant_id}` | Delete plant |
| `GET` | `/plants/by-name/{name}` | Get plant profile by name |
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
| `GET` | `/admin/plants` | Manage plants |
| `GET` | `/admin/products` | Manage shop products |
| `GET` | `/admin/feedback` | Manage feedback |
| `GET` | `/admin/payments` | Manage orders/payments |
| `DELETE` | `/admin/plants/{plant_id}` | Delete plant as admin |
| `DELETE` | `/admin/products/{product_id}` | Delete product as admin |
| `DELETE` | `/admin/payments/{payment_id}` | Delete payment record as admin |

Uploaded images are served from:

```text
/uploads/<filename>
```

## 11. Screenshots

Add final app screenshots to `docs/screenshots/` before submission or GitHub presentation.

Recommended screenshots:

| Screen | Suggested File |
| --- | --- |
| Welcome screen | `docs/screenshots/welcome.png` |
| Home screen | `docs/screenshots/home.png` |
| Disease detection | `docs/screenshots/disease-detection.png` |
| My Plants dashboard | `docs/screenshots/my-plants.png` |
| Plant profile and growth chart | `docs/screenshots/plant-profile.png` |
| Seasonal shop catalog | `docs/screenshots/shop.png` |
| Cart / checkout | `docs/screenshots/cart.png` |
| Admin dashboard | `docs/screenshots/admin-dashboard.png` |

## 12. Dataset Information

The ML pipeline supports downloading image datasets from Cloudinary, organizing them by class folders, and training a CNN image classifier.

Current backend class labels:

- Botrytis
- Fresh Leaf
- Leaf Spot
- Powdery Mildew
- Rust

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

Accuracy depends on the training dataset and the latest trained model. Add final training accuracy, validation accuracy, dataset size, and confusion matrix details after model evaluation.

## 14. Future Enhancements

- Live weather-based plant care recommendations
- Push notifications through Firebase for scheduled reminders
- Chatbot assistant for plant care questions
- Plant doctor consultation booking
- Community forum or shared plant posts
- IoT soil moisture and temperature integration
- Cloud deployment for backend, admin dashboard, and database
- Cloud image storage for uploaded plant and product images
- More disease classes and larger training dataset

## 15. Contributors

- Florana Development Team
- GitHub: [msnavodya](https://github.com/msnavodya)

## 16. License

This project is currently prepared for academic/final-year project submission. Add an open-source license such as MIT before public reuse or distribution.

## 17. Contact

- GitHub Repository: [Florana-FYP](https://github.com/msnavodya/Florana-FYP)
- GitHub Profile: [msnavodya](https://github.com/msnavodya)
- Email: Add your email address here
- LinkedIn: Add your LinkedIn profile here

## Verification

Useful checks before pushing changes:

```bash
npm run mobile:typecheck
npm run admin:build
.\.venv\Scripts\python.exe -m py_compile backend\main.py backend\routes\plant.py backend\routes\shop.py backend\routes\admin.py
```

## Git Notes

Ignored local files include virtual environments, `node_modules`, environment files, local uploads, generated caches, and large local datasets. Commit source code, configuration examples, documentation, and intended static assets only.
