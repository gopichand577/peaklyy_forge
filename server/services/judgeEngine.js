/**
 * Peaklyy Forge - Judge Execution Engine (P1 Online Judge)
 *
 * Handles sandbox execution, single-compilation, multiple test-case evaluation,
 * output comparison, scoring, and verdict generation.
 */

const { LANGUAGE_CONFIG, EXECUTION_LIMITS } = require("../config/languages");
const { createExecutionWorkspace, cleanupWorkspace } = require("../utils/tempManager");
const { runProcess } = require("../utils/processRunner");
const { sanitizeOutput } = require("../utils/sanitizer");
const { compareOutput } = require("../utils/outputComparator");
const { recordExecutionMetric } = require("./metricsService");

/**
 * Executes code against a set of test cases.
 * @param {object} params
 * @param {string} params.language - 'python' | 'javascript' | 'java'
 * @param {string} params.code - Source code
 * @param {Array<object>} params.testCases - Array of { id, title, input, expected, weight }
 * @param {string} [params.comparisonMode="trimmed"] - 'trimmed' | 'json' | 'token'
 * @param {number} [params.timeLimit=5000]
 * @param {number} [params.memoryLimit=128]
 * @param {boolean} [params.isSubmit=false]
 * @param {Function} [params.onProgress] - Optional callback for worker status updates
 * @returns {Promise<object>} Structured judge verdict
 */
async function evaluateSubmission({
  language,
  code,
  testCases,
  comparisonMode = "trimmed",
  timeLimit = EXECUTION_LIMITS.cpuTimeMs,
  memoryLimit = EXECUTION_LIMITS.memoryMb,
  isSubmit = false,
  onProgress,
}) {
  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    return {
      verdict: "SYSTEM_ERROR",
      score: 0,
      passedTests: 0,
      totalTests: testCases.length,
      runtimeMs: 0,
      memoryKb: 0,
      error: `Unsupported language: '${language}'.`,
      testResults: [],
    };
  }

  const detection = config.detect ? config.detect() : { available: true };
  if (!detection.available) {
    return {
      verdict: "SYSTEM_ERROR",
      score: 0,
      passedTests: 0,
      totalTests: testCases.length,
      runtimeMs: 0,
      memoryKb: 0,
      error: `${config.name} compiler/interpreter is not configured on the server.`,
      testResults: [],
    };
  }

  let sourceFileName = config.defaultFileName;
  if (language === "java") {
    const classMatch = code.match(/(?:public\s+)?class\s+([A-Za-z0-9_$]+)/);
    const className = classMatch ? classMatch[1] : "Main";
    sourceFileName = `${className}.java`;
  }

  const workspace = createExecutionWorkspace(sourceFileName, code);

  try {
    // 1. Compilation Step (for compiled languages like Java)
    if (config.executionMode === "compiled") {
      if (onProgress) onProgress("COMPILING");

      const compileStart = process.hrtime.bigint();
      const compileResult = await runProcess(
        detection.javac,
        ["-encoding", "UTF-8", sourceFileName],
        {
          cwd: workspace.runDir,
          timeout: EXECUTION_LIMITS.compileTimeMs,
          maxOutputSize: config.maxOutputSize,
        }
      );

      if (compileResult.timedOut) {
        return {
          verdict: "COMPILATION_ERROR",
          score: 0,
          passedTests: 0,
          totalTests: testCases.length,
          runtimeMs: Math.round(Number(process.hrtime.bigint() - compileStart) / 1e6),
          memoryKb: 0,
          error: "Compilation timed out.",
          testResults: [],
        };
      }

      if (compileResult.exitCode !== 0) {
        const sanitizedErr = sanitizeOutput(
          compileResult.stderr || compileResult.stdout,
          workspace.runDir,
          sourceFileName
        );
        return {
          verdict: "COMPILATION_ERROR",
          score: 0,
          passedTests: 0,
          totalTests: testCases.length,
          runtimeMs: Math.round(Number(process.hrtime.bigint() - compileStart) / 1e6),
          memoryKb: 0,
          error: sanitizedErr || "Compilation failed.",
          testResults: [],
        };
      }
    }

    if (onProgress) onProgress("RUNNING");

    // 2. Execution Step for each Test Case
    const testResults = [];
    let totalScore = 0;
    let maxWeight = 0;
    let passedCount = 0;
    let maxRuntimeMs = 0;
    let firstFailingVerdict = null;
    let firstErrorMsg = null;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const weight = tc.weight || 10;
      maxWeight += weight;

      if (onProgress) onProgress(`RUNNING test case ${i + 1}/${testCases.length}`);

      let execCmd = detection.command || detection.java;
      let execArgs = [];

      if (language === "python") {
        execArgs = ["-u", "-X", "utf8", sourceFileName];
      } else if (language === "javascript") {
        execArgs = [`--max-old-space-size=${EXECUTION_LIMITS.maxOldSpaceSizeNode}`, sourceFileName];
      } else if (language === "java") {
        const className = sourceFileName.replace(/\.java$/, "");
        execArgs = [`-Xmx${EXECUTION_LIMITS.maxHeapJava}`, "-cp", ".", className];
      }

      const runRes = await runProcess(execCmd, execArgs, {
        cwd: workspace.runDir,
        input: tc.input || "",
        timeout: timeLimit || config.timeout,
        maxOutputSize: config.maxOutputSize,
      });

      const runtimeMs = Math.round(runRes.executionTime * 1000);
      if (runtimeMs > maxRuntimeMs) {
        maxRuntimeMs = runtimeMs;
      }

      const sanitizedOut = sanitizeOutput(runRes.stdout, workspace.runDir, sourceFileName);
      const sanitizedErr = sanitizeOutput(runRes.stderr, workspace.runDir, sourceFileName);

      let tcPassed = false;
      let tcVerdict = "ACCEPTED";
      let tcError = null;

      if (runRes.timedOut) {
        tcVerdict = "TIME_LIMIT_EXCEEDED";
        tcError = `Time Limit Exceeded (${(timeLimit || config.timeout) / 1000}s limit).`;
      } else if (runRes.outputLimitExceeded) {
        tcVerdict = "OUTPUT_LIMIT_EXCEEDED";
        tcError = "Output Limit Exceeded.";
      } else if (runRes.exitCode !== 0) {
        const isSyntax = /SyntaxError|IndentationError/.test(sanitizedErr);
        tcVerdict = isSyntax ? "COMPILATION_ERROR" : "RUNTIME_ERROR";
        tcError = sanitizedErr || "Runtime error encountered.";
      } else {
        // Output comparison
        const cmp = compareOutput(sanitizedOut, tc.expected, comparisonMode);
        if (cmp.matched) {
          tcPassed = true;
          tcVerdict = "ACCEPTED";
        } else {
          tcVerdict = "WRONG_ANSWER";
          tcError = "Output does not match expected output.";
        }
      }

      if (tcPassed) {
        passedCount++;
        totalScore += weight;
      } else if (!firstFailingVerdict) {
        firstFailingVerdict = tcVerdict;
        firstErrorMsg = tcError;
      }

      testResults.push({
        id: tc.id,
        title: tc.title || `Test Case ${i + 1}`,
        input: tc.input,
        expected: tc.expected,
        actual: sanitizedOut,
        passed: tcPassed,
        verdict: tcVerdict,
        runtimeMs,
        error: tcError,
      });
    }

    const finalScore = maxWeight > 0 ? Math.round((totalScore / maxWeight) * 100) : 0;
    const finalVerdict = passedCount === testCases.length ? "ACCEPTED" : firstFailingVerdict || "WRONG_ANSWER";

    recordExecutionMetric({
      language,
      mode: isSubmit ? "submission" : "judge",
      status: finalVerdict,
      executionTime: maxRuntimeMs / 1000,
      isSubmission: isSubmit,
      isAccepted: finalVerdict === "ACCEPTED",
    });

    return {
      verdict: finalVerdict,
      score: finalScore,
      passedTests: passedCount,
      totalTests: testCases.length,
      runtimeMs: maxRuntimeMs,
      memoryKb: null,
      error: firstErrorMsg,
      testResults,
    };
  } finally {
    cleanupWorkspace(workspace.runDir);
  }
}

module.exports = {
  evaluateSubmission,
};
