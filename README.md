# GreenH2 — Green Hydrogen Optimization Platform

A full-stack web application for optimizing green hydrogen production from
renewable energy (solar + wind), using a rule-based optimization engine to
allocate energy between **hydrogen production, battery storage, and the
grid**, with monitoring, forecasting, alerts, and admin tooling built on top.

**Tech stack:** React (Vite) + Tailwind CSS + Recharts · Node.js + Express
· PostgreSQL + Prisma · JWT + bcrypt authentication

---

## 1. Project structure

```
greenh2/
├── backend/                 Express REST API
│   ├── prisma/
│   │   ├── schema.prisma    Database schema
│   │   └── seed.js          Demo data generator
│   ├── src/
│   │   ├── config/          Prisma client singleton
│   │   ├── middleware/      auth, validation, error handling
│   │   ├── routes/          one file per module
│   │   ├── controllers/     one file per module
│   │   ├── services/
│   │   │   └── optimizationService.js   <- core rule-based engine
│   │   ├── utils/           synthetic/demo data generator
│   │   └── index.js         app entry point
│   └── .env.example
│
└── frontend/                 React + Vite SPA
    ├── src/
    │   ├── pages/            one page per module
    │   ├── components/       layout, route guards, reusable UI
    │   ├── context/          Auth + Theme (dark/light) providers
    │   └── api/               axios client + endpoint functions
    └── .env.example
```

### Why this architecture

```
React (Vite)  →  Express REST API  →  Optimization Service  →  Prisma  →  PostgreSQL
```

The optimization logic lives in **one pure function**,
`backend/src/services/optimizationService.js → runOptimization(input)`,
with no database or HTTP dependencies. It takes plant state in and returns
an allocation out. This means:

- It's independently testable (`node -e "require('./src/services/optimizationService')..."`).
- A future ML model can be dropped in behind the exact same function
  signature without touching a single controller or route.
- Both the "Energy Optimization" page (live plant data) and the
  "Simulation" page (user-entered what-if data) reuse the same engine.

---

## 2. What's implemented (maps to the 9 required modules)

| # | Module | Where |
|---|--------|-------|
| 1 | Dashboard | `/` — generation, production, storage, efficiency, charts, system health |
| 2 | Renewable Energy | `/renewable` — solar/wind monitoring, history, capacity & efficiency |
| 3 | Hydrogen Production | `/hydrogen` — electrolyzer status, rate vs target, recommended schedule |
| 4 | Energy Optimization | `/optimization` — current vs optimized allocation, run against live data |
| 5 | Storage Management | `/storage` — battery & H₂ storage levels, alerts, trend |
| 6 | Simulation | `/simulation` — manual inputs + "Run Optimization" |
| 7 | Forecasting & Analytics | `/analytics` — 24h/7d forecast, H₂ trend, utilization/wastage, CSV export |
| 8 | Alerts & Recommendations | `/alerts` — low renewable/storage, production notices |
| 9 | Admin | `/admin` — users, roles, system capacities/config |

Authentication (JWT + bcrypt), protected routes (frontend + backend),
input validation (`express-validator`), centralized error handling, and
database indexes on all timestamp/lookup columns are included throughout.

---

## 3. Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+ running locally (or a cloud instance — Neon, Supabase,
  Railway, etc. all work)
- **VS Code** (recommended extensions: *Prisma*, *ESLint*, *Tailwind CSS
  IntelliSense*)

---

## 4. VS Code setup — step by step

### Step 1 — Open the project
Unzip the project and open the **`greenh2`** folder in VS Code
(`File → Open Folder…`). Open **two terminals** (`` Ctrl+` ``, then the `+`
icon) — one for the backend, one for the frontend.

### Step 2 — Create the PostgreSQL database
With PostgreSQL running locally:

```bash
psql -U postgres -c "CREATE DATABASE greenh2;"
```

(Or create a database named `greenh2` using your preferred GUI — pgAdmin,
TablePlus, etc. A free cloud Postgres instance works identically — just use
its connection string in step 4.)

### Step 3 — Backend: install dependencies
In terminal 1:

```bash
cd backend
npm install
```

### Step 4 — Backend: environment variables
Copy the example env file and fill in your real values:

```bash
cp .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/greenh2?schema=public"
PORT=5000
NODE_ENV=development
JWT_SECRET="any_long_random_string_here"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"
```

### Step 5 — Backend: run migrations + seed demo data

```bash
npx prisma migrate dev --name init
npm run seed
```

This creates all tables and populates **7 days of realistic hourly demo
data** (solar/wind generation following a diurnal curve, demand curves,
hydrogen production, battery/storage levels) plus two user accounts — see
Step 8 for credentials. No sensors or paid APIs required.

### Step 6 — Backend: start the API

```bash
npm run dev
```

The API runs at `http://localhost:5000`. Check it's alive:
`http://localhost:5000/api/health`

### Step 7 — Frontend: install, configure, run
In terminal 2:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:5173`.

### Step 8 — Log in

| Role  | Email               | Password   |
|-------|---------------------|------------|
| Admin | admin@greenh2.com   | Admin@123  |
| User  | user@greenh2.com    | User@123   |

The Admin account can access `/admin` (user management + system
configuration); both accounts can access every other module.

---

## 5. Useful scripts

**Backend** (`cd backend`):
```bash
npm run dev              # start with nodemon (auto-restart)
npm run start            # start without nodemon
npm run prisma:migrate   # create/apply a new migration
npm run prisma:generate  # regenerate Prisma client after schema changes
npm run seed             # re-seed demo data (wipes existing time-series data)
```

**Frontend** (`cd frontend`):
```bash
npm run dev       # start Vite dev server
npm run build     # production build → frontend/dist
npm run preview   # preview the production build locally
```

---

## 6. How the optimization engine works

Given current solar/wind generation, demand, electrolyzer capacity, target
production rate, and battery/hydrogen storage levels, `runOptimization()`:

1. **Meets demand first** from available generation; if generation falls
   short, it discharges the battery to cover the deficit.
2. **Allocates to hydrogen production** up to whichever is smallest of:
   electrolyzer capacity, the energy needed to hit the target production
   rate, and remaining available energy — and skips this entirely if
   hydrogen storage is already full.
3. **Charges the battery** with whatever surplus remains, up to its
   available headroom.
4. **Exports/curtails** anything left over.

It also computes a **baseline ("current") allocation** — a fixed-ratio,
non-adaptive split used purely for comparison — so the UI can show an
"efficiency improvement %" between the naive approach and the optimized
one. This is what powers the Energy Optimization and Simulation pages.

Because `runOptimization(input)` is a pure function with a fixed
input/output shape, swapping in a trained ML model later just means
replacing the body of `ruleBasedStrategy()` (or adding a new strategy and
switching which one `runOptimization` calls) — no controller, route, or
frontend code needs to change.

---

## 7. Troubleshooting

- **`P1001: Can't reach database server`** — PostgreSQL isn't running, or
  `DATABASE_URL` in `backend/.env` is wrong. Verify with
  `psql -U postgres -d greenh2 -c "SELECT 1;"`.
- **CORS errors in the browser console** — make sure `CLIENT_URL` in
  `backend/.env` matches the URL the frontend is actually running on
  (default `http://localhost:5173`).
- **401 errors right after login** — check `JWT_SECRET` is set in
  `backend/.env` (it has no default; the server won't sign tokens without
  it).
- **Charts show no data** — run `npm run seed` again from `backend/`.

---

## 8. Notes for examiners / reviewers

- All renewable generation, demand, and hydrogen production figures are
  **synthetic but physically plausible** (solar follows a bell curve
  peaking midday, wind has a gentle diurnal bias, demand has morning/
  evening peaks) — see `backend/src/utils/demoData.js`.
- The 55 kWh/kg hydrogen energy constant used throughout
  (`ENERGY_PER_KG_H2`) is a realistic approximation for PEM electrolyzers.
- The system is designed so a real ML-based optimizer, real sensor feeds,
  or a real weather API could be substituted in without restructuring the
  app — see Section 6.
