/**
 * Peaklyy Forge - Judge Routes (P1 Online Judge)
 */

const express = require("express");
const router = express.Router();
const {
  getProblemsList,
  getProblemDetail,
  runProblemCode,
  submitProblemSolution,
  getProblemSubmissions,
  getSingleSubmission,
  getProblemDraft,
  saveProblemDraft,
  getJobStatus,
} = require("../controllers/judgeController");

// Problem endpoints
router.get("/problems", getProblemsList);
router.get("/problems/:id", getProblemDetail);
router.post("/problems/:id/run", runProblemCode);
router.post("/problems/:id/submit", submitProblemSolution);
router.get("/problems/:id/submissions", getProblemSubmissions);
router.get("/problems/:id/draft", getProblemDraft);
router.post("/problems/:id/draft", saveProblemDraft);

// Submission & Job endpoints
router.get("/submissions/:id", getSingleSubmission);
router.get("/jobs/:jobId", getJobStatus);

module.exports = router;
