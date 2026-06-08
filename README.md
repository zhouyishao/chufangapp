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

- Admin: `http://127.0.0.1:5174`
Default API base: `http://localhost:3002/api/admin`

### 4) Start C端 App (H5)

```bash
cd frontend
npm run dev:h5
```

- C端 H5: `http://127.0.0.1:5175`

## Ports

| 服务 | 端口 |
|------|------|
| 后端 API | `3002` |
| 后台管理 | `5174` |
| C 端 H5 | `5175` |

## Notes

- `admin-backend/` and `backend/` are still kept for now (will be migrated in later stages).
