export function hexA(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const HEALTH = {
  critical: {
    label: "CRITICAL",
    color: "#EF4444",
    phrase: "Business is under stress",
  },
  at_risk: {
    label: "WARNING",
    color: "#F59E0B",
    phrase: "Some areas need attention",
  },
  healthy: {
    label: "HEALTHY",
    color: "#10B981",
    phrase: "Everything looks healthy",
  },
  unknown: { label: "UNKNOWN", color: "#6366F1", phrase: "Status unclear" },
};

const SEVERITY = {
  critical: { label: "CRITICAL", color: "#EF4444" },
  warning: { label: "WARNING", color: "#F59E0B" },
  normal: { label: "NORMAL", color: "#10B981" },
};

export function healthMeta(health) {
  const m = HEALTH[health] || HEALTH.unknown;
  return {
    label: m.label,
    color: m.color,
    phrase: m.phrase,
    accent: `linear-gradient(to bottom, ${m.color}, ${hexA(m.color, 0)})`,
    glow: `0 0 40px ${hexA(m.color, 0.08)}`,
    tint: hexA(m.color, 0.08),
    softTint: hexA(m.color, 0.05),
    border: hexA(m.color, 0.15),
  };
}

export function severityMeta(severity) {
  const m = SEVERITY[severity] || SEVERITY.normal;
  return {
    label: m.label,
    color: m.color,
    tint: hexA(m.color, 0.1),
    border: hexA(m.color, 0.25),
  };
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

export function primaryStory(text) {
  if (!text) return "";
  const strip = (s) => s.replace(/\*\*/g, "");
  const lines = text.split("\n").map((l) => l.trim());
  const idx = lines.findIndex((l) => /^\**\s*executive summary\s*\**:?/i.test(l));
  if (idx !== -1) {
    const inline = lines[idx]
      .replace(/^\**\s*executive summary\s*\**:?/i, "")
      .trim();
    if (inline) return strip(inline);
    return strip(lines.slice(idx + 1).find((l) => l) || "");
  }
  return strip(lines.find((l) => l && !/^\**[A-Z][A-Z \/&]{2,}\**:?$/.test(l)) || "");
}
