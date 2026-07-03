#!/bin/sh
set -e

DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@host.docker.internal:5432/ai_campus_os}"
DB_HOST=$(echo "$DB_URL" | sed -E 's|^.*@([^:/]+).*$|\1|')
DB_PORT=$(echo "$DB_URL" | sed -E 's|^.*:([0-9]+)/.*$|\1|')
DB_NAME=$(echo "$DB_URL" | sed -E 's|^.*/([^?]+).*$|\1|')

echo "================================================"
echo " Backend Starting Up"
echo " Database Host : $DB_HOST"
echo " Database Port : $DB_PORT"
echo " Database Name : $DB_NAME"
echo "================================================"

echo "Waiting for database connection at $DB_HOST:$DB_PORT..."
i=1
while [ $i -le 30 ]; do
  if python -c "import socket,sys; s=socket.socket(); s.settimeout(2); s.connect(('$DB_HOST',$DB_PORT)); s.close(); sys.exit(0)" 2>/dev/null; then
    echo "Database connection established."
    break
  fi
  echo "Attempt $i/30 — database not ready, retrying in 2s..."
  i=$((i + 1))
  sleep 2
done

echo "Running Alembic migrations..."
alembic upgrade head

echo "Starting Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
