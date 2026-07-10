"""Business Impact Agent.

Answers the executive question "why should I care?" by turning a completed brief
into a concrete, quantified business impact estimate. This does not run as part
of the core analysis pipeline; it is invoked on demand for a stored brief.
"""

from __future__ import annotations

import json
from typing import Any

from core.fireworks_client import as_dict, call_llm_json

AGENT_NAME = "impact"

SYSTEM_PROMPT = (
    "You are the Business Impact Agent, a CFO-minded analyst. Given an executive "
    "brief and its supporting findings, you estimate the concrete business impact "
    "in money, customers, and urgency. Ground every number in the evidence "
    "provided; when data is thin, make a clearly-reasoned, conservative estimate "
    "rather than refusing. Never return empty strings."
)

_ALLOWED_PRIORITIES = {"critical", "high", "medium", "low"}


async def run(brief: dict[str, Any]) -> dict[str, Any]:
    """Generate a structured business-impact estimate for a stored brief."""
    context = {
        "data_source_name": brief.get("data_source_name"),
        "overall_health": brief.get("overall_health"),
        "final_brief": brief.get("final_brief"),
        "anomalies": brief.get("anomalies"),
        "likely_root_cause": brief.get("likely_root_cause"),
        "watch_list": brief.get("watch_list"),
        "agent_results": brief.get("agent_results"),
    }

    prompt = (
        "Analyze the executive brief and findings below and quantify the business "
        "impact. Return JSON with this exact shape:\n"
        "{\n"
        '  "headline": str,               // one punchy sentence: why this matters now\n'
        '  "revenue_at_risk": str,        // e.g. "$18,400" or "Minimal" if healthy\n'
        '  "customers_affected": str,     // e.g. "21%" or "~340 accounts"\n'
        '  "priority": str,               // one of: critical, high, medium, low\n'
        '  "resolve_within": str,         // e.g. "2 hours", "This week"\n'
        '  "projected_loss_24h": str,     // projected loss if unresolved in 24h, e.g. "$72,000"\n'
        '  "reasoning": str               // 1-2 sentences explaining how you derived the numbers\n'
        "}\n"
        "If the business is healthy, still fill every field (use low/minimal "
        "values and frame it as opportunity rather than risk).\n\n"
        f"BRIEF AND FINDINGS:\n{json.dumps(context, default=str)[:9000]}"
    )

    impact = as_dict(await call_llm_json(prompt, system_prompt=SYSTEM_PROMPT))

    priority = str(impact.get("priority", "medium")).lower().strip()
    if priority not in _ALLOWED_PRIORITIES:
        priority = "medium"

    return {
        "headline": impact.get("headline", ""),
        "revenue_at_risk": impact.get("revenue_at_risk", ""),
        "customers_affected": impact.get("customers_affected", ""),
        "priority": priority,
        "resolve_within": impact.get("resolve_within", ""),
        "projected_loss_24h": impact.get("projected_loss_24h", ""),
        "reasoning": impact.get("reasoning", ""),
    }
