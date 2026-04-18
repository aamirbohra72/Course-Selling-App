# Course Selling App

Production-oriented course marketplace: **Node.js**, **Express**, **Neon (PostgreSQL)** via **Drizzle ORM**, **JWT** auth for students and admins, and a static **frontend** served from `public/`.

## Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) project and **connection string** (use the **pooled** URI for server apps when available)

## Setup

1. Copy environment file and fill in real values:

   ```bash
   copy .env.example .env
   ```

   - `DATABASE_URL` — Neon PostgreSQL URL (`sslmode=require` is typical).
   - `JWT_SECRET` — At least 16 characters in development; **at least 32 in production**.
   - `CORS_ORIGIN` — Optional; comma-separated allowed origins, or omit to reflect the request origin.

   Replace the **placeholder** `DATABASE_URL` in `.env` with the real URI from [Neon](https://console.neon.tech) (**Connection details** → URI, preferably **pooled**). If the password contains `@`, `#`, or other special characters, [URL-encode](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) them in the connection string.

   Check connectivity without starting the app:

   ```bash
   npm run db:ping
   ```

   (Use **`db:ping` with no space** — `npm run db: ping` is invalid and triggers “Missing script: db:”. You can also run `npm run check-db`.)

2. Install dependencies:

   ```bash
   npm install
   ```

3. Apply database migrations:

   ```bash
   npm run db:migrate
   ```

4. Start the server:

   ```bash
   npm start
   ```

   Open `http://localhost:3000` for the UI.

   - **Liveness:** `GET /health` (no database).
   - **Readiness:** `GET /health/ready` (runs `SELECT 1` against Neon).

   **Never commit real `DATABASE_URL` or share it in chat.** If a secret was exposed, rotate the Neon role password in the Neon console and update `.env`.

## API overview

| Area    | Method | Path | Auth |
|--------|--------|------|------|
| Student | POST | `/api/users/signup` | — |
| Student | POST | `/api/users/login` | — |
| Catalog | GET | `/api/users/courses` | — |
| Catalog | GET | `/api/users/courses/:courseId` | — |
| Purchase | POST | `/api/users/courses/:courseId/purchase` | User JWT |
| Library | GET | `/api/users/me/purchases` | User JWT |
| Library | GET | `/api/users/me/course-access` | User JWT |
| Admin | POST | `/api/admin/signup` | — |
| Admin | POST | `/api/admin/login` | — |
| Admin | GET | `/api/admin/courses` | Admin JWT |
| Admin | POST | `/api/admin/courses` | Admin JWT |
| Admin | PUT | `/api/admin/courses/:courseId` | Admin JWT |
| Admin | DELETE | `/api/admin/courses/:courseId` | Admin JWT |

Send `Authorization: Bearer <token>` for protected routes.

Prices are stored in **cents** (`priceCents`).

## Production notes

- Set `NODE_ENV=production`.
- Use a strong `JWT_SECRET` (32+ characters).
- Set `CORS_ORIGIN` to your real front-end origin(s), comma-separated. If you omit it in production, only **same-origin** requests get CORS headers (typical when the API serves `public/`).
- Set `ADMIN_SIGNUP_ENABLED=false` after you’ve created admin accounts (default in production is **off** unless this is `true`).
- Terminate TLS at your reverse proxy or platform (e.g. Railway, Render, Fly).
- Tune `PG_POOL_MAX` if needed (default pool max 20 in `src/db/index.js`).
- The server closes the Postgres pool on `SIGTERM` / `SIGINT` for cleaner deploys.

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Run server |
| `npm run dev` | Run with `node --watch` |
| `npm run db:generate` | Generate SQL after schema changes |
| `npm run db:migrate` | Run migrations against `DATABASE_URL` |
| `npm run db:push` | Push schema (dev convenience; prefer migrations in production) |
