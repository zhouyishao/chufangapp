# chufangapp unified backend (`server/`)

Tech:
- Node.js + Express
- Prisma (config via `prisma.config.ts`)
- PostgreSQL
- JWT (admin)

## Local run

1) Prepare PostgreSQL and create database `chufangapp`.

2) Setup env:

```bash
cd server
cp .env.example .env
```

3) Install deps:

```bash
npm install
```

4) Generate Prisma client:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chufangapp?schema=public" npm run prisma:generate
```

5) Create tables (two options):

- Recommended: Prisma migrate (will create migration files on your machine):

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chufangapp?schema=public" npm run prisma:migrate
```

- Or: apply migration SQL manually (no Prisma CLI):
  - init: `prisma/migrations/20260523090952_init/migration.sql`
  - add operation logs: `prisma/migrations/20260524143000_add_operation_logs/migration.sql`

6) Seed data:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chufangapp?schema=public" npm run prisma:seed
```

7) Start server:

```bash
npm run dev
```

- Health: `GET http://localhost:3002/health`
- Swagger UI: `GET http://localhost:3002/docs`

## Default admin account (seed)

- username: `admin`
- password: `admin123`

## API (stage 1)

Admin prefix: `/api/admin`
- `POST /api/admin/auth/login`
- `GET /api/admin/auth/profile`
- `GET/POST/PUT/DELETE /api/admin/categories`
- `GET/POST/PUT/DELETE /api/admin/ingredients`
- `GET/POST/PUT/DELETE /api/admin/recipes`
- `PATCH /api/admin/recipes/:id/publish`
- `PATCH /api/admin/recipes/:id/recommend`

App prefix: `/api`
- `GET /api/home`
- `GET /api/recipes` / `GET /api/recipes/:id`
- `GET /api/ingredients` / `GET /api/ingredients/:id`
