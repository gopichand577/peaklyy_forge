import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

export default function VerdictBadge({
  verdict,
  status,
  showIcon = true,
  size = 12,
}) {
  const v = (verdict || status || "").toUpperCase();
  const isAccepted = v === "ACCEPTED" || v === "SUCCESS";
  const isPending = v === "PENDING" || v === "RUNNING";
  const isTLE = v === "TIME_LIMIT_EXCEEDED" || v === "TLE";

  return (
    <span
      className={`verdict-pill ${
        isAccepted ? "accepted" : isPending ? "pending" : "failed"
      }`}
    >
      {showIcon &&
        (isAccepted ? (
          <CheckCircle2 size={size} />
        ) : isTLE ? (
          <Clock size={size} />
        ) : (
          <AlertCircle size={size} />
        ))}
      <span>{v}</span>
    </span>
  );
}
