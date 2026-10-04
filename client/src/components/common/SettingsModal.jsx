import React from "react";
import { Sliders, X } from "lucide-react";
import { useEditor } from "../../context/EditorContext";

export default function SettingsModal() {
  const {
    isSettingsOpen,
    setSettingsOpen,
    editorSettings,
    updateEditorSettings,
  } = useEditor();

  if (!isSettingsOpen) return null;

  return (
    <div
      className="project-modal-backdrop"
      onMouseDown={() => setSettingsOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="project-modal-card settings-modal-card"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ maxWidth: "520px" }}
      >
        <div className="project-modal-header">
          <div className="project-modal-title-group">
            <div className="modal-kicker-badge">
              <Sliders size={13} className="text-red" />
              <span>IDE PREFERENCES</span>
            </div>
            <h2 className="project-modal-title">Editor Settings</h2>
            <p className="project-modal-subtitle">
              Customize Monaco code editor typography, formatting rules, and visual indicators.
            </p>
          </div>
          <button
            type="button"
            className="project-modal-close-btn"
            onClick={() => setSettingsOpen(false)}
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        <div className="settings-form-body" style={{ padding: "20px 0 10px 0" }}>

          {/* Font Size */}
          <div className="settings-field-row">
            <div className="settings-label-group">
              <label htmlFor="setting-font-size" className="settings-label">Font Size (px)</label>
              <span className="settings-desc">Controls code text font size in editor</span>
            </div>
            <select
              id="setting-font-size"
              value={editorSettings.fontSize}
              onChange={(e) => updateEditorSettings({ fontSize: Number(e.target.value) })}
              className="settings-select-input"
            >
              <option value={12}>12 px</option>
              <option value={13}>13 px</option>
              <option value={14}>14 px (Default)</option>
              <option value={16}>16 px</option>
              <option value={18}>18 px</option>
              <option value={20}>20 px</option>
            </select>
          </div>

          {/* Tab Size */}
          <div className="settings-field-row">
            <div className="settings-label-group">
              <label htmlFor="setting-tab-size" className="settings-label">Tab Indent Size</label>
              <span className="settings-desc">Number of spaces for indentation</span>
            </div>
            <select
              id="setting-tab-size"
              value={editorSettings.tabSize}
              onChange={(e) => updateEditorSettings({ tabSize: Number(e.target.value) })}
              className="settings-select-input"
            >
              <option value={2}>2 Spaces</option>
              <option value={4}>4 Spaces (Default)</option>
            </select>
          </div>

          {/* Word Wrap */}
          <div className="settings-field-row">
            <div className="settings-label-group">
              <label htmlFor="setting-word-wrap" className="settings-label">Word Wrap</label>
              <span className="settings-desc">Wrap long code lines inside the viewport</span>
            </div>
            <select
              id="setting-word-wrap"
              value={editorSettings.wordWrap}
              onChange={(e) => updateEditorSettings({ wordWrap: e.target.value })}
              className="settings-select-input"
            >
              <option value="on">On (Wrap)</option>
              <option value="off">Off (Horizontal Scroll)</option>
            </select>
          </div>

          {/* Minimap */}
          <div className="settings-field-row">
            <div className="settings-label-group">
              <label htmlFor="setting-minimap" className="settings-label">Code Minimap</label>
              <span className="settings-desc">Overview scrollbar outline on right edge</span>
            </div>
            <select
              id="setting-minimap"
              value={editorSettings.minimap ? "on" : "off"}
              onChange={(e) => updateEditorSettings({ minimap: e.target.value === "on" })}
              className="settings-select-input"
            >
              <option value="off">Disabled (Clean)</option>
              <option value="on">Enabled</option>
            </select>
          </div>

          {/* Line Numbers */}
          <div className="settings-field-row">
            <div className="settings-label-group">
              <label htmlFor="setting-line-numbers" className="settings-label">Line Numbers</label>
              <span className="settings-desc">Display line numbers in editor gutter</span>
            </div>
            <select
              id="setting-line-numbers"
              value={editorSettings.lineNumbers}
              onChange={(e) => updateEditorSettings({ lineNumbers: e.target.value })}
              className="settings-select-input"
            >
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </div>
        </div>

        <div className="create-actions-row" style={{ marginTop: "16px" }}>
          <button
            type="button"
            className="create-submit-btn"
            onClick={() => setSettingsOpen(false)}
            style={{ width: "100%", justifyContent: "center" }}
          >
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}
