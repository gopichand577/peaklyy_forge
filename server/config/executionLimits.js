/**
 * Peaklyy Forge - Centralized Execution Limits Configuration (P0 & P1)
 *
 * Defines single source of truth for execution limits, timeouts, and buffer constraints.
 */

const EXECUTION_LIMITS = {
  // Time limits
  cpuTimeMs: 5000,
  wallTimeMs: 8000,
  compileTimeMs: 6000,

  // Memory limits
  memoryMb: 128,
  memoryKb: 128 * 1024,
  maxOldSpaceSizeNode: 128, // Node.js --max-old-space-size=128
  maxHeapJava: "128m",      // Java -Xmx128m

  // Output & Input buffer sizes
  maxOutputBytes: 256 * 1024, // 256 KB
  maxInputBytes: 64 * 1024,   // 64 KB
  maxSourceBytes: 64 * 1024,  // 64 KB

  // Concurrency & queue limits
  maxProcesses: 10,
  maxQueueSize: 100,
  maxRetries: 1,
};

module.exports = {
  EXECUTION_LIMITS,
};
