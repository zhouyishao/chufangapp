# chufangapp backend (FastAPI)

## Tech

- FastAPI
- SQLModel (SQLAlchemy)
- PostgreSQL preferred, SQLite for dev
- Alembic migrations

## Local run

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- OpenAPI: `http://localhost:8000/docs`
- Base API prefix: `/api/v1`

## API response convention

All endpoints return:

```json
{ "code": 0, "message": "OK", "data": {} }
```

List endpoints support pagination query params: `page`, `page_size`.

## Environment variables

Put secrets in `.env` (never hardcode them in code).

- `DATABASE_URL`: `sqlite:///./dev.db` (default) or `postgresql+psycopg://...`
- `APP_SECRET_KEY`: secret key
- `APP_ENV`: `dev` / `prod`

## Database migrations (Alembic)

```bash
cd backend
source .venv/bin/activate
alembic revision --autogenerate -m "init"
alembic upgrade head
```

## Test

```bash
cd backend
source .venv/bin/activate
pytest -q
```
