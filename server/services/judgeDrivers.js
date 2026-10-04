/**
 * Peaklyy Forge - Judge Driver Harness Manager
 *
 * Injects user solution code into problem test harnesses for automated evaluation.
 */

const { PROBLEMS_DATA } = require("../data/problems");

/**
 * Prepares complete executable code by injecting user code into the driver harness if needed.
 * @param {string} problemId
 * @param {string} language - 'python' | 'javascript' | 'java'
 * @param {string} userCode
 * @returns {string} Fully executable code with harness
 */
function prepareJudgeCode(problemId, language, userCode) {
  if (!userCode) return "";

  const problem = PROBLEMS_DATA.find((p) => p.id === problemId || String(p.problemNumber) === String(problemId));
  if (!problem || !problem.drivers || !problem.drivers[language]) {
    return userCode;
  }

  const driverTemplate = problem.drivers[language];

  // If user code already contains full standalone entry point harness, keep it
  if (language === "python") {
    if (userCode.includes("if __name__ ==") || userCode.includes('if __name__=="') || userCode.includes("if __name__ == '__main__'")) {
      return userCode;
    }
    return driverTemplate.replace("{{USER_CODE}}", userCode);
  }

  if (language === "javascript") {
    if (userCode.includes("readFileSync") && userCode.includes("fs")) {
      return userCode;
    }
    return driverTemplate.replace("{{USER_CODE}}", userCode);
  }

  if (language === "java") {
    if (userCode.includes("public class Main") && userCode.includes("static void main")) {
      return userCode;
    }
    return driverTemplate.replace("{{USER_CODE}}", userCode);
  }

  return userCode;
}

module.exports = {
  prepareJudgeCode,
};
