# Florana Mobile

This Expo app is the main Florana client in this repo.

- `../mobile`: active Expo app for diagnosis, plants, shop, and reminders
- `../frontend`: separate Expo payment demo used by the Stripe checkout flow
- `../florana`: older React web client kept for legacy reference

## Run

1. Copy `.env.example` to `.env`.
2. Set `EXPO_PUBLIC_API_BASE_URL` to your computer's LAN IP, for example `http://192.168.8.116:8000`.
3. Start Expo with `npm start`. The helper script will try to start the backend on the same port configured in `EXPO_PUBLIC_API_BASE_URL`, or `8000` by default.
4. Install dependencies with `npm install`.
5. If the backend is already running, Expo will reuse it.
6. Press `a` for Android, `i` for iOS, or scan the QR code with Expo Go.

## Backend URL notes

- Physical Android device with Expo Go: use your computer's LAN IP, for example `http://192.168.8.116:8000`
- Android emulator fallback: `http://10.0.2.2:8000`
- iOS simulator fallback: `http://127.0.0.1:8000`
- If you change the backend port, update `EXPO_PUBLIC_API_BASE_URL` so the mobile app and startup script stay aligned.
- `npm start` now defaults Expo to `--lan`, which is the right mode for a phone talking to a local backend on the same Wi-Fi.

## Backend checklist for Expo Go

1. Start the backend with `npm run backend:start` from the repo root, or run `python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000`.
2. Use `npm run backend:start:reload` only if you specifically need auto-reload. The non-reload server is the stable default for the TensorFlow disease model on this setup.
3. Keep the phone and laptop on the same Wi-Fi network.
4. Allow inbound TCP traffic to Python or port `8000` in Windows Defender Firewall.
5. Open `http://YOUR_LAN_IP:8000/health` from the phone browser. If this fails in the browser, Expo Go will fail too.
6. Avoid `localhost`, `127.0.0.1`, and `10.0.2.2` on a real phone. Those only work on the same machine or inside the Android emulator.

## Mobile coverage

- Auth flow backed by `/auth/login` and `/auth/signup`
- Shop catalog and sell flow backed by `/shop/products`
- Cart with device persistence and backend payment notification
- Plant registration, listing, flower profile, and growth tracking backed by `/plants` and `/growth`
- Disease prediction using Expo Image Picker and `/predict`
- Care reminders using Expo Notifications and AsyncStorage
- Settings, profile, help, about, quick tips, and feedback screens rebuilt natively
