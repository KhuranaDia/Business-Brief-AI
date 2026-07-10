"""Pre-generated sample briefs for first-run seeding.

These are static, realistic executive briefs used to populate an empty
database so a first-time visitor sees a full dashboard immediately. They are
inserted only when the ``briefs`` table is empty (see ``POST /api/seed``); no
LLM calls are made.
"""

from __future__ import annotations

from typing import Any

SAMPLE_BRIEFS: list[dict[str, Any]] = [
    {
        "data_source_name": "Acme SaaS — Crisis Scenario",
        "overall_health": "critical",
        "processing_time_seconds": 6.4,
        "final_brief": (
            "**STATUS:** CRITICAL\n\n"
            "**EXECUTIVE SUMMARY:** Revenue is collapsing as MRR fell 8.6% to "
            "$245k while refunds of $42.6k outpaced $18.4k in new bookings, "
            "driven by a broken mobile checkout experience.\n\n"
            "**WHAT CHANGED:**\n"
            "- MRR dropped from $268k to $245k month over month.\n"
            "- Checkout API failures spiked to 842, up from a normal baseline near zero.\n"
            "- NPS fell to 12 and support tickets jumped to 890.\n\n"
            "**RECOMMENDED ACTIONS:**\n"
            "- Roll back the latest mobile checkout release immediately.\n"
            "- Proactively refund and email affected customers.\n"
            "- Stand up a war room until checkout success recovers."
        ),
        "anomalies": [
            "Checkout API failures at 842 (baseline ~0)",
            "Refunds ($42.6k) exceed new bookings ($18.4k)",
            "NPS dropped 20 points to 12",
        ],
        "agent_severities": {
            "revenue": "critical",
            "behavior": "warning",
            "error": "critical",
            "sentiment": "critical",
        },
        "patterns": [
            "Revenue decline correlates with checkout failure spike",
            "Support volume rising in lockstep with error rate",
        ],
        "likely_root_cause": (
            "A regression in the latest mobile checkout release is causing payment "
            "failures, driving refunds, churn, and negative sentiment."
        ),
        "watch_list": [
            "Mobile checkout success rate",
            "Refund volume",
            "NPS trend",
        ],
        "agent_results": {
            "revenue": {
                "severity": "critical",
                "insight": "MRR fell 8.6% to $245k; refunds ($42.6k) now exceed new bookings ($18.4k).",
                "anomalies": ["Refunds exceed new bookings"],
            },
            "behavior": {
                "severity": "warning",
                "insight": "DAU slipped to 12.9k and checkout funnel dropoff hit 58%.",
                "anomalies": ["Checkout funnel dropoff at 58%"],
            },
            "error": {
                "severity": "critical",
                "insight": "Checkout API failures reached 842 with p95 latency of 1240ms.",
                "anomalies": ["842 checkout API failures"],
            },
            "sentiment": {
                "severity": "critical",
                "insight": "NPS collapsed to 12 with 890 support tickets citing mobile checkout crashes.",
                "anomalies": ["NPS down 20 points"],
            },
        },
    },
    {
        "data_source_name": "Northwind Retail — Weekly Review",
        "overall_health": "at_risk",
        "processing_time_seconds": 5.1,
        "final_brief": (
            "**STATUS:** WARNING\n\n"
            "**EXECUTIVE SUMMARY:** Growth is stalling as weekly churn climbed to "
            "6.1% and NPS slid from 54 to 41, though revenue remains stable for now.\n\n"
            "**WHAT CHANGED:**\n"
            "- Churn rose to 6.1% from a 4.2% baseline.\n"
            "- NPS dropped 13 points to 41.\n"
            "- New signups softened while active usage held flat.\n\n"
            "**RECOMMENDED ACTIONS:**\n"
            "- Launch a win-back campaign for recently churned accounts.\n"
            "- Interview detractors to isolate the NPS driver.\n"
            "- Tighten onboarding to protect activation."
        ),
        "anomalies": [
            "Weekly churn at 6.1% (baseline 4.2%)",
            "NPS down 13 points to 41",
        ],
        "agent_severities": {
            "revenue": "normal",
            "behavior": "warning",
            "error": "normal",
            "sentiment": "warning",
        },
        "patterns": [
            "Churn rising ahead of any revenue impact",
            "Sentiment softening among long-tenured users",
        ],
        "likely_root_cause": (
            "Retention is eroding before revenue reflects it; declining NPS suggests a "
            "product or support experience gap rather than a pricing issue."
        ),
        "watch_list": [
            "Weekly churn rate",
            "NPS trend",
            "New signup volume",
        ],
        "agent_results": {
            "revenue": {
                "severity": "normal",
                "insight": "Revenue is flat week over week; no immediate financial shock.",
                "anomalies": [],
            },
            "behavior": {
                "severity": "warning",
                "insight": "Weekly churn climbed to 6.1% while signups softened.",
                "anomalies": ["Churn spike to 6.1%"],
            },
            "error": {
                "severity": "normal",
                "insight": "Error rate and latency are within normal ranges.",
                "anomalies": [],
            },
            "sentiment": {
                "severity": "warning",
                "insight": "NPS fell 13 points to 41 with rising neutral-to-negative feedback.",
                "anomalies": ["NPS down 13 points"],
            },
        },
    },
    {
        "data_source_name": "Globex Cloud — Daily Snapshot",
        "overall_health": "healthy",
        "processing_time_seconds": 4.7,
        "final_brief": (
            "**STATUS:** STABLE\n\n"
            "**EXECUTIVE SUMMARY:** A healthy, normal business day. Revenue, usage, "
            "reliability, and sentiment are all within expected ranges.\n\n"
            "**WHAT CHANGED:**\n"
            "- MRR grew 1.2% with steady new bookings.\n"
            "- DAU and MAU are in line with the trailing average.\n"
            "- Error rate held at 0.4% with 99.98% uptime.\n\n"
            "**RECOMMENDED ACTIONS:**\n"
            "- No urgent action required.\n"
            "- Continue monitoring the standard KPI set."
        ),
        "anomalies": [],
        "agent_severities": {
            "revenue": "normal",
            "behavior": "normal",
            "error": "normal",
            "sentiment": "normal",
        },
        "patterns": [
            "All metrics tracking their trailing averages",
        ],
        "likely_root_cause": "",
        "watch_list": [
            "Standard KPI set",
        ],
        "agent_results": {
            "revenue": {
                "severity": "normal",
                "insight": "MRR grew 1.2% with steady bookings and low refunds.",
                "anomalies": [],
            },
            "behavior": {
                "severity": "normal",
                "insight": "DAU and MAU match the trailing average; engagement is stable.",
                "anomalies": [],
            },
            "error": {
                "severity": "normal",
                "insight": "Error rate at 0.4% with 99.98% uptime.",
                "anomalies": [],
            },
            "sentiment": {
                "severity": "normal",
                "insight": "NPS steady at 57 with normal support volume.",
                "anomalies": [],
            },
        },
    },
]
