# Banking Ledger System

A full-stack banking ledger application with a React and Vite frontend and a Node.js/Express backend backed by MongoDB. Users can register, sign in, create accounts, view ledger-based balances, and transfer funds between accounts.

> **Note:** This is a learning project, not a real banking service. Do not use it to store or transfer real money or sensitive financial data.

## Features

### Frontend

- Responsive dashboard with account balances and account management
- Registration, login, logout, and session restoration through a server cookie
- Account creation and balance lookup
- Fund transfers with a review step, idempotency key, and saved recipients
- Activity view with filters and CSV export
- Security settings, loading states, and notifications

### Backend

- REST API built with Express
- MongoDB data persistence with Mongoose
- JWT-based authentication and protected account/transaction routes
- Account balances calculated from debit and credit ledger entries
- Transaction status tracking and idempotency-key checks
- Registration and transaction email notifications via Gmail OAuth2

## Tech Stack

- **Frontend:** React, Vite, JavaScript
- **Backend:** Node.js, Express
- **Database:** MongoDB, Mongoose
- **Authentication:** JSON Web Tokens (JWT), HTTP cookies

## Project Structure

```text
.
├── backend/
│   ├── server.js
│   ├── src/
│   │   ├── config/        # Database connection
│   │   ├── controllers/   # Authentication, account, and transaction logic
│   │   ├── middlewares/   # Authentication middleware
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # Express API routes
│   │   └── services/      # Email service
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   └── pages/
    ├── package.json
    └── vite.config.js
```

## Prerequisites

- Node.js and npm (Node.js 20.19+ or 22.12+ recommended for Vite 7)
- A MongoDB database
- Gmail OAuth2 credentials if you want to send email notifications

## Getting Started

### 1. Configure the backend

In a terminal, open the backend directory and install dependencies:

```bash
cd backend
npm install
```

Create `backend/.env` with the following variables:

```env
MONGO_URI=mongodb://127.0.0.1:27017/banking-ledger
JWT_SECRET=replace-with-a-long-random-secret

# Required for Gmail email notifications
EMAIL_USER=your-gmail-address
CLIENT_ID=your-google-oauth-client-id
CLIENT_SECRET=your-google-oauth-client-secret
REFRESH_TOKEN=your-google-oauth-refresh-token
```

Use your own MongoDB connection string and keep `.env` and all credentials private. MongoDB transactions require a replica set; for local development, use a replica-set-enabled MongoDB instance or a MongoDB Atlas cluster.

Start the backend:

```bash
npm run dev
```

The API listens on `http://localhost:8000`.

### 2. Configure and run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (by default, `http://localhost:5173`). The Vite development server proxies `/api` requests to `http://localhost:8000`.

To use a different backend host during development:

```bash
VITE_API_TARGET=http://localhost:8000 npm run dev
```

### 3. Build the frontend

```bash
cd frontend
npm run build
npm run preview
```

The production frontend build is written to `frontend/dist`. Configure your production web server to route `/api` requests to the backend; the Vite proxy is for development and preview use.

## API Overview

All API routes are prefixed with `/api`.

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| `POST` | `/auth/register` | Register a user | No |
| `POST` | `/auth/login` | Sign in | No |
| `POST` | `/auth/logout` | Sign out and revoke the current token | No |
| `GET` | `/accounts` | Get the signed-in user's accounts | Yes |
| `POST` | `/accounts` | Create an account | Yes |
| `GET` | `/accounts/balance/:accountId` | Get an account balance | Yes |
| `POST` | `/transaction` | Transfer funds between accounts | Yes |
| `POST` | `/transaction/system/initial-funds` | Create an initial-funds transaction | System user |

Authentication uses an HTTP cookie and also returns a JWT in the login/register response. Protect and transmit credentials securely, especially outside local development.

## Current Limitations

- There is no backend endpoint to list transaction history. The Activity page currently stores successful transfers/funding activity in the current browser's local storage, so it is not a complete cross-device history.
- There is no dedicated “current user” endpoint. The frontend restores a session by requesting the authenticated accounts endpoint.
- Initial funding is restricted to a system user; regular users cannot use that endpoint.
- The backend currently listens on port `8000`.

## Available Scripts

### Backend (`backend/`)

- `npm run dev` — start the API with Nodemon
- `npm start` — start the API with Node.js

### Frontend (`frontend/`)

- `npm run dev` — start the Vite development server
- `npm run build` — create a production build
- `npm run preview` — preview the production build locally

## Security

- Never commit `.env` files, JWT secrets, database credentials, or OAuth credentials.
- Use a strong, unique `JWT_SECRET`.
- Use HTTPS and secure cookie settings when deploying.
- This project is for educational purposes and has not been represented as production-ready financial software.
