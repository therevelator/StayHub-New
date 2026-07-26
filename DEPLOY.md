# Deploying StayHub to Railway

StayHub runs as **one service**: the Express backend serves both the API
(`/api/*`) and the built React frontend (same origin, so no CORS). It connects
to a **managed MySQL** database. Everything below lives on Railway.

> You need a Railway account and (for MySQL) a paid/verified plan. Account
> creation, provisioning and setting variables are done by you in the Railway
> dashboard — the repo is already configured for it.

---

## 1. Create the project + database

1. Go to [railway.app](https://railway.app) → **New Project**.
2. **New → Database → Add MySQL**. Railway provisions a MySQL service (note its
   name, e.g. `MySQL`). It exposes: `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`,
   `MYSQLPASSWORD`, `MYSQLDATABASE`.

## 2. Add the app service

1. In the same project: **New → GitHub Repo** → select `StayHub-New`.
2. Set the deploy **branch** to `july-2026`.
3. Railway reads [`railway.json`](railway.json) automatically:
   - build: `npm run build:railway` (installs deps, builds the client)
   - start: `npm run start:railway` (runs the Express server)

## 3. Set environment variables (app service → Variables)

Use Railway **reference variables** so the DB creds stay in sync (replace
`MySQL` with your database service's actual name):

```
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
JWT_SECRET=<paste a long random string>
JWT_EXPIRES_IN=24h
NODE_ENV=production
```

Notes:
- **`PORT`** is injected by Railway automatically — do **not** set it. The server
  listens on `process.env.PORT`.
- **CORS** isn't needed (frontend is same-origin). The frontend auto-uses a
  relative `/api` on any non-localhost host, so no frontend URL to configure.

## 4. Initialize the database (once)

After the first successful deploy, load the schema into the MySQL service. In
the **app service** open a shell / one-off command (Railway → the service →
"…" → *Run a command* or the shell) and run:

```
npm run db:init --prefix server
```

This executes [`server/src/db/schema.sql`](server/src/db/schema.sql) against the
connected database (creates all 19 tables). It reads the same `DB_*` variables.

Then load the demo data + demo accounts:

```
npm run db:seed --prefix server
```

This loads [`server/src/db/seed-demo.sql`](server/src/db/seed-demo.sql) — 10
properties, 18 rooms, and three ready-to-use accounts:

| Role  | Email                | Password    |
|-------|----------------------|-------------|
| Admin | `admin@stayhub.demo` | `Demo1234!` |
| Host  | `host@stayhub.demo`  | `Demo1234!` |
| Guest | `guest@stayhub.demo` | `Demo1234!` |

The host account owns all the seeded properties. The seed contains no real user
data — only these demo accounts.

> Re-running `db:init` re-creates the tables (drops existing) — only run it again
> if you intend to reset. `db:seed` uses REPLACE, so it's safe to re-run.

## 5. Expose the app

App service → **Settings → Networking → Generate Domain**. Open the generated
URL — the StayHub landing page loads and the whole app (login, listings,
booking) works against the Railway MySQL.

---

## How it fits together

```
Browser ──> Railway domain ──> Express service (PORT)
                                 ├─ /api/*        → API routes → MySQL service
                                 └─ everything else → client/dist (React SPA)
```

## Local development is unchanged

`npm start` still runs Vite (`:3000`) + the API server (`:5001`) separately.
The single-service behaviour only kicks in when `client/dist` exists (i.e. after
a production build), which is what the Railway build produces.
