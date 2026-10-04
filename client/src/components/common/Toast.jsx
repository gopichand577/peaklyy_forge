import React from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useEditor } from "../../context/EditorContext";

export default function Toast() {
  const { toast } = useEditor();

  if (!toast) return null;

  const { message, type } = toast;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={16} className="toast-icon text-success" />;
      case "error":
        return <AlertCircle size={16} className="toast-icon text-error" />;
      default:
        return <Info size={16} className="toast-icon text-info" />;
    }
  };

  return (
    <div className={`peaklyy-toast-container ${type || "info"}`} role="alert">
      <div className="toast-content">
        {getIcon()}
        <span className="toast-message">{message}</span>
      </div>
    </div>
  );
}
