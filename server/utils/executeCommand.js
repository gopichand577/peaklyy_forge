const { exec } = require("child_process");
const { EXECUTION_LIMITS } = require("../config/executionLimits");

/**
 * Execute command with centralized timeout and maxBuffer settings.
 * Preserves legacy signature while respecting centralized limits.
 */
const executeCommand = (command, options = {}) => {
  const timeout = options.timeout || EXECUTION_LIMITS.wallTimeMs;
  const maxBuffer = options.maxBuffer || EXECUTION_LIMITS.maxOutputBytes;

  return new Promise((resolve, reject) => {
    exec(
      command,
      {
        timeout,
        maxBuffer,
        encoding: "utf8",
        ...options,
      },
      (error, stdout, stderr) => {
        if (error) {
          if (error.killed || error.signal === "SIGTERM") {
            return reject(new Error(`Execution Timed Out (Time limit: ${timeout / 1000} seconds exceeded)`));
          }
          if (error.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER") {
            return reject(new Error(`Output Limit Exceeded (Buffer size exceeded ${maxBuffer / 1024} KB)`));
          }
          return reject(new Error(stderr || stdout || error.message));
        }

        resolve(stdout || stderr || "Execution completed with no output.");
      }
    );
  });
};

module.exports = {
  executeCommand,
};