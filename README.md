# Chufangapp / 家常有味

This repo currently contains multiple apps/services:

- `frontend/`: App (uni-app + Vue3 + NutUI)
- `admin-frontend/`: Admin (React + Vite + Tailwind)
- `server/`: Unified backend (Express + Prisma + PostgreSQL) **(new)**
- `admin-backend/`: legacy admin backend (Express + MySQL)
- `backend/`: legacy backend (FastAPI)

## Stage 1 local dev (recommended)

### 1) Start PostgreSQL

This machine currently needs a PostgreSQL installation (Docker is not required).

Recommended (macOS): install **Postgres.app**, then create database `chufangapp`.

Configure `server/.env` with a valid `DATABASE_URL`.

### 2) Start unified backend

```bash
cd server
cp .env.example .env
npm install
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chufangapp?schema=public" npm run prisma:generate
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chufangapp?schema=public" npm run prisma:migrate
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chufangapp?schema=public" npm run prisma:seed
npm run dev
```

- Health: `http://localhost:3002/health`
- Swagger: `http://localhost:3002/docs`

### 3) Start admin frontend

```bash
cd admin-frontend
cp .env.example .env
npm install
npm run dev
```

Default API base: `http://localhost:3002/api/admin`

## Notes

- `admin-backend/` and `backend/` are still kept for now (will be migrated in later stages).
