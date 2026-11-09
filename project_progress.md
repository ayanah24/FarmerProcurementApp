# Project Progress Log

This document details the step-by-step development, architectural decisions, and justifications for the Farmer Procurement App.

## 1. Project Initialization

- Created project directory `FarmerProcurementApp`.
- Initialized Git repository.
- Created `.gitignore` with common exclusions.
- Created `README.md` and this `project_progress.md` file.

## 2. Project Architecture Setup and Initialization

### 2.1 Backend Initialization (Node.js + Express)

- **Directory:** `backend/`
- **Dependencies:** `express`, `cors`, `dotenv`, `zod`, `jsonwebtoken`, `bcryptjs`, `@prisma/client`
- **Dev Dependencies:** `prisma`, `nodemon`
- **Folder Structure:**
    - `backend/src/controllers`
    - `backend/src/routes`
    - `backend/src/models` (Prisma will manage `schema.prisma` here)
    - `backend/src/middlewares`
    - `backend/src/config`
- **Prisma:** Initialized with `npx prisma init`, creating `prisma/schema.prisma` and `.env` in the backend root.

### 2.2 Frontend Initialization (React + Vite PWA)

- **Directory:** `frontend/`
- **Framework:** React with Vite
- **Dependencies:** `dexie`, `axios`, `react-router-dom`, `vite-plugin-pwa`
- **Setup:**
    - Established project structure (components, pages, context, db, hooks, services, utils).
    - Configured `Dexie.js` for local IndexedDB storage.
    - Set up `axios` base client with auth interceptors.
    - Implemented `react-router-dom` for client-side routing, including a Login page.
    - Configured `vite-plugin-pwa` for service worker offline capability.

## 3. Backend Implementation: Core Security

### 3.1 Authentication & Authorization
- **Middleware:** Implemented JWT verification and role-based access control (Operator vs. Manager).
- **Controller:** Implemented `login` and `register` with `bcryptjs` for password hashing and `zod` for input validation.
- **Routes:** Created `/api/auth` endpoints.

## 4. Backend Implementation: Farmer & Price Management

### 4.1 Farmer Registry
- Implemented CRUD for farmers.
- Added "Verification" status for bank details (Manager-only action).
- Enforced DPDP Act compliance by not including Aadhaar fields.

### 4.2 Centralized Price Board
- Implemented daily price setting by crop and grade.
- Ensure all centers fetch the same price centrally.

## 5. Frontend Implementation: Core UI & Features

### 5.1 Dashboard & Navigation
- Implemented `Dashboard` page with a logout feature.
- Added `ProtectedRoute` to ensure only logged-in users can access core features.
- Established basic layout and navigation structure.

### 5.2 Farmer Registry Page
- Built `Farmers.jsx` for displaying registered farmers.
- Integrated Dexie.js for offline reading/caching of farmer data.
- Added "Add New Farmer" modal with immediate Dexie local storage support when offline.
- Connected route `/farmers` in `App.jsx`.

### 5.3 Procurement Form
- Built `Procurement.jsx` for recording produce collection.
- Implemented real-time moisture deduction logic as per strategy (Deduction if moisture > 12%).
- Auto-calculation of final weight and total amount based on daily price board data.
- Integrated with Dexie.js for immediate local storage and background sync.
- Added Marathi labels to UI for operator accessibility.
- Connected route `/procurement` in `App.jsx`.

### 5.4 Automated Offline Sync Service
- Created `useSync.js` custom hook for global sync management.
- Listens to browser `online` network events to automatically trigger background sync.
- Runs every 30 seconds as a fallback to clear `PENDING` offline records in Dexie.
- Reconciles temporary local farmer IDs with server-assigned primary keys.
- Integrated directly into root `App.jsx` component.

### 5.5 Office Manager Tools
- Built `Manager.jsx` component with three functional tabs:
  1. **Bank Verification:** Review and approve pending farmer bank details.
  2. **Daily Price Board:** Publish centralized rates per crop and grade to all collection centers.
  3. **AI Anomaly Detection:** Review procurements flagged for unexpected yields or suspicious entries.
- Enhanced `ProtectedRoute` in `App.jsx` with role-based restriction (`OFFICE_MANAGER`).

## 6. Deployment & Containerization

### 6.1 Dockerization (Docker Compose)
- Created multi-stage `Dockerfile` for the Node.js/Prisma backend based on `node:22-slim` with OpenSSL and CA certificate support.
- Configured automatic Prisma database push (`npx prisma db push`) and data seeding (`prisma/seed.js`) on container initialization.
- Created multi-stage `Dockerfile` for the React/Vite frontend using an Nginx alpine image to serve static files.
- Added custom `nginx.conf` providing SPA client-side routing fallback and `/api/` reverse-proxying directly to backend container.
- Configured a root `docker-compose.yml` orchestrating PostgreSQL (with healthcheck), Backend, and Frontend services with persistent volumes.
- Verified build and verified end-to-end container operation (`postgres`, `backend`, `frontend`).
