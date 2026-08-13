# Sentinel Enterprise Audit System

Full-stack audit and risk management with **Node.js**, **MySQL**, and the existing **HTML/CSS/JS** UI.

## Features

- Role-based access: `ADMIN`, `ADMIN_AUDITOR`, `DEPT_AUDITOR`, `DEPT_USER`
- Department-scoped dashboard for staff (`department-dashboard.html`)
- Risk assignments with due dates and remediation tracking
- Automatic audit report generation on form submit
- In-app messaging and notifications

## Prerequisites

- Node.js 18+
- MySQL 8 (XAMPP, WAMP, or standalone)

## Setup

### 1. MySQL

Create the database and seed data:

```bash
cd backend
copy .env.example .env
```

Edit `backend/.env` with your MySQL credentials, then:

```bash
npm install
npm run db:init
```

### 2. Run the server

```bash
npm run dev
```

Open: **http://localhost:3000/login.html**

### Demo accounts (after `db:init`)

| Email | Password | Role |
|-------|----------|------|
| admin@sentinel.local | Admin123! | ADMIN |
| auditor@sentinel.local | Auditor123! | ADMIN_AUDITOR |
| it.staff@sentinel.local | Staff123! | DEPT_USER (IT) |

## Project structure

```
Audit System/
├── api.js, auth-guard.js, nav.js, notifications.js
├── audit dashboard.html      # Auditors / admins
├── department-dashboard.html # Department users
├── messages.html
├── login.html, signup.html
└── backend/
    ├── server.js
    ├── config/database.js
    ├── data/database.js      # MySQL layer
    ├── routes/
    ├── services/
    └── scripts/schema.sql, init-db.js
```

## API overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | Login |
| `POST /api/auth/register` | Sign up (dept required) |
| `GET /api/departments/public` | Departments for signup |
| `GET /api/dashboard/global` | Auditor dashboard stats |
| `GET /api/dashboard/department/:id` | Dept dashboard stats |
| `GET /api/assignments` | Risk assignments (scoped by role) |
| `PATCH /api/assignments/:id/remediation` | Submit remediation |
| `POST /api/audits/:id/submit` | Submit form → generate report |
| `GET /api/notifications` | User notifications |
| `GET/POST /api/messages/*` | Messaging |

## Deployment

1. Provision **MySQL** (RDS, PlanetScale, Azure MySQL, etc.).
2. Set environment variables on your host (`DB_*`, `JWT_SECRET`, `PORT`).
3. Run `npm run db:init` once against production DB.
4. Deploy Node app (Render, Railway, VPS) with `npm start`.
5. Serve static HTML from the same Express app (already configured).

## Notes

- Department users are redirected to `department-dashboard.html` after login.
- Auditors use `audit dashboard.html` and can assign risks via `POST /api/assignments`.
- Reports are stored as JSON in `audit_reports.content` (PDF export can be added later).
