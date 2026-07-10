"""Error Agent.

Analyzes system health and reliability metrics in two phases:

1. Extract structured reliability signals from the raw data (JSON).
2. Reason over those signals to produce an insight, anomaly list, and severity.
"""

from __future__ import annotations

import json
from typing import Any

from core.fireworks_client import as_dict, call_llm_json

AGENT_NAME = "error"

SYSTEM_PROMPT = (
    "You are the Error Agent, a specialist in system health and reliability. You "
    "focus on error rates, p95/p99 latency, uptime, crash rates, API failure "
    "rates, and incident volume. Be quantitative and never fabricate numbers."
)


def _stringify(data: Any) -> str:
    if isinstance(data, str):
        return data
    return json.dumps(data, default=str)[:8000]


async def run(data: Any) -> dict[str, Any]:
    """Run the two-phase reliability analysis and return a structured result."""
    raw = _stringify(data)

    # Phase 1: extract reliability signals as structured JSON.
    extract_prompt = (
        "From the business data below, extract every system-health and reliability "
        "signal you can find. Return JSON with this shape:\n"
        "{\n"
        '  "metrics": [{"name": str, "value": number|string, "period": str}],\n'
        '  "incidents": [str],\n'
        '  "notable_movements": [str]\n'
        "}\n"
        "Only include values actually present in the data.\n\n"
        f"DATA:\n{raw}"
    )
    signals = await call_llm_json(
        extract_prompt, system_prompt=SYSTEM_PROMPT, agent_name=AGENT_NAME
    )

    # Phase 2: analyze trends and anomalies from the extracted signals.
    analyze_prompt = (
        "Given these extracted reliability signals, analyze system health trends "
        "and detect anomalies. Return JSON with this exact shape:\n"
        "{\n"
        '  "insight": str,           // 2-3 sentences, specific and quantitative\n'
        '  "anomalies": [str],       // concrete anomalies, empty list if none\n'
        '  "severity": str           // one of: critical, warning, normal\n'
        "}\n\n"
        f"RELIABILITY SIGNALS:\n{json.dumps(signals, default=str)}"
    )
    analysis = as_dict(
        await call_llm_json(
            analyze_prompt, system_prompt=SYSTEM_PROMPT, agent_name=AGENT_NAME
        )
    )

    severity = str(analysis.get("severity", "normal")).lower()
    if severity not in {"critical", "warning", "normal"}:
        severity = "normal"

    return {
        "agent": AGENT_NAME,
        "insight": analysis.get("insight", ""),
        "anomalies": analysis.get("anomalies", []) or [],
        "severity": severity,
        "signals": signals,
    }
