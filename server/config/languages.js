/**
 * Peaklyy Forge - Centralized Language Configuration (P0 & P1)
 * 
 * Defines trusted server-side execution configurations for all supported languages.
 */

const path = require("path");
const fs = require("fs");
const { EXECUTION_LIMITS } = require("./executionLimits");

// Check if an executable is available in PATH or common directories
function findExecutable(names, extraPaths = []) {
  const isWindows = process.platform === "win32";
  const pathExt = isWindows ? (process.env.PATHEXT || ".COM;.EXE;.BAT;.CMD").split(";") : [""];
  const searchPaths = [
    ...extraPaths,
    ...(process.env.PATH || "").split(path.delimiter),
  ];

  for (const name of names) {
    if (fs.existsSync(name)) {
      return name;
    }
    for (const dir of searchPaths) {
      if (!dir) continue;
      for (const ext of pathExt) {
        const fullPath = path.join(dir, name + ext);
        if (fs.existsSync(fullPath)) {
          try {
            fs.accessSync(fullPath, fs.constants.X_OK || fs.constants.F_OK);
            return fullPath;
          } catch {
            // Ignore access errors and continue search
          }
        }
      }
    }
  }
  return null;
}

// Java compiler / runtime detection helper
function detectJava() {
  const extraPaths = [
    path.join(__dirname, "..", "runtimes", "jdk", "bin"),
    path.join(__dirname, "..", "runtimes", "bin"),
  ];

  const javaHome = process.env.JAVA_HOME;
  if (javaHome) {
    extraPaths.push(path.join(javaHome, "bin"));
  }

  if (process.platform === "win32") {
    const programFiles = [
      process.env["ProgramFiles"],
      process.env["ProgramFiles(x86)"],
      process.env["LocalAppData"] ? path.join(process.env["LocalAppData"], "Programs") : null,
    ].filter(Boolean);

    for (const pf of programFiles) {
      const javaDir = path.join(pf, "Java");
      if (fs.existsSync(javaDir)) {
        try {
          const entries = fs.readdirSync(javaDir);
          for (const entry of entries) {
            extraPaths.push(path.join(javaDir, entry, "bin"));
          }
        } catch {}
      }
    }
  }

  const javacPath = findExecutable(["javac"], extraPaths);
  const javaPath = findExecutable(["java"], extraPaths);

  const binDir = javacPath ? path.dirname(javacPath) : (javaPath ? path.dirname(javaPath) : null);
  const computedJavaHome = binDir ? path.dirname(binDir) : (process.env.JAVA_HOME || null);

  return {
    available: Boolean(javacPath && javaPath),
    javac: javacPath || "javac",
    java: javaPath || "java",
    binDir,
    javaHome: computedJavaHome,
  };
}

// Python interpreter detection helper
function detectPython() {
  const pythonPath = findExecutable(["python3", "python", "py"]);
  return {
    available: Boolean(pythonPath),
    command: pythonPath || "python",
  };
}

// Node.js interpreter detection helper
function detectNode() {
  const nodePath = findExecutable(["node"]);
  return {
    available: Boolean(nodePath),
    command: nodePath || "node",
  };
}

const DEFAULT_LIMITS = {
  TIMEOUT_MS: EXECUTION_LIMITS.cpuTimeMs,
  MAX_OUTPUT_BYTES: EXECUTION_LIMITS.maxOutputBytes,
  MAX_CODE_BYTES: EXECUTION_LIMITS.maxSourceBytes,
  MAX_INPUT_BYTES: EXECUTION_LIMITS.maxInputBytes,
};

const LANGUAGE_CONFIG = {
  python: {
    id: "python",
    name: "Python 3",
    extension: "py",
    defaultFileName: "main.py",
    executionMode: "interpreted",
    timeout: EXECUTION_LIMITS.cpuTimeMs,
    maxOutputSize: EXECUTION_LIMITS.maxOutputBytes,
    memoryLimit: null,
    detect: detectPython,
  },
  javascript: {
    id: "javascript",
    name: "JavaScript (Node.js)",
    extension: "js",
    defaultFileName: "main.js",
    executionMode: "interpreted",
    timeout: EXECUTION_LIMITS.cpuTimeMs,
    maxOutputSize: EXECUTION_LIMITS.maxOutputBytes,
    memoryLimit: `${EXECUTION_LIMITS.maxOldSpaceSizeNode}MB`,
    detect: detectNode,
  },
  java: {
    id: "java",
    name: "Java",
    extension: "java",
    defaultFileName: "Main.java",
    executionMode: "compiled",
    timeout: EXECUTION_LIMITS.wallTimeMs,
    maxOutputSize: EXECUTION_LIMITS.maxOutputBytes,
    memoryLimit: EXECUTION_LIMITS.maxHeapJava,
    detect: detectJava,
  },
  html: {
    id: "html",
    name: "HTML",
    extension: "html",
    defaultFileName: "index.html",
    executionMode: "preview",
  },
  css: {
    id: "css",
    name: "CSS",
    extension: "css",
    defaultFileName: "style.css",
    executionMode: "preview",
  },
};

module.exports = {
  LANGUAGE_CONFIG,
  DEFAULT_LIMITS,
  EXECUTION_LIMITS,
  findExecutable,
  detectJava,
  detectPython,
  detectNode,
};
