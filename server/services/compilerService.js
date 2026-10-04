/**
 * Peaklyy Forge - Compiler Service Dispatcher (P0)
 */

const { LANGUAGE_CONFIG } = require("../config/languages");
const { executePython } = require("./compilers/pythonRunner");
const { executeJavaScript } = require("./compilers/javascriptRunner");
const { executeJava } = require("./compilers/javaRunner");

/**
 * Dispatches code execution to the respective language runner.
 * @param {string} language - Target language ID
 * @param {string} code - Source code
 * @param {string} [input=""] - Stdin
 * @returns {Promise<object>} Structured execution result
 */
const executeCode = async (language, code, input = "") => {
  const normalizedLang = (language || "").toLowerCase().trim();
  const config = LANGUAGE_CONFIG[normalizedLang];

  if (!config) {
    return {
      status: "SYSTEM_ERROR",
      compilationStatus: null,
      executionStatus: null,
      output: "",
      error: `Unsupported language: '${language}'. Supported languages are: ${Object.keys(LANGUAGE_CONFIG).join(", ")}`,
      executionTime: 0,
      memoryUsage: null,
      exitCode: null,
    };
  }

  // Handle preview-only languages (HTML / CSS)
  if (config.executionMode === "preview") {
    return {
      status: "SUCCESS",
      compilationStatus: "SUCCESS",
      executionStatus: "SUCCESS",
      output: `${config.name} rendered successfully. No compiler/runtime output.`,
      error: null,
      executionTime: 0,
      memoryUsage: null,
      exitCode: 0,
    };
  }

  switch (normalizedLang) {
    case "python":
      return await executePython(code, input);

    case "javascript":
      return await executeJavaScript(code, input);

    case "java":
      return await executeJava(code, input);

    default:
      return {
        status: "SYSTEM_ERROR",
        compilationStatus: null,
        executionStatus: null,
        output: "",
        error: `Language '${language}' is configured but runner is not implemented.`,
        executionTime: 0,
        memoryUsage: null,
        exitCode: null,
      };
  }
};

module.exports = {
  executeCode,
};