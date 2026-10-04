import {
  Activity,
  Check,
  Code2,
  Copy,
  RotateCcw,
  X,
} from "lucide-react";
import { useState } from "react";
import LanguageIcon from "../common/LanguageIcon";
import VerdictBadge from "../common/VerdictBadge";

export default function SubmissionDetailModal({
  activeSubmissionModal,
  selectedProblem,
  onClose,
  restorePreviousCode,
}) {
  const [copiedModalCode, setCopiedModalCode] = useState(false);

  if (!activeSubmissionModal) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="submission-detail-modal" onClick={(e) => e.stopPropagation()}>
        <header className="submission-modal-header">
          <div className="submission-modal-title-group">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={16} className="text-red" />
              <h3>Submission #{activeSubmissionModal.submissionId}</h3>
              <div className="history-lang-badge">
                <LanguageIcon language={activeSubmissionModal.language} size={14} />
                <span>{activeSubmissionModal.language}</span>
              </div>
            </div>
            <small className="submission-modal-subtext">
              {activeSubmissionModal.problemTitle || selectedProblem?.title} • Submitted on{" "}
              {new Date(activeSubmissionModal.submittedAt).toLocaleString()}
            </small>
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

        <div className="submission-detail-metrics-grid">
          <div className="sub-modal-metric-card">
            <span className="sub-modal-metric-label">Verdict</span>
            <VerdictBadge verdict={activeSubmissionModal.verdict} />
          </div>

          <div className="sub-modal-metric-card">
            <span className="sub-modal-metric-label">Score</span>
            <strong className="sub-modal-metric-val">{activeSubmissionModal.score} / 100</strong>
          </div>

          <div className="sub-modal-metric-card">
            <span className="sub-modal-metric-label">Runtime</span>
            <strong className="sub-modal-metric-val">{activeSubmissionModal.runtimeMs || 0} ms</strong>
          </div>

          <div className="sub-modal-metric-card">
            <span className="sub-modal-metric-label">Test Cases</span>
            <strong className="sub-modal-metric-val text-green">
              {activeSubmissionModal.passedTests !== undefined
                ? `${activeSubmissionModal.passedTests} / ${activeSubmissionModal.totalTests} passed`
                : "Full Evaluation"}
            </strong>
          </div>
        </div>

        <div className="submission-code-viewer-container">
          <div className="submission-code-header-bar">
            <div className="code-lang-indicator">
              <Code2 size={13} />
              <span>Submitted Source Code ({activeSubmissionModal.language})</span>
            </div>

            <button
              type="button"
              className="sub-copy-code-btn"
              onClick={() => {
                if (activeSubmissionModal.code) {
                  navigator.clipboard.writeText(activeSubmissionModal.code);
                  setCopiedModalCode(true);
                  setTimeout(() => setCopiedModalCode(false), 2000);
                }
              }}
            >
              {copiedModalCode ? (
                <>
                  <Check size={12} className="text-green" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <div className="submission-code-viewer">
            {(activeSubmissionModal.code || "").split("\n").map((line, idx) => (
              <div key={idx} className="code-line-row">
                <span className="code-line-num">{idx + 1}</span>
                <span className="code-line-text">{line || " "}</span>
              </div>
            ))}
          </div>
        </div>

        <footer className="submission-modal-footer">
          <button
            type="button"
            className="restore-code-btn"
            onClick={() => {
              restorePreviousCode(activeSubmissionModal);
            }}
          >
            <RotateCcw size={14} />
            <span>Restore this code & Start Coding</span>
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={onClose}
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
