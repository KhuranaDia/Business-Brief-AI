---
name: PulseBoard on Replit (standalone Docker app in a pnpm monorepo)
description: How the standalone Dockerized PulseBoard app (pulseboard/) is made to run live in Replit's path-based proxy without losing Docker compatibility.
---

PulseBoard lives at `pulseboard/` (workspace root) and is a self-contained Docker app: FastAPI backend + React/Vite/Tailwind frontend (npm, NOT a pnpm workspace package). It must keep working under `docker compose` (base path `/`) AND run live inside Replit.

## Key constraints & decisions

- **Do not fold `pulseboard/frontend` into the pnpm workspace.** It stays an npm app so the Docker build is untouched. The Replit `pulseboard` artifact is a *thin runner*: its `artifact.toml` dev/build commands `cd` into `pulseboard/frontend`. The scaffolded react-vite files under `artifacts/pulseboard/src` are unused (kept so the pnpm workspace stays valid).
- **Artifact service run command CWD is the artifact directory** (`artifacts/pulseboard`), NOT the workspace root. Relative `cd pulseboard/frontend` fails with "No such file or directory". Use an absolute path: `bash -c 'cd /home/runner/workspace/pulseboard/frontend && npm run dev'`.
- **`verifyAndReplaceArtifactToml` refuses to change the `integratedSkills` block.** When rewriting a generated artifact.toml, preserve the `[[integratedSkills]]` entry verbatim or it errors with `ARTIFACT_EDITING_ERROR - cannot change integratedSkills`.

## Path-prefix architecture (Docker-compatible)

- Frontend reads `BASE_PATH` (URL prefix; `/` for Docker, `/pulseboard/` in Replit) and `PORT` from env. Base path flows through three places: Vite `base`, React Router `basename` (`import.meta.env.BASE_URL`, strip trailing slash), axios `baseURL` in `src/hooks/useApi.js`.
- **Python backend stays INTERNAL on localhost:8000** — deliberately NOT registered on the shared proxy, because the scaffold `api-server` artifact already owns `/api`. The Vite dev proxy key is `${PREFIX}/api` and rewrites by stripping `PREFIX`, so the browser hits `/pulseboard/api/*` → vite → backend `/api/*`.

## asyncpg + Replit Postgres

`DATABASE_URL` from Replit includes libpq-only params (`sslmode`, `channel_binding`, `sslrootcert`) that asyncpg rejects (`connect() got an unexpected keyword argument 'sslmode'`). `pulseboard/backend/core/database.py` has `_normalize_url()` that strips them and sets `connect_args={"ssl": True}` when sslmode requires SSL.

## Secrets

`FIREWORKS_API_KEY` is required only for brief generation (`/api/analyze`, `/api/upload-csv`). The app boots and lists past briefs without it; backend logs a clear warning at startup.
