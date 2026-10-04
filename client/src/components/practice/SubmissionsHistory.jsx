import {
  Activity,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Filter,
  Layers,
  RotateCcw,
  Search,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import LanguageIcon from "../common/LanguageIcon";
import VerdictBadge from "../common/VerdictBadge";

export default function SubmissionsHistory({
  submissionsList = [],
  selectedProblem,
  setActiveDescTab,
  setActiveSubmissionModal,
  restorePreviousCode,
}) {
  const [subStatusFilter, setSubStatusFilter] = useState("ALL");
  const [subLangFilter, setSubLangFilter] = useState("ALL");
  const [subSearchQuery, setSubSearchQuery] = useState("");
  const [copiedSubId, setCopiedSubId] = useState(null);

  const totalSubmissions = submissionsList.length;
  const acceptedSubmissions = submissionsList.filter((s) => s.verdict === "ACCEPTED").length;
  const acceptanceRate = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;
  const bestRuntime = useMemo(() => {
    const runtimes = submissionsList
      .filter((s) => s.verdict === "ACCEPTED" && typeof s.runtimeMs === "number")
      .map((s) => s.runtimeMs);
    return runtimes.length > 0 ? Math.min(...runtimes) : null;
  }, [submissionsList]);

  const filteredSubmissions = useMemo(() => {
    return submissionsList.filter((s) => {
      if (subStatusFilter === "ACCEPTED" && s.verdict !== "ACCEPTED") return false;
      if (subStatusFilter === "WRONG_ANSWER" && s.verdict !== "WRONG_ANSWER") return false;
      if (subStatusFilter === "TIME_LIMIT_EXCEEDED" && s.verdict !== "TIME_LIMIT_EXCEEDED") return false;
      if (subStatusFilter === "ERRORS" && !["RUNTIME_ERROR", "COMPILATION_ERROR", "SYSTEM_ERROR"].includes(s.verdict)) return false;
      if (subLangFilter !== "ALL" && s.language?.toLowerCase() !== subLangFilter.toLowerCase()) return false;
      if (subSearchQuery.trim()) {
        const q = subSearchQuery.toLowerCase().trim();
        const matchId = String(s.submissionId || "").toLowerCase().includes(q);
        const matchLang = s.language?.toLowerCase().includes(q);
        const matchVerdict = s.verdict?.toLowerCase().includes(q);
        if (!matchId && !matchLang && !matchVerdict) return false;
      }
      return true;
    });
  }, [submissionsList, subStatusFilter, subLangFilter, subSearchQuery]);

  const handleCopySubId = (e, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(id)).then(() => {
      setCopiedSubId(id);
      setTimeout(() => setCopiedSubId(null), 1500);
    });
  };

  return (
    <div className="submissions-history-view-redesign">
      {/* Header Banner */}
      <div className="submissions-hub-header">
        <div className="submissions-hub-title-group">
          <div className="submissions-title-badge">
            <Activity size={16} className="text-red" />
            <h3>Submissions Dashboard</h3>
          </div>
          <p className="submissions-hub-subtitle">
            Review judge evaluation history, runtime efficiency, test results, and restore previous snapshots.
          </p>
        </div>

        <button
          type="button"
          className="submissions-back-to-editor-btn"
          onClick={() => setActiveDescTab("description")}
          title="Return to Problem Description & Code Editor"
        >
          <ArrowLeft size={14} />
          <span>Back to Code Editor</span>
        </button>
      </div>

      {/* Stats Overview 4-Card Bar */}
      <div className="submissions-stats-cards-grid">
        <div className="sub-stat-card">
          <div className="sub-stat-card-icon total">
            <Layers size={18} />
          </div>
          <div className="sub-stat-card-info">
            <span className="sub-stat-card-label">Total Submissions</span>
            <strong className="sub-stat-card-val">{totalSubmissions}</strong>
          </div>
        </div>

        <div className="sub-stat-card">
          <div className="sub-stat-card-icon accepted">
            <CheckCircle2 size={18} />
          </div>
          <div className="sub-stat-card-info">
            <span className="sub-stat-card-label">Accepted Rate</span>
            <strong className="sub-stat-card-val text-green">
              {acceptanceRate}% <small>({acceptedSubmissions}/{totalSubmissions})</small>
            </strong>
          </div>
        </div>

        <div className="sub-stat-card">
          <div className="sub-stat-card-icon speed">
            <Zap size={18} />
          </div>
          <div className="sub-stat-card-info">
            <span className="sub-stat-card-label">Best Runtime</span>
            <strong className="sub-stat-card-val">
              {bestRuntime !== null ? `${bestRuntime} ms` : "—"}
            </strong>
          </div>
        </div>

        <div className="sub-stat-card">
          <div className="sub-stat-card-icon time">
            <Clock size={18} />
          </div>
          <div className="sub-stat-card-info">
            <span className="sub-stat-card-label">Active Problem</span>
            <strong className="sub-stat-card-val" style={{ fontSize: "13px" }}>
              #{selectedProblem?.problemNumber} {selectedProblem?.title}
            </strong>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="submissions-toolbar-row">
        <div className="submissions-search-box">
          <Search size={14} className="sub-search-icon" />
          <input
            type="text"
            placeholder="Search by #ID, language, or verdict..."
            value={subSearchQuery}
            onChange={(e) => setSubSearchQuery(e.target.value)}
            className="sub-search-input"
          />
          {subSearchQuery && (
            <button
              type="button"
              className="sub-search-clear"
              onClick={() => setSubSearchQuery("")}
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="submissions-filter-pills-group">
          {[
            { id: "ALL", label: `All (${totalSubmissions})` },
            { id: "ACCEPTED", label: `Accepted (${acceptedSubmissions})`, colorClass: "green" },
            { id: "WRONG_ANSWER", label: "Wrong Answer", colorClass: "red" },
            { id: "TIME_LIMIT_EXCEEDED", label: "Time Limit", colorClass: "amber" },
            { id: "ERRORS", label: "Errors", colorClass: "rose" },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              className={`sub-filter-pill ${subStatusFilter === btn.id ? "active" : ""} ${btn.colorClass || ""}`}
              onClick={() => setSubStatusFilter(btn.id)}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="submissions-lang-select-box">
          <select
            value={subLangFilter}
            onChange={(e) => setSubLangFilter(e.target.value)}
            className="sub-lang-dropdown"
          >
            <option value="ALL">All Languages</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="javascript">JavaScript</option>
          </select>
        </div>
      </div>

      {/* Submissions Table List */}
      {submissionsList.length === 0 ? (
        <div className="empty-submissions-state">
          <Clock size={36} className="text-red" />
          <h4>No submissions recorded yet</h4>
          <p>Submit your solution using the "Submit" button on the code editor to run against the judge test suite.</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="empty-submissions-state">
          <Filter size={32} />
          <h4>No matching submissions</h4>
          <p>No submissions match your active filter criteria.</p>
          <button
            type="button"
            className="sub-clear-filter-btn"
            onClick={() => {
              setSubStatusFilter("ALL");
              setSubLangFilter("ALL");
              setSubSearchQuery("");
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="submissions-table-wrapper-redesign">
          <table className="forge-history-table-modern">
            <thead>
              <tr>
                <th>SUBMISSION ID</th>
                <th>STATUS / VERDICT</th>
                <th>LANGUAGE</th>
                <th>SCORE & TESTS</th>
                <th>RUNTIME</th>
                <th>MEMORY</th>
                <th>SUBMITTED TIME</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((sub) => {
                const isAccepted = sub.verdict === "ACCEPTED";

                return (
                  <tr
                    key={sub.submissionId}
                    className="history-table-row-modern"
                    onClick={() => setActiveSubmissionModal(sub)}
                  >
                    <td>
                      <div className="history-id-cell">
                        <span className="history-id-modern">#{sub.submissionId}</span>
                        <button
                          type="button"
                          className="sub-id-copy-btn"
                          onClick={(e) => handleCopySubId(e, sub.submissionId)}
                          title="Copy submission ID"
                        >
                          {copiedSubId === sub.submissionId ? (
                            <Check size={11} className="text-green" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      </div>
                    </td>

                    <td>
                      <VerdictBadge verdict={sub.verdict} />
                    </td>

                    <td>
                      <div className="history-lang-badge">
                        <LanguageIcon language={sub.language} size={15} />
                        <span>{sub.language}</span>
                      </div>
                    </td>

                    <td>
                      <div className="sub-score-progress-group">
                        <span className="sub-score-val">{sub.score} / 100</span>
                        <div className="sub-mini-progress-bar">
                          <div
                            className={`sub-progress-fill ${isAccepted ? "green" : "red"}`}
                            style={{ width: `${Math.max(sub.score || 0, 5)}%` }}
                          />
                        </div>
                        {sub.passedTests !== undefined && sub.totalTests !== undefined && (
                          <small className="sub-tests-ratio">
                            {sub.passedTests}/{sub.totalTests} passed
                          </small>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className="history-metric-mono">
                        <Zap size={12} className="metric-inline-icon" />
                        {sub.runtimeMs || 0} ms
                      </span>
                    </td>

                    <td>
                      <span className="history-metric-mono">
                        {sub.memoryKb ? `${Math.round(sub.memoryKb / 1024)} MB` : "14.2 MB"}
                      </span>
                    </td>

                    <td>
                      <span className="history-date-cell">
                        {new Date(sub.submittedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div className="sub-row-actions-group" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="sub-action-view-btn"
                          onClick={() => setActiveSubmissionModal(sub)}
                          title="View Submission Code & Metrics"
                        >
                          <Code2 size={13} />
                          <span>View Code</span>
                        </button>

                        <button
                          type="button"
                          className="sub-action-restore-btn"
                          onClick={() => {
                            restorePreviousCode(sub);
                            setActiveDescTab("description");
                          }}
                          title="Restore code to editor and start coding"
                        >
                          <RotateCcw size={13} />
                          <span>Restore</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
