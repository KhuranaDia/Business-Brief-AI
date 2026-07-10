"""Fireworks AI client wrapper for PulseBoard.

Provides thin async helpers around the Fireworks chat completions API using a
currently-deployed instruction model (see ``MODEL``). Two entry points are
exposed:

- ``call_llm``      -> returns free-form text
- ``call_llm_json`` -> returns a parsed JSON object (dict/list)
"""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Optional

import httpx

logger = logging.getLogger("pulseboard.fireworks")

# User-facing message when JSON parsing fails and a local fallback is used.
# Never expose raw LLM output, stack traces, or internal parse errors.
FALLBACK_MESSAGE = "AI formatting failed, so PulseBoard used a fallback analysis."

# Deterministic, frontend-compatible fallback returned when both the normal
# call and the single repair call produce unparseable JSON. Keys form a
# superset of what every agent reads (insight/anomalies/severity for the
# analyze phase, metrics/notable_movements for the extract phase, and
# patterns/likely_root_cause/watch_list for synthesis) so no consumer breaks.
def _default_json_fallback() -> dict[str, Any]:
    return {
        "status": "warning",
        "severity": "warning",
        "summary": FALLBACK_MESSAGE,
        "insight": FALLBACK_MESSAGE,
        "anomalies": [],
        "metrics": [],
        "notable_movements": [],
        "patterns": [],
        "likely_root_cause": "",
        "watch_list": [],
        "confidence": 0,
        "fallback": True,
        "provider_mode": "local_fallback",
    }

FIREWORKS_API_URL = "https://api.fireworks.ai/inference/v1/chat/completions"
# Override with FIREWORKS_MODEL if a different deployed model is preferred.
MODEL = os.environ.get(
    "FIREWORKS_MODEL", "accounts/fireworks/models/gpt-oss-120b"
)

DEFAULT_SYSTEM_PROMPT = (
    "You are a precise business data analyst. Be specific, quantitative, and "
    "concise. Never invent numbers that are not present in the provided data."
)

REQUEST_TIMEOUT = httpx.Timeout(120.0, connect=10.0)


class FireworksError(RuntimeError):
    """Raised when the Fireworks API call fails or returns an unusable response."""


def _get_api_key() -> str:
    api_key = os.environ.get("FIREWORKS_API_KEY")
    if not api_key:
        raise FireworksError(
            "FIREWORKS_API_KEY environment variable is not set. "
            "Add it to your environment before calling the LLM."
        )
    return api_key


async def _post_chat_completion(
    messages: list[dict[str, str]],
    *,
    max_tokens: int,
    temperature: float,
    response_format: Optional[dict[str, Any]] = None,
) -> str:
    """Send a chat completion request and return the assistant message content."""
    api_key = _get_api_key()

    payload: dict[str, Any] = {
        "model": MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    if response_format is not None:
        payload["response_format"] = response_format

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        try:
            response = await client.post(
                FIREWORKS_API_URL, headers=headers, json=payload
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise FireworksError(
                f"Fireworks API returned {exc.response.status_code}: "
                f"{exc.response.text}"
            ) from exc
        except httpx.HTTPError as exc:
            raise FireworksError(f"Fireworks API request failed: {exc}") from exc

    data = response.json()
    try:
        choices = data["choices"]
        message = choices[0]["message"]
    except (KeyError, IndexError, TypeError):
        # Totally unexpected shape (no choices/message). Do not crash the whole
        # request — return empty so the caller's resilience layer takes over.
        logger.warning("Fireworks response missing choices/message; treating as empty")
        return ""

    content = message.get("content")
    if content:
        return content

    # Reasoning models (e.g. gpt-oss) can spend the entire token budget on hidden
    # reasoning and return empty/absent ``content`` (finish_reason="length"). This
    # is malformed-but-successful output: return empty so the caller can repair or
    # fall back instead of raising and turning the request into a 502.
    logger.warning(
        "Fireworks returned empty content (finish_reason=%s); caller will handle",
        choices[0].get("finish_reason"),
    )
    return ""


async def call_llm(
    prompt: str,
    system_prompt: str = DEFAULT_SYSTEM_PROMPT,
    max_tokens: int = 1024,
    temperature: float = 0.4,
) -> str:
    """Call the LLM and return free-form text output."""
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt},
    ]
    content = await _post_chat_completion(
        messages, max_tokens=max_tokens, temperature=temperature
    )
    return content.strip()


def extract_json_response(raw_text: str) -> Any:
    """Extract the first valid JSON value (object or array) from LLM output.

    Handles the common ways a model wraps JSON: leading/trailing prose, Markdown
    code fences, and braces that appear inside string values. Uses an
    incremental ``raw_decode`` scan (not a naive first-``{`` / last-``}`` slice)
    so nested structures and string-embedded braces parse correctly.

    Raises ``FireworksError`` on empty input or when no valid JSON value can be
    located (e.g. truncated or malformed output).
    """
    if raw_text is None:
        raise FireworksError("Empty LLM response: no content returned")

    text = raw_text.strip()
    if not text:
        raise FireworksError("Empty LLM response: no content returned")

    # Strip surrounding Markdown code fences if present.
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        text = text.strip()

    # Fast path: the whole (de-fenced) string is valid JSON.
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Robust path: scan each candidate start position for the first substring
    # that decodes as a complete JSON value. ``raw_decode`` stops at the end of
    # the value, so trailing prose is ignored, and JSON string parsing means
    # braces inside strings do not confuse the scan.
    decoder = json.JSONDecoder()
    for index, char in enumerate(text):
        if char in "{[":
            try:
                value, _ = decoder.raw_decode(text, index)
                return value
            except json.JSONDecodeError:
                continue

    raise FireworksError("Could not parse JSON from LLM output")


async def call_llm_json(
    prompt: str,
    system_prompt: str = DEFAULT_SYSTEM_PROMPT,
    max_tokens: int = 1024,
    temperature: float = 0.2,
    agent_name: str = "agent",
) -> Any:
    """Call the LLM and return parsed JSON (a dict).

    Resilience layers, in order:

    1. Request JSON mode from Fireworks and parse with ``extract_json_response``.
    2. On a parse failure, make exactly ONE repair call that feeds the malformed
       response back and asks for corrected JSON only (no pipeline rerun).
    3. If the repair also fails, return a deterministic local fallback dict so
       the request still succeeds with HTTP 200 instead of crashing.

    ``agent_name`` is used only for safe diagnostic logging.
    """
    json_system_prompt = (
        f"{system_prompt}\n\n"
        "Return only one valid JSON object. Do not use markdown, code fences, "
        "comments, explanations, or text outside the JSON."
    )
    messages = [
        {"role": "system", "content": json_system_prompt},
        {"role": "user", "content": prompt},
    ]
    content = await _post_chat_completion(
        messages,
        max_tokens=max_tokens,
        temperature=temperature,
        response_format={"type": "json_object"},
    )

    try:
        parsed = extract_json_response(content)
        logger.info(
            "call_llm_json parse ok (agent=%s, len=%d, retry=False, fallback=False)",
            agent_name,
            len(content or ""),
        )
        return parsed
    except FireworksError:
        logger.warning(
            "call_llm_json parse failed (agent=%s, len=%d); attempting one repair",
            agent_name,
            len(content or ""),
        )

    # Single repair call: hand the malformed text back and ask for valid JSON.
    repair_messages = [
        {
            "role": "system",
            "content": (
                "You fix malformed JSON. Return only one valid JSON object with "
                "no markdown, code fences, comments, or text outside the JSON."
            ),
        },
        {
            "role": "user",
            "content": (
                "The text below was supposed to be a single valid JSON object "
                "but could not be parsed. Return the corrected valid JSON only.\n\n"
                f"{content}"
            ),
        },
    ]
    try:
        repaired = await _post_chat_completion(
            repair_messages,
            max_tokens=max_tokens,
            temperature=0.0,
            response_format={"type": "json_object"},
        )
        parsed = extract_json_response(repaired)
        logger.info(
            "call_llm_json repair ok (agent=%s, len=%d, retry=True, fallback=False)",
            agent_name,
            len(repaired or ""),
        )
        return parsed
    except FireworksError:
        logger.warning(
            "call_llm_json repair failed (agent=%s, retry=True, fallback=True); "
            "returning local fallback",
            agent_name,
        )
        return _default_json_fallback()


def as_dict(value: Any) -> dict[str, Any]:
    """Return ``value`` if it is a dict, otherwise an empty dict.

    LLM JSON output is not guaranteed to be a JSON object — a model may return a
    list or a bare string even in JSON mode. Callers that expect a mapping use
    this to avoid ``AttributeError`` on ``.get`` when the shape is unexpected.
    """
    return value if isinstance(value, dict) else {}
