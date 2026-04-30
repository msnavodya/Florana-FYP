# Florana Workspace

This repository currently contains three client folders because they serve different roles:

- `mobile/`: the main Florana Expo app. Use this for plant diagnosis, plant tracking, shop, reminders, and the current mobile UI.
- `frontend/`: a standalone Expo payment demo used for the Stripe checkout experiment.
- `florana/`: the older React web client kept as a legacy app/reference.
- `backend/`: the FastAPI backend and TensorFlow disease model used by the apps.

## Recommended commands

- `npm start`: start the main `mobile/` app
- `npm run web`: run the main `mobile/` app in the browser
- `npm run backend:start`: start the FastAPI backend on port `8000`
- `npm run payments:start`: start the separate payment demo in `frontend/`
- `npm run legacy:web:start`: start the older React web client in `florana/`

If you only want the current Florana app, work in `mobile/` and `backend/`.
