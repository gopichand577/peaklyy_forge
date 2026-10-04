import { AlertTriangle, CheckCircle2, X } from "lucide-react";

export default function SubmissionResultModal({ submissionResult, onClose }) {
  if (!submissionResult) return null;

  const isAccepted = submissionResult.verdict === "ACCEPTED";
  const formattedVerdict = (submissionResult.verdict || "").replace(/_/g, " ");

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="submission-verdict-modal" onClick={(e) => e.stopPropagation()}>
        <header className="verdict-modal-header">
          <div className="verdict-header-lockup">
            <span className={`verdict-huge-badge ${isAccepted ? "accepted" : "failed"}`}>
              {isAccepted ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
              <span>{formattedVerdict}</span>
            </span>
            <span className="verdict-score-pill">{submissionResult.score} / 100</span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </header>

        <div className="verdict-metrics-row">
          <div className="metric-box">
            <span className="metric-label">Test Cases</span>
            <strong className="metric-val">
              {submissionResult.passedTests} / {submissionResult.totalTests} passed
            </strong>
          </div>
          <div className="metric-box">
            <span className="metric-label">Runtime</span>
            <strong className="metric-val">{submissionResult.runtimeMs || 0} ms</strong>
          </div>
          <div className="metric-box">
            <span className="metric-label">Memory</span>
            <strong className="metric-val">
              {submissionResult.memoryKb
                ? `${Math.round(submissionResult.memoryKb / 1024)} MB`
                : "N/A"}
            </strong>
          </div>
        </div>

        {submissionResult.error && (
          <div className="verdict-error-box">
            <strong>Error details:</strong>
            <pre>{submissionResult.error}</pre>
          </div>
        )}

        <footer className="verdict-modal-footer">
          <button
            type="button"
            className="verdict-continue-btn"
            onClick={onClose}
          >
            Continue Coding
          </button>
        </footer>
      </div>
    </div>
  );
}
