import { Loader2, Play } from "lucide-react";
import { useEditor } from "../../context/EditorContext";

export default function RunButton() {
  const { runCode, isRunning } = useEditor();

  return (
    <button
      type="button"
      className="run-button"
      onClick={runCode}
      disabled={isRunning}
      title="Run Code (Ctrl+Enter)"
    >
      {isRunning ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <Play size={14} fill="currentColor" />
      )}
      <span>{isRunning ? "Running..." : "Run"}</span>
    </button>
  );
}
