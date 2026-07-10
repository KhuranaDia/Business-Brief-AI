// Maps backend health/severity values to display labels and Tailwind classes.

export const HEALTH_META = {
  critical: {
    label: "CRITICAL",
    badge: "bg-red-500/15 text-red-400 border-red-500/40",
    dot: "bg-red-500",
  },
  at_risk: {
    label: "WARNING",
    badge: "bg-yellow-500/15 text-yellow-300 border-yellow-500/40",
    dot: "bg-yellow-400",
  },
  healthy: {
    label: "GOOD",
    badge: "bg-green-500/15 text-green-400 border-green-500/40",
    dot: "bg-green-500",
  },
  stable: {
    label: "STABLE",
    badge: "bg-blue-500/15 text-blue-300 border-blue-500/40",
    dot: "bg-blue-400",
  },
  unknown: {
    label: "UNKNOWN",
    badge: "bg-gray-500/15 text-gray-300 border-gray-500/40",
    dot: "bg-gray-400",
  },
};

export const SEVERITY_META = {
  critical: {
    label: "Critical",
    badge: "bg-red-500/15 text-red-400 border-red-500/40",
  },
  warning: {
    label: "Warning",
    badge: "bg-yellow-500/15 text-yellow-300 border-yellow-500/40",
  },
  normal: {
    label: "Normal",
    badge: "bg-green-500/15 text-green-400 border-green-500/40",
  },
};

export const healthMeta = (health) =>
  HEALTH_META[health] || HEALTH_META.unknown;

export const severityMeta = (severity) =>
  SEVERITY_META[severity] || SEVERITY_META.normal;

export const formatTimestamp = (iso) => {
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
};
