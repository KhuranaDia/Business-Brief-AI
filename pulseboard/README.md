# PulseBoard

An autonomous multi-agent AI system that analyzes business data and generates a plain-English **morning brief**.

Four specialist agents (Revenue, Behavior, Error, Sentiment) analyze your data **in parallel**, then a Synthesis agent connects the dots across all of them and writes a concise executive brief.

## Architecture

```
                    ┌──────────────┐
   business data →  │ Orchestrator │
                    └──────┬───────┘
          ┌───────────┬────┴─────┬────────────┐
          ▼           ▼          ▼            ▼
      Revenue     Behavior     Error      Sentiment    (run in parallel)
          └───────────┴────┬─────┴────────────┘
                           ▼
                     Synthesis agent  → final morning brief
```

- **Backend** — Python + FastAPI, async SQLAlchemy over PostgreSQL, Fireworks AI (`llama-v3p1-70b-instruct`) for LLM reasoning.
- **Frontend** — React 18 + Vite + Tailwind CSS (dark theme), React Router, axios.
- **Database** — PostgreSQL, stores every generated brief.
- **Containerization** — Docker + docker-compose for a one-command stack.

## Project structure

```
pulseboard/
├── backend/
│   ├── agents/          # revenue, behavior, error, sentiment, synthesis
│   ├── core/            # fireworks_client, orchestrator, database
│   ├── api/routes.py    # FastAPI endpoints
│   ├── main.py          # app entry point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/  # Dashboard, BriefCard, AgentActivity, UploadData
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── nginx.conf       # serves the SPA + proxies /api to the backend
│   └── package.json
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── README.md
```

## Quick start (Docker)

1. Set your Fireworks API key (create a `.env` file next to `docker-compose.yml`):

   ```
   FIREWORKS_API_KEY=your_key_here
   ```

2. Build and run the whole stack:

   ```bash
   docker-compose up --build
   ```

3. Open the app:
   - Frontend: http://localhost:3000
   - Backend API docs: http://localhost:8000/docs

## Local development (without Docker)

**Backend**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in FIREWORKS_API_KEY and DATABASE_URL
uvicorn main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173, proxies /api to :8000
```

## API endpoints

| Method | Path               | Description                                  |
| ------ | ------------------ | -------------------------------------------- |
| POST   | `/api/analyze`     | Run the pipeline over JSON data, save a brief |
| POST   | `/api/upload-csv`  | Upload a CSV, parse it, run the pipeline      |
| GET    | `/api/briefs`      | Last 10 briefs                                |
| GET    | `/api/briefs/{id}` | A specific brief                              |
| GET    | `/api/health`      | Health check                                  |

## Environment variables

| Variable            | Used by  | Description                          |
| ------------------- | -------- | ------------------------------------ |
| `FIREWORKS_API_KEY` | backend  | Fireworks AI API key                 |
| `DATABASE_URL`      | backend  | Async Postgres connection string     |
| `VITE_API_URL`      | frontend | Optional API base URL override       |
