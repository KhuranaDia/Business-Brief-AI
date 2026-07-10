"""API routes for PulseBoard.

Endpoints:
- POST /api/analyze        -> run the pipeline over JSON data, persist, return result
- POST /api/upload-csv     -> parse an uploaded CSV, run the pipeline, persist
- GET  /api/briefs         -> last 10 briefs
- GET  /api/briefs/{id}    -> a specific brief
- GET  /api/health         -> health check
"""

from __future__ import annotations

import io
from typing import Any

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import Brief, get_db
from core.orchestrator import run_pipeline

router = APIRouter(prefix="/api")


class AnalyzeRequest(BaseModel):
    data: Any = Field(..., description="Raw business data (object, list, or text).")
    data_source_name: str = Field(
        default="Untitled data source",
        description="Human-readable label for the data source.",
    )


async def _persist_brief(db: AsyncSession, result: dict[str, Any]) -> Brief:
    """Persist a pipeline result as a Brief row and return it."""
    brief = Brief(
        data_source_name=result["data_source_name"],
        final_brief=result["final_brief"],
        overall_health=result["overall_health"],
        anomalies=result["anomalies"],
        processing_time_seconds=result["processing_time_seconds"],
        agent_severities=result["agent_severities"],
    )
    db.add(brief)
    await db.commit()
    await db.refresh(brief)
    return brief


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/analyze")
async def analyze(
    request: AnalyzeRequest, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Run the multi-agent pipeline over supplied JSON data."""
    try:
        result = await run_pipeline(request.data, request.data_source_name)
    except Exception as exc:  # surface pipeline/LLM failures clearly
        raise HTTPException(status_code=502, detail=f"Analysis failed: {exc}") from exc

    brief = await _persist_brief(db, result)
    result["brief_id"] = brief.id
    result["created_at"] = brief.created_at.isoformat() if brief.created_at else None
    return result


@router.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...), db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Accept a CSV upload, parse it, and run the pipeline."""
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="A .csv file is required.")

    raw = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail=f"Could not parse CSV: {exc}"
        ) from exc

    if df.empty:
        raise HTTPException(status_code=400, detail="The uploaded CSV is empty.")

    data = df.to_dict(orient="records")
    data_source_name = file.filename

    try:
        result = await run_pipeline(data, data_source_name)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Analysis failed: {exc}") from exc

    brief = await _persist_brief(db, result)
    result["brief_id"] = brief.id
    result["created_at"] = brief.created_at.isoformat() if brief.created_at else None
    return result


@router.get("/briefs")
async def list_briefs(db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    """Return the 10 most recent briefs."""
    stmt = select(Brief).order_by(Brief.created_at.desc()).limit(10)
    rows = (await db.execute(stmt)).scalars().all()
    return [row.to_dict() for row in rows]


@router.get("/briefs/{brief_id}")
async def get_brief(
    brief_id: int, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Return a specific brief by id."""
    brief = await db.get(Brief, brief_id)
    if brief is None:
        raise HTTPException(status_code=404, detail="Brief not found.")
    return brief.to_dict()
