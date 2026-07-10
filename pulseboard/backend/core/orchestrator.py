"""Orchestrator.

Coordinates the multi-agent analysis pipeline:

1. Run the four specialist agents (revenue, behavior, error, sentiment) fully in
   parallel with ``asyncio.gather``.
2. Feed all four results into the synthesis agent.
3. Return a complete, serializable result including timing.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any

from agents import (
    behavior_agent,
    error_agent,
    revenue_agent,
    sentiment_agent,
    synthesis_agent,
)


async def run_pipeline(data: Any, data_source_name: str) -> dict[str, Any]:
    """Run the full PulseBoard analysis pipeline over ``data``.

    Args:
        data: The raw business data (parsed JSON, dict, list, or text).
        data_source_name: Human-readable label for the data source.

    Returns:
        A dict with the final brief, overall health, anomalies, per-agent
        results, and total processing time in seconds.
    """
    start = time.perf_counter()

    # Phase 1: run all four specialist agents in parallel.
    revenue_result, behavior_result, error_result, sentiment_result = (
        await asyncio.gather(
            revenue_agent.run(data),
            behavior_agent.run(data),
            error_agent.run(data),
            sentiment_agent.run(data),
        )
    )

    # Phase 2: synthesize the four results into a single morning brief.
    synthesis = await synthesis_agent.run(
        revenue_result,
        behavior_result,
        error_result,
        sentiment_result,
        data_source_name,
    )

    processing_time = round(time.perf_counter() - start, 2)

    return {
        "data_source_name": data_source_name,
        "final_brief": synthesis["final_brief"],
        "overall_health": synthesis["overall_health"],
        "anomalies": synthesis["anomalies"],
        "patterns": synthesis["patterns"],
        "likely_root_cause": synthesis["likely_root_cause"],
        "watch_list": synthesis["watch_list"],
        "agent_severities": synthesis["agent_severities"],
        "agent_results": {
            "revenue": revenue_result,
            "behavior": behavior_result,
            "error": error_result,
            "sentiment": sentiment_result,
        },
        "processing_time_seconds": processing_time,
    }
