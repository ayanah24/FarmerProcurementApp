# 🚀 Deployment Guide — Farmer Procurement Application

This document provides a comprehensive, step-by-step technical guide on how the **Farmer Procurement Application (FPC PWA)** is containerized, orchestrated, and deployed using Docker Compose locally, as well as cloud-deployed on **Render**.

🌐 **Live Production App:** [https://farmerprocurementapp-1.onrender.com](https://farmerprocurementapp-1.onrender.com)

---

## 1. Deployment Topology & Architecture

The application deploys as an isolated multi-container stack orchestrated via `docker-compose.yml`. All services communicate over an internal Docker bridge network (`farmerprocurementapp_default`), with public traffic routed through an Nginx reverse proxy.

```
 Internet / Browser (User)
            │
            ▼ Port 80
┌────────────────────────────────────────────────────────┐
│  frontend (Nginx 1.27 Alpine)                          │
│  - Serves React 19 PWA static assets                   │
│  - Handles SPA client routing fallback                 │
│  - Reverse-proxies /api/* requests                     │
└───────────────────────────┬────────────────────────────┘
                            │
                            │ Internal Network (http://backend:5000)
                            ▼
┌────────────────────────────────────────────────────────┐
│  backend (Node.js 22 Slim + Express 5)                 │
│  - REST API & Authentication                           │
│  - Business logic & AI anomaly detection               │
│  - Prisma ORM v6 query engine                          │
└───────────────────────────┬────────────────────────────┘
                            │
                            │ Internal Network (postgres:5432)
                            ▼
┌────────────────────────────────────────────────────────┐
│  postgres (PostgreSQL 15 Alpine)                       │
│  - Relational database                                 │
│  - Persistent data volume: postgres_data               │
│  - Native healthcheck: pg_isready                      │
└────────────────────────────────────────────────────────┘
```

---

## 2. Cloud Deployment on Render (Recommended Production Setup)

The production build of the application is hosted on Render at **[https://farmerprocurementapp-1.onrender.com](https://farmerprocurementapp-1.onrender.com)**. 

### Step-by-Step Cloud Setup:

1. **PostgreSQL Database:**
   - Create a new **PostgreSQL** service on Render.
   - Copy the **External Connection String**.

2. **Backend Web Service:**
   - Create a new **Web Service** connected to your repository.
   - **Root Directory:** `FarmerProcurementApp/backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/index.js`
   - **Environment Variables:**
     - `DATABASE_URL`: *(Your Render PostgreSQL external connection string)*
     - `JWT_SECRET`: *(Your secure random secret string)*
     - `PORT`: `5000`

3. **Frontend Static Site:**
   - Create a new **Static Site** connected to your repository.
   - **Root Directory:** `FarmerProcurementApp/frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist` *(Note: Vite builds into `dist`, not `build`)*
   - **Environment Variables:**
     - `REACT_APP_API_BASE_URL`: *(Your deployed Render backend URL, e.g. `https://your-backend.onrender.com`)*

---

## 3. Local Deployment via Docker Compose

### System Requirements
- **Operating System:** Windows 10/11 (with WSL 2 enabled), macOS, or Linux.
- **Docker Engine:** Version 24.0+
- **Docker Compose:** Version 2.20+
- **Available Ports:** `80` (HTTP), `5000` (Backend API), `5432` (PostgreSQL).

### Step-by-Step Local Launch:

1. **Open Docker Desktop** and ensure the engine is running.
2. **Navigate to Project Directory:**
   ```powershell
   cd "C:\Users\ayan2\OneDrive\Desktop\WEBDEV\PROJECTS\Isocode Workspace Assesment\FarmerProcurementApp"
   ```
3. **Launch Containers in Detached Mode:**
   ```bash
   docker-compose up --build -d
   ```
4. **Verify Containers are Up:**
   ```bash
   docker-compose ps
   ```

---

## 4. Access & Verification URLs

- **Live Render Production App:** [https://farmerprocurementapp-1.onrender.com](https://farmerprocurementapp-1.onrender.com)
- **Local Web Application (UI):** [http://localhost](http://localhost)
- **API Health Check:** [http://localhost/api/health](http://localhost/api/health)
- **Direct Backend API:** [http://localhost:5000/api](http://localhost:5000/api)

---

## 5. Troubleshooting & Maintenance

| Issue / Symptom | Root Cause | Solution |
|---|---|---|
| Render build fails with `Publish directory build does not exist!` | Vite builds output to `dist`, not `build`. | Set the **Publish Directory** to `dist` in your Render Static Site settings. |
| `open //./pipe/dockerDesktopLinuxEngine` | Docker Desktop is not running. | Open Docker Desktop from the Start Menu. |
| Port already allocated | Local port in use by IIS or local Postgres. | Stop conflicting service or adjust host port mapping in `docker-compose.yml`. |
