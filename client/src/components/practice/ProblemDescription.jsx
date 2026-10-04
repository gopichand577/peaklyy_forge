import {
  Check,
  CheckCircle2,
  Copy,
  ThumbsUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import DifficultyBadge from "../common/DifficultyBadge";

function formatTextWithCode(text) {
  if (!text) return null;
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="forge-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default function ProblemDescription({
  selectedProblem,
  activeDescTab,
  submissionsCount = 0,
  acceptanceRate = 0,
}) {
  const [copiedId, setCopiedId] = useState(null);

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (!selectedProblem) return null;

  return (
    <>
      {/* Description Tab */}
      {activeDescTab === "description" && (
        <div className="problem-full-description">
          <div className="problem-headline">
            <h2>
              {selectedProblem.problemNumber}. {selectedProblem.title}
            </h2>
            <div className="problem-headline-badges">
              <DifficultyBadge difficulty={selectedProblem.difficulty} />
              {selectedProblem.topics?.map((topic) => (
                <span key={topic} className="forge-topic-tag">
                  {topic}
                </span>
              ))}
              {submissionsCount > 0 && (
                <span className="headline-stat">
                  <Users size={12} /> {submissionsCount} submissions
                </span>
              )}
              {acceptanceRate > 0 && (
                <span className="headline-stat">
                  <ThumbsUp size={12} /> {acceptanceRate}% acceptance
                </span>
              )}
              {selectedProblem.isSolved && (
                <span className="headline-stat-solved">
                  <CheckCircle2 size={12} /> Solved
                </span>
              )}
            </div>
          </div>

          <div className="problem-markdown-body">
            {selectedProblem.description?.split("\n\n").map((para, i) => (
              <p key={i}>{formatTextWithCode(para)}</p>
            ))}
          </div>

          {selectedProblem.inputFormat && (
            <div className="spec-card">
              <div className="spec-header-row">
                <span className="spec-square-icon" />
                <strong className="spec-title">Input Format:</strong>
              </div>
              <div className="spec-text">
                {selectedProblem.inputFormat.split("\n").map((line, idx) => (
                  <div key={idx}>{formatTextWithCode(line)}</div>
                ))}
              </div>
            </div>
          )}

          {selectedProblem.outputFormat && (
            <div className="spec-card">
              <div className="spec-header-row">
                <span className="spec-square-icon" />
                <strong className="spec-title">Output Format:</strong>
              </div>
              <div className="spec-text">
                {selectedProblem.outputFormat.split("\n").map((line, idx) => (
                  <div key={idx}>{formatTextWithCode(line)}</div>
                ))}
              </div>
            </div>
          )}

          <div className="examples-container">
            <h4 className="section-title">Examples</h4>
            {selectedProblem.examples?.map((ex) => (
              <div key={ex.num} className="example-block-card">
                <div className="example-block-header">
                  <span>Example {ex.num}</span>
                  <button
                    type="button"
                    className="example-copy-btn"
                    onClick={() =>
                      copyToClipboard(
                        `Input:\n${ex.input}\nOutput:\n${ex.output}`,
                        `ex-${ex.num}`
                      )
                    }
                    title="Copy Example"
                  >
                    {copiedId === `ex-${ex.num}` ? (
                      <>
                        <Check size={12} className="text-green" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="example-block-content">
                  <div className="ex-line">
                    <span className="ex-tag">Input:</span>
                    <pre className="ex-code-body">{ex.input}</pre>
                  </div>
                  <div className="ex-line">
                    <span className="ex-tag">Output:</span>
                    <pre className="ex-code-body">{ex.output}</pre>
                  </div>
                  {ex.explanation && (
                    <div className="ex-line">
                      <span className="ex-tag">Explanation:</span>
                      <span className="ex-desc">{ex.explanation}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="constraints-container">
            <h4 className="section-title">Constraints:</h4>
            <ul className="constraints-items-list">
              {selectedProblem.constraints?.map((c, i) => (
                <li key={i}>
                  <code>{c}</code>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Editorial Tab */}
      {activeDescTab === "editorial" && (
        <div className="editorial-content-view">
          <h3 className="editorial-heading">Approach & Solution Strategy</h3>
          <p>
            To solve <strong>{selectedProblem.title}</strong> efficiently, focus on the problem
            constraints and identify the optimal asymptotic time complexity.
          </p>
          <div className="editorial-tip-card">
            <strong>💡 Optimal Complexity Target:</strong>
            <p>
              Strive for an optimal one-pass O(N) or O(N log N) solution using hash tables, two
              pointers, or dynamic programming.
            </p>
          </div>
        </div>
      )}

      {/* Solutions Tab */}
      {activeDescTab === "solutions" && (
        <div className="editorial-content-view">
          <h3 className="editorial-heading">Community Solutions & Discussion</h3>
          <p>
            Explore top-rated algorithms, clean implementations, and discussions for{" "}
            <strong>{selectedProblem.title}</strong>.
          </p>
          <div className="editorial-tip-card">
            <strong>⚡ Python & JavaScript Clean Patterns:</strong>
            <p>Check the discussion forum for language-specific idioms and memory optimizations.</p>
          </div>
        </div>
      )}
    </>
  );
}
