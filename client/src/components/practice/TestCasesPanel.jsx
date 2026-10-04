import {
  Check,
  Copy,
  FileCode,
  Loader2,
  Play,
  Plus,
  Sliders,
  Terminal,
} from "lucide-react";
import { useState } from "react";

export default function TestCasesPanel({
  sampleCases = [],
  activeTestMode,
  setActiveTestMode,
  activeTestTab,
  setActiveTestTab,
  runResults,
  isJudgeRunning,
  runJudge,
  customInput,
  setCustomInput,
  customResult,
  runJudgeCustom,
}) {
  const [copiedId, setCopiedId] = useState(null);

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="testcase-pane-card-inner">
      <div className="testcase-pane-header">
        <div className="testcase-mode-tabs">
          <button
            type="button"
            className={`tc-mode-btn ${activeTestMode === "cases" ? "active" : ""}`}
            onClick={() => {
              setActiveTestMode("cases");
              if (activeTestTab === -1) setActiveTestTab(0);
            }}
          >
            <FileCode size={13} />
            <span>Test Cases</span>
          </button>

          <button
            type="button"
            className={`tc-mode-btn ${activeTestMode === "custom" ? "active" : ""}`}
            onClick={() => {
              setActiveTestMode("custom");
              setActiveTestTab(-1);
            }}
          >
            <Terminal size={13} />
            <span>Custom Input</span>
          </button>
        </div>

        <button
          type="button"
          className={`tc-result-btn ${activeTestMode === "result" ? "active" : ""}`}
          onClick={() => setActiveTestMode("result")}
        >
          <Sliders size={13} />
          <span>Test Result</span>
        </button>
      </div>

      <div className="testcase-pane-body">
        {activeTestMode === "cases" && (
          <>
            {/* Case Tabs Row */}
            <div className="case-pills-row">
              {sampleCases.map((tc, index) => {
                const result = runResults?.testResults?.find((r) => r.id === tc.id);
                return (
                  <button
                    key={tc.id}
                    type="button"
                    className={`case-pill-btn ${activeTestTab === index ? "active" : ""}`}
                    onClick={() => setActiveTestTab(index)}
                  >
                    <span>Case {index + 1}</span>
                    {result && (
                      <span className={`case-indicator ${result.passed ? "passed" : "failed"}`}>
                        {result.passed ? "✓" : "✗"}
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                className="case-add-btn"
                onClick={() => setActiveTestMode("custom")}
                title="Add Custom Test Case"
              >
                <Plus size={14} />
              </button>
            </div>

            {activeTestTab >= 0 && sampleCases[activeTestTab] && (
              <div className="case-detail-inputs">
                {(() => {
                  const currentCase = sampleCases[activeTestTab];
                  const result = runResults?.testResults?.find((r) => r.id === currentCase.id);

                  return (
                    <>
                      <div className="input-field-group">
                        <div className="field-label-row">
                          <label className="case-field-label">Input</label>
                        </div>
                        <div className="code-box-container">
                          <pre className="input-pre-card">{currentCase.input}</pre>
                          <button
                            type="button"
                            className="io-copy-btn"
                            onClick={() => copyToClipboard(currentCase.input, `in-${currentCase.id}`)}
                            title="Copy input"
                          >
                            {copiedId === `in-${currentCase.id}` ? (
                              <Check size={13} className="text-green" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="input-field-group">
                        <div className="field-label-row">
                          <label className="case-field-label">Expected Output</label>
                        </div>
                        <div className="code-box-container">
                          <pre className="input-pre-card">{currentCase.expected}</pre>
                          <button
                            type="button"
                            className="io-copy-btn"
                            onClick={() => copyToClipboard(currentCase.expected, `exp-${currentCase.id}`)}
                            title="Copy expected output"
                          >
                            {copiedId === `exp-${currentCase.id}` ? (
                              <Check size={13} className="text-green" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                      </div>

                      {result && (
                        <div className="input-field-group">
                          <div className="field-label-row">
                            <label>
                              Actual Output{" "}
                              <span className={result.passed ? "text-green" : "text-red"}>
                                ({result.passed ? "✓ Passed" : "✗ Failed"})
                              </span>
                            </label>
                          </div>
                          <pre className={`input-pre-card ${result.passed ? "passed" : "failed"}`}>
                            {result.actual || result.error || "No output"}
                          </pre>
                        </div>
                      )}

                      <div className="run-testcase-bottom-row">
                        <button
                          type="button"
                          className="run-testcase-red-btn"
                          onClick={runJudge}
                          disabled={isJudgeRunning}
                        >
                          {isJudgeRunning ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Play size={14} fill="currentColor" />
                          )}
                          <span>Run Test Case</span>
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </>
        )}

        {activeTestMode === "custom" && (
          <div className="custom-input-runner-view">
            <div className="input-field-group">
              <label>Standard Input (stdin)</label>
              <textarea
                className="custom-textarea-card"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Enter custom standard input string here..."
                spellCheck={false}
              />
            </div>
            <div className="input-field-group">
              <label>Output</label>
              <pre className="input-pre-card custom-out">
                {customResult
                  ? customResult.output || customResult.error || "Execution finished with no output."
                  : "Click 'Run Test Case' to execute with custom input."}
              </pre>
            </div>
            <div className="run-testcase-bottom-row">
              <button
                type="button"
                className="run-testcase-red-btn"
                onClick={runJudgeCustom}
                disabled={isJudgeRunning}
              >
                {isJudgeRunning ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Play size={14} fill="currentColor" />
                )}
                <span>Run Test Case</span>
              </button>
            </div>
          </div>
        )}

        {activeTestMode === "result" && (
          <div className="test-results-overview">
            {runResults ? (
              <div className="results-summary-card">
                <div className="summary-status-header">
                  <span
                    className={`summary-badge ${
                      runResults.verdict === "ACCEPTED" ? "accepted" : "failed"
                    }`}
                  >
                    {runResults.verdict === "ACCEPTED" ? "All Sample Cases Passed ✓" : runResults.verdict}
                  </span>
                  <span className="summary-runtime">{runResults.runtimeMs || 0} ms</span>
                </div>
                <div className="results-cases-list">
                  {runResults.testResults?.map((r, idx) => (
                    <div key={idx} className={`result-case-item ${r.passed ? "passed" : "failed"}`}>
                      <span>Case {idx + 1}</span>
                      <strong>{r.passed ? "Passed" : "Wrong Answer"}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-results-msg">
                <Play size={24} />
                <p>Run test cases to view comprehensive execution diagnostics and diffs.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
