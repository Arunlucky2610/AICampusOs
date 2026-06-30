import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.core.config import get_settings
from app.core.database import Base, engine
from app.models import *  # noqa: F403
from app.routes import admin, ai, auth, faculty, parent, placement, student, users

logging.basicConfig(level=logging.INFO, format="%(levelname)s [%(name)s] %(message)s")
logger = logging.getLogger(__name__)

settings = get_settings()


def run_pending_migrations():
    try:
        import alembic.config
        from alembic import command
        logger.info("Running alembic migrations...")
        alembic.config.main(argv=["--raiseerr", "upgrade", "head"])
        logger.info("Alembic migrations complete.")
    except SystemExit:
        logger.warning("Alembic exit, trying direct ALTER TABLE as fallback...")
        _ensure_columns()
    except Exception as exc:
        logger.warning("Alembic migration failed: %s — trying direct ALTER TABLE...", exc)
        _ensure_columns()


def _ensure_columns():
    from sqlalchemy import inspect
    try:
        insp = inspect(engine)
        columns = [c["name"] for c in insp.get_columns("users")]
        with engine.connect() as conn:
            if "auth_provider" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'password' NOT NULL"))
                logger.info("Added column: auth_provider")
            if "google_sub" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN google_sub VARCHAR(255) UNIQUE"))
                logger.info("Added column: google_sub")
            if "profile_picture" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN profile_picture VARCHAR(500)"))
                logger.info("Added column: profile_picture")
            conn.commit()
    except Exception as exc:
        logger.warning("Could not add columns (may already exist): %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    run_pending_migrations()
    yield


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)

import os
from pathlib import Path
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
(uploads_dir / "profile_photos").mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]


@app.middleware("http")
async def cors_error_fallback(request, call_next):
    response = await call_next(request)
    origin = request.headers.get("origin", "")
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT"
        response.headers["Access-Control-Allow-Headers"] = "*"
    return response


app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(users.router, prefix=settings.api_prefix)
app.include_router(student.router, prefix=settings.api_prefix)
app.include_router(faculty.router, prefix=settings.api_prefix)
app.include_router(placement.router, prefix=settings.api_prefix)
app.include_router(parent.router, prefix=settings.api_prefix)
app.include_router(admin.router, prefix=settings.api_prefix)
app.include_router(ai.router, prefix=settings.api_prefix)


@app.get("/health")
def health():
    return {"status": "ok", "service": settings.app_name}
