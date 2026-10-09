import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function CustomSelect({
  value,
  options = [],
  onChange,
  icon: IconComponent,
  className = "",
  style = {},
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOpt = options.find((opt) => opt.value === value) || options[0] || { label: String(value), value };

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

  const handleSelect = (val) => {
    if (typeof onChange === "function") {
      onChange(val);
    }
    setIsOpen(false);
  };

  return (
    <div
      className={`custom-select-container ${className}`}
      ref={containerRef}
      style={{ position: "relative", display: "inline-block", ...style }}
    >
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="select-trigger-left" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {IconComponent && <IconComponent size={15} className="select-icon-prefix" />}
          <span className="select-trigger-label" style={{ fontWeight: 600 }}>
            {selectedOpt.label}
          </span>
        </span>
        <ChevronDown size={14} className={`chevron-icon ${isOpen ? "rotated" : ""}`} />
      </button>

      {isOpen && (
        <div className="custom-select-dropdown" role="listbox">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`custom-option-item ${isSelected ? "selected" : ""}`}
                onClick={() => handleSelect(opt.value)}
                role="option"
                aria-selected={isSelected}
              >
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
