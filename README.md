# PulseBoard 🔴
### Autonomous Multi-Agent Business Intelligence

> Your business, explained. Every morning. Automatically.

Built for **AMD Developer Hackathon ACT II — Track 3 Unicorn Track**
**Team Cogent** | Dia Khurana & Hammad

---

## Live Demo
🔗 **[Try PulseBoard Live](https://PulseBoard.replit.app/pulseboard/)**

### See It In 30 Seconds
1. Click **"+ New Analysis"**
2. Click **"⚡ Try Crisis Scenario Demo Data"**
3. Watch 5 agents analyze your business in parallel
4. Read your morning brief

---

## What Is PulseBoard

Every founder and product manager starts their day opening seven dashboards, scrolling Slack, running queries — spending an hour just figuring out what happened yesterday.

**PulseBoard fixes this completely.**

Five specialized AI agents run in parallel on AMD Developer Cloud overnight. Each analyzes a different dimension of your business simultaneously. A synthesis agent connects the dots across all four and writes one plain-English brief. It lands in your dashboard before you wake up.

No dashboards to open. No queries to run. No dots to connect manually. Just answers.

---

## Agent Architecture

```
Data In → Ingestion → Parallel Agent Execution (AMD) → Synthesis → Brief Out
```

| Agent | What It Watches | Output |
|---|---|---|
| 💰 Revenue Agent | MRR, sales, refunds, failed payments | Revenue health + anomalies |
| 👥 Behavior Agent | DAU, churn, retention, funnel drop-offs | User behavior patterns |
| ⚠️ Error Agent | Error rates, latency, crashes, timeouts | System health + incidents |
| 💬 Sentiment Agent | NPS, support tickets, social mentions | Customer signal analysis |
| 🧠 Synthesis Agent | All 4 outputs combined | Final plain-English brief |

All 4 specialist agents fire **simultaneously** via `asyncio.gather()` on AMD Developer Cloud — not sequentially.

---

## Sample Brief Output

```
🔴 STATUS: CRITICAL

Revenue dropped 23% overnight. Mobile checkout errors spiked 4x 
starting at 11 PM, directly after the evening deployment. Eight 
customers have already raised support tickets. This pattern matches 
your March outage.

WHAT CHANGED:
- Revenue down $1,350 (13.8%) to $8,450 — 8.2% below weekly average
- Error rate spiked to 8.3%, ten times the normal 0.8%
- DAU dropped 34% from 1,891 to 1,243
- Support tickets up 366% — all about mobile checkout

ROOT CAUSE:
Ten-fold error spike in mobile checkout API caused 143 failures,
directly reducing revenue, DAU, and customer sentiment simultaneously.

RECOMMENDED ACTIONS:
- Rollback last night's deploy immediately
- Check payment gateway logs from 11 PM onwards
- Send customer communication within 2 hours

WATCH LIST:
- Checkout error rate over next 24 hours
- Revenue and DAU trends over next 48 hours
```

---

## AMD Integration — Genuinely Native

PulseBoard's architecture specifically requires AMD compute power:

| Execution Mode | Time | Experience |
|---|---|---|
| Sequential (one agent at a time) | ~40 seconds | Too slow |
| Parallel on AMD Developer Cloud | ~18 seconds | Fast enough to feel instant |

- **4 concurrent LLM inference processes** per brief generation
- All inference via **Fireworks AI API** (AMD-hardware hosted)
- Deployed on **AMD Developer Cloud**
- This is not "powered by AMD" as a label — the parallel architecture genuinely requires it

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11 + FastAPI |
| Agent Orchestration | asyncio.gather() — true parallel execution |
| LLM | Fireworks AI API — LLaMA 3.1 70B on AMD hardware |
| Compute | AMD Developer Cloud |
| Frontend | React 18 + Tailwind CSS |
| Database | PostgreSQL |
| Container | Docker + docker-compose |

---

## Quick Start

### Prerequisites
- Docker + docker-compose installed
- Fireworks AI API key — [get one free at fireworks.ai](https://fireworks.ai)

### Run Locally

```bash
# Clone the repo
git clone https://github.com/KhuranaDia/Business-Brief-AI
cd Business-Brief-AI

# Add your Fireworks API key
cp pulseboard/backend/.env.example pulseboard/backend/.env
# Edit .env and add: FIREWORKS_API_KEY=your_key_here

# Start everything with Docker
docker-compose up --build

# App: http://localhost:5173
# API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Run Without Docker

```bash
# Backend
cd pulseboard/backend
pip install -r requirements.txt
python main.py

# Frontend (new terminal)
cd pulseboard/frontend
npm install
npm run dev
```

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/analyze` | POST | Submit data, run all 5 agents, get brief |
| `/api/upload-csv` | POST | Upload CSV file, auto-analyze |
| `/api/briefs` | GET | Get last 10 generated briefs |
| `/api/briefs/{id}` | GET | Get specific brief by ID |
| `/api/health` | GET | System health check |

Full interactive docs at `/docs` when running locally.

---

## Project Structure

```
Business-Brief-AI/
├── pulseboard/
│   ├── backend/
│   │   ├── agents/
│   │   │   ├── revenue_agent.py
│   │   │   ├── behavior_agent.py
│   │   │   ├── error_agent.py
│   │   │   ├── sentiment_agent.py
│   │   │   └── synthesis_agent.py
│   │   ├── core/
│   │   │   ├── fireworks_client.py
│   │   │   ├── orchestrator.py
│   │   │   └── database.py
│   │   ├── api/
│   │   │   └── routes.py
│   │   └── main.py
│   └── frontend/
│       └── src/
│           ├── components/
│           └── pages/
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── README.md
```

---

## Team Cogent

Built for **AMD Developer Hackathon ACT II** — July 2026

Powered by **AMD Developer Cloud** · **Fireworks AI** · **LLaMA 3.1 70B**

*"Building AI that thinks before it acts."*
