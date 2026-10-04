/**
 * Peaklyy Forge - Real System Metrics & Observability Service
 * 
 * Strictly tracks real execution metrics, queue events, sandbox outcomes,
 * and language statistics. NO FAKE OR FABRICATED METRICS.
 */

const metricsState = {
  startTime: new Date().toISOString(),
  totalExecutions: 0,
  successfulExecutions: 0,
  failedExecutions: 0,
  totalSubmissions: 0,
  acceptedSubmissions: 0,
  totalExecutionTimeMs: 0,
  timeLimitExceededCount: 0,
  memoryLimitExceededCount: 0,
  compilationErrorCount: 0,
  runtimeErrorCount: 0,
  systemErrorCount: 0,
  languageStats: {
    python: { executions: 0, successes: 0, failures: 0, totalTimeMs: 0 },
    java: { executions: 0, successes: 0, failures: 0, totalTimeMs: 0 },
    javascript: { executions: 0, successes: 0, failures: 0, totalTimeMs: 0 },
    html: { executions: 0, successes: 0, failures: 0, totalTimeMs: 0 },
    css: { executions: 0, successes: 0, failures: 0, totalTimeMs: 0 },
  },
  recentLogs: [],
};

const MAX_LOGS = 50;

/**
 * Records a real execution outcome in system metrics.
 * @param {object} event
 * @param {string} event.language
 * @param {string} [event.mode="compiler"] - 'compiler' | 'judge' | 'interactive'
 * @param {string} event.status - 'SUCCESS' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'SYSTEM_ERROR'
 * @param {number} [event.executionTime=0] - Duration in seconds
 * @param {number} [event.exitCode=0]
 * @param {boolean} [event.isSubmission=false]
 * @param {boolean} [event.isAccepted=false]
 */
const LANG_MAP = {
  py: "python",
  python: "python",
  python3: "python",
  js: "javascript",
  javascript: "javascript",
  node: "javascript",
  java: "java",
  html: "html",
  htm: "html",
  css: "css",
  cpp: "cpp",
  "c++": "cpp",
  c: "cpp",
  ts: "typescript",
  typescript: "typescript",
};

function normalizeLangName(rawLang) {
  if (!rawLang) return "python";
  const clean = String(rawLang).toLowerCase().trim();
  return LANG_MAP[clean] || clean;
}

/**
 * Records a real execution outcome in system metrics.
 * @param {object} event
 * @param {string} event.language
 * @param {string} [event.mode="compiler"] - 'compiler' | 'judge' | 'interactive'
 * @param {string} event.status - 'SUCCESS' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'SYSTEM_ERROR'
 * @param {number} [event.executionTime=0] - Duration in seconds
 * @param {number} [event.exitCode=0]
 * @param {boolean} [event.isSubmission=false]
 * @param {boolean} [event.isAccepted=false]
 */
function recordExecutionMetric({
  language,
  mode = "compiler",
  status,
  executionTime = 0,
  exitCode = 0,
  isSubmission = false,
  isAccepted = false,
}) {
  const normLang = normalizeLangName(language);
  const durationMs = Math.round((executionTime || 0) * 1000);

  metricsState.totalExecutions++;
  metricsState.totalExecutionTimeMs += durationMs;

  const isSuccess = status === "SUCCESS" || (status === "ACCEPTED" && exitCode === 0);

  if (isSuccess) {
    metricsState.successfulExecutions++;
  } else {
    metricsState.failedExecutions++;
  }

  if (isSubmission) {
    metricsState.totalSubmissions++;
    if (isAccepted || isSuccess) {
      metricsState.acceptedSubmissions++;
    }
  }

  // Categorize status count
  if (status === "TIME_LIMIT_EXCEEDED") metricsState.timeLimitExceededCount++;
  else if (status === "MEMORY_LIMIT_EXCEEDED") metricsState.memoryLimitExceededCount++;
  else if (status === "COMPILATION_ERROR") metricsState.compilationErrorCount++;
  else if (status === "RUNTIME_ERROR") metricsState.runtimeErrorCount++;
  else if (status === "SYSTEM_ERROR") metricsState.systemErrorCount++;

  // Categorize by language
  if (!metricsState.languageStats[normLang]) {
    metricsState.languageStats[normLang] = { executions: 0, successes: 0, failures: 0, totalTimeMs: 0 };
  }
  const langObj = metricsState.languageStats[normLang];
  langObj.executions++;
  langObj.totalTimeMs += durationMs;
  if (isSuccess) {
    langObj.successes++;
  } else {
    langObj.failures++;
  }

  // Append to recent audit log
  const logEntry = {
    id: `LOG-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
    timestamp: new Date().toISOString(),
    language: normLang,
    mode,
    status,
    durationMs,
    exitCode,
  };

  metricsState.recentLogs.unshift(logEntry);
  if (metricsState.recentLogs.length > MAX_LOGS) {
    metricsState.recentLogs.pop();
  }
}

/**
 * Returns complete real monitoring snapshot.
 * @param {number} [activeQueueCount=0]
 * @param {boolean} [isWorkerActive=false]
 */
function getMonitoringMetrics(activeQueueCount = 0, isWorkerActive = false) {
  const total = metricsState.totalExecutions;
  const avgTimeMs = total > 0 ? Math.round(metricsState.totalExecutionTimeMs / total) : 0;
  const successRatePct = total > 0 ? Math.round((metricsState.successfulExecutions / total) * 100) : 0;
  const acceptanceRatePct =
    metricsState.totalSubmissions > 0
      ? Math.round((metricsState.acceptedSubmissions / metricsState.totalSubmissions) * 100)
      : 0;

  return {
    success: true,
    startTime: metricsState.startTime,
    summary: {
      totalExecutions: metricsState.totalExecutions,
      successfulExecutions: metricsState.successfulExecutions,
      failedExecutions: metricsState.failedExecutions,
      successRatePct,
      totalSubmissions: metricsState.totalSubmissions,
      acceptedSubmissions: metricsState.acceptedSubmissions,
      acceptanceRatePct,
      avgExecutionTimeMs: avgTimeMs,
      activeQueueCount,
      isWorkerActive,
    },
    errorBreakdown: {
      timeLimitExceeded: metricsState.timeLimitExceededCount,
      memoryLimitExceeded: metricsState.memoryLimitExceededCount,
      compilationError: metricsState.compilationErrorCount,
      runtimeError: metricsState.runtimeErrorCount,
      systemError: metricsState.systemErrorCount,
    },
    languageBreakdown: Object.entries(metricsState.languageStats).map(([lang, stat]) => ({
      language: lang,
      executions: stat.executions,
      successes: stat.successes,
      failures: stat.failures,
      avgTimeMs: stat.executions > 0 ? Math.round(stat.totalTimeMs / stat.executions) : 0,
      successRatePct: stat.executions > 0 ? Math.round((stat.successes / stat.executions) * 100) : 0,
    })),
    recentLogs: metricsState.recentLogs,
  };
}

module.exports = {
  recordExecutionMetric,
  getMonitoringMetrics,
};
