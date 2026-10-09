import { Download, FolderOpen, Plus, Upload } from "lucide-react";
import { useEffect, useRef } from "react";
import CommandPalette from "../components/common/CommandPalette";
import { ColumnSplitter, RowSplitter } from "../components/common/SplitterHandle";
import SettingsModal from "../components/common/SettingsModal";
import Toast from "../components/common/Toast";
import Output from "../components/console/Output";
import Editor from "../components/editor/Editor";
import LanguageSelector from "../components/editor/LanguageSelector";
import RunButton from "../components/editor/RunButton";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import MonitoringView from "../components/monitoring/MonitoringView";
import PracticeView from "../components/practice/PracticeView";
import ProfileView from "../components/profile/ProfileView";
import SettingsView from "../components/settings/SettingsView";
import Preview from "../components/preview/Preview";
import ProjectModal from "../components/projects/ProjectModal";
import { useEditor } from "../context/EditorContext";
import { useResizable } from "../utils/useResizable";
import "../App.css";

export default function Home() {
  const {
    activeNav,
    project,
    runCode,
    setProjectDialogOpen,
    importProject,
    importLocalFolder,
    setIsCommandPaletteOpen,
    setIsSettingsOpen,
    showToast,
  } = useEditor();
  const uploadRef = useRef(null);
  const folderUploadRef = useRef(null);

  const {
    split: compilerSplitX,
    startResize: startCompilerResizeX,
    resetSplit: resetCompilerSplitX,
    containerRef: compilerWorkspaceRef,
    isDragging: isDraggingCompilerX,
  } = useResizable({
    initialSplit: 52,
    min: 22,
    max: 78,
    direction: "horizontal",
    storageKey: "peaklyy-compiler-split-x",
  });

  const {
    split: compilerSplitY,
    startResize: startCompilerResizeY,
    resetSplit: resetCompilerSplitY,
    containerRef: compilerMainRef,
    isDragging: isDraggingCompilerY,
  } = useResizable({
    initialSplit: 64,
    min: 25,
    max: 82,
    direction: "vertical",
    storageKey: "peaklyy-compiler-split-y",
  });

  useEffect(() => {
    const shortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        showToast("Project and code saved to draft.", "success");
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        runCode();
      }
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key.toLowerCase() === "k" || (event.shiftKey && event.key.toLowerCase() === "p"))
      ) {
        event.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if ((event.ctrlKey || event.metaKey) && event.key === ",") {
        event.preventDefault();
        setIsSettingsOpen((prev) => !prev);
      }
      if (event.key === "Escape") {
        setIsCommandPaletteOpen(false);
        setIsSettingsOpen(false);
        setProjectDialogOpen(false);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [runCode, setIsCommandPaletteOpen, setIsSettingsOpen, setProjectDialogOpen, showToast]);

  const download = () => {
    if (!project) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([JSON.stringify(project, null, 2)], { type: "application/json" })
    );
    link.download = `${
      (project.name || "peaklyy-project").replace(/[^a-z0-9]+/gi, "-").toLowerCase()
    }.peaklyy.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      importProject(JSON.parse(await file.text()));
    } catch {
      window.alert("That file isn’t a valid Peaklyy Forge project.");
    }
    event.target.value = "";
  };

  const handleFolderUpload = async (event) => {
    const fileList = Array.from(event.target.files || []);
    if (!fileList.length) return;

    const firstRel = fileList[0].webkitRelativePath || "";
    const folderName = firstRel ? firstRel.split("/")[0] : "Imported Project";

    const parsedFiles = [];
    for (const f of fileList) {
      if (f.name === ".DS_Store" || f.name === "Thumbs.db") continue;
      if (
        f.webkitRelativePath &&
        (f.webkitRelativePath.includes("node_modules/") ||
          f.webkitRelativePath.includes(".git/") ||
          f.webkitRelativePath.includes(".vscode/"))
      )
        continue;

      try {
        const text = await f.text();
        const pathParts = f.webkitRelativePath
          ? f.webkitRelativePath.split("/").slice(1).join("/")
          : f.name;
        parsedFiles.push({
          name: pathParts || f.name,
          content: text,
        });
      } catch (err) {
        console.warn("Could not read file:", f.name, err);
      }
    }

    if (parsedFiles.length > 0) {
      importLocalFolder(folderName, parsedFiles);
    } else {
      showToast("No readable files found in the selected folder.", "warning");
    }
    event.target.value = "";
  };

  return (
    <div className="forge-root-layout">
      <Navbar />

      <div className="forge-body-container">
        <Sidebar />

        <main className="forge-main-content">
          {activeNav === "compiler" ? (
            <div
              className={`compiler-view-wrapper ${
                isDraggingCompilerX || isDraggingCompilerY ? "is-resizing-active" : ""
              }`}
              ref={compilerMainRef}
            >
              <div className="compiler-top-toolbar">
                <div className="toolbar-actions-left">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setProjectDialogOpen(true)}
                    aria-label="Open projects"
                    title="Open Projects"
                  >
                    <FolderOpen size={17} />
                  </button>

                  <button
                    type="button"
                    className="icon-button"
                    onClick={download}
                    aria-label="Download project"
                    title="Export JSON"
                  >
                    <Download size={16} />
                  </button>

                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => folderUploadRef.current?.click()}
                    aria-label="Import local folder from system"
                    title="Import Local Folder"
                  >
                    <Upload size={16} />
                  </button>

                  <input
                    ref={folderUploadRef}
                    className="file-upload"
                    type="file"
                    webkitdirectory=""
                    directory=""
                    multiple
                    onChange={handleFolderUpload}
                  />

                  <input
                    ref={uploadRef}
                    className="file-upload"
                    type="file"
                    accept="application/json,.json"
                    onChange={upload}
                  />

                  <button
                    type="button"
                    className="new-button"
                    onClick={() => setProjectDialogOpen(true)}
                    title="Create or Manage Projects (+)"
                  >
                    <Plus size={15} />
                    <span>New</span>
                  </button>
                </div>

                <div className="toolbar-actions-right">
                  <LanguageSelector />
                  <RunButton />
                </div>
              </div>

              <section
                className="compiler-workspace-split"
                ref={compilerWorkspaceRef}
                style={{ height: `calc(${compilerSplitY}% - 5px)` }}
              >
                <div
                  className="compiler-pane-container compiler-editor-pane"
                  style={{ width: `calc(${compilerSplitX}% - 5px)` }}
                >
                  <Editor />
                </div>

                <ColumnSplitter
                  isDragging={isDraggingCompilerX}
                  onStart={startCompilerResizeX}
                  onReset={resetCompilerSplitX}
                  title="Drag to resize Editor and Input/Preview (Double-click to reset 50/50)"
                />

                <div
                  className="compiler-pane-container compiler-preview-pane"
                  style={{ width: `calc(${100 - compilerSplitX}% - 5px)` }}
                >
                  <Preview />
                </div>
              </section>

              <RowSplitter
                isDragging={isDraggingCompilerY}
                onStart={startCompilerResizeY}
                onReset={resetCompilerSplitY}
                title="Drag to resize Workspace and Output Console (Double-click to reset)"
              />

              <section
                className="compiler-console-split"
                style={{ height: `calc(${100 - compilerSplitY}% - 5px)` }}
              >
                <Output />
              </section>
            </div>
          ) : activeNav === "monitoring" ? (
            <MonitoringView />
          ) : activeNav === "profile" ? (
            <ProfileView />
          ) : activeNav === "settings" ? (
            <SettingsView />
          ) : (
            <PracticeView />
          )}
        </main>
      </div>

      <ProjectModal />
      <CommandPalette />
      <SettingsModal />
      <Toast />
    </div>
  );
}
