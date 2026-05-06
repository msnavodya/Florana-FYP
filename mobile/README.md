# Florana Mobile

This Expo app is the main Florana client in this repo.

- `../mobile`: active Expo app for diagnosis, plants, shop, and reminders
- `../frontend`: separate Expo payment demo used by the Stripe checkout flow
- `../florana`: older React web client kept for legacy reference

## Run

1. Copy `.env.example` to `.env`.
2. Set `EXPO_PUBLIC_API_BASE_URL` to your computer's LAN IP, for example `http://192.168.8.116:8000`.
3. Install dependencies with `npm install`.
4. Start Expo with `npm start`.
5. The Expo helper script checks the backend on the same port configured in `EXPO_PUBLIC_API_BASE_URL`, or `8000` by default.
6. If the backend is already running, Expo will reuse it. If the backend is not running, the helper will try to start it.
7. Press `a` for Android, `i` for iOS, or scan the QR code with Expo Go.

## Why Expo Shows Backend Messages

`npm start`, `npm run android`, and `npm run ios` run `mobile/scripts/start-expo.js`.
That script manages both the mobile session and the local backend connection:

- It checks `http://127.0.0.1:8000/health`.
- If Florana backend is healthy, it reuses the existing backend.
- If the backend is missing, it starts `backend/run_backend.py`.
- It passes the correct API URL to Expo for the current session.

So seeing backend text in the Expo terminal is normal for this project. For the
cleanest daily workflow, start the backend first from the repo root:

```bash
npm run backend:start
npm start
```

Use `npm run backend:restart` when you need a fresh backend process, and
`npm run backend:stop` when you want to close the backend completely.

Type only the command. Do not add extra words after it. For example:

```bash
npm run backend:restart
```

Do not type:

```bash
npm run backend:restart to start fresh
```

## Backend URL notes

- Physical Android device with Expo Go: use your computer's LAN IP, for example `http://192.168.8.116:8000`
- Android emulator fallback: `http://10.0.2.2:8000`
- iOS simulator fallback: `http://127.0.0.1:8000`
- If you change the backend port, update `EXPO_PUBLIC_API_BASE_URL` so the mobile app and startup script stay aligned.
- `npm start` now defaults Expo to `--lan`, which is the right mode for a phone talking to a local backend on the same Wi-Fi.

## Backend checklist for Expo Go

1. Start the backend with `npm run backend:start` from the repo root. This safely reuses an already-running Florana backend on port `8000`.
2. Use `npm run backend:restart` when you want to stop the old backend and start a fresh one.
3. Use `npm run backend:stop` if you need to close the backend completely.
4. Use `npm run backend:start:reload` only if you specifically need auto-reload. The non-reload server is the stable default for the TensorFlow disease model on this setup.
5. Keep the phone and laptop on the same Wi-Fi network.
6. Allow inbound TCP traffic to Python or port `8000` in Windows Defender Firewall.
7. Open `http://YOUR_LAN_IP:8000/health` from the phone browser. If this fails in the browser, Expo Go will fail too.
8. Avoid `localhost`, `127.0.0.1`, and `10.0.2.2` on a real phone. Those only work on the same machine or inside the Android emulator.

## Command Summary

| Command | Purpose |
| --- | --- |
| `npm start` | Start Expo and reuse/start backend if needed |
| `npm run android` | Start Expo Android and reuse/start backend if needed |
| `npm run ios` | Start Expo iOS and reuse/start backend if needed |
| `npm run web` | Start Expo web only |
| `npm run typecheck` | Run TypeScript check |
| `npm run backend:start` | Start or reuse backend when run from repo root or `backend/` |
| `npm run backend:status` | Check backend health |
| `npm run backend:restart` | Restart backend |
| `npm run backend:stop` | Stop backend |

## Mobile coverage

- Auth flow backed by `/auth/login` and `/auth/signup`
- Shop catalog and sell flow backed by `/shop/products`
- Cart with device persistence and backend payment notification
- Plant registration, listing, flower profile, and growth tracking backed by `/plants` and `/growth`
- Disease prediction using Expo Image Picker and `/predict`
- Care reminders using Expo Notifications and AsyncStorage
- Settings, profile, help, about, quick tips, and feedback screens rebuilt natively
