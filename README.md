# AI CampusOS

Production-ready full-stack EdTech AI SaaS starter with React, TypeScript, Tailwind, FastAPI, PostgreSQL, SQLAlchemy, Alembic, JWT auth, role-based access, Docker, and seeded demo data.

## Folder Structure

```text
.
├── backend
│   ├── app
│   │   ├── core
│   │   ├── dependencies
│   │   ├── models
│   │   ├── routes
│   │   ├── schemas
│   │   ├── services
│   │   └── utils
│   ├── alembic
│   ├── Dockerfile
│   ├── requirements.txt
│   └── seed.py
├── frontend
│   ├── src
│   │   ├── api
│   │   ├── components
│   │   ├── context
│   │   ├── layouts
│   │   ├── pages
│   │   ├── routes
│   │   ├── types
│   │   └── utils
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

## Local Setup

Backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/ai_campus_os uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Seed data:

```bash
cd backend
python -m app.seed
```

Frontend:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Docker:

```bash
docker compose up --build
docker compose exec backend python -m app.seed
```

## URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API docs: http://localhost:8000/docs

## Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@aicampusos.com | Campus@123 |
| Student | student@aicampusos.com | Campus@123 |
| Faculty | faculty@aicampusos.com | Campus@123 |
| Parent | parent@aicampusos.com | Campus@123 |
| Placement Officer | placement@aicampusos.com | Campus@123 |

## API Endpoints

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/refresh-token`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

Dashboards:

- `GET /api/student/dashboard`
- `GET /api/faculty/dashboard`
- `GET /api/placement/dashboard`
- `GET /api/parent/dashboard`
- `GET /api/admin/dashboard`
- `GET /api/admin/debug/users`

AI modules:

- `GET /api/ai/placement-prediction`
- `GET /api/ai/risk-prediction`
- `GET /api/ai/skill-gap`
- `POST /api/ai/resume-analysis`
- `GET /api/ai/career-recommendation`
- `GET /api/ai/learning-roadmap`
- `POST /api/ai/assistant`

Admin/users:

- `GET /api/users`
