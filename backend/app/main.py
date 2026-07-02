import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.core.ai_config import validate_ai_configuration
from app.core.config import get_settings
from app.core.database import Base, engine
from app.models import *  # noqa: F403
from app.routes import admin, ai, auth, faculty, interview, parent, placement, student, tutor, users

logging.basicConfig(level=logging.INFO, format="%(levelname)s [%(name)s] %(message)s")
logger = logging.getLogger(__name__)

settings = get_settings()


def run_pending_migrations():
    from sqlalchemy import inspect, text
    Base.metadata.create_all(bind=engine)
    try:
        insp = inspect(engine)
        tables = insp.get_table_names()
        logger.info("Database tables: %d total — running fallback column checks.", len(tables))
    except Exception as exc:
        logger.warning("Could not inspect database: %s", exc)
    _ensure_columns()


def _ensure_columns():
    from sqlalchemy import inspect
    try:
        insp = inspect(engine)
        users_cols = [c["name"] for c in insp.get_columns("users")]
        students_cols = [c["name"] for c in insp.get_columns("students")]
        with engine.connect() as conn:
            if "auth_provider" not in users_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'password' NOT NULL"))
                logger.info("Added column: auth_provider")
            if "google_sub" not in users_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN google_sub VARCHAR(255) UNIQUE"))
                logger.info("Added column: google_sub")
            if "profile_picture" not in users_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN profile_picture VARCHAR(500)"))
                logger.info("Added column: profile_picture")
            if "linkedin_headline" not in students_cols:
                conn.execute(text("ALTER TABLE students ADD COLUMN linkedin_headline VARCHAR(300)"))
                logger.info("Added column: linkedin_headline")
            if "linkedin_about" not in students_cols:
                conn.execute(text("ALTER TABLE students ADD COLUMN linkedin_about TEXT"))
                logger.info("Added column: linkedin_about")
            if "linkedin_skills" not in students_cols:
                conn.execute(text("ALTER TABLE students ADD COLUMN linkedin_skills VARCHAR(500)"))
                logger.info("Added column: linkedin_skills")
            if "linkedin_open_to_work" not in students_cols:
                conn.execute(text("ALTER TABLE students ADD COLUMN linkedin_open_to_work INTEGER DEFAULT 0"))
                logger.info("Added column: linkedin_open_to_work")
            if "resume_text" not in students_cols:
                conn.execute(text("ALTER TABLE students ADD COLUMN resume_text TEXT"))
                logger.info("Added column: resume_text")
            conn.commit()
    except Exception as exc:
        logger.warning("Could not add columns (may already exist): %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_ai_configuration(settings)
    run_pending_migrations()
    yield


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)

cors_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    *settings.allowed_origins,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(dict.fromkeys(cors_origins)),
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1):\d+$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from pathlib import Path
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
(uploads_dir / "profile_photos").mkdir(exist_ok=True)
(uploads_dir / "resumes").mkdir(exist_ok=True)
(uploads_dir / "interview_recordings").mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(users.router, prefix=settings.api_prefix)
app.include_router(student.router, prefix=settings.api_prefix)
app.include_router(faculty.router, prefix=settings.api_prefix)
app.include_router(placement.router, prefix=settings.api_prefix)
app.include_router(parent.router, prefix=settings.api_prefix)
app.include_router(admin.router, prefix=settings.api_prefix)
app.include_router(ai.router, prefix=settings.api_prefix)
app.include_router(interview.router, prefix=settings.api_prefix)
app.include_router(tutor.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": settings.app_name}
