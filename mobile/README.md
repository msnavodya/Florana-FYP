# Florana Mobile App

The `mobile/` folder contains the main Florana Expo React Native application. This is the primary client for plant diagnosis, plant registration, care reminders, growth tracking, multilingual UI, seasonal shopping, and feedback.

## Overview

This app is built with:

- Expo
- React Native
- TypeScript
- Expo Router
- AsyncStorage
- Expo Image Picker
- Expo Notifications

The mobile app talks to the FastAPI backend for:

- authentication
- plant registration and profile data
- disease prediction
- growth records
- shop products
- feedback
- care reminder persistence
- payment/order flows

## Main Features

- User signup and login
- Home dashboard with shortcuts and live status
- Plant disease prediction from uploaded images
- Plant registration with care-related details
- My Plants dashboard and detailed flower profile screen
- Growth history and chart view
- Care Reminder screen with saved settings, custom notes, and multilingual reminder UI
- Quick Tip community-style local sharing space
- Shop catalog, season browsing, product details, cart, and checkout flow
- Sell plant flow for adding marketplace listings
- Profile, settings, feedback, help, and about screens
- Multi-language interface support
- Currency switcher for product pricing

## Current Screens

Implemented screens in `mobile/src/screens/`:

- `WelcomeScreen.tsx`
- `LoginScreen.tsx`
- `RegisterScreen.tsx`
- `HomeScreen.tsx`
- `MyPlantsScreen.tsx`
- `RegisterPlantScreen.tsx`
- `FlowerProfileScreen.tsx`
- `CareReminderScreen.tsx`
- `QuickTipScreen.tsx`
- `CatalogScreen.tsx`
- `SeasonScreen.tsx`
- `SellScreen.tsx`
- `ProductDetailsScreen.tsx`
- `CartScreen.tsx`
- `ProfileScreen.tsx`
- `FeedbackScreen.tsx`
- `SettingsScreen.tsx`
- `HelpScreen.tsx`
- `AboutScreen.tsx`

## Route Coverage

Main Expo Router entry files in `mobile/app/`:

- `index.tsx`
  Renders `WelcomeScreen` for signed-out users and redirects authenticated users to `/home`.
- `home.tsx`
- `login.tsx`
- `register.tsx`
- `myplants.tsx`
- `plant-register.tsx`
- `care.tsx`
- `quicktip.tsx`
- `catalog.tsx`
- `season/[season].tsx`
- `sell.tsx`
- `product/[id].tsx`
- `cart.tsx`
- `profile.tsx`
- `feedback.tsx`
- `settings.tsx`
- `help.tsx`
- `about.tsx`

Compatibility aliases:

- `tips.tsx`
  Redirects legacy `/tips` navigation to `/quicktip`.
- `reminder.tsx`
  Redirects legacy `/reminder` navigation to `/care`.

## Project Structure

Important folders and files inside `mobile/`:

```text
mobile/
|-- app/                    Expo Router route entry files
|-- assets/                 Images, icons, and static assets
|-- scripts/                Startup helpers such as start-expo.js
|-- src/
|   |-- components/         Shared UI components
|   |-- context/            App-wide state providers
|   |-- lib/                API clients, config, storage helpers
|   |-- screens/            Main screen implementations
|   |-- theme/              Tokens and brand styling
|   |-- types/              Shared TypeScript models
|   `-- utils/              Translation tables and utility helpers
|-- .env.example
|-- package.json
`-- tsconfig.json
```

## Shared UI Components

Main reusable components in `mobile/src/components/`:

- `AppMenu.tsx`
- `BottomNav.tsx`
- `CurrencySwitcher.tsx`
- `GrowthChart.tsx`
- `LanguageSelector.tsx`
- `PlantCard.tsx`
- `PrimaryButton.tsx`
- `ProductCard.tsx`
- `Screen.tsx`
- `TextField.tsx`
- `TopBar.tsx`

## App State / Context

Main providers in `mobile/src/context/`:

- `AuthContext.tsx`
  Handles login state and current user session.
- `CartContext.tsx`
  Stores cart items and cart actions.
- `LanguageContext.tsx`
  Controls language selection and the shared translator function.
- `SettingsContext.tsx`
  Stores device-level app settings, reminders, and feedback cache behavior.

## Translation System

Language handling is driven by:

- `mobile/src/context/LanguageContext.tsx`
- `mobile/src/utils/translations.ts`
- `mobile/src/utils/translationOverrides.ts`

Supported language labels:

- English
- Sinhala
- Tamil
- Spanish
- French
- Arabic
- Hindi
- Chinese

Notes:

- The app uses `t("key")` from `LanguageContext` for screen text.
- `translations.ts` contains the main translation dataset.
- `translationOverrides.ts` is used for targeted fixes and newer screen text.
- The Care Reminder screen now uses the shared translator path instead of isolated page-only copy, so reminder text is consistent across supported languages.

## Care Reminder Notes

The Care Reminder flow combines local device state and backend persistence.

Main files:

- `mobile/src/screens/CareReminderScreen.tsx`
- `mobile/src/context/SettingsContext.tsx`
- `mobile/src/lib/api/reminders.ts`

Current behavior:

- Reminder options are stored through `/care-reminders/`
- Watering time is validated using 24-hour `HH:MM` format
- Reminder settings are auto-saved
- Custom notes are stored in the reminder state
- In-app reminder activity is stored locally in reminder state
- Expo push notification support is used when available outside Expo Go limitations
- Reminder UI labels now follow the shared translation system

## API Configuration

The mobile app reads its backend base URL from:

```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:8000
```

Setup steps:

1. Copy `.env.example` to `.env`
2. Set `EXPO_PUBLIC_API_BASE_URL`
3. Install dependencies
4. Start the backend
5. Start Expo

Fastest root-level setup:

```powershell
npm run setup
```

## Install

From the repository root:

```powershell
npm --prefix mobile install
```

Or from inside `mobile/`:

```powershell
npm install
```

## Run

Recommended from the repository root with separate terminals:

Terminal 1:

```powershell
npm run backend:start
```

Terminal 2:

```powershell
npm start
```

From the repository root:

```powershell
npm run backend:start
npm start
```

Recommended first-time verification from the repository root:

```powershell
npm run verify
```

Or from inside `mobile/`:

```powershell
npm start
```

Common local URLs:

- Backend API: `http://127.0.0.1:8000`
- Backend docs: `http://127.0.0.1:8000/docs`
- Expo dev server: usually `http://127.0.0.1:8081` or the next free Expo port

Useful commands:

| Command | Purpose |
| --- | --- |
| `npm start` | Start Expo |
| `npm run android` | Start Expo for Android |
| `npm run ios` | Start Expo for iOS |
| `npm run web` | Start Expo web |
| `npm run typecheck` | Run TypeScript validation |

From the repository root:

| Command | Purpose |
| --- | --- |
| `npm run backend:start` | Start or reuse the FastAPI backend |
| `npm run backend:restart` | Restart backend |
| `npm run backend:stop` | Stop backend |
| `npm run backend:status` | Check backend health |
| `npm run mobile:typecheck` | Run mobile TypeScript check |

## Expo Startup Behavior

`mobile/scripts/start-expo.js` is used for Expo startup.

What it does:

- checks backend availability
- reuses the backend if already running
- attempts to start the backend if needed
- passes the correct API URL into the Expo session

This is why backend text may appear in the same terminal when starting Expo. That is expected in this project.

## Device / Emulator API URL Notes

- Real phone on same Wi-Fi: use your computer LAN IP
- Android emulator: `http://10.0.2.2:8000`
- iOS simulator: `http://127.0.0.1:8000`
- Web: usually `http://127.0.0.1:8000` or your chosen local backend URL

Do not use `localhost` on a real phone.

## Troubleshooting

Common checks:

- Confirm backend health at `http://YOUR_IP:8000/health`
- Keep phone and computer on the same Wi-Fi
- Make sure Windows Firewall allows backend access
- Verify `EXPO_PUBLIC_API_BASE_URL` points to the correct machine and port
- If Expo Go cannot reach backend, test the backend URL directly in the phone browser first
- Use `npm run backend:restart` if backend state looks stale

Care Reminder-specific checks:

- Use valid watering time like `07:00` or `18:30`
- Push notifications may not fully work in Expo Go depending on environment
- Reminder language text depends on the selected language in app settings

## Verification

Recommended validation:

```powershell
npm run typecheck
```

From the repository root:

```powershell
npm run mobile:typecheck
```

## Related Documentation

- Root repository guide: [`../README.md`](../README.md)
- Legacy web module guide: [`../florana/README.md`](../florana/README.md)
- ML pipeline guide: [`../ml_pipeline/README.md`](../ml_pipeline/README.md)
- Payment setup notes: [`../PAYMENT_SYSTEM_GUIDE.md`](../PAYMENT_SYSTEM_GUIDE.md)
