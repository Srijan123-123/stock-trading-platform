# Stock Trading Platform

A full-stack stock trading dashboard project with a public landing page, account registration and sign-in, JWT-protected API routes, and a React dashboard for orders, holdings, positions, and funds.

> This is a learning/demo project. Stock prices and trading data are sample data; it is not connected to a broker and should not be used for real financial decisions.

## Project layout

| Folder | Purpose | Local address |
| --- | --- | --- |
| `frontend/` | Landing pages, signup, and sign-in | `http://localhost:3001` |
| `dashboard/` | Authenticated trading dashboard | `http://localhost:3000` |
| `backend/` | Express API, MongoDB models, and JWT authentication | `http://localhost:3002` |

The landing page hands a short-lived, one-time code to the dashboard after successful signup/sign-in. The dashboard exchanges that code for a JWT. Dashboard API requests send that token as a Bearer token.

## Requirements

- Node.js and npm
- MongoDB running locally, or a MongoDB connection string

## Setup

Open three terminals from the repository root.

### 1. Configure and start the backend

```powershell
cd backend
Copy-Item .env.example .env
```

Edit `backend/.env` and set `MONGO_URL` to your MongoDB connection string. Set `JWT_SECRET` to a long, random secret (at least 32 bytes). Keep `.env` private; it is excluded from Git.

Install dependencies and start the API:

```powershell
npm install
npm start
```

The API starts on port `3002` by default. The backend reads `MONGO_URL`, `JWT_SECRET`, and optional `PORT` from `backend/.env`.

### 2. Start the dashboard

In a second terminal:

```powershell
cd dashboard
npm install
npm start
```

The dashboard runs on `http://localhost:3000`.

### 3. Start the landing page

In a third terminal:

```powershell
cd frontend
npm install
npm start
```

The landing page runs on `http://localhost:3001`. If prompted to use another port, accept it only if port `3001` is already occupied; update the redirect URL configuration if you choose a different port.

## Signup and sign-in flow

1. Open `http://localhost:3001` and choose signup or sign-in.
2. The frontend calls the backend's `/api/auth/register` or `/api/auth/login` endpoint.
3. The backend verifies credentials, stores password hashes, and issues a signed JWT.
4. The frontend requests a short-lived, one-time dashboard handoff code.
5. The dashboard exchanges the code for a JWT and stores it in browser local storage.
6. The dashboard sends the JWT on protected API requests. Signing out removes it.

You can also open `http://localhost:3000` directly. The dashboard has its own signup/sign-in screen.

## API routes

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create an account |
| `POST` | `/api/auth/login` | Public | Sign in with username or email |
| `GET` | `/api/auth/me` | Bearer JWT | Get the current user |
| `POST` | `/api/auth/handoff` | Bearer JWT | Create a one-time dashboard handoff code |
| `POST` | `/api/auth/handoff/exchange` | Public, one-time code | Exchange the code for a dashboard JWT |
| `GET` | `/allHoldings` | Bearer JWT | Get the signed-in user's holdings |
| `GET` | `/allPositions` | Bearer JWT | Get the signed-in user's positions |
| `POST` | `/newOrder` | Bearer JWT | Save an order for the signed-in user |

The frontend and dashboard default to the API at `http://localhost:3002`. You can override it with `REACT_APP_API_URL` in their respective React environment files. The landing page's dashboard redirect can be set with `REACT_APP_DASHBOARD_URL` (default `http://localhost:3000`).

## Tests and production builds

Run the React test runner or make a production build from either `frontend/` or `dashboard/`:

```powershell
npm test
npm run build
```

## Git and secrets

The root `.gitignore` excludes `.env` files, dependency folders, build output, and coverage output. `backend/.env.example` contains placeholder configuration and can be committed. Never commit real database credentials or a real JWT secret.
