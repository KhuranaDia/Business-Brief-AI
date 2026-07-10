---
name: Fireworks reasoning-model empty content
description: Troubleshooting PulseBoard analyses that fail or come back empty/all-fallback
---

# Fireworks reasoning model returns empty `content`

PulseBoard's model (`gpt-oss-120b`) is a **reasoning model**: hidden reasoning lands in `message.reasoning_content` (often 2000+ chars), separate from the answer in `message.content`. When reasoning eats the whole `max_tokens` budget, `finish_reason` becomes `length` and `content` is empty/absent.

**Why this matters:** it is intermittent — small prompts return `content` fine; large agent prompts sometimes don't. It masqueraded as two different bugs over time (a JSON "could not parse" error, then an "unexpected response shape" 502) but the real cause is the same: empty/garbled model output must be treated as recoverable, never fatal.

**Decision / invariant to preserve:** in `core/fireworks_client.py`, bad model output must degrade to a deterministic local fallback and keep `/api/analyze` at HTTP 200 — one normal call, at most one repair call, then fallback. Do NOT rerun the pipeline, add retries, switch models, or bump `max_tokens` to "fix" empties (all explicitly out of scope, and more calls worsen the 429 rate-limit problem).

**How to apply when debugging:**
- Briefs empty or all-fallback ⇒ suspect token-budget exhaustion by reasoning, NOT a parser bug. Check `finish_reason`/`usage` on a direct Fireworks call before touching parsing code.
- Never surface `reasoning_content`, raw output, stack traces, or the API key to the frontend; the user-facing fallback text is `"AI formatting failed, so PulseBoard used a fallback analysis."`
- Agents are defensive (`as_dict()` + `.get(k, default)`), so a generic fallback dict flows through safely — no per-agent fallback schema needed.

Parser tests live at `pulseboard/backend/tests/test_extract_json.py` (dependency-free).
