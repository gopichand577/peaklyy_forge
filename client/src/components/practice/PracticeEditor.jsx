import MonacoEditor from "@monaco-editor/react";
import {
  Check,
  ChevronDown,
  MoreVertical,
  Repeat,
  RotateCcw,
  Sun,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { defineMonacoTheme } from "../../utils/monacoTheme";
import LanguageIcon from "../common/LanguageIcon";

export default function PracticeEditor({
  practiceLang,
  changePracticeLanguage,
  practiceCode,
  handlePracticeCodeChange,
  resetPracticeStarterCode,
  lastSavedTime,
}) {
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [isPracticeLangOpen, setIsPracticeLangOpen] = useState(false);
  const practiceLangDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (practiceLangDropdownRef.current && !practiceLangDropdownRef.current.contains(event.target)) {
        setIsPracticeLangOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsPracticeLangOpen(false);
      }
    }
    if (isPracticeLangOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPracticeLangOpen]);

  return (
    <>
      <div className="editor-pane-header">
        <div className="editor-lang-group">
          <div className="language-selector-wrapper" ref={practiceLangDropdownRef}>
            <button
              type="button"
              className={`custom-language-trigger ${isPracticeLangOpen ? "open" : ""}`}
              onClick={() => setIsPracticeLangOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={isPracticeLangOpen}
            >
              <span className="lang-icon-badge" style={{ display: "flex", alignItems: "center" }}>
                <LanguageIcon language={practiceLang} size={18} />
              </span>
              <span className="lang-trigger-label">
                {practiceLang === "python" ? "Python" : practiceLang === "javascript" ? "JavaScript" : "Java"}
              </span>
              <ChevronDown size={14} className={`chevron-icon ${isPracticeLangOpen ? "rotated" : ""}`} />
            </button>

            {isPracticeLangOpen && (
              <div className="custom-language-dropdown" role="listbox">
                {[
                  { id: "python", label: "Python" },
                  { id: "javascript", label: "JavaScript" },
                  { id: "java", label: "Java" },
                ].map((item) => {
                  const isSelected = practiceLang === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`lang-option-item ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        changePracticeLanguage(item.id);
                        setIsPracticeLangOpen(false);
                      }}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="lang-option-emoji" style={{ display: "flex", alignItems: "center" }}>
                        <LanguageIcon language={item.id} size={18} />
                      </span>
                      <span className="lang-option-text">{item.label}</span>
                      {isSelected && <Check size={14} className="lang-check" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="editor-quick-icons">
            <button type="button" className="editor-icon-action" title="Toggle Theme">
              <Sun size={14} />
            </button>
            <button type="button" className="editor-icon-action" title="Format Code">
              <Repeat size={14} />
            </button>
            <button
              type="button"
              className="editor-icon-action"
              onClick={resetPracticeStarterCode}
              title="Reset Starter Code"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        <div className="editor-right-status">
          <div className="editor-auto-save-tag">
            <span className="auto-save-red-dot" />
            <span className="auto-save-label">Auto Save</span>
            <span className="auto-save-time">{lastSavedTime || "Saved 12s ago"}</span>
          </div>

          <button type="button" className="editor-more-btn" title="More Options">
            <MoreVertical size={14} />
          </button>
        </div>
      </div>

      <div className="monaco-container-wrap">
        <MonacoEditor
          height="100%"
          theme="peaklyy-dark"
          beforeMount={defineMonacoTheme}
          onMount={(editor) => {
            editor.onDidChangeCursorPosition((e) => {
              setCursorPos({
                line: e.position.lineNumber,
                col: e.position.column,
              });
            });
          }}
          language={practiceLang}
          value={practiceCode}
          onChange={(v) => handlePracticeCodeChange(v ?? "")}
          options={{
            fontSize: 13.5,
            fontFamily: "'JetBrains Mono', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            lineNumbersMinChars: 3,
            scrollBeyondLastLine: false,
          }}
        />
      </div>

      <div className="editor-bottom-status-bar">
        <span className="status-metric">Ln {cursorPos.line}, Col {cursorPos.col}</span>
        <span className="status-metric">Spaces: 4</span>
        <span className="status-metric">
          {practiceLang === "python"
            ? "Python"
            : practiceLang === "javascript"
            ? "JavaScript"
            : "Java"}
        </span>
      </div>
    </>
  );
}
