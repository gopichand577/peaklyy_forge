import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Layers,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import LanguageIcon from "../common/LanguageIcon";
import VerdictBadge from "../common/VerdictBadge";
import { fetchMonitoringMetrics } from "../../services/api";

export default function MonitoringView() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    } catch (err) {
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

  const { summary, errorBreakdown, languageBreakdown, recentLogs } = metrics;
  const hasNoData = summary.totalExecutions === 0;

  return (
    <div className="monitoring-container" style={{ padding: "24px 32px", width: "100%", maxWidth: "1400px", margin: "0 auto" }}>
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

          {/* Bottom Section: Live Audit Execution Logs */}
          <div className="panel" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#ffffff", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={16} className="text-red" />
              <span>Recent Sandbox Execution Log Stream</span>
            </h3>

            <div className="submissions-table-wrapper" style={{ maxHeight: "350px", overflowY: "auto" }}>
              <table className="forge-history-table">
                <thead>
                  <tr>
                    <th>Event ID</th>
                    <th>Timestamp</th>
                    <th>Language</th>
                    <th>Mode</th>
                    <th>Verdict Status</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log) => {
                    const isPassed = log.status === "SUCCESS" || log.status === "ACCEPTED";
                    return (
                      <tr key={log.id}>
                        <td className="history-id-cell">
                          <code>{log.id}</code>
                        </td>
                        <td className="history-time-cell">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <LanguageIcon language={log.language} size={14} />
                            <span style={{ textTransform: "capitalize" }}>{log.language}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: "12px", color: "#9a94a4", textTransform: "capitalize" }}>{log.mode}</td>
                        <td>
                          <VerdictBadge verdict={log.status} />
                        </td>
                        <td className="history-runtime-cell">{log.durationMs} ms</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
