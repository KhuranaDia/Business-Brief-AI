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
import json
from typing import Any

import pandas as pd
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from agents import impact_agent
from core.database import Brief, get_db
from core.fireworks_client import call_llm
from core.orchestrator import run_pipeline
from core.seed_data import SAMPLE_BRIEFS

router = APIRouter(prefix="/api")


class AnalyzeRequest(BaseModel):
    data: Any = Field(..., description="Raw business data (object, list, or text).")
    data_source_name: str = Field(
        default="Untitled data source",
        description="Human-readable label for the data source.",
    )


class ChatRequest(BaseModel):
    question: str = Field(..., description="The user's question for the assistant.")
    brief_id: int | None = Field(
        default=None,
        description="Optional brief to focus on. Falls back to recent briefs.",
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
        patterns=result.get("patterns", []),
        likely_root_cause=result.get("likely_root_cause", ""),
        watch_list=result.get("watch_list", []),
        agent_results=result.get("agent_results", {}),
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
    result["id"] = brief.id
    result["brief_id"] = brief.id
    result["created_at"] = brief.created_at.isoformat() if brief.created_at else None
    return result


@router.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
    data_source_name: str = Form(default=""),
    db: AsyncSession = Depends(get_db),
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
    data_source_name = data_source_name.strip() or file.filename

    try:
        result = await run_pipeline(data, data_source_name)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Analysis failed: {exc}") from exc

    brief = await _persist_brief(db, result)
    result["id"] = brief.id
    result["brief_id"] = brief.id
    result["created_at"] = brief.created_at.isoformat() if brief.created_at else None
    return result


@router.get("/briefs")
async def list_briefs(db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    """Return the 10 most recent briefs."""
    stmt = select(Brief).order_by(Brief.created_at.desc()).limit(10)
    rows = (await db.execute(stmt)).scalars().all()
    return [row.to_dict() for row in rows]


@router.post("/seed")
async def seed(db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    """Populate an empty database with pre-generated sample briefs.

    Idempotent: if any briefs already exist, this is a no-op and simply returns
    the 10 most recent briefs. Only seeds when the table is empty.

    A transaction-level advisory lock serializes concurrent seed calls (e.g. the
    frontend auto-seeds on first load) so two callers cannot both observe an
    empty table and each insert the samples, which would create duplicates.
    """
    await db.execute(text("SELECT pg_advisory_xact_lock(4815162342)"))

    existing = (
        await db.execute(select(Brief).order_by(Brief.created_at.desc()).limit(10))
    ).scalars().all()
    if existing:
        return [row.to_dict() for row in existing]

    for sample in SAMPLE_BRIEFS:
        db.add(Brief(**sample))
    await db.commit()

    rows = (
        await db.execute(select(Brief).order_by(Brief.created_at.desc()).limit(10))
    ).scalars().all()
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


@router.get("/briefs/{brief_id}/impact")
async def brief_impact(
    brief_id: int, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Generate a quantified business-impact estimate for a stored brief."""
    brief = await db.get(Brief, brief_id)
    if brief is None:
        raise HTTPException(status_code=404, detail="Brief not found.")
    try:
        return await impact_agent.run(brief.to_dict())
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail=f"Impact analysis failed: {exc}"
        ) from exc


@router.post("/chat")
async def chat(
    request: ChatRequest, db: AsyncSession = Depends(get_db)
) -> dict[str, str]:
    """Executive assistant: answer a question grounded in prior analyses."""
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="A question is required.")

    if request.brief_id is not None:
        brief = await db.get(Brief, request.brief_id)
        if brief is None:
            raise HTTPException(status_code=404, detail="Brief not found.")
        briefs = [brief]
    else:
        stmt = select(Brief).order_by(Brief.created_at.desc()).limit(5)
        briefs = list((await db.execute(stmt)).scalars().all())

    if not briefs:
        raise HTTPException(
            status_code=400,
            detail="No analyses exist yet. Generate a brief before asking.",
        )

    context = [
        {
            "id": b.id,
            "data_source_name": b.data_source_name,
            "created_at": b.created_at.isoformat() if b.created_at else None,
            "overall_health": b.overall_health,
            "final_brief": b.final_brief,
            "anomalies": b.anomalies,
            "likely_root_cause": b.likely_root_cause,
            "watch_list": b.watch_list,
            "agent_results": b.agent_results,
        }
        for b in briefs
    ]

    system_prompt = (
        "You are the PulseBoard Executive Assistant, a sharp chief-of-staff who "
        "answers questions using the executive analyses provided. Be concise, "
        "specific, and cite concrete numbers from the analyses. When asked to "
        "draft a summary, investor update, email, or incident report, produce a "
        "polished, ready-to-send document. Never fabricate data beyond what the "
        "analyses support; if something is unknown, say so."
    )
    prompt = (
        f"Prior analyses (JSON):\n{json.dumps(context, default=str)[:12000]}\n\n"
        f"Question / request:\n{question}"
    )
    try:
        answer = await call_llm(
            prompt, system_prompt=system_prompt, max_tokens=1200, temperature=0.4
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Chat failed: {exc}") from exc

    return {"answer": answer}
