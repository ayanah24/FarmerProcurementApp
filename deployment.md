# 🚀 Deployment Guide — Farmer Procurement Application

This document provides a comprehensive, step-by-step technical guide on how the **Farmer Procurement Application (FPC PWA)** is containerized, orchestrated, and deployed using Docker Compose.

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

## 2. Prerequisites & Environment Setup

### System Requirements
- **Operating System:** Windows 10/11 (with WSL 2 enabled), macOS, or Linux.
- **Docker Engine:** Version 24.0+
- **Docker Compose:** Version 2.20+
- **Available Ports:** `80` (HTTP), `5000` (Backend API), `5432` (PostgreSQL).

### Environment Configuration
The backend reads environment variables passed via `docker-compose.yml`:

```yaml
environment:
  - DATABASE_URL=postgresql://postgres:@pass/farmer_procurement?schema=public
  - JWT_SECRET=***********
  - PORT=5000
```

---

## 3. Container Build Pipeline (Multi-Stage Dockerfiles)

### 3.1 Backend Multi-Stage Build (`backend/Dockerfile`)
The backend uses Debian Bookworm (`node:22-slim`) because Prisma's native query engine requires **glibc** and **OpenSSL 3**, which are incompatible with standard Alpine musl libc:

```dockerfile
# ---- Build Stage ----
FROM node:22-slim AS builder
RUN apt-get update -y && apt-get install -y openssl libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate

# ---- Production Stage ----
FROM node:22-slim AS production
RUN apt-get update -y && apt-get install -y openssl libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY package*.json ./

EXPOSE 5000
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node prisma/seed.js && node src/index.js"]
```

#### Key Highlights:
- **Automatic Migration & Push:** Runs `npx prisma db push --accept-data-loss` on startup, automatically creating all database tables without needing manual migration execution.
- **Automatic Seeding:** Executes `node prisma/seed.js` on boot, pre-populating test accounts (`operator1`, `manager`), regional crops, and today's price board.

---

### 3.2 Frontend Multi-Stage Build (`frontend/Dockerfile`)
The frontend is compiled into optimized static assets by Vite, then served through a lightweight Nginx web server:

```dockerfile
# ---- Build Stage ----
FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ---- Production Stage (Nginx) ----
FROM nginx:1.27-alpine AS production
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

### 3.3 Nginx Reverse Proxy Configuration (`frontend/nginx.conf`)

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # Static assets with long-term caching
    location ~* \.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|ttf|svg|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # PWA Service Worker: NEVER cache sw.js
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files $uri =404;
    }

    # Reverse proxy /api/ requests to the Node.js backend container
    location /api/ {
        proxy_pass         http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # SPA Client Routing: fallback all routes to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 4. Docker Compose Orchestration (`docker-compose.yml`)

```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password123
      POSTGRES_DB: farmer_procurement
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d farmer_procurement"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:password123@postgres:5432/farmer_procurement?schema=public
      - JWT_SECRET=supersecretjwtkey123
      - PORT=5000
    depends_on:
      postgres:
        condition: service_healthy
    restart: on-failure

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Critical Orchestration Features:
1. **Database Healthcheck Dependency:** The backend container will **not start** until PostgreSQL reports `service_healthy` via `pg_isready`. This eliminates container race conditions and startup crashes.
2. **Persistent Storage:** The `postgres_data` named volume ensures farmer records, weighment slips, and price boards persist across container restarts and host reboots.

---

## 5. Deployment Execution (Step-by-Step)

### Step 1: Open Docker Desktop
Ensure Docker Desktop is open and the Linux VM engine is running (whale icon shows steady in the taskbar).

### Step 2: Navigate to Project Directory
```powershell
cd "C:\Users\ayan2\OneDrive\Desktop\WEBDEV\PROJECTS\Isocode Workspace Assesment\FarmerProcurementApp"
```

### Step 3: Launch Containers in Detached Mode
```bash
docker-compose up --build -d
```

### Step 4: Verify Deployment Status
Check that all three containers show `Up` and PostgreSQL shows `healthy`:

```bash
docker-compose ps
```

*Expected output:*
```text
NAME                              IMAGE                           STATUS                    PORTS
farmerprocurementapp-backend-1    farmerprocurementapp-backend    Up                        0.0.0.0:5000->5000/tcp
farmerprocurementapp-frontend-1   farmerprocurementapp-frontend   Up                        0.0.0.0:80->80/tcp
farmerprocurementapp-postgres-1   postgres:15-alpine              Up (healthy)              0.0.0.0:5432->5432/tcp
```

### Step 5: Check Backend Startup Logs
Confirm the database schema was pushed and seed data was created:

```bash
docker-compose logs backend
```

*Expected log confirmation:*
```text
🚀  Your database is now in sync with your Prisma schema.
🌱 Seeding database...
✅ Users created: manager, operator1
✅ Crops created: Soybean, Tur Dal, Wheat, Onion, Cotton
✅ Today's prices seeded for all crops (Grades A/B/C)
🎉 Seed complete!
Server running on port 5000
```

---

## 6. Access & Verification URLs

- **Web Application (UI):** [http://localhost](http://localhost)
- **API Health Check:** [http://localhost/api/health](http://localhost/api/health)
- **Direct Backend API:** [http://localhost:5000/api](http://localhost:5000/api)
- **Database Connection:** `localhost:5432` (User: `postgres`, Password: `password123`, DB: `farmer_procurement`)

---

## 7. Common Maintenance & Management Commands

### Stop All Services
```bash
docker-compose down
```

### Restart a Single Service (e.g. Frontend after changes)
```bash
docker-compose build frontend
docker-compose up -d --no-deps frontend
```

### View Live Container Logs
```bash
docker-compose logs -f backend
```

### Database Backup (Export SQL Dump)
```bash
docker exec -t farmerprocurementapp-postgres-1 pg_dump -U postgres farmer_procurement > backup.sql
```

### Database Restore (Import SQL Dump)
```bash
docker exec -i farmerprocurementapp-postgres-1 psql -U postgres -d farmer_procurement < backup.sql
```

### Complete Clean Rebuild (Ignoring Cached Layers)
```bash
docker-compose build --no-cache
docker-compose up -d
```

---

## 8. Deployment Troubleshooting

| Symptom | Root Cause | Solution |
|---|---|---|
| `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified` | Docker Desktop is not running on the Windows host. | Open Docker Desktop from the Start Menu and wait 30 seconds for the engine to initialize. |
| `port is already allocated: 80` or `5432` | Host port is in use by another application (e.g. IIS, local Postgres). | Stop the conflicting local service or change the host port mapping in `docker-compose.yml` (e.g. `"8080:80"`). |
| Browser shows old UI / outdated styles | PWA Service Worker has cached previous assets. | Hard-refresh with **`Ctrl + Shift + R`** or test in an **Incognito Window** (`Ctrl + Shift + N`). |
| `npm ci --omit=dev` fails during Docker build | Lockfile drift or package version incompatibility. | Dockerfile uses `npm install` with Node 22 Slim to resolve dependencies fresh. |

