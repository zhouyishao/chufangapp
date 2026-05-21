from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.core.database import init_db
from app.core.response import err


def create_app() -> FastAPI:
  app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
  )

  @app.exception_handler(StarletteHTTPException)
  async def http_exception_handler(_: Request, exc: StarletteHTTPException):
    return JSONResponse(
      status_code=exc.status_code,
      content=err(code=exc.status_code, message=str(exc.detail), data=None).model_dump(),
    )

  @app.exception_handler(RequestValidationError)
  async def validation_exception_handler(_: Request, exc: RequestValidationError):
    return JSONResponse(
      status_code=422,
      content=err(code=422, message="validation error", data={"errors": exc.errors()}).model_dump(),
    )

  @app.on_event("startup")
  def on_startup() -> None:
    init_db()

  app.include_router(api_v1_router, prefix="/api/v1")
  return app


app = create_app()
