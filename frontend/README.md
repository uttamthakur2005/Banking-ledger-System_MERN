# Ledger System – Banking Ledger frontend (React + Vite)

Frontend for the BankingLedger-System backend (Node/Express/MongoDB).

## Run

```bash
# 1) backend (port 8000) – in the backend folder
npm run dev

# 2) frontend – in this folder
npm install
npm run dev          # http://localhost:5173
```

Vite proxies `/api` to `http://localhost:8000`, so cookies work and no CORS setup is needed.
Different backend URL: `VITE_API_TARGET=http://host:port npm run dev`.

## Features
- Landing page with an animated double-entry ledger
- Register / login with validation, password strength meter, show/hide password, login throttle
- Session: JWT kept in memory only, restored via the server cookie, logout revokes the token (blacklist),
  global 401 handling, auto sign-out after inactivity (configurable) with a 60 s warning
- Overview: total + per-account balances (live from ledger), open account, copy account ID, hide balances
- Transfer: review step, idempotency key per attempt, animated "posting" progress (backend takes ~15 s),
  saved recipients, double-submit and tab-close protection
- Fund (system user only): `POST /api/transaction/system/initial-funds`
- Activity: ledger-style debit/credit table with filters and CSV export
- Security page, toasts, skeleton loaders, responsive (bottom nav on mobile), reduced-motion support

## Limitations of the current backend
- There is no "list transactions" endpoint, so Activity shows transfers made from this browser
  (localStorage). Add `GET /api/transaction` and swap it into `src/data.jsx` for full history.
- There is no `GET /api/auth/me`; the session is verified with `GET /api/accounts` on reload.
