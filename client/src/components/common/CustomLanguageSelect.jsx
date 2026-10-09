import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { RUNNABLE_LANGUAGES, languageMeta } from "../../constants/languages";
import LanguageIcon from "./LanguageIcon";

export default function CustomLanguageSelect({ value = "python", onChange, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const currentMeta = languageMeta[value] || { name: value, label: value };

  useEffect(() => {
    function handleOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (langKey) => {
    if (typeof onChange === "function") {
      onChange(langKey);
    }
    setIsOpen(false);
  };

  return (
    <div className={`custom-lang-select-container ${className}`} ref={containerRef}>
      <button
        type="button"
        className={`custom-language-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="lang-trigger-left" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <LanguageIcon language={value} size={18} />
          <span className="lang-trigger-label" style={{ fontWeight: 600 }}>
            {currentMeta.name || currentMeta.label}
          </span>
        </span>
        <ChevronDown size={14} className={`chevron-icon ${isOpen ? "rotated" : ""}`} />
      </button>

      {isOpen && (
        <div className="custom-language-dropdown" role="listbox">
          {RUNNABLE_LANGUAGES.map((key) => {
            const meta = languageMeta[key] || { name: key };
            const isSelected = value === key;
            return (
              <button
                key={key}
                type="button"
                className={`lang-option-item ${isSelected ? "selected" : ""}`}
                onClick={() => handleSelect(key)}
                role="option"
                aria-selected={isSelected}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <LanguageIcon language={key} size={18} />
                  <span>{meta.name || meta.label || key}</span>
                </span>
                {isSelected && <Check size={14} className="lang-check" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
