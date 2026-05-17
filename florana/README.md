# Florana Legacy Web Client

The `florana/` folder contains the older React web client that is kept in this repository for reference and optional local use. The main client for the project is the Expo mobile app in `mobile/`.

## What This Module Is

- Framework: Create React App
- Port in development: `3000`
- Start command from repo root: `npm run legacy:web:start`
- Build command from repo root: `npm run legacy:web:build`

## When To Use It

Use this client only if you specifically want to review or demo the older web experience. For the main project flow, use:

- `mobile/` for the primary user app
- `backend/` for the FastAPI API
- `admin-dashboard/` for admin management

## Install

From the repository root:

```powershell
npm --prefix florana install
```

Or just run the root workspace setup:

```powershell
npm run setup
```

## Run

Start the backend first:

```powershell
npm run backend:start
```

Then start the legacy web client:

```powershell
npm run legacy:web:start
```

The app opens on:

```text
http://127.0.0.1:3000
```

## Build

```powershell
npm run legacy:web:build
```

## Notes

- This module is not the primary maintained client.
- The main full-project run guide is in the root [README](../README.md).
- Payment-related notes for the repository are documented in [PAYMENT_SYSTEM_GUIDE.md](../PAYMENT_SYSTEM_GUIDE.md).
