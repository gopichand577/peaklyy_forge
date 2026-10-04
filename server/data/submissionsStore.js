/**
 * Peaklyy Forge - Submissions Storage Layer (P1 Online Judge)
 *
 * Persists and retrieves submission records.
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "temp", "data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");

let submissionsCache = [];

function initStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(SUBMISSIONS_FILE)) {
      const data = fs.readFileSync(SUBMISSIONS_FILE, "utf-8");
      submissionsCache = JSON.parse(data || "[]");
    } else {
      submissionsCache = [];
      fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify([], null, 2));
    }
  } catch {
    submissionsCache = [];
  }
}

initStore();

function persist() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissionsCache, null, 2));
  } catch (err) {
    console.error("Failed to persist submissions to file:", err);
  }
}

function saveSubmission(submission) {
  const record = {
    submissionId: submission.submissionId || `SUB-${Date.now().toString(36).toUpperCase()}`,
    jobId: submission.jobId,
    problemId: submission.problemId,
    problemTitle: submission.problemTitle || submission.problemId,
    language: submission.language,
    code: submission.code,
    verdict: submission.verdict,
    score: submission.score !== undefined ? submission.score : 0,
    passedTests: submission.passedTests || 0,
    totalTests: submission.totalTests || 0,
    runtimeMs: submission.runtimeMs || 0,
    memoryKb: submission.memoryKb || 0,
    error: submission.error || null,
    sampleResults: submission.sampleResults || [],
    submittedAt: submission.submittedAt || new Date().toISOString(),
  };

  submissionsCache.unshift(record);
  persist();
  return record;
}

function getSubmissionsByProblem(problemId) {
  return submissionsCache.filter((s) => s.problemId === problemId);
}

function getSubmissionById(submissionId) {
  return submissionsCache.find((s) => s.submissionId === submissionId) || null;
}

function getAllSubmissions() {
  return submissionsCache;
}

function getSolvedProblemIds() {
  const solved = new Set();
  for (const s of submissionsCache) {
    if (s.verdict === "ACCEPTED") {
      solved.add(s.problemId);
    }
  }
  return solved;
}

module.exports = {
  saveSubmission,
  getSubmissionsByProblem,
  getSubmissionById,
  getAllSubmissions,
  getSolvedProblemIds,
};
