#!/usr/bin/env bash
set -euo pipefail

# Simple local runner for the Flask backend using gunicorn.
# Usage:
#   cd backend && cp .env.example .env && bash run.sh

cd "$(dirname "$0")"

if [[ ! -f .env ]]; then
  if [[ -f .env.example ]]; then
    cp .env.example .env
    echo "Created backend/.env from .env.example (edit it before starting)."
  fi
fi

python -m venv .venv
# shellcheck disable=SC1091
source .venv/bin/activate

python -m pip install --upgrade pip
pip install -r requirements.txt

# Ensure module import works: Procfile uses `app:app` when run from backend/.
# We run gunicorn from within backend/ so that `app.py` is importable as `app`.

echo "Starting gunicorn..."
gunicorn --bind "${PORT:-8000}" "app:app" --workers "${WEB_CONCURRENCY:-2}" --timeout 120

