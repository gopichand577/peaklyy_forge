/**
 * Peaklyy Forge - Judge Controller (P1 Online Judge)
 *
 * Implements REST endpoints for problems, sample run, judge submit,
 * submission history, drafts, and job progress.
 */

const { getAllProblems, getPublicProblemById, getProblemInternal } = require("../models/problemRepository");
const { getSubmissionsByProblem, getSubmissionById } = require("../data/submissionsStore");
const { saveDraft, getDraft } = require("../data/draftsStore");
const { createJob, getJob, waitForJob } = require("../services/queueService");
const { executeCode } = require("../services/compilerService");
const { EXECUTION_LIMITS } = require("../config/executionLimits");
const { prepareJudgeCode } = require("../services/judgeDrivers");

/**
 * GET /api/judge/problems
 */
const getProblemsList = (req, res) => {
  try {
    const problems = getAllProblems(req.query);
    return res.status(200).json({
      success: true,
      problems,
    });
  } catch (err) {
    console.error("Error fetching problems list:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch problems" });
  }
};

/**
 * GET /api/judge/problems/:id
 */
const getProblemDetail = (req, res) => {
  try {
    const problem = getPublicProblemById(req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, error: `Problem '${req.params.id}' not found` });
    }
    return res.status(200).json({
      success: true,
      problem,
    });
  } catch (err) {
    console.error("Error fetching problem detail:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch problem detail" });
  }
};

/**
 * POST /api/judge/problems/:id/run
 * Run code against sample test cases OR custom input
 */
const runProblemCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { language, code, customInput } = req.body || {};

    const problem = getProblemInternal(id);
    if (!problem) {
      return res.status(404).json({ success: false, error: `Problem '${id}' not found` });
    }

    if (!language || !code || !code.trim()) {
      return res.status(400).json({ success: false, error: "No code to execute. Write your solution first." });
    }

    if (Buffer.byteLength(code, "utf8") > EXECUTION_LIMITS.maxSourceBytes) {
      return res.status(400).json({
        success: false,
        error: `Source code exceeds ${EXECUTION_LIMITS.maxSourceBytes / 1024} KB limit.`,
      });
    }

    const executableCode = prepareJudgeCode(problem.id, language, code);

    // If custom input is provided, execute using single-execution path
    if (customInput !== undefined && customInput !== null && customInput !== "") {
      const customResult = await executeCode(language, executableCode, String(customInput));
      return res.status(200).json({
        success: customResult.status === "SUCCESS",
        type: "custom",
        status: customResult.status,
        output: customResult.output,
        error: customResult.error,
        executionTime: customResult.executionTime,
        exitCode: customResult.exitCode,
      });
    }

    // Otherwise, execute against problem's sample test cases
    const testCasesToRun = problem.sampleTestCases || [];
    const jobId = createJob({
      type: "run",
      problemId: problem.id,
      problemTitle: problem.title,
      language,
      code: executableCode,
      testCases: testCasesToRun,
      comparisonMode: problem.comparisonMode,
      timeLimit: problem.timeLimit,
      memoryLimit: problem.memoryLimit,
    });

    const completedJob = await waitForJob(jobId, 15000);
    const result = completedJob.result || {};

    return res.status(200).json({
      success: result.verdict === "ACCEPTED",
      jobId,
      type: "sample",
      verdict: result.verdict,
      score: result.score,
      passedTests: result.passedTests,
      totalTests: result.totalTests,
      runtimeMs: result.runtimeMs,
      memoryKb: result.memoryKb,
      error: result.error,
      testResults: result.testResults || [],
    });
  } catch (err) {
    console.error("Error in runProblemCode:", err);
    return res.status(500).json({ success: false, error: "Internal error during test run" });
  }
};

/**
 * POST /api/judge/problems/:id/submit
 * Evaluate code against complete test suite (sample + hidden) and create persistent submission
 */
const submitProblemSolution = async (req, res) => {
  try {
    const { id } = req.params;
    const { language, code } = req.body || {};

    const problem = getProblemInternal(id);
    if (!problem) {
      return res.status(404).json({ success: false, error: `Problem '${id}' not found` });
    }

    if (!language || !code || !code.trim()) {
      return res.status(400).json({ success: false, error: "No code to execute. Write your solution first." });
    }

    if (Buffer.byteLength(code, "utf8") > EXECUTION_LIMITS.maxSourceBytes) {
      return res.status(400).json({
        success: false,
        error: `Source code exceeds ${EXECUTION_LIMITS.maxSourceBytes / 1024} KB limit.`,
      });
    }

    const executableCode = prepareJudgeCode(problem.id, language, code);

    // Combine sample and hidden test cases for complete judgment
    const allTestCases = [
      ...(problem.sampleTestCases || []),
      ...(problem.hiddenTestCases || []),
    ];

    const jobId = createJob({
      type: "submit",
      problemId: problem.id,
      problemTitle: problem.title,
      language,
      code: executableCode,
      testCases: allTestCases,
      comparisonMode: problem.comparisonMode,
      timeLimit: problem.timeLimit,
      memoryLimit: problem.memoryLimit,
    });

    const completedJob = await waitForJob(jobId, 25000);
    const result = completedJob.result || {};
    const submission = completedJob.submission || {};

    // Filter testResults to only show sample results (hidden tests remain concealed!)
    const sampleResults = (result.testResults || []).filter((tr) => !String(tr.id).startsWith("10"));

    return res.status(200).json({
      success: result.verdict === "ACCEPTED",
      jobId,
      submissionId: submission.submissionId || null,
      problemId: problem.id,
      problemTitle: problem.title,
      language,
      verdict: result.verdict,
      score: result.score,
      passedTests: result.passedTests,
      totalTests: result.totalTests,
      runtimeMs: result.runtimeMs,
      memoryKb: result.memoryKb,
      error: result.error,
      sampleResults,
      submittedAt: submission.submittedAt || new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error in submitProblemSolution:", err);
    return res.status(500).json({ success: false, error: "Internal error during submission" });
  }
};

/**
 * GET /api/judge/problems/:id/submissions
 */
const getProblemSubmissions = (req, res) => {
  try {
    const { id } = req.params;
    const submissions = getSubmissionsByProblem(id);
    return res.status(200).json({
      success: true,
      submissions,
    });
  } catch (err) {
    console.error("Error fetching submissions:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch submissions" });
  }
};

/**
 * GET /api/judge/submissions/:id
 */
const getSingleSubmission = (req, res) => {
  try {
    const { id } = req.params;
    const submission = getSubmissionById(id);
    if (!submission) {
      return res.status(404).json({ success: false, error: `Submission '${id}' not found` });
    }
    return res.status(200).json({
      success: true,
      submission,
    });
  } catch (err) {
    console.error("Error fetching submission details:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch submission details" });
  }
};

/**
 * GET /api/judge/problems/:id/draft
 */
const getProblemDraft = (req, res) => {
  try {
    const { id } = req.params;
    const language = req.query.language || "python";
    const draft = getDraft(id, language);
    return res.status(200).json({
      success: true,
      draft,
    });
  } catch (err) {
    console.error("Error fetching draft:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch draft" });
  }
};

/**
 * POST /api/judge/problems/:id/draft
 */
const saveProblemDraft = (req, res) => {
  try {
    const { id } = req.params;
    const { language, code } = req.body || {};
    if (!language || code === undefined) {
      return res.status(400).json({ success: false, error: "Language and code are required." });
    }
    const record = saveDraft(id, language, code);
    return res.status(200).json({
      success: true,
      draft: record,
    });
  } catch (err) {
    console.error("Error saving draft:", err);
    return res.status(500).json({ success: false, error: "Failed to save draft" });
  }
};

/**
 * GET /api/judge/jobs/:jobId
 */
const getJobStatus = (req, res) => {
  try {
    const { jobId } = req.params;
    const job = getJob(jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: `Job '${jobId}' not found` });
    }
    return res.status(200).json({
      success: true,
      job: {
        jobId: job.jobId,
        type: job.type,
        status: job.status,
        statusDetail: job.statusDetail,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        result: job.result,
      },
    });
  } catch (err) {
    console.error("Error fetching job status:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch job status" });
  }
};

module.exports = {
  getProblemsList,
  getProblemDetail,
  runProblemCode,
  submitProblemSolution,
  getProblemSubmissions,
  getSingleSubmission,
  getProblemDraft,
  saveProblemDraft,
  getJobStatus,
};
