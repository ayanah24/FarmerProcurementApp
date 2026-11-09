# 🌾 Farmer Procurement Application (FPC PWA)

An offline-first, Progressive Web Application (PWA) and backend system built for a Farmer Producer Company (FPC) to digitize produce procurement at village collection centers, eliminate calculation errors, automate moisture deductions, and streamline farmer payments.

---

## 🚀 Quick Start (Docker Compose)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running with WSL 2 / Linux engine)

### Run the App
From the `FarmerProcurementApp` directory:

```bash
docker-compose up --build
```

The database is automatically created, migrated, and seeded on startup.

| Service | URL / Port | Description |
|---|---|---|
| **Frontend PWA** | [http://localhost](http://localhost) | React + Vite served via Nginx |
| **Backend API** | [http://localhost/api](http://localhost/api) (or `localhost:5000`) | Express + Prisma REST API |
| **PostgreSQL** | `localhost:5432` | Postgres database |

---

## 🔑 Test Credentials

| Role | Username | Password | Permitted Actions |
|---|---|---|---|
| **Office Manager** | `manager` | `manager123` | Verify farmer bank accounts, publish daily prices, approve payments, export bank CSV, review AI anomalies |
| **Center Operator** | `operator1` | `operator123` | Register farmers, record produce procurement slips, view today's prices |

---

## 📐 Architecture & Key Features

### 1. Offline-First PWA (Dexie.js + IndexedDB)
- Village collection centers often have weak or intermittent internet connectivity.
- Operators can register farmers and record procurement entries completely offline.
- Data is stored in client-side IndexedDB using **Dexie.js**.
- When internet connectivity returns, the custom `useSync` hook automatically sends queued `PENDING` records to `/api/procurements/sync` and reconciles temporary local IDs with server IDs.

### 2. Business Logic & Calculations
- **Moisture Deduction:** Standard acceptable moisture is 12.0%. For every 1% moisture above 12%, a 1% deduction is applied to the net weight:
  $$\text{Net Weight} = (\text{Gross} - \text{Tare}) \times \left(1 - \frac{\text{Moisture} - 12}{100}\right)$$
- **Centralized Daily Price Board:** Daily prices per crop and grade are published centrally by the Office Manager. Collection centers fetch rates to prevent unauthorized rate manipulation.
- **Precision Currency & Weights:** Weights stored to 1 decimal place (`Decimal(10, 1)` in kg), currency stored to 2 decimal places (`Decimal(15, 2)` in paisa).

### 3. AI Anomaly & Fraud Detection Engine
Every procurement submission is evaluated automatically:
1. **Excessive Yield Check:** Flags if net weight exceeds 2,500 kg per hectare based on the farmer's registered land area (`"High yield for land size"`).
2. **Frequency Check:** Flags if the same farmer submits produce more than once within a 1-hour window (`"Farmer appeared twice in one hour"`).
3. **Manager Review:** All flagged transactions appear in the Manager Control Panel under the **AI Anomaly Flagged** tab for inspection before payment approval.

### 4. Security & DPDP Act 2023 Compliance
- **No Aadhaar Storage:** In strict adherence to India's Digital Personal Data Protection (DPDP) Act 2023, Aadhaar numbers are never collected, validated, or stored.
- Farmers are assigned system-generated codes (`F-XXXXX`).
- **Role-Based Access Control (RBAC):** Express routes and React navigation guards enforce strict permission separation between operators and managers.
- **Bank Verification Guard:** Procurement from farmers with unverified bank details is blocked until approved by an Office Manager.

---

## 🛠️ Tech Stack

- **Backend:** Node.js 22, Express 5, Prisma ORM 6, PostgreSQL 15, Zod, JWT, bcryptjs
- **Frontend:** React 19, Vite 8, `vite-plugin-pwa` (Service Workers), Dexie.js 4 (IndexedDB), Axios, React Router 7
- **Deployment:** Docker, Docker Compose, Nginx (reverse proxy & static server)

---

## 📡 API Reference

### Authentication
- `POST /api/auth/register` — Register a new operator or manager
- `POST /api/auth/login` — Authenticate and receive JWT

### Farmers
- `GET /api/farmers` — List all registered farmers
- `POST /api/farmers` — Register a new farmer (auto-generates `farmerCode`)
- `PATCH /api/farmers/:id/verify` — Approve farmer bank details *(Manager only)*

### Prices & Crops
- `GET /api/prices/today` — Get today's active price board
- `POST /api/prices` — Publish/update daily rate per crop & grade *(Manager only)*
- `GET /api/prices/crops` — List supported crops
- `POST /api/prices/crops` — Add new crop *(Manager only)*

### Procurements
- `GET /api/procurements` — List procurements (includes AI flag metadata)
- `POST /api/procurements` — Create procurement slip (applies moisture deduction & AI check)
- `POST /api/procurements/sync` — Bulk batch sync for offline records
- `PATCH /api/procurements/:id/approve` — Approve payment *(Manager only)*
- `GET /api/procurements/export-bank-file` — Download bank disbursement CSV *(Manager only)*
