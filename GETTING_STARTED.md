# Florana Getting Started

This guide is the fastest path for someone opening the repository on GitHub and wanting to run Florana locally with the fewest surprises.

## 1. Clone The Repository

```powershell
git clone https://github.com/msnavodya/Florana-FYP.git
cd Florana-FYP
```

## 2. Install Everything

Run the workspace setup script from the repository root:

```powershell
npm run setup
```

What this does:

- installs root JavaScript dependencies
- installs `mobile/`, `admin-dashboard/`, and `florana/` dependencies
- creates `.venv/` if it does not exist
- installs backend Python dependencies into `.venv/`
- creates `backend/.env` and `mobile/.env` from their example files if missing

## 3. Verify The Clone

Run the standard verification:

```powershell
npm run verify
```

Run the full verification, including the legacy web build:

```powershell
npm run verify:full
```

## 4. Start The Main Project

Use separate terminals from the repository root.

Terminal 1:

```powershell
npm run backend:start
```

Terminal 2:

```powershell
npm start
```

Optional Terminal 3 for the admin dashboard:

```powershell
npm run admin:start
```

Optional Terminal 4 for the older legacy web client:

```powershell
npm run legacy:web:start
```

## 5. Local URLs

- Backend API: `http://127.0.0.1:8000`
- Backend docs: `http://127.0.0.1:8000/docs`
- Admin dashboard: `http://127.0.0.1:5173`
- Mobile Expo dev server: usually `http://127.0.0.1:8081`
- Legacy web client: `http://127.0.0.1:3000`

## 6. Admin Login

For local development, the admin dashboard can use:

- Email: `admin@florana.com`
- Password: `123456`

The backend creates that admin account automatically in the current development flow.

## 7. Mobile API URL For Real Phones

If you run the mobile app on a real phone with Expo Go, update `mobile/.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:8000
```

Examples:

- Android emulator: `http://10.0.2.2:8000`
- iOS simulator: `http://127.0.0.1:8000`
- Web on the same computer: `http://127.0.0.1:8000`

## 8. Notes

- MongoDB is optional for a first run because the backend falls back to local JSON storage.
- If `npm run verify` fails before setup, run `npm run setup` first.
- For deeper module-specific instructions, use the repository guides linked in [`README.md`](./README.md).
