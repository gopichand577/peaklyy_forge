import { Check, ChevronDown, Code2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { languageMeta, useEditor } from "../../context/EditorContext";
import LanguageIcon from "../common/LanguageIcon";

export default function LanguageSelector() {
  const { project, setLanguage } = useEditor();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const langKeys = ["python", "java", "javascript", "html", "css"];
  const current = project?.language
    ? languageMeta[project.language] || { label: project.language }
    : { label: "Select a language" };

  // Close dropdown on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (langKey) => {
    setLanguage(langKey);
    setIsOpen(false);
  };

  return (
    <div className="language-selector-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`custom-language-trigger ${isOpen ? "open" : ""} ${!project?.language ? "placeholder" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="lang-icon-badge" style={{ display: "flex", alignItems: "center" }}>
          {project?.language ? (
            <LanguageIcon language={project.language} size={18} />
          ) : (
            <Code2 size={16} className="text-red" />
          )}
        </span>
        <span className="lang-trigger-label" style={{ fontWeight: project?.language ? 600 : 400 }}>
          {current.label}
        </span>
        <ChevronDown size={14} className={`chevron-icon ${isOpen ? "rotated" : ""}`} />
      </button>

      {isOpen && (
        <div className="custom-language-dropdown" role="listbox">
          {langKeys.map((key) => {
            const item = languageMeta[key] || { label: key };
            const isSelected = project?.language === key;
            return (
              <button
                key={key}
                type="button"
                className={`lang-option-item ${isSelected ? "selected" : ""}`}
                onClick={() => handleSelect(key)}
                role="option"
                aria-selected={isSelected}
              >
                <span className="lang-option-emoji" style={{ display: "flex", alignItems: "center" }}>
                  <LanguageIcon language={key} size={18} />
                </span>
                <span className="lang-option-text">{item.label}</span>
                {isSelected && <Check size={14} className="lang-check" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
