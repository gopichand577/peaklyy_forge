import {
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Play,
  Send,
} from "lucide-react";

export default function PracticeWorkspaceHeader({
  selectedProblem,
  backToProblemCatalog,
  goToPrevProblem,
  goToNextProblem,
  isBookmarked,
  setIsBookmarked,
  isJudgeRunning,
  isJudgeSubmitting,
  onRun,
  onSubmit,
}) {
  return (
    <header className="workspace-header-bar">
      <div className="workspace-header-left">
        <button
          type="button"
          className="forge-back-btn"
          onClick={backToProblemCatalog}
          title="Back to Problem List"
        >
          <ArrowLeft size={15} />
          <span>Problem List</span>
        </button>

        <div className="workspace-problem-switcher">
          <button
            type="button"
            className="switcher-arrow-btn"
            onClick={goToPrevProblem}
            title="Previous Problem"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="switcher-title">
            {selectedProblem?.problemNumber}. {selectedProblem?.title}
          </span>
          <button
            type="button"
            className="switcher-arrow-btn"
            onClick={goToNextProblem}
            title="Next Problem"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="workspace-header-right">
        <button
          type="button"
          className={`bookmark-btn ${isBookmarked ? "active" : ""}`}
          onClick={() => setIsBookmarked((prev) => !prev)}
          title={isBookmarked ? "Remove Bookmark" : "Bookmark Question"}
        >
          <Bookmark size={15} fill={isBookmarked ? "currentColor" : "none"} />
        </button>

        <button
          type="button"
          className="forge-run-action-btn"
          onClick={onRun}
          disabled={isJudgeRunning || isJudgeSubmitting}
          title="Run code against sample test cases (Ctrl+Enter)"
        >
          {isJudgeRunning ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Play size={13} fill="currentColor" />
          )}
          <span>Run</span>
        </button>

        <button
          type="button"
          className="forge-submit-action-btn"
          onClick={onSubmit}
          disabled={isJudgeRunning || isJudgeSubmitting}
          title="Submit solution for full judge evaluation"
        >
          {isJudgeSubmitting ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Send size={13} />
          )}
          <span>Submit</span>
        </button>
      </div>
    </header>
  );
}
