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
- **Dependencies:** `dexie`, `axios`, `react-router-dom`
- **Next Steps:** PWA setup will be handled in a dedicated step.

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

