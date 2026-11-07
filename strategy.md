# Project Strategy: Farmer Procurement App

## Core Objective
To digitize the procurement process for a Farmer Producer Company, reducing errors, speeding up payments, and ensuring offline capability at village collection centers.

## Architectural Pillars
1. **Offline-First (PWA + IndexedDB):** Operators must be able to record produce even without internet. We use `Dexie.js` on the frontend to cache data locally and sync when back online.
2. **MVC Pattern (Backend):** Separating Routes, Controllers, and Models (via Prisma) for maintainability.
3. **Data Integrity:**
    - Tamper-proof timestamps for offline entries.
    - AI flagging for anomalies (yield vs. land size, duplicates).
    - Decimal precision for weights and currency.
4. **Localization:** Marathi interface for village operators.
5. **Security:** JWT-based role access (Operator vs. Manager). No Aadhaar storage (DPDP 2023 compliance).

## Success Metrics
- Payment time: 12 days -> 2 days.
- Error rate: 2% -> <0.3%.

## Business Logic & AI
1. **Moisture Deduction:** If moisture > 12%, net weight = (gross - tare) * (1 - (moisture - 12)/100).
2. **AI Anomaly Detection:** Logic for flagging high-yield, high-frequency, and uniform moisture.
3. **Tamper-Proofing:** Using `localTimestamp` from the device to ensure transparency in offline entries.
4. **Currency:** All calculations done using `Decimal` and stored to 2 decimal places (paisa).

## Offline Sync Protocol
1. Client generates a UUID and `localTimestamp`.
2. Client stores in `IndexedDB` (Dexie.js).
3. On sync, server uses `upsert` to prevent duplicates.
4. Server sets `syncStatus` to `SYNCED`.
