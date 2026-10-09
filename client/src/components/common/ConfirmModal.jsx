import React from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title = "Reset preferences?",
  message = "This will restore your editor and application preferences to their defaults.",
  confirmText = "Reset",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="project-modal-backdrop"
      onMouseDown={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="project-modal-card confirm-modal-card"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ maxWidth: "420px" }}
      >
        <div className="project-modal-header">
          <div className="project-modal-title-group">
            <div className="modal-kicker-badge" style={{ color: "#ef4444" }}>
              <AlertTriangle size={13} />
              <span>CONFIRM ACTION</span>
            </div>
            <h2 className="project-modal-title">{title}</h2>
          </div>
          <button
            type="button"
            className="project-modal-close-btn"
            onClick={onCancel}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="confirm-modal-body" style={{ padding: "16px 0", color: "var(--text-secondary)", fontSize: "14px" }}>
          <p>{message}</p>
        </div>

        <div className="confirm-actions-row" style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
          <button
            type="button"
            className="confirm-cancel-btn"
            onClick={onCancel}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className="confirm-submit-btn"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
