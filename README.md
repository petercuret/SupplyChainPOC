# Supply Chain POC

A monorepo with two projects:

- **`api/`**: Python API. FastAPI serves the endpoints, Django provides the ORM, PostgreSQL runs in Docker.
- **`web/`**: Next.js + React + TypeScript app built with Material UI. It fetches data from the API with SWR.

## Prerequisites

- [just](https://github.com/casey/just) (`brew install just`)
- [uv](https://docs.astral.sh/uv/) (`brew install uv`)
- [Node.js](https://nodejs.org/) 22 or newer
- [Docker](https://www.docker.com/) (running)

## Getting started

```bash
just setup   # install dependencies and create .env files
just dev     # start the database, API and web app
```

Then open:

- Web app: http://localhost:3000. It should show **"Hello, World!"** from the API.
- API docs: http://localhost:8000/docs

Press `Ctrl+C` to stop. Postgres keeps running in the background; stop it with `just db-down`.

## Common commands

| Command                   | What it does                                  |
| ------------------------- | --------------------------------------------- |
| `just`                    | List all commands                             |
| `just dev`                | Run the database, API and web app             |
| `just api-dev`            | Run only the API (and database)               |
| `just web-dev`            | Run only the web app                          |
| `just test`               | Run all tests                                 |
| `just lint`               | Lint and typecheck both projects              |
| `just api-makemigrations` | Create Django migrations after model changes  |
| `just api-migrate`        | Apply migrations                              |
| `just db-down`            | Stop the database                             |
| `just db-reset`           | Stop the database and delete its data         |

## Configuration

- `api/.env`: database credentials and allowed CORS origins (created from `api/.env.example`).
- `web/.env.local`: `NEXT_PUBLIC_API_URL`, the API's address (created from `web/.env.example`).
