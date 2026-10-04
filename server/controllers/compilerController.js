/**
 * Peaklyy Forge - Compiler Controller (P0)
 */

const { executeCode } = require("../services/compilerService");
const { DEFAULT_LIMITS, LANGUAGE_CONFIG } = require("../config/languages");
const { recordExecutionMetric } = require("../services/metricsService");

const runCode = async (req, res) => {
  try {
    const { language, code, input, stdin } = req.body || {};
    const rawInput = stdin !== undefined ? stdin : input;
    console.log(`[EXECUTE] lang=${language}, codeLen=${code ? code.length : 0}, stdin=${JSON.stringify(rawInput || "")}`);

    // 1. Validation: Language
    if (!language || typeof language !== "string") {
      return res.status(400).json({
        success: false,
        status: "SYSTEM_ERROR",
        compilationStatus: null,
        executionStatus: null,
        output: "",
        error: "Missing or invalid 'language' parameter. A valid string is required.",
        executionTime: 0,
        memoryUsage: null,
        exitCode: null,
      });
    }

    const normalizedLang = language.toLowerCase().trim();
    if (!LANGUAGE_CONFIG[normalizedLang]) {
      return res.status(400).json({
        success: false,
        status: "SYSTEM_ERROR",
        compilationStatus: null,
        executionStatus: null,
        output: "",
        error: `Unsupported language: '${language}'. Supported languages: ${Object.keys(LANGUAGE_CONFIG).join(", ")}`,
        executionTime: 0,
        memoryUsage: null,
        exitCode: null,
      });
    }

    // 2. Validation: Code
    if (code === undefined || code === null || typeof code !== "string") {
      return res.status(400).json({
        success: false,
        status: "SYSTEM_ERROR",
        compilationStatus: null,
        executionStatus: null,
        output: "",
        error: "Missing or invalid 'code' parameter. Source code must be a string.",
        executionTime: 0,
        memoryUsage: null,
        exitCode: null,
      });
    }

    if (Buffer.byteLength(code, "utf8") > DEFAULT_LIMITS.MAX_CODE_BYTES) {
      return res.status(400).json({
        success: false,
        status: "SYSTEM_ERROR",
        compilationStatus: null,
        executionStatus: null,
        output: "",
        error: `Source code size exceeds the allowed limit of ${DEFAULT_LIMITS.MAX_CODE_BYTES / 1024} KB.`,
        executionTime: 0,
        memoryUsage: null,
        exitCode: null,
      });
    }

    // 3. Validation: Input (stdin)
    let sanitizedInput = "";
    if (rawInput !== undefined && rawInput !== null) {
      if (typeof rawInput !== "string") {
        sanitizedInput = String(rawInput);
      } else {
        sanitizedInput = rawInput;
      }

      if (Buffer.byteLength(sanitizedInput, "utf8") > DEFAULT_LIMITS.MAX_INPUT_BYTES) {
        return res.status(400).json({
          success: false,
          status: "SYSTEM_ERROR",
          compilationStatus: null,
          executionStatus: null,
          output: "",
          error: `Standard input size exceeds the allowed limit of ${DEFAULT_LIMITS.MAX_INPUT_BYTES / 1024} KB.`,
          executionTime: 0,
          memoryUsage: null,
          exitCode: null,
        });
      }
    }

    // 4. Execution
    const result = await executeCode(normalizedLang, code, sanitizedInput);

    recordExecutionMetric({
      language: normalizedLang,
      mode: "http",
      status: result.status,
      executionTime: result.executionTime,
      exitCode: result.exitCode,
    });

    return res.status(200).json({
      success: result.status === "SUCCESS",
      status: result.status,
      compilationStatus: result.compilationStatus,
      executionStatus: result.executionStatus,
      output: result.output,
      error: result.error,
      executionTime: result.executionTime,
      memoryUsage: result.memoryUsage,
      exitCode: result.exitCode,
    });
  } catch (err) {
    console.error("Internal Forge Server Error:", err);
    return res.status(500).json({
      success: false,
      status: "SYSTEM_ERROR",
      compilationStatus: null,
      executionStatus: null,
      output: "",
      error: "Internal server error occurred while processing execution request.",
      executionTime: 0,
      memoryUsage: null,
      exitCode: null,
    });
  }
};

module.exports = {
  runCode,
};