# chufangapp admin backend (Express + MySQL)

## Requirements

- Node.js 18+
- MySQL 8+

## Setup

1. Create database & tables:

```sql
source sql/schema.sql;
```

2. Create `.env`:

```bash
cp .env.example .env
```

3. Install & run:

```bash
npm install
npm run dev
```

## API

- Base: `http://localhost:3001/api/admin`
- Login: `POST /auth/login`
- Protected: `Authorization: Bearer <token>`

All responses:

```json
{ "code": 0, "message": "OK", "data": {} }
```

