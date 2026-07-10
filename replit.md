# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `pulseboard/` (workspace root, NOT a pnpm package) — standalone Dockerized full-stack app:
  - `pulseboard/backend/` — FastAPI + asyncpg, routes under `/api` (uvicorn on port 8000)
  - `pulseboard/frontend/` — React + Vite + Tailwind (npm, not pnpm), served via the `pulseboard` artifact
- `artifacts/pulseboard/.replit-artifact/artifact.toml` — thin runner: its dev/build commands `cd` into `pulseboard/frontend`. The scaffolded react-vite files in `artifacts/pulseboard/src` are unused.

## Architecture decisions

- **PulseBoard runs live in Replit AND stays Docker-compatible.** Frontend reads `BASE_PATH` (URL prefix, `/` for Docker, `/pulseboard/` in Replit) and `PORT` from env. Base path flows through: Vite `base`, React Router `basename` (`import.meta.env.BASE_URL`), and axios `baseURL` in `useApi.js`.
- **Python backend is INTERNAL** on `localhost:8000` — it is NOT on the shared proxy (avoids colliding with `api-server` which owns `/api`). The Vite dev proxy forwards the base-prefixed `/pulseboard/api/*` → backend `/api/*` (strips the prefix).
- `pulseboard/backend/core/database.py` normalizes `DATABASE_URL` for asyncpg: strips libpq-only params (`sslmode`, `channel_binding`, `sslrootcert`) and sets `connect_args={"ssl": True}` when SSL is required.

## Product

PulseBoard turns raw business data (pasted JSON or a CSV upload) into a plain-English morning brief using Fireworks AI. Requires `FIREWORKS_API_KEY` for brief generation; the UI loads and lists past briefs without it.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
