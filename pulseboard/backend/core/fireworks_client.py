"""Fireworks AI client wrapper for PulseBoard.

Provides thin async helpers around the Fireworks chat completions API using a
currently-deployed instruction model (see ``MODEL``). Two entry points are
exposed:

- ``call_llm``      -> returns free-form text
- ``call_llm_json`` -> returns a parsed JSON object (dict/list)
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Optional

import httpx

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
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise FireworksError(
            f"Unexpected Fireworks response shape: {json.dumps(data)[:500]}"
        ) from exc


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


def _extract_json(text: str) -> Any:
    """Best-effort extraction of a JSON object/array from a text blob."""
    text = text.strip()

    # Strip Markdown code fences if present.
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Fall back to grabbing the first balanced JSON object or array.
    match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError as exc:
            raise FireworksError(
                f"Could not parse JSON from LLM output: {text[:500]}"
            ) from exc

    raise FireworksError(f"No JSON found in LLM output: {text[:500]}")


async def call_llm_json(
    prompt: str,
    system_prompt: str = DEFAULT_SYSTEM_PROMPT,
    max_tokens: int = 1024,
    temperature: float = 0.2,
) -> Any:
    """Call the LLM and return parsed JSON (dict or list).

    Requests JSON mode from Fireworks and defensively parses the response so a
    slightly malformed payload (code fences, prose wrapper) still succeeds.
    """
    json_system_prompt = (
        f"{system_prompt}\n\n"
        "Respond ONLY with valid JSON. Do not include any prose, explanation, "
        "or Markdown code fences."
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
    return _extract_json(content)


def as_dict(value: Any) -> dict[str, Any]:
    """Return ``value`` if it is a dict, otherwise an empty dict.

    LLM JSON output is not guaranteed to be a JSON object — a model may return a
    list or a bare string even in JSON mode. Callers that expect a mapping use
    this to avoid ``AttributeError`` on ``.get`` when the shape is unexpected.
    """
    return value if isinstance(value, dict) else {}
