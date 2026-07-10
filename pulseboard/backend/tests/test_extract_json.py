"""Local tests for ``extract_json_response`` (the LLM JSON parser).

Dependency-free: run directly with ``python tests/test_extract_json.py`` from
the ``pulseboard/backend`` directory (also importable under pytest if present).
Covers the malformed-output shapes Fireworks returns in practice.
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.fireworks_client import (  # noqa: E402
    FireworksError,
    extract_json_response,
)


def test_plain_valid_json() -> None:
    assert extract_json_response('{"a": 1, "b": "x"}') == {"a": 1, "b": "x"}


def test_json_in_code_fences() -> None:
    raw = '```json\n{"insight": "up", "anomalies": []}\n```'
    assert extract_json_response(raw) == {"insight": "up", "anomalies": []}


def test_bare_code_fences() -> None:
    raw = '```\n{"severity": "warning"}\n```'
    assert extract_json_response(raw) == {"severity": "warning"}


def test_text_before_json() -> None:
    raw = 'Here is the JSON you asked for:\n{"ok": true}'
    assert extract_json_response(raw) == {"ok": True}


def test_text_after_json() -> None:
    raw = '{"ok": true}\nHope that helps!'
    assert extract_json_response(raw) == {"ok": True}


def test_text_before_and_after_json() -> None:
    raw = 'Sure!\n{"metrics": [1, 2]}\nLet me know if you need more.'
    assert extract_json_response(raw) == {"metrics": [1, 2]}


def test_braces_inside_string_values() -> None:
    raw = '{"note": "revenue {up} by 10% {a:b}", "n": 3}'
    assert extract_json_response(raw) == {"note": "revenue {up} by 10% {a:b}", "n": 3}


def test_nested_objects_and_arrays() -> None:
    raw = (
        '{"patterns": ["p1", "p2"], '
        '"detail": {"root": {"cause": "x"}, "list": [{"k": 1}, {"k": 2}]}}'
    )
    parsed = extract_json_response(raw)
    assert parsed["detail"]["root"]["cause"] == "x"
    assert parsed["detail"]["list"][1]["k"] == 2


def test_top_level_array() -> None:
    raw = 'Result: [{"name": "MRR"}, {"name": "ARR"}]'
    assert extract_json_response(raw) == [{"name": "MRR"}, {"name": "ARR"}]


def test_empty_response_raises() -> None:
    for bad in ["", "   ", "\n\t "]:
        try:
            extract_json_response(bad)
        except FireworksError:
            continue
        raise AssertionError(f"expected FireworksError for {bad!r}")


def test_incomplete_json_raises() -> None:
    try:
        extract_json_response('{"a": 1, "b":')
    except FireworksError:
        return
    raise AssertionError("expected FireworksError for truncated JSON")


def test_malformed_json_raises() -> None:
    try:
        extract_json_response("this is not json at all, no braces")
    except FireworksError:
        return
    raise AssertionError("expected FireworksError for non-JSON text")


def _run_all() -> int:
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    failures = 0
    for test in tests:
        try:
            test()
            print(f"PASS {test.__name__}")
        except Exception as exc:  # noqa: BLE001 - test harness surface
            failures += 1
            print(f"FAIL {test.__name__}: {exc}")
    print(f"\n{len(tests) - failures}/{len(tests)} passed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(_run_all())
