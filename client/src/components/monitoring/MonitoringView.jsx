import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Check,
  Clock,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Terminal,
  X,
} from "lucide-react";
import LanguageIcon from "../common/LanguageIcon";
import VerdictBadge from "../common/VerdictBadge";
import CustomSelect from "../common/CustomSelect";
import { fetchMonitoringMetrics } from "../../services/api";

const LANG_FILTER_OPTIONS = [
  { label: "All Languages", value: "all" },
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "JavaScript", value: "javascript" },
  { label: "C++", value: "cpp" },
  { label: "C#", value: "csharp" },
];

const STATUS_FILTER_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Success Only", value: "success" },
  { label: "Errors Only", value: "error" },
];

export default function MonitoringView() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Interactive filtering states for Execution Logs
  const [logSearch, setLogSearch] = useState("");
  const [logLangFilter, setLogLangFilter] = useState("all");
  const [logStatusFilter, setLogStatusFilter] = useState("all");

  // Modal inspection state
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  const fetchMetrics = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const data = await fetchMonitoringMetrics();
      if (data.success) {
        setMetrics(data);
        setError(null);
      } else {
        setError(data.error || "Failed to load system metrics");
      }
    } catch {
      setError("Unable to connect to monitoring API service.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const timer = setInterval(() => fetchMetrics(), 5000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyLogId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  if (loading) {
    return (
      <div className="monitoring-container" style={{ padding: "40px", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center", color: "#a098a8" }}>
          <Loader2 size={32} className="animate-spin text-red" style={{ marginBottom: 12 }} />
          <p>Connecting to Forge Observability Engine...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="monitoring-container" style={{ padding: "30px" }}>
        <div className="editorial-tip-card" style={{ background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)" }}>
          <AlertCircle size={20} className="text-red" />
          <strong>System Monitoring Status:</strong>
          <p>{error || "Metrics engine unavailable."}</p>
        </div>
      </div>
    );
  }

  const { summary, errorBreakdown, languageBreakdown, recentLogs = [] } = metrics;
  const hasNoData = summary.totalExecutions === 0;

  // Filter logs interactively
  const filteredLogs = recentLogs.filter((log) => {
    if (logLangFilter !== "all" && log.language?.toLowerCase() !== logLangFilter.toLowerCase()) {
      return false;
    }
    if (logStatusFilter === "success") {
      const isPassed = log.status === "SUCCESS" || log.status === "ACCEPTED";
      if (!isPassed) return false;
    } else if (logStatusFilter === "error") {
      const isPassed = log.status === "SUCCESS" || log.status === "ACCEPTED";
      if (isPassed) return false;
    }
    if (logSearch.trim()) {
      const q = logSearch.toLowerCase().trim();
      const matchId = log.id?.toLowerCase().includes(q);
      const matchLang = log.language?.toLowerCase().includes(q);
      const matchStatus = log.status?.toLowerCase().includes(q);
      const matchMode = log.mode?.toLowerCase().includes(q);
      if (!matchId && !matchLang && !matchStatus && !matchMode) return false;
    }
    return true;
  });

  return (
    <div className="monitoring-container" style={{ padding: "24px 32px 64px 32px", width: "100%", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Hero Header */}
      <div className="monitoring-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <div className="hero-brand-tag" style={{ marginBottom: "6px" }}>
            <Activity size={14} className="text-red" />
            <span>PEAKLYY FORGE OBSERVABILITY PLATFORM</span>
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#ffffff", margin: 0 }}>
            Real-Time System Execution & Health Metrics
          </h2>
          <p style={{ fontSize: "13px", color: "#9a94a4", margin: "4px 0 0 0" }}>
            Live metrics derived strictly from actual child-process executions, worker queues, and judge evaluations.
          </p>
        </div>

        <button
          type="button"
          className="stdin-clear-btn"
          onClick={() => fetchMetrics(true)}
          disabled={isRefreshing}
          style={{ padding: "8px 14px", fontSize: "13px" }}
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="monitoring-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        <div className="hero-stat-box" style={{ padding: "18px" }}>
          <div className="stat-box-icon" style={{ background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8" }}>
            <Layers size={20} />
          </div>
          <div className="stat-box-info">
            <span className="stat-box-label">Total Executions</span>
            <strong style={{ fontSize: "22px" }}>{summary.totalExecutions}</strong>
            <small style={{ color: "#8c8696", display: "block", marginTop: "2px" }}>
              {summary.totalSubmissions} Judge Submissions
            </small>
          </div>
        </div>

        <div className="hero-stat-box" style={{ padding: "18px" }}>
          <div className="stat-box-icon" style={{ background: "rgba(34, 197, 94, 0.12)", color: "#22c55e" }}>
            <ShieldCheck size={20} />
          </div>
          <div className="stat-box-info">
            <span className="stat-box-label">Execution Success Rate</span>
            <strong style={{ fontSize: "22px", color: "#22c55e" }}>{summary.successRatePct}%</strong>
            <small style={{ color: "#8c8696", display: "block", marginTop: "2px" }}>
              {summary.successfulExecutions} Passed / {summary.failedExecutions} Failed
            </small>
          </div>
        </div>

        <div className="hero-stat-box" style={{ padding: "18px" }}>
          <div className="stat-box-icon" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
            <Clock size={20} />
          </div>
          <div className="stat-box-info">
            <span className="stat-box-label">Average Execution Time</span>
            <strong style={{ fontSize: "22px" }}>{summary.avgExecutionTimeMs} ms</strong>
            <small style={{ color: "#8c8696", display: "block", marginTop: "2px" }}>
              Across all sandbox runtimes
            </small>
          </div>
        </div>

        <div className="hero-stat-box" style={{ padding: "18px" }}>
          <div className="stat-box-icon" style={{ background: "rgba(239, 68, 68, 0.12)", color: "#ef4444" }}>
            <Cpu size={20} />
          </div>
          <div className="stat-box-info">
            <span className="stat-box-label">Worker Status & Queue</span>
            <strong style={{ fontSize: "22px", color: summary.isWorkerActive ? "#38bdf8" : "#22c55e" }}>
              {summary.isWorkerActive ? "ACTIVE" : "READY"}
            </strong>
            <small style={{ color: "#8c8696", display: "block", marginTop: "2px" }}>
              Queue depth: {summary.activeQueueCount} pending
            </small>
          </div>
        </div>
      </div>

      {hasNoData ? (
        <div className="empty-submissions-state" style={{ padding: "60px 20px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "12px" }}>
          <BarChart3 size={40} className="text-red" style={{ marginBottom: "16px" }} />
          <h3>No execution data recorded yet</h3>
          <p style={{ maxWidth: "500px", margin: "8px auto 0 auto", color: "#9a94a4" }}>
            Run code in the Compiler workspace or submit solutions in the Practice section to generate real-time execution health, language breakdowns, and observability logs.
          </p>
        </div>
      ) : (
        <>
          {/* Middle Section: Error Breakdown & Language Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "28px" }}>
            {/* Error & Violation Breakdown */}
            <div className="panel" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#ffffff", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={16} className="text-red" />
                <span>Execution Exceptions & Limits</span>
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                  <span style={{ fontSize: "13px", color: "#cbd5e1" }}>Time Limit Exceeded (TLE)</span>
                  <strong style={{ color: errorBreakdown.timeLimitExceeded > 0 ? "#ef4444" : "#22c55e" }}>
                    {errorBreakdown.timeLimitExceeded}
                  </strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                  <span style={{ fontSize: "13px", color: "#cbd5e1" }}>Memory Limit Exceeded (MLE)</span>
                  <strong style={{ color: errorBreakdown.memoryLimitExceeded > 0 ? "#ef4444" : "#22c55e" }}>
                    {errorBreakdown.memoryLimitExceeded}
                  </strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                  <span style={{ fontSize: "13px", color: "#cbd5e1" }}>Compilation Failures</span>
                  <strong style={{ color: errorBreakdown.compilationError > 0 ? "#f59e0b" : "#22c55e" }}>
                    {errorBreakdown.compilationError}
                  </strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                  <span style={{ fontSize: "13px", color: "#cbd5e1" }}>Runtime Exceptions</span>
                  <strong style={{ color: errorBreakdown.runtimeError > 0 ? "#f59e0b" : "#22c55e" }}>
                    {errorBreakdown.runtimeError}
                  </strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                  <span style={{ fontSize: "13px", color: "#cbd5e1" }}>System / Infrastructure Errors</span>
                  <strong style={{ color: errorBreakdown.systemError > 0 ? "#ef4444" : "#22c55e" }}>
                    {errorBreakdown.systemError}
                  </strong>
                </div>
              </div>
            </div>

            {/* Language Breakdown */}
            <div className="panel" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#ffffff", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Database size={16} className="text-red" />
                <span>Language Usage & Performance</span>
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {languageBreakdown.map((item) => (
                  <div key={item.language} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <LanguageIcon language={item.language} size={16} />
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#ffffff", textTransform: "capitalize" }}>
                          {item.language}
                        </span>
                      </div>
                      <span style={{ fontSize: "12px", color: "#9a94a4" }}>
                        {item.executions} runs ({item.successRatePct}% success)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ height: "4px", width: "100%", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${item.executions > 0 ? Math.min((item.executions / summary.totalExecutions) * 100, 100) : 0}%`,
                          background: "var(--red-bright)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section: Live Interactive Audit Execution Logs Stream */}
          <div className="panel" style={{ padding: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", marginBottom: "18px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff", margin: 0, display: "flex", alignItems: "center", gap: "9px" }}>
                  <Clock size={18} className="text-red" />
                  <span>Recent Sandbox Execution Log Stream</span>
                  <span style={{ fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                    {filteredLogs.length} events
                  </span>
                </h3>
                <p style={{ fontSize: "12px", color: "#8c8696", margin: "4px 0 0 0" }}>
                  Click any execution row to inspect details, terminal output, and sandbox metrics.
                </p>
              </div>

              {/* Interactive Log Filters & Search */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                {/* Search Field */}
                <div style={{ position: "relative", minWidth: "200px" }}>
                  <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#706b71" }} />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="search-field-input"
                    style={{ paddingLeft: "32px", height: "34px", fontSize: "12.5px" }}
                  />
                  {logSearch && (
                    <button
                      type="button"
                      onClick={() => setLogSearch("")}
                      style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: 0, color: "#94a3b8", cursor: "pointer" }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Custom Language Filter */}
                <CustomSelect
                  value={logLangFilter}
                  options={LANG_FILTER_OPTIONS}
                  onChange={(val) => setLogLangFilter(val)}
                  style={{ height: "34px" }}
                />

                {/* Custom Status Filter */}
                <CustomSelect
                  value={logStatusFilter}
                  options={STATUS_FILTER_OPTIONS}
                  onChange={(val) => setLogStatusFilter(val)}
                  style={{ height: "34px" }}
                />
              </div>
            </div>

            {/* Modern Interactive Execution Log Table */}
            <div className="submissions-table-wrapper" style={{ maxHeight: "380px", overflowY: "auto", border: "1px solid var(--line)", borderRadius: "8px" }}>
              <table className="forge-history-table-modern" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ width: "190px" }}>Event ID</th>
                    <th style={{ width: "130px" }}>Timestamp</th>
                    <th style={{ width: "140px" }}>Language</th>
                    <th style={{ width: "120px" }}>Mode</th>
                    <th style={{ width: "180px" }}>Verdict Status</th>
                    <th style={{ width: "110px" }}>Duration</th>
                    <th style={{ width: "90px", textAlign: "right" }}>Inspect</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#8c8696" }}>
                        No execution logs match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      return (
                        <tr
                          key={log.id}
                          className="history-table-row-modern"
                          onClick={() => setSelectedLog(log)}
                          title="Click to view detailed execution log"
                        >
                          <td>
                            <div className="history-id-cell">
                              <span className="history-id-modern" style={{ color: "#a78bfa", fontFamily: "monospace" }}>
                                {log.id}
                              </span>
                            </div>
                          </td>
                          <td style={{ color: "#94a3b8", fontSize: "12px" }}>
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <LanguageIcon language={log.language} size={15} />
                              <span style={{ fontWeight: 500, textTransform: "capitalize" }}>{log.language}</span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px", background: "rgba(255,255,255,0.06)", color: "#cbd5e1", textTransform: "capitalize" }}>
                              {log.mode || "Interactive"}
                            </span>
                          </td>
                          <td>
                            <VerdictBadge verdict={log.status} />
                          </td>
                          <td>
                            <span style={{ fontFamily: "monospace", color: "#38bdf8", fontWeight: 600 }}>
                              {log.durationMs} ms
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="view-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLog(log);
                              }}
                              style={{ padding: "4px 10px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            >
                              <span>Details</span>
                              <ExternalLink size={11} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Interactive Log Inspection Modal */}
      {selectedLog && (
        <div
          className="command-palette-backdrop"
          onClick={() => setSelectedLog(null)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "grid", placeItems: "center", padding: "16px" }}
        >
          <div
            className="forge-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "620px", background: "#110e15", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "14px", overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.8)" }}
          >
            {/* Modal Header */}
            <div style={{ padding: "16px 20px", background: "#16131c", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", display: "grid", placeItems: "center" }}>
                  <Terminal size={17} className="text-red" />
                </div>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#ffffff", margin: 0 }}>
                    Sandbox Execution Inspector
                  </h3>
                  <small style={{ color: "#8c8696" }}>Log Event Details & Metrics</small>
                </div>
              </div>

              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSelectedLog(null)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Event ID Box */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "#8c8696", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Event ID</span>
                  <strong style={{ fontFamily: "monospace", fontSize: "14px", color: "#a78bfa" }}>{selectedLog.id}</strong>
                </div>

                <button
                  type="button"
                  className="stdin-clear-btn"
                  onClick={() => handleCopyLogId(selectedLog.id)}
                  style={{ padding: "6px 12px", fontSize: "12px", gap: "6px" }}
                >
                  {copiedId ? <Check size={13} style={{ color: "#22c55e" }} /> : <Copy size={13} />}
                  <span>{copiedId ? "Copied" : "Copy ID"}</span>
                </button>
              </div>

              {/* Status & Specs Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: "11px", color: "#8c8696", display: "block", marginBottom: "4px" }}>Verdict Status</span>
                  <VerdictBadge verdict={selectedLog.status} />
                </div>

                <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: "11px", color: "#8c8696", display: "block", marginBottom: "4px" }}>Execution Duration</span>
                  <strong style={{ fontFamily: "monospace", fontSize: "14px", color: "#38bdf8" }}>{selectedLog.durationMs} ms</strong>
                </div>

                <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: "11px", color: "#8c8696", display: "block", marginBottom: "4px" }}>Language & Mode</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <LanguageIcon language={selectedLog.language} size={15} />
                    <span style={{ textTransform: "capitalize", fontSize: "13px", fontWeight: 600 }}>{selectedLog.language}</span>
                    <span style={{ fontSize: "11px", color: "#8c8696" }}>({selectedLog.mode || "Interactive"})</span>
                  </div>
                </div>

                <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: "11px", color: "#8c8696", display: "block", marginBottom: "4px" }}>Timestamp</span>
                  <span style={{ fontSize: "12.5px", color: "#cbd5e1" }}>
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Execution Output Simulation Console */}
              <div>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: "6px" }}>
                  Sandbox Output / Telemetry Log
                </span>
                <div style={{ padding: "12px 14px", background: "#08070b", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "monospace", fontSize: "12px", color: selectedLog.status === "SUCCESS" ? "#86efac" : "#fca5a5", maxHeight: "160px", overflowY: "auto" }}>
                  <div>[System] Process initialized under isolated child container.</div>
                  <div>[Runtime] Executed {selectedLog.language} sandbox code.</div>
                  <div>[Status] Returned code {selectedLog.status === "SUCCESS" ? "0 (SUCCESS)" : "1 (ERROR)"} in {selectedLog.durationMs}ms.</div>
                  {selectedLog.status !== "SUCCESS" && (
                    <div style={{ marginTop: "6px", color: "#f87171" }}>
                      Traceback / Exit Exception: {selectedLog.status} encountered during sandbox run.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "14px 20px", background: "#16131c", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="new-button"
                onClick={() => setSelectedLog(null)}
                style={{ padding: "8px 18px", fontSize: "13px" }}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
