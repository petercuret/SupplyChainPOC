# CLAUDE.md

Supply Chain POC: an MVP monorepo with a Python API (`/api`) and a Next.js web app (`/web`).
All common tasks go through the root `justfile`. Run `just` to list the recipes.

## Layout

```
justfile              # Entry point for every dev task
api/                  # Python 3.12, managed with uv
  main.py             # FastAPI app: all HTTP endpoints live here (or in routers it includes)
  routers/            # catalog.py (finishers, toys, suppliers, exposure), incidents.py (CRUD)
  schemas.py          # Pydantic request/response models
  config/settings.py  # Django settings (ORM + migrations only; no Django views/urls)
  config/django.py    # Calls django.setup(); main.py imports it first
  core/               # Django app: ORM models in core/models.py, migrations in core/migrations/
    graph.py          # Edge validation + recursive-CTE traversals (exposure)
    importer.py       # seed_data/*.csv -> graph (`just api-seed`)
  tests/              # pytest, uses FastAPI TestClient
  docker-compose.yml  # Postgres 17 for local dev
web/                  # Next.js 16 (App Router) + React 19 + TypeScript, managed with npm
  src/app/            # layout.tsx (providers, Header, Sidebar), page.tsx (dashboard views),
                      # toys/[toyId]/graph (React Flow supply-chain graph)
  src/components/     # UI components (MUI); *.test.tsx next to the component
  src/lib/api.ts      # API_URL, the shared SWR `fetcher`, `send` for mutations
  src/lib/view.ts     # Selected finisher + view live in the URL (?finisher=&view=)
```

## Architecture

- **The supply chain is a generic graph.** `Node` (kind: organization | facility | item, plus a
  `role` such as finisher/supplier/factory/product/part) and `Edge` (contains | made_at |
  operated_by). Edges point from dependent to dependency (toy -> part -> factory -> supplier).
  Create edges via `core.graph.create_edge` (validates kinds against `ALLOWED_EDGES`).
  Products are tenant-scoped with `Node.owner` (the finisher); suppliers, factories, parts are shared.
- `Incident` attaches to any node; `type` is a free normalized string, `severity` a fixed choice.
  Only `open` incidents propagate. Exposure = reverse traversal (`core.graph.find_exposure`).
- **Django is only the ORM.** FastAPI serves HTTP. Don't add Django views, URLs or middleware.
  `config.django` must be imported before any Django model, which is why it is the first import in `main.py`.
- Django ORM calls are synchronous. Use plain `def` endpoints (FastAPI runs them in a threadpool), or
  `asgiref.sync.sync_to_async` / Django's async ORM methods (`aget`, `acreate`, ...) in `async def` ones.
- API routes are prefixed with `/api`. Responses are typed with Pydantic models (see `HelloResponse`).
- CORS origins come from `CORS_ORIGINS` in `api/.env` (default `http://localhost:3000`).
- The web app fetches data client-side with **SWR**: `useSWR("/api/<path>", fetcher)` inside a
  `"use client"` component. `fetcher` prefixes `NEXT_PUBLIC_API_URL` and throws on non-2xx.
- UI uses **Material UI** (`@mui/material`). Import components by path (`@mui/material/Button`).
  Theme lives in `src/components/Providers.tsx`. Use MUI components and `sx` styling, not custom CSS.
- Next.js `cacheComponents` is enabled: client components using `useSearchParams`/`useParams`
  must sit inside `<Suspense>` (check with `npm run build`). This Next.js version may differ from what you know:
  read `web/AGENTS.md` and `web/node_modules/next/dist/docs/` before using unfamiliar Next APIs.

## Commands

```bash
just setup              # install deps for both projects and create .env files
just dev                # start Postgres + API (:8000) + web (:3000)
just test               # all tests (api: pytest, web: vitest)
just lint               # ruff + eslint + tsc
just api-format         # auto-fix Python lint/formatting
just api-makemigrations # after changing Django models
just api-migrate
just api-seed           # import api/seed_data/*.csv (idempotent)
just db-reset           # wipe the local database
```

Add Python deps with `cd api && uv add <pkg>` (or `uv add --dev`), web deps with `cd web && npm install <pkg>`.

## Conventions

- This is a proof of concept: keep it small. Test only enough to show that a feature works
  (one happy path, plus a failure case when it matters). API tests don't need the database
  unless they test ORM code.
- Python: type hints everywhere, ruff for lint and format (line length 100).
- TypeScript: strict mode, `@/` import alias for `web/src`, named exports for components.
- Run `just lint` and `just test` before calling work done.
