import {
  Activity,
  Clock,
  FileCode,
  Layers,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useEditor } from "../../context/EditorContext";
import { useResizable } from "../../utils/useResizable";
import { ColumnSplitter, RowSplitter } from "../common/SplitterHandle";
import PracticeEditor from "./PracticeEditor";
import PracticeWorkspaceHeader from "./PracticeWorkspaceHeader";
import ProblemCatalog from "./ProblemCatalog";
import ProblemDescription from "./ProblemDescription";
import SubmissionDetailModal from "./SubmissionDetailModal";
import SubmissionResultModal from "./SubmissionResultModal";
import SubmissionsHistory from "./SubmissionsHistory";
import TestCasesPanel from "./TestCasesPanel";

export default function PracticeView() {
  const {
    problemsList,
    practiceViewMode,
    selectedProblem,
    practiceLang,
    changePracticeLanguage,
    practiceCode,
    handlePracticeCodeChange,
    lastSavedTime,
    openProblem,
    backToProblemCatalog,
    goToPrevProblem,
    goToNextProblem,
    pickRandomProblem,
    resetPracticeStarterCode,
    runJudge,
    runJudgeCustom,
    submitJudge,
    isJudgeRunning,
    isJudgeSubmitting,
    runResults,
    customInput,
    setCustomInput,
    customResult,
    submissionResult,
    setSubmissionResult,
    submissionsList,
    activeSubmissionModal,
    setActiveSubmissionModal,
    restorePreviousCode,
  } = useEditor();

  const [activeDescTab, setActiveDescTab] = useState("description");
  const [activeTestMode, setActiveTestMode] = useState("cases");
  const [activeTestTab, setActiveTestTab] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Horizontal Split: Left Problem Description vs Right IDE & Testcases
  const {
    split: practiceSplitX,
    startResize: startPracticeResizeX,
    resetSplit: resetPracticeSplitX,
    containerRef: practiceMainSplitRef,
    isDragging: isDraggingPracticeX,
  } = useResizable({
    initialSplit: 48,
    min: 22,
    max: 78,
    direction: "horizontal",
    storageKey: "peaklyy-practice-split-x",
  });

  // Vertical Split: Top Code Editor vs Bottom Testcases/Results
  const {
    split: practiceSplitY,
    startResize: startPracticeResizeY,
    resetSplit: resetPracticeSplitY,
    containerRef: practiceRightCardRef,
    isDragging: isDraggingPracticeY,
  } = useResizable({
    initialSplit: 58,
    min: 24,
    max: 82,
    direction: "vertical",
    storageKey: "peaklyy-practice-split-y",
  });

  const totalSubmissions = submissionsList.length;
  const acceptedSubmissions = submissionsList.filter((s) => s.verdict === "ACCEPTED").length;
  const acceptanceRate = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;
  const sampleCases = selectedProblem?.sampleTestCases || [];

  const handleRun = () => {
    if (activeTestTab === -1 || activeTestMode === "custom") {
      runJudgeCustom();
    } else {
      runJudge();
    }
  };

  // =========================================================================
  // VIEW 1: PROBLEMS CATALOG VIEW
  // =========================================================================
  if (practiceViewMode === "catalog") {
    return (
      <ProblemCatalog
        problemsList={problemsList}
        openProblem={openProblem}
        pickRandomProblem={pickRandomProblem}
      />
    );
  }

  // =========================================================================
  // VIEW 2: PRACTICE WORKSPACE VIEW
  // =========================================================================
  return (
    <div className="forge-practice-workspace">
      {/* Workspace Top Bar */}
      <PracticeWorkspaceHeader
        selectedProblem={selectedProblem}
        backToProblemCatalog={backToProblemCatalog}
        goToPrevProblem={goToPrevProblem}
        goToNextProblem={goToNextProblem}
        isBookmarked={isBookmarked}
        setIsBookmarked={setIsBookmarked}
        isJudgeRunning={isJudgeRunning}
        isJudgeSubmitting={isJudgeSubmitting}
        onRun={handleRun}
        onSubmit={submitJudge}
      />

      {/* Resizable Split Layout: Left Problem Description & Right IDE/Testcases */}
      <div
        className={`workspace-main-split ${
          isDraggingPracticeX || isDraggingPracticeY ? "is-resizing-active" : ""
        }`}
        ref={practiceMainSplitRef}
      >
        {/* LEFT CARD: PROBLEM DESCRIPTION PANEL */}
        <section
          className={`panel workspace-left-card ${
            activeDescTab === "submissions" ? "submissions-expanded-mode" : ""
          }`}
          style={{
            width: activeDescTab === "submissions" ? "100%" : `calc(${practiceSplitX}% - 5px)`,
            flex: activeDescTab === "submissions" ? "1 1 100%" : undefined,
            maxWidth: "100%",
          }}
        >
          {selectedProblem ? (
            <>
              {/* Top Navigation Tabs */}
              <div className="card-tab-header">
                <button
                  type="button"
                  className={`card-tab-button ${activeDescTab === "description" ? "active" : ""}`}
                  onClick={() => setActiveDescTab("description")}
                >
                  <FileCode size={13} />
                  <span>Description</span>
                </button>
                <button
                  type="button"
                  className={`card-tab-button ${activeDescTab === "editorial" ? "active" : ""}`}
                  onClick={() => setActiveDescTab("editorial")}
                >
                  <Layers size={13} />
                  <span>Editorial</span>
                </button>
                <button
                  type="button"
                  className={`card-tab-button ${activeDescTab === "solutions" ? "active" : ""}`}
                  onClick={() => setActiveDescTab("solutions")}
                >
                  <Clock size={13} />
                  <span>Solutions</span>
                </button>
                <button
                  type="button"
                  className={`card-tab-button ${activeDescTab === "submissions" ? "active" : ""}`}
                  onClick={() => setActiveDescTab("submissions")}
                >
                  <Activity size={13} />
                  <span>Submissions ({submissionsList.length})</span>
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="card-scroll-body">
                {activeDescTab === "submissions" ? (
                  <SubmissionsHistory
                    submissionsList={submissionsList}
                    selectedProblem={selectedProblem}
                    setActiveDescTab={setActiveDescTab}
                    setActiveSubmissionModal={setActiveSubmissionModal}
                    restorePreviousCode={restorePreviousCode}
                  />
                ) : (
                  <ProblemDescription
                    selectedProblem={selectedProblem}
                    activeDescTab={activeDescTab}
                    submissionsCount={submissionsList.length}
                    acceptanceRate={acceptanceRate}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="panel-loading-state">
              <Loader2 size={24} className="animate-spin" />
              <span>Loading challenge...</span>
            </div>
          )}
        </section>

        {/* Right Split & Cards (Visible when NOT in full-screen Submissions view) */}
        {activeDescTab !== "submissions" && (
          <>
            <ColumnSplitter
              isDragging={isDraggingPracticeX}
              onStart={startPracticeResizeX}
              onReset={resetPracticeSplitX}
              title="Drag to resize Problem Description and IDE (Double-click to reset 50/50)"
            />

            <section
              className="workspace-right-card"
              ref={practiceRightCardRef}
              style={{ width: `calc(${100 - practiceSplitX}% - 5px)` }}
            >
              {/* Top: Monaco Code Editor */}
              <div
                className="panel editor-pane-card"
                style={{ height: `calc(${practiceSplitY}% - 5px)` }}
              >
                <PracticeEditor
                  practiceLang={practiceLang}
                  changePracticeLanguage={changePracticeLanguage}
                  practiceCode={practiceCode}
                  handlePracticeCodeChange={handlePracticeCodeChange}
                  resetPracticeStarterCode={resetPracticeStarterCode}
                  lastSavedTime={lastSavedTime}
                />
              </div>

              <RowSplitter
                isDragging={isDraggingPracticeY}
                onStart={startPracticeResizeY}
                onReset={resetPracticeSplitY}
                title="Drag to resize Editor and Test Cases (Double-click to reset)"
              />

              {/* Bottom: Test Cases & Results Panel */}
              <div
                className="panel testcase-pane-card"
                style={{ height: `calc(${100 - practiceSplitY}% - 5px)` }}
              >
                <TestCasesPanel
                  sampleCases={sampleCases}
                  activeTestMode={activeTestMode}
                  setActiveTestMode={setActiveTestMode}
                  activeTestTab={activeTestTab}
                  setActiveTestTab={setActiveTestTab}
                  runResults={runResults}
                  isJudgeRunning={isJudgeRunning}
                  runJudge={runJudge}
                  customInput={customInput}
                  setCustomInput={setCustomInput}
                  customResult={customResult}
                  runJudgeCustom={runJudgeCustom}
                />
              </div>
            </section>
          </>
        )}
      </div>

      {/* Modals */}
      <SubmissionResultModal
        submissionResult={submissionResult}
        onClose={() => setSubmissionResult(null)}
      />

      <SubmissionDetailModal
        activeSubmissionModal={activeSubmissionModal}
        selectedProblem={selectedProblem}
        onClose={() => setActiveSubmissionModal(null)}
        restorePreviousCode={(sub) => {
          restorePreviousCode(sub);
          setActiveDescTab("description");
          setActiveSubmissionModal(null);
        }}
      />
    </div>
  );
}
