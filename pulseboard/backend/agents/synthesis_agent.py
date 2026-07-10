"""Synthesis Agent.

Combines the four specialist agent results into a single plain-English morning
brief. Runs in two steps:

1. Detect cross-agent patterns and connections (JSON).
2. Write the final brief in plain English.
"""

from __future__ import annotations

import json
from typing import Any

from core.fireworks_client import as_dict, call_llm, call_llm_json

AGENT_NAME = "synthesis"

SYSTEM_PROMPT = (
    "You are the Synthesis Agent, a chief-of-staff analyst who turns multiple "
    "specialist findings into one crisp executive morning brief. You connect dots "
    "across revenue, behavior, reliability, and sentiment. Be specific, cite "
    "concrete numbers from the findings, and never fabricate data."
)

_SEVERITY_RANK = {"critical": 3, "warning": 2, "normal": 1}


def _overall_health(severities: list[str]) -> str:
    """Roll up individual agent severities into an overall health label."""
    if not severities:
        return "unknown"
    worst = max(severities, key=lambda s: _SEVERITY_RANK.get(s, 0))
    return {"critical": "critical", "warning": "at_risk", "normal": "healthy"}.get(
        worst, "unknown"
    )


async def run(
    revenue_result: dict[str, Any],
    behavior_result: dict[str, Any],
    error_result: dict[str, Any],
    sentiment_result: dict[str, Any],
    data_source_name: str,
) -> dict[str, Any]:
    """Combine agent results and produce the final morning brief."""
    agent_results = {
        "revenue": revenue_result,
        "behavior": behavior_result,
        "error": error_result,
        "sentiment": sentiment_result,
    }

    severities = [r.get("severity", "normal") for r in agent_results.values()]
    overall_health = _overall_health(severities)

    all_anomalies: list[str] = []
    for result in agent_results.values():
        all_anomalies.extend(result.get("anomalies", []) or [])

    findings_json = json.dumps(agent_results, default=str)

    # Step 1: detect cross-agent patterns.
    pattern_prompt = (
        "Below are findings from four specialist agents (revenue, behavior, error, "
        "sentiment). Identify cross-agent patterns: where do two or more agents "
        "point at the same underlying story? Return JSON with this shape:\n"
        "{\n"
        '  "patterns": [str],        // connections spanning multiple agents\n'
        '  "likely_root_cause": str, // single most probable root cause\n'
        '  "watch_list": [str]       // things to monitor over coming days\n'
        "}\n\n"
        f"AGENT FINDINGS:\n{findings_json}"
    )
    patterns = as_dict(
        await call_llm_json(pattern_prompt, system_prompt=SYSTEM_PROMPT)
    )

    # Step 2: write the final plain-English brief.
    status_label = overall_health.replace("_", " ").upper()
    brief_prompt = (
        f"Write the morning brief for data source '{data_source_name}'. "
        f"Overall health is {status_label}.\n\n"
        "Use exactly these sections, in this order:\n"
        f"STATUS: {status_label}\n"
        "EXECUTIVE SUMMARY: 1-2 sentences capturing the single most important story.\n"
        "WHAT CHANGED: 3-5 bullet points, each with a concrete number.\n"
        "ROOT CAUSE: the most probable driver behind the changes.\n"
        "RECOMMENDED ACTIONS: 2-4 prioritized, specific actions.\n"
        "WATCH LIST: 2-3 metrics or risks to monitor.\n\n"
        "Rules: under 300 words, plain English, no jargon, every sentence must be "
        "specific and reference real numbers from the findings. Do not invent data.\n\n"
        f"AGENT FINDINGS:\n{findings_json}\n\n"
        f"CROSS-AGENT PATTERNS:\n{json.dumps(patterns, default=str)}"
    )
    final_brief = await call_llm(
        brief_prompt,
        system_prompt=SYSTEM_PROMPT,
        max_tokens=900,
        temperature=0.5,
    )

    return {
        "agent": AGENT_NAME,
        "final_brief": final_brief,
        "overall_health": overall_health,
        "anomalies": all_anomalies,
        "patterns": patterns.get("patterns", []) or [],
        "likely_root_cause": patterns.get("likely_root_cause", ""),
        "watch_list": patterns.get("watch_list", []) or [],
        "agent_severities": {
            name: result.get("severity", "normal")
            for name, result in agent_results.items()
        },
    }
