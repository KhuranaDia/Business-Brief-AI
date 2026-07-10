"""PulseBoard FastAPI application entry point."""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router
from core.database import init_db

load_dotenv()

logger = logging.getLogger("pulseboard")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the database and validate required configuration on startup."""
    if not os.environ.get("FIREWORKS_API_KEY"):
        # Surface the misconfiguration loudly at boot instead of letting every
        # /api/analyze and /api/upload-csv request fail with an opaque 502.
        logger.warning(
            "FIREWORKS_API_KEY is not set. Brief generation (/api/analyze and "
            "/api/upload-csv) will fail until it is provided. Set it as an "
            "environment variable or in a .env file before generating briefs."
        )
    await init_db()
    yield


app = FastAPI(
    title="PulseBoard",
    description=(
        "Autonomous multi-agent AI system that analyzes business data and "
        "generates a plain-English morning brief."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
async def root() -> dict[str, str]:
    return {"service": "pulseboard", "status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
