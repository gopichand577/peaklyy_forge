/**
 * Peaklyy Forge - Error & Path Sanitizer
 * 
 * Cleans process outputs to prevent exposure of internal server paths,
 * infrastructure details, and raw execution commands.
 */

const path = require("path");

const SERVER_ROOT = path.resolve(__dirname, "..");
const WORKSPACE_ROOT = path.resolve(__dirname, "../../..");
const USER_PROFILE = process.env.USERPROFILE || process.env.HOME || "";

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Sanitizes output and errors by removing absolute paths and internal details.
 * @param {string} text - Raw output / stderr / error string
 * @param {string} runDir - Absolute path of the temp run directory
 * @param {string} publicFileName - User-friendly file name (e.g. "main.py", "Main.java")
 * @returns {string} Sanitized string
 */
function sanitizeOutput(text, runDir, publicFileName, isChunk = false) {
  if (!text || typeof text !== "string") return "";

  let cleaned = text;

  // 1. Remove specific runDir
  if (runDir) {
    const norm1 = runDir.replace(/\\/g, "/");
    cleaned = cleaned.replace(new RegExp(escapeRegExp(runDir), "gi"), "");
    cleaned = cleaned.replace(new RegExp(escapeRegExp(norm1), "gi"), "");
  }

  // 2. Remove server root and workspace paths
  if (SERVER_ROOT) {
    const sNorm = SERVER_ROOT.replace(/\\/g, "/");
    cleaned = cleaned.replace(new RegExp(escapeRegExp(SERVER_ROOT), "gi"), "");
    cleaned = cleaned.replace(new RegExp(escapeRegExp(sNorm), "gi"), "");
  }
  if (WORKSPACE_ROOT) {
    const wNorm = WORKSPACE_ROOT.replace(/\\/g, "/");
    cleaned = cleaned.replace(new RegExp(escapeRegExp(WORKSPACE_ROOT), "gi"), "");
    cleaned = cleaned.replace(new RegExp(escapeRegExp(wNorm), "gi"), "");
  }

  // 3. Remove user profile directories (e.g. C:\Users\<name>)
  if (USER_PROFILE) {
    const uNorm = USER_PROFILE.replace(/\\/g, "/");
    cleaned = cleaned.replace(new RegExp(escapeRegExp(USER_PROFILE), "gi"), "");
    cleaned = cleaned.replace(new RegExp(escapeRegExp(uNorm), "gi"), "");
  }

  // 4. Sanitize standard Windows/Linux temp path patterns
  cleaned = cleaned.replace(/[A-Za-z]:\\[^"'\n\r:]+\\temp\\runs\\[0-9a-fA-F-]+\\/gi, "");
  cleaned = cleaned.replace(/\/.*?\/temp\/runs\/[0-9a-fA-F-]+\//gi, "");
  cleaned = cleaned.replace(/[A-Za-z]:\\[^"'\n\r:]+\\runtimes\\[^"'\n\r:]+\\/gi, "");

  // 5. Strip executable path banners (e.g. "C:\...\python.EXE: can't open file...")
  cleaned = cleaned.replace(/^[A-Za-z]:\\[^:\n\r]+\\(python|node|java|javac)(\.exe)?:\s*/gim, "");

  // 6. Strip raw "Command failed: ..." banners
  cleaned = cleaned.replace(/Command failed:.*?\r?\n/gim, "");

  // 7. Replace OS "javac is not recognized..." message with clean configuration message
  if (/is not recognized as an internal or external command/i.test(cleaned)) {
    cleaned = "The required language compiler or runtime is not installed or available on this server environment.";
  }

  // 8. Strip internal runner and bootstrap script frames from tracebacks
  cleaned = cleaned.replace(/^\s*File\s*["'][^"'\n\r]*(_runner|_bootstrap)\.py["'][^\r\n]*\r?\n(?:\s*exec\(compiled[^\r\n]*\r?\n|\s{4,}[^\r\n]*\r?\n)?/gim, "");
  // Also strip any dangling exec(compiled, ...) lines from bootstrap
  cleaned = cleaned.replace(/^\s*exec\(compiled,\s*\{.*?\}\)\r?\n/gim, "");

  // 9. Clean file references: File ".../main.py" -> File "main.py"
  cleaned = cleaned.replace(/File ["'][^"'\n\r]*[\\/]+([^"'\\/]+)["']/gi, 'File "$1"');
  cleaned = cleaned.replace(/File ["'][\\/]+([^"']+)["']/g, 'File "$1"');

  // 9. Normalize any leading backslash before filename in errors
  if (publicFileName) {
    cleaned = cleaned.replace(new RegExp(`[\\\\/]+${escapeRegExp(publicFileName)}`, "gi"), publicFileName);
  }

  // 10. Normalize CRLF to LF for uniform cross-platform output and UI rendering
  cleaned = cleaned.replace(/\r\n/g, "\n");

  // Strip trailing whitespace for final output, but preserve newlines for streaming chunks
  if (!isChunk) {
    cleaned = cleaned.trimEnd();
  }

  return cleaned;
}

module.exports = {
  sanitizeOutput,
  escapeRegExp,
};

