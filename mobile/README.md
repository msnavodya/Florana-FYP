# Florana Mobile

This Expo app lives next to the existing web app and does not modify `../florana`.

## Run

1. Optionally copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL`.
2. Start Expo with `npm start`. The helper script will try to start the backend on the same port configured in `EXPO_PUBLIC_API_URL`, or `8000` by default.
3. Install dependencies with `npm install`.
4. If the backend is already running, Expo will reuse it.
5. Press `a` for Android, `i` for iOS, or scan the QR code with Expo Go.

## Backend URL notes

- Android emulator default: `http://10.0.2.2:8000`
- iOS simulator default: `http://127.0.0.1:8000`
- Physical device: use your computer's LAN IP, for example `http://192.168.1.10:8000`
- If you change the backend port, update `EXPO_PUBLIC_API_URL` so the mobile app and startup script stay aligned.

## Mobile coverage

- Auth flow backed by `/auth/login` and `/auth/signup`
- Shop catalog and sell flow backed by `/shop/products`
- Cart with device persistence and backend payment notification
- Plant registration, listing, flower profile, and growth tracking backed by `/plants` and `/growth`
- Disease prediction using Expo Image Picker and `/predict`
- Care reminders using Expo Notifications and AsyncStorage
- Settings, profile, help, about, quick tips, and feedback screens rebuilt natively
