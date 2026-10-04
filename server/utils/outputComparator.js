/**
 * Peaklyy Forge - Output Validation Utility (P1 Judge)
 *
 * Provides reliable, normalized comparison between actual program output and expected judge output.
 */

function normalizeLines(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function tryParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key) || !deepEqual(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }

  return false;
}

/**
 * Compares actual output with expected output.
 * @param {string} actualRaw
 * @param {string} expectedRaw
 * @param {string} [mode="trimmed"] - "trimmed" | "exact" | "token" | "json"
 * @returns {{ matched: boolean, actual: string, expected: string }}
 */
function compareOutput(actualRaw, expectedRaw, mode = "trimmed") {
  const actualNorm = normalizeLines(actualRaw);
  const expectedNorm = normalizeLines(expectedRaw);

  // 1. Direct trimmed string match
  if (actualNorm === expectedNorm) {
    return {
      matched: true,
      actual: actualNorm,
      expected: expectedNorm,
    };
  }

  // 2. JSON structural comparison if mode is json or looks like json array/object
  if (mode === "json" || (expectedNorm.startsWith("[") && expectedNorm.endsWith("]")) || (expectedNorm.startsWith("{") && expectedNorm.endsWith("}"))) {
    const parsedActual = tryParseJSON(actualNorm);
    const parsedExpected = tryParseJSON(expectedNorm);
    if (parsedActual !== null && parsedExpected !== null) {
      if (deepEqual(parsedActual, parsedExpected)) {
        return {
          matched: true,
          actual: actualNorm,
          expected: expectedNorm,
        };
      }
    }
  }

  // 3. Token-by-token comparison (handles multiple whitespaces/tabs consistently)
  const actualTokens = actualNorm.split(/\s+/).filter(Boolean);
  const expectedTokens = expectedNorm.split(/\s+/).filter(Boolean);

  if (actualTokens.length === expectedTokens.length && actualTokens.length > 0) {
    let allTokensMatch = true;
    for (let i = 0; i < actualTokens.length; i++) {
      if (actualTokens[i] !== expectedTokens[i]) {
        allTokensMatch = false;
        break;
      }
    }
    if (allTokensMatch) {
      return {
        matched: true,
        actual: actualNorm,
        expected: expectedNorm,
      };
    }
  }

  return {
    matched: false,
    actual: actualNorm,
    expected: expectedNorm,
  };
}

module.exports = {
  compareOutput,
  normalizeLines,
};
