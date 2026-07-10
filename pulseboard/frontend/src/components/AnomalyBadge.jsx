// Small reusable badge for anomalies / severities.

const TONES = {
  CRITICAL:
    "bg-status-critical/10 text-status-critical border-status-critical/40",
  WARNING: "bg-status-warning/10 text-status-warning border-status-warning/40",
  INFO: "bg-status-good/10 text-status-good border-status-good/40",
};

export default function AnomalyBadge({ type, severity = "INFO", description }) {
  const tone = TONES[String(severity).toUpperCase()] || TONES.INFO;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${tone}`}
    >
      {type && (
        <span className="font-semibold uppercase tracking-wide">{type}</span>
      )}
      {description && <span className="opacity-90">{description}</span>}
    </span>
  );
}
