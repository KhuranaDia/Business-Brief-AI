---
name: PulseBoard environment & validation
description: How to work on the PulseBoard app given this container lacks Python/Docker
---

# PulseBoard environment constraints

PulseBoard lives in `pulseboard/` at workspace root. It is a **standalone app, NOT a Replit artifact** (Python/FastAPI backend + React/Vite/Tailwind frontend + Postgres, orchestrated by docker-compose).

- **This container only has Node 24.** Python and Docker are NOT installed. The full app runs only via `docker-compose up`, which cannot be executed here — so you cannot run or screenshot the running app in this environment.
- **Validate frontend changes** by parsing every file with esbuild (no `--loader` flag):
  `cd pulseboard/frontend && for f in $(find src -name '*.jsx' -o -name '*.js'); do npx --yes esbuild "$f" --format=esm >/dev/null; done`
- The Replit workflows (`api-server`, `mockup-sandbox`) are unrelated scaffold artifacts, not PulseBoard.
- **Why:** brief generation calls (`/api/analyze`, `/api/upload-csv`) return an opaque 502 whenever `FIREWORKS_API_KEY` is absent from the backend env. main.py logs a startup warning when it is missing; docker-compose passes it through as `${FIREWORKS_API_KEY}`.
