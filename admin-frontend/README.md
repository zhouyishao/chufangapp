# chufangapp admin frontend (React + Vite + Tailwind)

## Setup

```bash
cd admin-frontend
npm install
cp .env.example .env
npm run dev
```

## Env

- `VITE_API_BASE` defaults to `http://localhost:3002/api/admin`
- Keep `VITE_API_BASE` pointed at the running backend. For local development, both `http://localhost:5176` and `http://127.0.0.1:5176` are accepted by the backend when `APP_ENV=dev`.
