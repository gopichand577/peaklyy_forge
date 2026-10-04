/**
 * Peaklyy Forge - Job Queue & Worker Service (P1 Online Judge)
 *
 * Manages asynchronous execution jobs, status tracking, and worker processing.
 */

const { EXECUTION_LIMITS } = require("../config/executionLimits");
const { evaluateSubmission } = require("./judgeEngine");
const { saveSubmission } = require("../data/submissionsStore");

const jobsMap = new Map();
const jobQueue = [];
let isWorkerRunning = false;

function generateJobId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `JOB-${ts}-${rand}`;
}

/**
 * Creates and enqueues a new execution/judge job.
 * @param {object} params
 * @param {string} params.type - 'run' | 'submit'
 * @param {string} params.problemId
 * @param {string} params.language
 * @param {string} params.code
 * @param {Array<object>} params.testCases
 * @param {string} [params.comparisonMode]
 * @param {number} [params.timeLimit]
 * @param {number} [params.memoryLimit]
 * @returns {string} jobId
 */
function createJob(params) {
  const jobId = generateJobId();
  const jobRecord = {
    jobId,
    type: params.type || "run",
    status: "QUEUED",
    statusDetail: "In execution queue",
    params,
    result: null,
    error: null,
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    attempts: 0,
  };

  jobsMap.set(jobId, jobRecord);
  jobQueue.push(jobId);

  processQueue();

  return jobId;
}

function getJob(jobId) {
  return jobsMap.get(jobId) || null;
}

async function processQueue() {
  if (isWorkerRunning) return;
  if (jobQueue.length === 0) return;

  isWorkerRunning = true;

  while (jobQueue.length > 0) {
    const jobId = jobQueue.shift();
    const job = jobsMap.get(jobId);
    if (!job) continue;

    job.startedAt = new Date().toISOString();
    job.status = "RUNNING";
    job.statusDetail = "Executing sandbox...";
    job.attempts++;

    try {
      const evalResult = await evaluateSubmission({
        language: job.params.language,
        code: job.params.code,
        testCases: job.params.testCases,
        comparisonMode: job.params.comparisonMode || "trimmed",
        timeLimit: job.params.timeLimit || EXECUTION_LIMITS.cpuTimeMs,
        memoryLimit: job.params.memoryLimit || EXECUTION_LIMITS.memoryMb,
        isSubmit: job.params.type === "submit",
        onProgress: (statusText) => {
          job.statusDetail = statusText;
        },
      });

      job.status = "COMPLETED";
      job.statusDetail = "Execution completed";
      job.completedAt = new Date().toISOString();
      job.result = evalResult;

      // If this was a submission, persist to submissions store
      if (job.params.type === "submit") {
        const submissionRecord = saveSubmission({
          jobId: job.jobId,
          problemId: job.params.problemId,
          problemTitle: job.params.problemTitle || job.params.problemId,
          language: job.params.language,
          code: job.params.code,
          verdict: evalResult.verdict,
          score: evalResult.score,
          passedTests: evalResult.passedTests,
          totalTests: evalResult.totalTests,
          runtimeMs: evalResult.runtimeMs,
          memoryKb: evalResult.memoryKb,
          error: evalResult.error,
          // Only store sample results in submission history to preserve hidden tests!
          sampleResults: (evalResult.testResults || []).filter((tr) => !String(tr.id).startsWith("10")),
        });
        job.submission = submissionRecord;
      }
    } catch (err) {
      console.error(`Worker error on job ${jobId}:`, err);
      job.status = "FAILED";
      job.statusDetail = "Internal execution error";
      job.completedAt = new Date().toISOString();
      job.error = err.message;
      job.result = {
        verdict: "SYSTEM_ERROR",
        score: 0,
        passedTests: 0,
        totalTests: job.params.testCases.length,
        runtimeMs: 0,
        memoryKb: 0,
        error: err.message,
        testResults: [],
      };
    }
  }

  isWorkerRunning = false;
}

/**
 * Synchronously or asynchronously waits for a job to complete.
 * @param {string} jobId
 * @param {number} [timeoutMs=15000]
 * @returns {Promise<object>}
 */
function waitForJob(jobId, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const job = jobsMap.get(jobId);
    if (!job) {
      return resolve({
        jobId,
        status: "FAILED",
        error: "Job not found",
        result: { verdict: "SYSTEM_ERROR", error: "Job not found" },
      });
    }

    if (job.status === "COMPLETED" || job.status === "FAILED") {
      return resolve(job);
    }

    const checkInterval = 30;
    let elapsed = 0;

    const intervalTimer = setInterval(() => {
      elapsed += checkInterval;
      const current = jobsMap.get(jobId);

      if (current && (current.status === "COMPLETED" || current.status === "FAILED")) {
        clearInterval(intervalTimer);
        return resolve(current);
      }

      if (elapsed >= timeoutMs) {
        clearInterval(intervalTimer);
        if (current) {
          current.status = "TIMEOUT";
          current.statusDetail = "Execution job timed out in queue";
          current.result = {
            verdict: "TIME_LIMIT_EXCEEDED",
            score: 0,
            passedTests: 0,
            totalTests: current.params.testCases.length,
            error: "Job queue execution timeout exceeded.",
          };
        }
        return resolve(current || { jobId, status: "TIMEOUT" });
      }
    }, checkInterval);
  });
}

module.exports = {
  createJob,
  getJob,
  waitForJob,
};
