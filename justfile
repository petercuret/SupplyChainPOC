# Run `just` to list all recipes.

set dotenv-load := false

default:
    @just --list

# Install all dependencies and create local .env files
setup: api-setup web-setup

# Start the database, API and web app together (Ctrl+C stops the API and web app)
dev: db-up api-migrate
    #!/usr/bin/env bash
    set -euo pipefail
    trap 'kill 0' EXIT
    (cd api && uv run uvicorn main:app --reload --port 8000) &
    (cd web && npm run dev) &
    wait

# Run all tests
test: api-test web-test

# Lint and typecheck everything
lint: api-lint web-lint

# --- Database -------------------------------------------------------------

# Start the Postgres container and wait until it is healthy
db-up:
    cd api && docker compose up -d --wait db

# Stop the Postgres container (data is kept)
db-down:
    cd api && docker compose down

# Stop the Postgres container and delete its data
db-reset:
    cd api && docker compose down -v

# --- API ------------------------------------------------------------------

api-setup:
    cd api && (test -f .env || cp .env.example .env) && uv sync

# Run only the API (starts the database first)
api-dev: db-up api-migrate
    cd api && uv run uvicorn main:app --reload --port 8000

api-migrate:
    cd api && uv run python manage.py migrate

# Import the CSVs in api/seed_data into the graph (safe to re-run)
api-seed: db-up api-migrate
    cd api && uv run python manage.py import_seed

api-makemigrations:
    cd api && uv run python manage.py makemigrations

api-test:
    cd api && uv run pytest

api-lint:
    cd api && uv run ruff check . && uv run ruff format --check .

# Auto-fix lint and formatting issues in the API
api-format:
    cd api && uv run ruff check --fix . && uv run ruff format .

# --- Web ------------------------------------------------------------------

web-setup:
    cd web && (test -f .env.local || cp .env.example .env.local) && npm install

# Run only the web app
web-dev:
    cd web && npm run dev

web-test:
    cd web && npm test

web-lint:
    cd web && npm run lint && npm run typecheck
