# Florana Admin Dashboard

The `admin-dashboard/` folder contains the Florana admin web dashboard built with React and Vite. It is used to review backend summary data and manage users, plants, feedback, and payment records through the protected `/admin` API routes.

## Overview

This dashboard is built with:

- React
- React Router
- Vite
- Tailwind CSS
- Axios
- Recharts
- Lucide React

The admin dashboard supports:

- admin login
- summary metrics from the backend
- plant record review and deletion
- user listing
- feedback review and deletion
- payment/order review and deletion

## Main Files

Important files inside `admin-dashboard/`:

```text
admin-dashboard/
|-- src/
|   |-- components/         Shared admin UI building blocks
|   |-- hooks/              Shared data-loading hooks
|   |-- layouts/            Admin shell layout and navigation
|   |-- pages/              Routed and additional dashboard page modules
|   `-- services/           API client and local chart/mock helpers
|-- index.html
|-- package.json
|-- postcss.config.js
|-- tailwind.config.js
`-- vite.config.js
```

## Route Coverage

Current routed pages in `src/App.jsx`:

- `/login`
  Admin login page backed by `/auth/login`.
- `/`
  Dashboard summary page.
- `/plants`
  Plant management table.
- `/feedback`
  Feedback management table.
- `/payments`
  Payment and order management table.
- `/users`
  User list page.

Current routed navigation is defined in:

- `src/App.jsx`
- `src/layouts/AdminLayout.jsx`
- `src/components/ProtectedRoute.jsx`

## Additional Page Modules

The repository also contains extra page components under `src/pages/` that are not part of the current routed admin navigation:

- `CareReminders.jsx`
- `DiseasePredictions.jsx`
- `GrowthTracking.jsx`
- `Products.jsx`
- `ReportsAnalytics.jsx`
- `Settings.jsx`
- `ShopProducts.jsx`

These files are useful references for future expansion, but the current dashboard navigation exposes only Dashboard, Plants, Feedback, Payments, and Users.

## API Integration

Main API client file:

- `src/services/api.js`

Current API behavior:

- Reads `VITE_API_BASE_URL` when provided.
- Falls back to `http://localhost:8000` by default.
- Tries legacy fallback URLs for compatible read requests.
- Stores the admin token in browser `localStorage`.
- Requires the backend user role to be `admin`.

Current backend endpoints used by the dashboard:

- `/auth/login`
- `/admin/summary`
- `/admin/users`
- `/admin/plants`
- `/admin/products`
- `/admin/feedback`
- `/admin/payments`
- `/admin/plants/{id}`
- `/admin/products/{id}`
- `/admin/feedback/{id}`
- `/admin/payments/{id}`

## Local Login

The current login screen in `src/pages/Login.jsx` is prefilled for local development with:

- email: `admin@florana.com`
- password: `123456`

That admin account is created automatically by the backend login flow when using the current development setup.

## Environment

Optional local environment variable:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

If this variable is not set, the dashboard defaults to the local Florana backend on port `8000`.

## Run

From the repository root:

```powershell
npm run admin:start
```

Useful commands:

| Command | Purpose |
| --- | --- |
| `npm run admin:start` | Start the Vite admin dashboard |
| `npm run admin:build` | Build the dashboard for production |
| `npm run admin:preview` | Preview the production build |

From inside `admin-dashboard/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite dev server on port `5173` |
| `npm run build` | Build the dashboard |
| `npm run preview` | Preview the production build |

Default local URL:

```text
http://127.0.0.1:5173
```

## Verification

Recommended check from the repository root:

```powershell
npm --prefix admin-dashboard run build
```

Verification notes:

- The dashboard build depends on Vite and `esbuild`.
- A successful build is the main verification step for this module.
- The root `npm run verify` command also includes the admin build.

## Related Docs

- Root project guide: [`../README.md`](../README.md)
- Backend guide: [`../backend/README.md`](../backend/README.md)
- Mobile app guide: [`../mobile/README.md`](../mobile/README.md)
