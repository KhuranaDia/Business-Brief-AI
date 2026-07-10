// Shared display helpers: map backend health/severity values to labels and
// static Tailwind class strings.
//
// NOTE: Tailwind only detects complete class strings at build time, so every
// class combination below is written out in full (no string interpolation).

const HEALTH_TONE = {
  critical:
    "bg-status-critical/10 text-status-critical border-status-critical/40",
  warning: "bg-status-warning/10 text-status-warning border-status-warning/40",
  stable: "bg-status-stable/10 text-status-stable border-status-stable/40",
  good: "bg-status-good/10 text-status-good border-status-good/40",
};

const HEALTH_DOT = {
  critical: "bg-status-critical",
  warning: "bg-status-warning",
  stable: "bg-status-stable",
  good: "bg-status-good",
};

const HEALTH = {
  critical: { label: "CRITICAL", tone: "critical" },
  at_risk: { label: "WARNING", tone: "warning" },
  healthy: { label: "STABLE", tone: "stable" },
  good: { label: "GOOD", tone: "good" },
  unknown: { label: "UNKNOWN", tone: "good" },
};

const SEVERITY = {
  critical: { label: "CRITICAL", tone: "critical" },
  warning: { label: "WARNING", tone: "warning" },
  normal: { label: "NORMAL", tone: "stable" },
};

export function healthMeta(health) {
  const meta = HEALTH[health] || HEALTH.unknown;
  return { label: meta.label, badge: HEALTH_TONE[meta.tone], dot: HEALTH_DOT[meta.tone] };
}

export function severityMeta(severity) {
  const meta = SEVERITY[severity] || SEVERITY.normal;
  return { label: meta.label, badge: HEALTH_TONE[meta.tone], dot: HEALTH_DOT[meta.tone] };
}

export function formatTimestamp(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// Extract a one-line "primary story" from a brief for list previews.
export function primaryStory(text) {
  if (!text) return "";
  const lines = text.split("\n").map((l) => l.trim());
  const idx = lines.findIndex((l) => /^\**\s*executive summary\s*\**:?/i.test(l));
  if (idx !== -1) {
    const inline = lines[idx]
      .replace(/^\**\s*executive summary\s*\**:?/i, "")
      .trim();
    if (inline) return inline;
    return lines.slice(idx + 1).find((l) => l) || "";
  }
  return (
    lines.find((l) => l && !/^\**[A-Z][A-Z \/&]{2,}\**:?$/.test(l)) || ""
  );
}
