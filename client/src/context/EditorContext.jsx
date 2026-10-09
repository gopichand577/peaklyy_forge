/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  executeCode,
  fetchProblems,
  fetchProblem,
  runJudgeCode,
  submitJudgeSolution,
  fetchProblemSubmissions,
  fetchSubmissionDetail,
  fetchProblemDraft,
  saveProblemDraft,
} from "../services/api";
import { connectInteractiveSession } from "../services/terminalSocket";

const EditorContext = createContext(null);
const STORAGE_KEY = "peaklyy-forge-projects";
const ACTIVE_KEY = "peaklyy-forge-active-project";
const LOCAL_DRAFTS_KEY = "peaklyy-forge-p1-drafts";
const NAV_KEY = "peaklyy-forge-active-nav";
const PRACTICE_VIEW_MODE_KEY = "peaklyy-forge-practice-view-mode";
const PRACTICE_PROBLEM_ID_KEY = "peaklyy-forge-selected-problem-id";
const PRACTICE_LANG_KEY = "peaklyy-forge-practice-lang";

import {
  getFileLanguage,
  initialOutput,
  languageMeta,
  RUNNABLE_LANGUAGES,
  starterCode,
} from "../constants/languages";

export { getFileLanguage, languageMeta, RUNNABLE_LANGUAGES };

const makeProject = (name = "Untitled project", language = "python") => {
  const ext = languageMeta[language]?.extension || "py";
  const entryName = language === "java" ? "Main.java" : `main.${ext}`;
  const code = starterCode[language] || "";
  const entryId = `file-${crypto.randomUUID().substring(0, 8)}`;
  return {
    id: crypto.randomUUID(),
    name,
    language: language || "python",
    ...starterCode,
    activeFileId: entryId,
    openFileIds: [entryId],
    files: [
      { id: entryId, name: entryName, content: code, isEntry: true }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

function ensureProjectFiles(proj) {
  if (!proj) return proj;
  const lang = proj.language || "python";
  const ext = languageMeta[lang]?.extension || "py";
  const entryName = lang === "java" ? "Main.java" : `main.${ext}`;
  const code = proj[lang] || starterCode[lang] || "";

  if (!proj.files || !Array.isArray(proj.files) || proj.files.length === 0) {
    const entryId = `file-${crypto.randomUUID().substring(0, 8)}`;
    proj.files = [
      { id: entryId, name: entryName, content: code, isEntry: true }
    ];
    proj.activeFileId = entryId;
    proj.openFileIds = [entryId];
  }
  if (!proj.activeFileId && proj.files[0]) {
    proj.activeFileId = proj.files[0].id;
  }
  if (!proj.openFileIds || !Array.isArray(proj.openFileIds) || proj.openFileIds.length === 0) {
    proj.openFileIds = proj.files.map((f) => f.id);
  }
  return proj;
}

const readProjects = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    if (!Array.isArray(raw)) return [];
    const seen = new Set();
    return raw.filter((p) => {
      if (!p || !p.id || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  } catch {
    return [];
  }
};

const getLocalDraft = (problemId, language) => {
  try {
    const map = JSON.parse(localStorage.getItem(LOCAL_DRAFTS_KEY) || "{}");
    return map[`${problemId}:${language}`] || null;
  } catch {
    return null;
  }
};

const setLocalDraft = (problemId, language, code) => {
  try {
    const map = JSON.parse(localStorage.getItem(LOCAL_DRAFTS_KEY) || "{}");
    map[`${problemId}:${language}`] = { code, lastEditedAt: new Date().toISOString() };
    localStorage.setItem(LOCAL_DRAFTS_KEY, JSON.stringify(map));
  } catch { }
};

const cleanLegacyCode = (code, starter) => {
  if (!code) return starter || "";
  if (code.includes("__main__") && code.includes("import sys")) {
    const classMatch = code.match(/(class\s+Solution[\s\S]*?)(?=\nif\s+__name__|$)/);
    if (classMatch && classMatch[1]) return classMatch[1].trim();
    return starter || code;
  }
  if (code.includes("readFileSync") && code.includes("fs")) {
    const fnMatch = code.match(/(function\s+[A-Za-z0-9_]+\([\s\S]*?\n\})/);
    if (fnMatch && fnMatch[1]) return fnMatch[1].trim();
    return starter || code;
  }
  if (code.includes("public class Main") && code.includes("static void main")) {
    const classMatch = code.match(/(class\s+Solution\s*\{[\s\S]*?\n\})/);
    if (classMatch && classMatch[1]) return classMatch[1].trim();
    return starter || code;
  }
  return code;
};

export function EditorProvider({ children }) {
  // Navigation mode: 'compiler' | 'practice' (Persisted across refreshes)
  const [activeNav, setActiveNavState] = useState(() => {
    try {
      return localStorage.getItem(NAV_KEY) || "compiler";
    } catch {
      return "compiler";
    }
  });

  const setActiveNav = useCallback((nav) => {
    setActiveNavState(nav);
    try {
      localStorage.setItem(NAV_KEY, nav);
    } catch {}
  }, []);

  // =========================================================================
  // P0 COMPILER STATE
  // =========================================================================
  const [projects, setProjects] = useState(readProjects);
  const [project, setProject] = useState(() => {
    const saved = readProjects();
    const active = localStorage.getItem(ACTIVE_KEY);
    return saved.find((item) => item.id === active) || saved[0] || null;
  });
  const [stdin, setStdinState] = useState(() => {
    try {
      const saved = localStorage.getItem("peaklyy-forge-stdin");
      return saved !== null ? saved : "Alice\n10\n20\n";
    } catch {
      return "Alice\n10\n20\n";
    }
  });

  const setStdin = useCallback((val) => {
    setStdinState(val);
    try {
      localStorage.setItem("peaklyy-forge-stdin", val);
    } catch {}
  }, []);
  const [output, setOutput] = useState(initialOutput);
  const [isRunning, setIsRunning] = useState(false);
  const [isProjectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectDialogMode, setProjectDialogMode] = useState("project"); // 'project' | 'file'
  const [projectDialogLang, setProjectDialogLang] = useState(null);

  const openCreateFileDialog = useCallback((langKey = null) => {
    setProjectDialogMode("file");
    setProjectDialogLang(langKey || null);
    setProjectDialogOpen(true);
  }, []);

  // Terminal interactive state
  const [terminalHistory, setTerminalHistory] = useState([]);
  const [activePrompt, setActivePrompt] = useState("");
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const activeSessionRef = useRef(null);
  const pendingPasteQueueRef = useRef([]);

  // =========================================================================
  // P2 DX & MULTI-FILE STATE
  // =========================================================================
  const [editorSettings, setEditorSettingsState] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("peaklyy-forge-editor-settings")) || {
          fontSize: 14,
          tabSize: 2,
          wordWrap: "on",
          minimap: false,
          lineNumbers: "on",
          autoSave: true,
        }
      );
    } catch {
      return { fontSize: 14, tabSize: 2, wordWrap: "on", minimap: false, lineNumbers: "on", autoSave: true };
    }
  });

  const updateEditorSettings = useCallback((newSettings) => {
    setEditorSettingsState((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem("peaklyy-forge-editor-settings", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Theme State (Dark / Light)
  const THEME_STORAGE_KEY = "peaklyy-forge-theme";
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || "dark";
    } catch {
      return "dark";
    }
  });

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Accent Color State
  const [accentColor, setAccentColorState] = useState(() => {
    try {
      return localStorage.getItem("peaklyy-forge-accent") || "#ef4444";
    } catch {
      return "#ef4444";
    }
  });

  const setAccentColor = useCallback((color) => {
    setAccentColorState(color);
    try {
      localStorage.setItem("peaklyy-forge-accent", color);
      document.documentElement.style.setProperty("--red", color);
    } catch {}
  }, []);

  // Toast Notification State
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 3200);
  }, []);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = useCallback(() => setIsFullscreen((prev) => !prev), []);

  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [targetErrorLine, setTargetErrorLine] = useState(null);

  const jumpToErrorLine = useCallback((line, col = 1) => {
    if (line) {
      setTargetErrorLine({ line, col, timestamp: Date.now() });
    }
  }, []);

  // =========================================================================
  // PROFILE, NOTIFICATIONS, COMPILER SETTINGS & ACTIVITY PERSISTENCE
  // =========================================================================
  const PROFILE_KEY = "peaklyy-forge-profile";
  const NOTIFICATIONS_KEY = "peaklyy-forge-notifications";
  const ACTIVITY_KEY = "peaklyy-forge-activity-stats";
  const COMPILER_SETTINGS_KEY = "peaklyy-forge-compiler-settings";
  const NOTIF_SETTINGS_KEY = "peaklyy-forge-notification-settings";

  // 1. Profile State
  const [profile, setProfileState] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(PROFILE_KEY)) || {
          displayName: "Gaurav",
          title: "Developer",
          bio: "Passionate about coding and learning new technologies.",
          avatarUrl: "",
        }
      );
    } catch {
      return {
        displayName: "Gaurav",
        title: "Developer",
        bio: "Passionate about coding and learning new technologies.",
        avatarUrl: "",
      };
    }
  });

  const updateProfile = useCallback((newProfile) => {
    setProfileState((prev) => {
      const updated = { ...prev, ...newProfile };
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // 2. Activity Stats State
  const [activityStats, setActivityStatsState] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(ACTIVITY_KEY)) || {
          compilerRuns: 0,
          practiceSessions: 0,
          languagesUsed: [],
          recentActivity: [],
        }
      );
    } catch {
      return {
        compilerRuns: 0,
        practiceSessions: 0,
        languagesUsed: [],
        recentActivity: [],
      };
    }
  });

  const recordActivity = useCallback(({ type, title, lang }) => {
    setActivityStatsState((prev) => {
      const compilerRuns = type === "compiler" ? (prev.compilerRuns || 0) + 1 : (prev.compilerRuns || 0);
      const practiceSessions = type === "practice" ? (prev.practiceSessions || 0) + 1 : (prev.practiceSessions || 0);
      const languagesUsed = Array.from(new Set([...(prev.languagesUsed || []), lang].filter(Boolean)));
      
      const newEntry = {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type,
        title,
        timestamp: new Date().toISOString(),
        lang: lang || "code",
      };

      const recentActivity = [newEntry, ...(prev.recentActivity || [])].slice(0, 15);

      const updated = {
        compilerRuns,
        practiceSessions,
        languagesUsed,
        recentActivity,
      };

      try {
        localStorage.setItem(ACTIVITY_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const [problemsList, setProblemsList] = useState([]);

  // Compute solved problems dynamically from problemsList
  const problemsSolvedCount = useMemo(() => {
    if (!Array.isArray(problemsList)) return 0;
    return problemsList.filter((p) => p.isSolved || p.status === "SOLVED").length;
  }, [problemsList]);

  // 3. Notifications State
  const [notifications, setNotificationsState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY)) || [];
    } catch {
      return [];
    }
  });

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const addNotification = useCallback(({ title, message, type = "info" }) => {
    setNotificationsState((prev) => {
      const newNotif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title,
        message,
        type,
        time: new Date().toISOString(),
        read: false,
      };
      const updated = [newNotif, ...prev].slice(0, 30);
      try {
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const markNotificationRead = useCallback((id) => {
    setNotificationsState((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      try {
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotificationsState((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      try {
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const clearNotifications = useCallback(() => {
    setNotificationsState([]);
    try {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
    } catch {}
  }, []);

  // 4. Compiler Settings State
  const [compilerSettings, setCompilerSettingsState] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(COMPILER_SETTINGS_KEY)) || {
          defaultLanguage: "python",
          executionTimeout: "10 seconds",
          outputLimit: "1 MB",
          interactiveStdin: true,
        }
      );
    } catch {
      return {
        defaultLanguage: "python",
        executionTimeout: "10 seconds",
        outputLimit: "1 MB",
        interactiveStdin: true,
      };
    }
  });

  const updateCompilerSettings = useCallback((newSettings) => {
    setCompilerSettingsState((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(COMPILER_SETTINGS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // 5. Notification Settings State
  const [notificationSettings, setNotificationSettingsState] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(NOTIF_SETTINGS_KEY)) || {
          execution: true,
          practice: true,
          system: true,
        }
      );
    } catch {
      return { execution: true, practice: true, system: true };
    }
  });

  const updateNotificationSettings = useCallback((newSettings) => {
    setNotificationSettingsState((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // 6. Reset Preferences
  const resetPreferences = useCallback(() => {
    const defaultEditor = {
      fontSize: 14,
      tabSize: 2,
      wordWrap: "on",
      minimap: false,
      lineNumbers: "on",
      autoSave: true,
    };
    const defaultCompiler = {
      defaultLanguage: "python",
      executionTimeout: "10 seconds",
      outputLimit: "1 MB",
      interactiveStdin: true,
    };
    const defaultNotif = {
      execution: true,
      practice: true,
      system: true,
    };

    setEditorSettingsState(defaultEditor);
    setCompilerSettingsState(defaultCompiler);
    setNotificationSettingsState(defaultNotif);
    setThemeState("dark");
    setAccentColorState("#ef4444");
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.style.setProperty("--red", "#ef4444");

    try {
      localStorage.setItem("peaklyy-forge-editor-settings", JSON.stringify(defaultEditor));
      localStorage.setItem(COMPILER_SETTINGS_KEY, JSON.stringify(defaultCompiler));
      localStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify(defaultNotif));
      localStorage.setItem(THEME_STORAGE_KEY, "dark");
      localStorage.setItem("peaklyy-forge-accent", "#ef4444");
    } catch {}

    showToast("Preferences reset to default values.", "success");
  }, [showToast]);

  const [isFileExplorerOpen, setIsFileExplorerOpenState] = useState(() => {
    try {
      const saved = localStorage.getItem("peaklyy-forge-file-explorer-open");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const setIsFileExplorerOpen = useCallback((val) => {
    setIsFileExplorerOpenState((prev) => {
      const nextVal = typeof val === "function" ? val(prev) : val;
      try {
        localStorage.setItem("peaklyy-forge-file-explorer-open", JSON.stringify(nextVal));
      } catch {}
      return nextVal;
    });
  }, []);

  const [isAddingFile, setIsAddingFile] = useState(false);

  const openNewFileInput = useCallback(() => {
    setIsFileExplorerOpen(true);
    setIsAddingFile(true);
  }, [setIsFileExplorerOpen]);

  // Multi-File Project Methods
  const activeFile = useMemo(() => {
    if (!project) return null;
    const ensured = ensureProjectFiles(project);
    if (!ensured) return null;
    return (
      ensured.files?.find((f) => f.id === ensured.activeFileId) ||
      ensured.files?.[0] ||
      null
    );
  }, [project]);

  const addProjectFile = useCallback((fileName, initialContent = null, isStandalone = true) => {
    if (!fileName || typeof fileName !== "string") return;
    const cleanName = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_").trim();
    if (!cleanName) return;

    setIsFileExplorerOpen(true);
    setProject((current) => {
      const ensured = ensureProjectFiles(current);
      const exists = ensured.files?.some((f) => f.name.toLowerCase() === cleanName.toLowerCase());
      if (exists) {
        const existing = ensured.files.find((f) => f.name.toLowerCase() === cleanName.toLowerCase());
        const openIds = ensured.openFileIds || [];
        const updatedOpen = openIds.includes(existing.id) ? openIds : [...openIds, existing.id];
        return { ...ensured, activeFileId: existing.id, openFileIds: updatedOpen };
      }

      const fileLang = getFileLanguage(cleanName, null);
      const isRunnable = RUNNABLE_LANGUAGES.includes(fileLang);
      const starter = initialContent !== null ? initialContent : (isRunnable ? (starterCode[fileLang] || "") : "");
      const newId = `file-${crypto.randomUUID().substring(0, 8)}`;
      const newFile = { id: newId, name: cleanName, content: starter, isEntry: false, isStandalone: Boolean(isStandalone) };
      const openIds = ensured.openFileIds || [];
      return {
        ...ensured,
        activeFileId: newId,
        openFileIds: [...openIds, newId],
        files: [...(ensured.files || []), newFile],
        updatedAt: new Date().toISOString(),
      };
    });
    showToast(`Created file "${cleanName}".`, "success");
  }, [showToast, setIsFileExplorerOpen]);

  const createIndividualFile = useCallback((fileName = "main.py", initialContent = null, forcedLang = null) => {
    const cleanName = (fileName || "").trim() || "main.py";
    const currentProjects = readProjects();
    const isDuplicate = currentProjects.some(
      (p) => p?.name?.toLowerCase() === cleanName.toLowerCase() || (p?.files || []).some((f) => f.name?.toLowerCase() === cleanName.toLowerCase())
    );

    if (isDuplicate) {
      showToast(`A file or project named "${cleanName}" already exists.`, "error");
      return;
    }

    const fileLang = forcedLang || getFileLanguage(cleanName, "python");
    const isRunnable = RUNNABLE_LANGUAGES.includes(fileLang);
    const starter = initialContent !== null ? initialContent : (isRunnable ? (starterCode[fileLang] || "") : "");
    const entryId = `file-${crypto.randomUUID().substring(0, 8)}`;
    const newProj = {
      id: crypto.randomUUID(),
      name: cleanName,
      isSingleFile: true,
      language: fileLang,
      ...starterCode,
      [fileLang]: starter,
      activeFileId: entryId,
      openFileIds: [entryId],
      files: [
        { id: entryId, name: cleanName, content: starter, isEntry: true, isStandalone: true }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newProj, ...currentProjects.filter((p) => p && p.id !== newProj.id)];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    setProjects(updated);
    setProject(newProj);
    try {
      localStorage.setItem(ACTIVE_KEY, newProj.id);
    } catch {}
    setIsFileExplorerOpen(true);
    setProjectDialogOpen(false);
    showToast(`Created individual file "${cleanName}".`, "success");
  }, [showToast, setIsFileExplorerOpen]);

  const switchToFile = useCallback((targetProjectId, targetFileId) => {
    setProjects((previous) => {
      const targetProj = previous.find((p) => p.id === targetProjectId);
      if (!targetProj) return previous;

      const ensured = ensureProjectFiles(targetProj);
      const targetId = targetFileId || ensured.activeFileId || ensured.files[0]?.id;
      const openIds = ensured.openFileIds || [];
      const updatedOpen = targetId && !openIds.includes(targetId) ? [...openIds, targetId] : openIds;

      const updatedProj = {
        ...ensured,
        activeFileId: targetId,
        openFileIds: updatedOpen,
      };

      setProject(updatedProj);
      try {
        localStorage.setItem(ACTIVE_KEY, targetProjectId);
      } catch {}
      return previous.map((p) => (p.id === targetProjectId ? updatedProj : p));
    });
  }, []);

  // Close tab from top editor tab bar ONLY (does NOT delete file from File Explorer/project)
  const closeEditorTab = useCallback((fileId) => {
    setProject((current) => {
      const ensured = ensureProjectFiles(current);
      const openIds = (ensured.openFileIds || []).filter((id) => (ensured.files || []).some((f) => f.id === id));
      const remainingOpen = openIds.filter((id) => id !== fileId);

      let nextActive = ensured.activeFileId;
      if (ensured.activeFileId === fileId) {
        if (remainingOpen.length > 0) {
          const closedIdx = openIds.indexOf(fileId);
          const nextIdx = Math.min(Math.max(0, closedIdx), remainingOpen.length - 1);
          nextActive = remainingOpen[nextIdx];
        } else {
          // If all tabs were closed, fallback to entry file or first available file
          const firstFile = ensured.files[0];
          if (firstFile) {
            nextActive = firstFile.id;
            remainingOpen.push(firstFile.id);
          }
        }
      }

      return {
        ...ensured,
        activeFileId: nextActive,
        openFileIds: remainingOpen,
      };
    });
  }, []);

  // Delete file permanently from project & File Explorer
  const deleteProjectFile = useCallback((fileId, parentProjId = null) => {
    // 1. Update projects list and sync to localStorage
    setProjects((prev) => {
      const updated = prev.map((p) => {
        const isTarget = parentProjId ? p.id === parentProjId : (p.files || []).some((f) => f.id === fileId);
        if (isTarget) {
          const ensured = ensureProjectFiles(p);
          if ((ensured.files || []).length <= 1) return p;

          const remainingFiles = (ensured.files || []).filter((f) => f.id !== fileId);
          // If the deleted file was entry, make the first remaining file the entry
          if (remainingFiles.length > 0 && !remainingFiles.some((f) => f.isEntry)) {
            remainingFiles[0] = { ...remainingFiles[0], isEntry: true };
          }

          const remainingOpen = (ensured.openFileIds || []).filter((id) => id !== fileId);
          let nextActive = ensured.activeFileId;
          if (ensured.activeFileId === fileId) {
            if (remainingOpen.length > 0) {
              nextActive = remainingOpen[0];
            } else {
              nextActive = remainingFiles[0]?.id;
              remainingOpen.push(remainingFiles[0]?.id);
            }
          }
          return {
            ...ensured,
            activeFileId: nextActive,
            openFileIds: remainingOpen,
            files: remainingFiles,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2. Update current active project state if affected
    setProject((current) => {
      const isTarget = parentProjId ? current.id === parentProjId : (current.files || []).some((f) => f.id === fileId);
      if (!isTarget) return current;

      const ensured = ensureProjectFiles(current);
      if ((ensured.files || []).length <= 1) return current;

      const remainingFiles = (ensured.files || []).filter((f) => f.id !== fileId);
      if (remainingFiles.length > 0 && !remainingFiles.some((f) => f.isEntry)) {
        remainingFiles[0] = { ...remainingFiles[0], isEntry: true };
      }

      const remainingOpen = (ensured.openFileIds || []).filter((id) => id !== fileId);
      let nextActive = ensured.activeFileId;

      if (ensured.activeFileId === fileId) {
        if (remainingOpen.length > 0) {
          nextActive = remainingOpen[0];
        } else {
          nextActive = remainingFiles[0]?.id;
          remainingOpen.push(remainingFiles[0]?.id);
        }
      }

      return {
        ...ensured,
        activeFileId: nextActive,
        openFileIds: remainingOpen,
        files: remainingFiles,
        updatedAt: new Date().toISOString(),
      };
    });

    showToast("Subfile deleted successfully.", "info");
  }, [showToast]);

  const renameProjectFile = useCallback((fileId, newName) => {
    if (!newName) return;
    const cleanName = newName.replace(/[^a-zA-Z0-9_.-]/g, "_").trim();
    if (!cleanName) return;

    setProject((current) => {
      if (!current) return current;
      const ensured = ensureProjectFiles(current);
      const updated = (ensured.files || []).map((f) => (f.id === fileId ? { ...f, name: cleanName } : f));
      const nextProj = {
        ...ensured,
        name: ensured.isSingleFile ? cleanName : ensured.name,
        files: updated,
        updatedAt: new Date().toISOString(),
      };
      setProjects((prev) => {
        const up = prev.map((p) => (p.id === nextProj.id ? nextProj : p));
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(up));
        } catch {}
        return up;
      });
      return nextProj;
    });
  }, []);

  const selectProjectFile = useCallback((fileId) => {
    setProject((current) => {
      const ensured = ensureProjectFiles(current);
      const target = (ensured.files || []).find((f) => f.id === fileId);
      if (!target) return current;

      const openIds = ensured.openFileIds || [];
      const updatedOpen = openIds.includes(fileId) ? openIds : [...openIds, fileId];

      return {
        ...ensured,
        activeFileId: fileId,
        openFileIds: updatedOpen,
      };
    });
  }, []);

  // =========================================================================
  // P1 ONLINE JUDGE STATE (Persisted across refreshes)
  // =========================================================================
  const [practiceViewMode, setPracticeViewModeState] = useState(() => {
    try {
      return localStorage.getItem(PRACTICE_VIEW_MODE_KEY) || "workspace";
    } catch {
      return "workspace";
    }
  });

  const setPracticeViewMode = useCallback((mode) => {
    setPracticeViewModeState(mode);
    try {
      localStorage.setItem(PRACTICE_VIEW_MODE_KEY, mode);
    } catch {}
  }, []);

  const [selectedProblemId, setSelectedProblemIdState] = useState(() => {
    try {
      return localStorage.getItem(PRACTICE_PROBLEM_ID_KEY) || "two-sum";
    } catch {
      return "two-sum";
    }
  });

  const setSelectedProblemId = useCallback((id) => {
    setSelectedProblemIdState(id);
    try {
      localStorage.setItem(PRACTICE_PROBLEM_ID_KEY, id);
    } catch {}
  }, []);

  const [selectedProblem, setSelectedProblem] = useState(null);
  const [practiceLang, setPracticeLangState] = useState(() => {
    try {
      return localStorage.getItem(PRACTICE_LANG_KEY) || "python";
    } catch {
      return "python";
    }
  });

  const setPracticeLang = useCallback((lang) => {
    setPracticeLangState(lang);
    try {
      localStorage.setItem(PRACTICE_LANG_KEY, lang);
    } catch {}
  }, []);
  const [practiceCode, setPracticeCode] = useState("");
  const [draftStatus, setDraftStatus] = useState("saved"); // 'saving' | 'saved' | 'offline'
  const [lastSavedTime, setLastSavedTime] = useState("");

  const [isJudgeRunning, setIsJudgeRunning] = useState(false);
  const [isJudgeSubmitting, setIsJudgeSubmitting] = useState(false);
  const [runResults, setRunResults] = useState(null);
  const [customInput, setCustomInput] = useState("");
  const [customResult, setCustomResult] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [activeSubmissionModal, setActiveSubmissionModal] = useState(null);

  // 1. Fetch Problem Catalog
  const reloadProblems = useCallback(async (filters = {}) => {
    try {
      const data = await fetchProblems(filters);
      if (data.success && Array.isArray(data.problems)) {
        setProblemsList(data.problems);
      }
    } catch (err) {
      console.error("Failed to load problems list:", err);
    }
  }, []);

  useEffect(() => {
    reloadProblems();
  }, [reloadProblems]);

  // 2. Load Selected Problem Details & Draft
  const loadProblem = useCallback(async (problemId, lang = practiceLang) => {
    setSelectedProblemId(problemId);
    try {
      const data = await fetchProblem(problemId);
      if (data.success && data.problem) {
        setSelectedProblem(data.problem);

        // Check for saved draft: server first, then local fallback, then starter code
        let initialCode = "";
        try {
          const draftRes = await fetchProblemDraft(problemId, lang);
          if (draftRes.success && draftRes.draft?.code) {
            initialCode = draftRes.draft.code;
          }
        } catch {
          // Network fail: fallback to local storage
          const local = getLocalDraft(problemId, lang);
          if (local?.code) {
            initialCode = local.code;
            setDraftStatus("offline");
          }
        }

        const starter = data.problem.starterCode?.[lang] || data.problem.starterCode?.python || "";

        if (!initialCode) {
          initialCode = starter;
        } else {
          initialCode = cleanLegacyCode(initialCode, starter);
        }

        setPracticeCode(initialCode);
        setRunResults(null);
        setCustomResult(null);
        setSubmissionResult(null);

        // Load submission history for this problem
        try {
          const subData = await fetchProblemSubmissions(problemId);
          if (subData.success) {
            setSubmissionsList(subData.submissions || []);
          }
        } catch { }
      }
    } catch (err) {
      console.error("Failed to load problem detail:", err);
    }
  }, [practiceLang]);

  useEffect(() => {
    loadProblem(selectedProblemId, practiceLang);
  }, [selectedProblemId, loadProblem]);

  // 3. Debounced Auto-Save Draft
  const saveTimeoutRef = useRef(null);
  const handlePracticeCodeChange = (newCode) => {
    setPracticeCode(newCode);
    setDraftStatus("saving");

    // Immediately update local recovery layer
    setLocalDraft(selectedProblemId, practiceLang, newCode);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveProblemDraft(selectedProblemId, {
          language: practiceLang,
          code: newCode,
        });
        setDraftStatus("saved");
        setLastSavedTime(`Saved at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`);
      } catch {
        setDraftStatus("offline");
        setLastSavedTime("Offline — saved locally");
      }
    }, 800);
  };

  // 4. Change Practice Language
  const changePracticeLanguage = async (newLang) => {
    setPracticeLang(newLang);
    const starter = selectedProblem?.starterCode?.[newLang] || "";

    // Load draft for new language
    try {
      const draftRes = await fetchProblemDraft(selectedProblemId, newLang);
      if (draftRes.success && draftRes.draft?.code) {
        setPracticeCode(cleanLegacyCode(draftRes.draft.code, starter));
        return;
      }
    } catch { }

    const local = getLocalDraft(selectedProblemId, newLang);
    if (local?.code) {
      setPracticeCode(cleanLegacyCode(local.code, starter));
      return;
    }

    if (starter) {
      setPracticeCode(starter);
    }
  };

  // 5. Run Problem Code (Sample Test Cases)
  const runJudge = async () => {
    if (isJudgeRunning || !selectedProblemId) return;
    setIsJudgeRunning(true);
    setRunResults(null);
    setCustomResult(null);

    try {
      const res = await runJudgeCode(selectedProblemId, {
        language: practiceLang,
        code: practiceCode,
      });
      setRunResults(res);
    } catch (err) {
      setRunResults({
        verdict: "SYSTEM_ERROR",
        error: err.response?.data?.error || err.message || "Failed to execute test cases.",
        testResults: [],
      });
    } finally {
      setIsJudgeRunning(false);
    }
  };

  // 6. Run Custom Input
  const runJudgeCustom = async () => {
    if (isJudgeRunning || !selectedProblemId) return;
    setIsJudgeRunning(true);
    setCustomResult(null);

    try {
      const res = await runJudgeCode(selectedProblemId, {
        language: practiceLang,
        code: practiceCode,
        customInput: customInput || "",
      });
      setCustomResult(res);
    } catch (err) {
      setCustomResult({
        status: "SYSTEM_ERROR",
        output: "",
        error: err.response?.data?.error || err.message,
      });
    } finally {
      setIsJudgeRunning(false);
    }
  };

  // 7. Submit Solution (All Test Cases + Persistent Record)
  const submitJudge = async () => {
    if (isJudgeSubmitting || !selectedProblemId) return;
    setIsJudgeSubmitting(true);
    setSubmissionResult(null);

    try {
      const res = await submitJudgeSolution(selectedProblemId, {
        language: practiceLang,
        code: practiceCode,
      });
      setSubmissionResult(res);

      // Refresh submissions list and problem catalog (to update solved badges)
      const subData = await fetchProblemSubmissions(selectedProblemId);
      if (subData.success) {
        setSubmissionsList(subData.submissions || []);
      }
      reloadProblems();
    } catch (err) {
      setSubmissionResult({
        verdict: "SYSTEM_ERROR",
        score: 0,
        passedTests: 0,
        totalTests: 0,
        error: err.response?.data?.error || err.message || "Submission failed.",
      });
    } finally {
      setIsJudgeSubmitting(false);
    }
  };

  // 8. Restore Code from Previous Submission
  const restorePreviousCode = (submission) => {
    if (!submission?.code) return;
    const confirm = window.confirm(
      `Are you sure you want to restore code from submission #${submission.submissionId}?\nThis will overwrite your current editor draft.`
    );
    if (confirm) {
      if (submission.language) {
        setPracticeLang(submission.language);
      }
      handlePracticeCodeChange(submission.code);
      setActiveSubmissionModal(null);
    }
  };

  // 9. Open Problem into Workspace View
  const openProblem = (problemId) => {
    loadProblem(problemId);
    setPracticeViewMode("workspace");
  };

  // 10. Back to Problem Catalog List View
  const backToProblemCatalog = () => {
    setPracticeViewMode("catalog");
  };

  // 11. Navigate Prev / Next Problem
  const goToPrevProblem = () => {
    if (!problemsList.length) return;
    const currentIndex = problemsList.findIndex((p) => p.id === selectedProblemId);
    if (currentIndex > 0) {
      openProblem(problemsList[currentIndex - 1].id);
    }
  };

  const goToNextProblem = () => {
    if (!problemsList.length) return;
    const currentIndex = problemsList.findIndex((p) => p.id === selectedProblemId);
    if (currentIndex >= 0 && currentIndex < problemsList.length - 1) {
      openProblem(problemsList[currentIndex + 1].id);
    }
  };

  // 12. Pick Random Problem
  const pickRandomProblem = () => {
    if (!problemsList.length) return;
    const randomIndex = Math.floor(Math.random() * problemsList.length);
    openProblem(problemsList[randomIndex].id);
  };

  // 13. Reset Code to Official Starter Code
  const resetPracticeStarterCode = () => {
    if (!selectedProblem) return;
    const starter = selectedProblem.starterCode?.[practiceLang] || "";
    if (window.confirm("Are you sure you want to reset your code to the starter template?")) {
      handlePracticeCodeChange(starter);
    }
  };

  // =========================================================================
  // P0 COMPILER FUNCTIONS (PRESERVED)
  // =========================================================================
  useEffect(() => {
    if (!project) {
      try {
        localStorage.removeItem(ACTIVE_KEY);
      } catch {}
      return;
    }
    const timer = setTimeout(() => {
      const next = { ...project, updatedAt: new Date().toISOString() };
      setProjects((previous) => {
        const exists = previous.some((item) => item.id === next.id);
        const all = exists
          ? previous.map((item) => (item.id === next.id ? next : item))
          : [next, ...previous];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        return all;
      });
      localStorage.setItem(ACTIVE_KEY, project.id);
    }, 500);
    return () => clearTimeout(timer);
  }, [project]);

  const updateCode = useCallback((value) => {
    const newContent = value ?? "";
    setProject((current) => {
      if (!current) return current;
      const ensured = ensureProjectFiles(current);
      const activeId = ensured.activeFileId || ensured.files?.[0]?.id;

      const updatedFiles = (ensured.files || []).map((f) => {
        if (f.id === activeId) {
          return { ...f, content: newContent };
        }
        return f;
      });

      const activeFileObj = updatedFiles.find((f) => f.id === activeId);
      const fileLang = activeFileObj ? getFileLanguage(activeFileObj.name, current.language) : current.language;

      return {
        ...ensured,
        [fileLang]: newContent,
        files: updatedFiles,
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const setLanguage = useCallback((newLang, directFileName = null) => {
    if (!newLang) return;
    if (directFileName) {
      createIndividualFile(directFileName, null, newLang);
    } else {
      openCreateFileDialog(newLang);
    }
  }, [openCreateFileDialog, createIndividualFile]);

  const resetCurrentFile = useCallback(() => {
    setProject((current) => {
      const ensured = ensureProjectFiles(current);
      const targetLang = current.language;
      const starter = starterCode[targetLang] || "";
      const updatedFiles = (ensured.files || []).map((f) =>
        f.id === (ensured.activeFileId || ensured.files[0]?.id) ? { ...f, content: starter } : f
      );
      return {
        ...ensured,
        [targetLang]: starter,
        files: updatedFiles,
      };
    });
  }, []);

  const clearOutput = useCallback(() => {
    setOutput(initialOutput);
  }, []);

  const clearTerminal = useCallback(() => {
    setTerminalHistory([]);
    setActivePrompt("");
    setIsWaitingForInput(false);
    pendingPasteQueueRef.current = [];
  }, []);

  const clearStdin = useCallback(() => {
    setStdin("");
  }, []);

  const createProject = useCallback((name, language = "python") => {
    const next = makeProject(name, language);
    setProject(next);
    setProjectDialogOpen(false);
    showToast(`Project "${next.name}" created.`, "success");
  }, [showToast]);

  const openProject = useCallback((item) => {
    setProject(item);
    setProjectDialogOpen(false);
    showToast(`Opened project "${item.name}".`, "info");
  }, [showToast]);

  const renameProject = useCallback(
    (idOrName, maybeName) => {
      const targetId = maybeName !== undefined ? idOrName : project?.id;
      const finalName = (maybeName !== undefined ? maybeName : idOrName)?.trim() || "Untitled project";

      setProjects((previous) => {
        const updated = previous.map((item) =>
          item.id === targetId ? { ...item, name: finalName, updatedAt: new Date().toISOString() } : item
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });

      setProject((current) =>
        current?.id === targetId ? { ...current, name: finalName, updatedAt: new Date().toISOString() } : current
      );
      showToast(`Renamed project to "${finalName}".`, "success");
    },
    [project?.id, showToast]
  );

  const importProject = useCallback((item) => {
    if (!item?.name || !item?.language) throw new Error("Invalid project structure");
    const next = { ...makeProject(item.name), ...item, id: crypto.randomUUID() };
    setProject(next);
    showToast(`Imported project "${next.name}".`, "success");
  }, [showToast]);

  const importLocalFolder = useCallback((folderName, filesList = []) => {
    if (!filesList || filesList.length === 0) return;
    const cleanFolderName = folderName?.trim() || "Imported Project";

    // Identify entry file
    const entryIdx = filesList.findIndex((f) =>
      /^(main|index|app|solution)\.(py|java|js|jsx|ts|tsx|html|cpp|c)$/i.test(f.name)
    );
    const primaryIdx = entryIdx >= 0 ? entryIdx : 0;

    const formattedFiles = filesList.map((f, idx) => ({
      id: `file-${crypto.randomUUID().substring(0, 8)}`,
      name: f.name,
      content: typeof f.content === "string" ? f.content : "",
      isEntry: idx === primaryIdx,
      isStandalone: false,
    }));

    const mainFile = formattedFiles[primaryIdx];
    const detectedLang = getFileLanguage(mainFile.name, "python");
    const entryId = mainFile.id;

    const newProject = {
      id: crypto.randomUUID(),
      name: cleanFolderName,
      language: detectedLang,
      isSingleFile: false,
      files: formattedFiles,
      activeFileId: entryId,
      openFileIds: [entryId],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProjects((prev) => {
      const updated = [newProject, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setProject(newProject);
    try {
      localStorage.setItem(ACTIVE_KEY, newProject.id);
    } catch {}

    setIsFileExplorerOpen(true);
    showToast(`Imported folder "${cleanFolderName}" (${formattedFiles.length} files).`, "success");
  }, [showToast, setIsFileExplorerOpen]);

  const importLocalFiles = useCallback((filesList = [], targetProjectId = null) => {
    if (!filesList || filesList.length === 0) return;

    const activeProjIsFolder = project && !project.isSingleFile;
    const targetId = targetProjectId || (activeProjIsFolder ? project.id : null);

    if (targetId) {
      // Import into project
      const newFiles = filesList.map((f) => ({
        id: `file-${crypto.randomUUID().substring(0, 8)}`,
        name: f.name,
        content: typeof f.content === "string" ? f.content : "",
        isEntry: false,
        isStandalone: false,
      }));

      setProjects((prev) => {
        const updated = prev.map((p) => {
          if (p.id === targetId) {
            const currentFiles = p.files || [];
            const mergedFiles = [...currentFiles, ...newFiles];
            const newActiveId = newFiles[0]?.id || p.activeFileId;
            const openIds = Array.from(new Set([...(p.openFileIds || []), newActiveId]));
            return {
              ...p,
              files: mergedFiles,
              activeFileId: newActiveId,
              openFileIds: openIds,
              updatedAt: new Date().toISOString(),
            };
          }
          return p;
        });
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setProject((curr) => {
        if (curr.id === targetId) {
          const currentFiles = curr.files || [];
          const mergedFiles = [...currentFiles, ...newFiles];
          const newActiveId = newFiles[0]?.id || curr.activeFileId;
          const openIds = Array.from(new Set([...(curr.openFileIds || []), newActiveId]));
          return {
            ...curr,
            files: mergedFiles,
            activeFileId: newActiveId,
            openFileIds: openIds,
            updatedAt: new Date().toISOString(),
          };
        }
        return curr;
      });

      setIsFileExplorerOpen(true);
      showToast(`Imported ${filesList.length} file(s) into current project.`, "success");
    } else {
      // Import as standalone individual files
      filesList.forEach((f, idx) => {
        const cleanName = f.name;
        const fileLang = getFileLanguage(cleanName, "python");
        const starter = typeof f.content === "string" ? f.content : "";
        const entryId = `file-${crypto.randomUUID().substring(0, 8)}`;
        const newProj = {
          id: crypto.randomUUID(),
          name: cleanName,
          isSingleFile: true,
          language: fileLang,
          ...starterCode,
          [fileLang]: starter,
          activeFileId: entryId,
          openFileIds: [entryId],
          files: [
            { id: entryId, name: cleanName, content: starter, isEntry: true, isStandalone: true }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        if (idx === 0) {
          setProject(newProj);
          try {
            localStorage.setItem(ACTIVE_KEY, newProj.id);
          } catch {}
        }
        setProjects((prev) => {
          const updated = [newProj, ...prev];
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        });
      });

      setIsFileExplorerOpen(true);
      showToast(`Imported ${filesList.length} file(s).`, "success");
    }
  }, [project, showToast, setIsFileExplorerOpen]);

  const deleteProject = useCallback(
    (id) => {
      const targetProj = projects.find((p) => p.id === id);
      const name = targetProj?.name || "this project";
      const confirmed = window.confirm(`Delete project "${name}"?\nThis action cannot be undone.`);
      if (!confirmed) return;

      setProjects((previous) => {
        const remaining = previous.filter((item) => item.id !== id);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
        } catch {}
        if (project?.id === id) {
          const next = remaining[0] || null;
          setProject(next);
          try {
            if (next) {
              localStorage.setItem(ACTIVE_KEY, next.id);
            } else {
              localStorage.removeItem(ACTIVE_KEY);
            }
          } catch {}
        }
        return remaining;
      });
      showToast(`Deleted project "${name}".`, "info");
    },
    [project?.id, projects, showToast]
  );

  const stopExecution = useCallback(() => {
    if (activeSessionRef.current) {
      if (typeof activeSessionRef.current.kill === "function") {
        activeSessionRef.current.kill();
      }
      activeSessionRef.current = null;
    }
    setIsRunning(false);
    setIsWaitingForInput(false);
    setActivePrompt("");
    pendingPasteQueueRef.current = [];
    setOutput((prev) => ({
      ...prev,
      status: "TERMINATED",
      executionStatus: "TERMINATED",
      error: "Execution stopped by user.",
      type: "warning",
      exitCode: 130,
    }));
  }, []);

  const sendTerminalInput = useCallback((value) => {
    if (activeSessionRef.current) {
      if (typeof activeSessionRef.current.sendStdin === "function") {
        activeSessionRef.current.sendStdin(value + "\n");
      }
      setTerminalHistory((prev) => [...prev, `> ${value}`]);
      setActivePrompt("");
      setIsWaitingForInput(false);
    }
  }, []);

  const handleTerminalPaste = useCallback((pastedText) => {
    if (!pastedText) return;
    const lines = pastedText.split(/\r?\n/);
    if (lines.length === 0) return;

    if (activeSessionRef.current) {
      const firstLine = lines[0];
      const remainingLines = lines.slice(1);
      if (typeof activeSessionRef.current.sendStdin === "function") {
        activeSessionRef.current.sendStdin(firstLine + "\n");
      }
      setTerminalHistory((prev) => [...prev, `${activePrompt}${firstLine}`]);
      setActivePrompt("");
      setIsWaitingForInput(false);
      pendingPasteQueueRef.current = remainingLines;
    }
  }, [activePrompt]);

  const runCode = useCallback(async () => {
    if (isRunning) return;

    if (!project) {
      showToast("Please select a language or create a file to run code.", "warning");
      return;
    }

    setIsRunning(true);
    setIsWaitingForInput(false);
    setActivePrompt("");
    clearTerminal();

    const ensured = ensureProjectFiles(project);
    const activeFileObj = ensured.files?.find((f) => f.id === ensured.activeFileId) || ensured.files?.[0];
    const activeFileName = activeFileObj?.name || "";
    const activeFileLang = activeFileObj ? getFileLanguage(activeFileObj.name, null) : project?.language;

    // Validate file extension before execution
    if (!activeFileLang || !RUNNABLE_LANGUAGES.includes(activeFileLang)) {
      const ext = activeFileName.includes(".") ? `.${activeFileName.split(".").pop()}` : "(no extension)";
      const errorMsg = `Execution Error: Cannot execute file '${activeFileName}'. '${ext}' is not a valid runnable file extension.\n\nSupported runnable extensions:\n • Python (.py)\n • Java (.java)\n • JavaScript (.js)\n • HTML (.html)\n • CSS (.css)\n • C++ (.cpp)\n\nPlease create or select a file with a valid extension.`;

      setOutput({
        status: "INVALID_FILE_TYPE",
        compilationStatus: "COMPILATION_ERROR",
        executionStatus: "FAILED",
        output: "",
        error: errorMsg,
        executionTime: 0,
        memoryUsage: null,
        exitCode: 1,
        type: "error",
        value: errorMsg,
      });
      setIsRunning(false);
      return;
    }

    const language = activeFileLang;
    const code = activeFileObj?.content ?? (project && project.language ? project[project.language] : "") ?? "";
    const projectFiles = (ensured.files || []).map((f) => ({
      name: f.name,
      content: f.content,
      isEntry: f.id === activeFileObj?.id || f.isEntry,
    }));

    setOutput({
      status: language === "java" ? "COMPILING" : "RUNNING",
      compilationStatus: language === "java" ? "COMPILING" : null,
      executionStatus: language === "java" ? null : "RUNNING",
      output: "",
      error: null,
      executionTime: null,
      memoryUsage: null,
      exitCode: null,
      type: "loading",
      value: language === "java" ? "Compiling and running..." : "Running program...",
    });

    if (["html", "css"].includes(language)) {
      setOutput({
        status: "SUCCESS",
        compilationStatus: "SUCCESS",
        executionStatus: "SUCCESS",
        output: `${language.toUpperCase()} rendered successfully in preview panel.`,
        error: null,
        executionTime: 0,
        memoryUsage: null,
        exitCode: 0,
        type: "success",
        value: `${language.toUpperCase()} rendered successfully in preview panel.`,
      });
      setIsRunning(false);

      // Post execution metric to monitoring server
      try {
        fetch("/api/compiler/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language, code, files: projectFiles }),
        }).catch(() => {});
      } catch {}
      return;
    }

    let accumulatedOutput = "";
    let accumulatedError = "";

    const session = connectInteractiveSession({
      language,
      code,
      files: projectFiles,
      input: stdin || "",
      onStatus: (status) => {
        setOutput((prev) => ({
          ...prev,
          status: status === "RUNNING" ? "RUNNING" : prev.status,
          executionStatus: status === "RUNNING" ? "RUNNING" : prev.executionStatus,
        }));
      },
      onPrompt: (promptText) => {
        setActivePrompt(promptText || "");
        setIsWaitingForInput(true);
        if (promptText) {
          setTerminalHistory((prev) => [...prev, promptText]);
        }
      },
      onStdout: (text) => {
        accumulatedOutput += text;
        setOutput((prev) => ({
          ...prev,
          output: accumulatedOutput,
          value: accumulatedOutput,
        }));
      },
      onStderr: (text) => {
        accumulatedError += (accumulatedError ? "\n" : "") + text;
        setOutput((prev) => ({
          ...prev,
          error: accumulatedError,
        }));
      },
      onComplete: (result) => {
        setIsRunning(false);
        setIsWaitingForInput(false);
        setActivePrompt("");
        activeSessionRef.current = null;

        const isSuccess = result.status === "SUCCESS" || result.exitCode === 0;
        const finalOutput = result.output || accumulatedOutput || "";
        const finalError = result.error || accumulatedError || null;

        setOutput({
          status: result.status || (isSuccess ? "SUCCESS" : "RUNTIME_ERROR"),
          compilationStatus: result.compilationStatus || (result.status === "COMPILATION_ERROR" ? "COMPILATION_ERROR" : "SUCCESS"),
          executionStatus: result.executionStatus || (isSuccess ? "SUCCESS" : "RUNTIME_ERROR"),
          output: finalOutput,
          error: finalError,
          executionTime: result.executionTime !== undefined ? result.executionTime : null,
          memoryUsage: result.memoryUsage || null,
          exitCode: result.exitCode !== undefined ? result.exitCode : (isSuccess ? 0 : 1),
          type: isSuccess ? "success" : "error",
          value: finalOutput || finalError || "",
        });
      },
      onError: (err) => {
        console.warn("Interactive session WS error, falling back to HTTP execution:", err);
        executeCode(language, code, stdin || "")
          .then((res) => {
            setOutput({
              status: res.status || (res.success ? "SUCCESS" : "SYSTEM_ERROR"),
              compilationStatus: res.compilationStatus,
              executionStatus: res.executionStatus,
              output: res.output || "",
              error: res.error || null,
              executionTime: res.executionTime !== undefined ? res.executionTime : null,
              memoryUsage: res.memoryUsage || null,
              exitCode: res.exitCode !== undefined ? res.exitCode : null,
              type: res.status === "SUCCESS" ? "success" : "error",
              value: res.output || res.error || "",
            });
          })
          .catch((httpErr) => {
            const errMessage = httpErr.response?.data?.error || httpErr.message || "Failed to execute code";
            setOutput({
              status: "SYSTEM_ERROR",
              compilationStatus: null,
              executionStatus: null,
              output: "",
              error: errMessage,
              executionTime: null,
              memoryUsage: null,
              exitCode: 1,
              type: "error",
              value: errMessage,
            });
          })
          .finally(() => {
            setIsRunning(false);
            setIsWaitingForInput(false);
            setActivePrompt("");
            activeSessionRef.current = null;
          });
      },
    });

    activeSessionRef.current = session;
  }, [isRunning, project, clearTerminal, stdin]);

  const runInteractiveCode = runCode;

  const value = {
    // Navigation
    activeNav,
    setActiveNav,

    // P0 Compiler
    projects,
    project,
    setLanguage,
    updateCode,
    resetCurrentFile,
    stdin,
    setStdin,
    clearStdin,
    output,
    clearOutput,
    isRunning,
    runCode,
    runInteractiveCode,
    isProjectDialogOpen,
    setProjectDialogOpen,
    projectDialogMode,
    setProjectDialogMode,
    projectDialogLang,
    setProjectDialogLang,
    openCreateFileDialog,
    createProject,
    openProject,
    renameProject,
    importProject,
    importLocalFolder,
    importLocalFiles,
    deleteProject,
    terminalHistory,
    activePrompt,
    isWaitingForInput,
    sendTerminalInput,
    handleTerminalPaste,
    clearTerminal,
    stopExecution,

    // P2 DX & Multi-File
    theme,
    setTheme,
    toast,
    showToast,
    editorSettings,
    updateEditorSettings,
    isFullscreen,
    toggleFullscreen,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    isSettingsOpen,
    // Profile, Notifications & Settings
    profile,
    updateProfile,
    activityStats,
    recordActivity,
    problemsSolvedCount,
    notifications,
    unreadCount,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    compilerSettings,
    updateCompilerSettings,
    notificationSettings,
    updateNotificationSettings,
    accentColor,
    setAccentColor,
    resetPreferences,

    setSettingsOpen,
    targetErrorLine,
    jumpToErrorLine,
    activeFile,
    addProjectFile,
    deleteProjectFile,
    renameProjectFile,
    selectProjectFile,
    closeEditorTab,
    isFileExplorerOpen,
    setIsFileExplorerOpen,
    isAddingFile,
    setIsAddingFile,
    openNewFileInput,
    createIndividualFile,
    switchToFile,

    // P1 Online Judge
    problemsList,
    practiceViewMode,
    setPracticeViewMode,
    selectedProblemId,
    selectedProblem,
    practiceLang,
    changePracticeLanguage,
    practiceCode,
    handlePracticeCodeChange,
    draftStatus,
    lastSavedTime,
    loadProblem,
    openProblem,
    backToProblemCatalog,
    goToPrevProblem,
    goToNextProblem,
    pickRandomProblem,
    resetPracticeStarterCode,
    reloadProblems,
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
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) throw new Error("useEditor must be used inside EditorProvider");
  return context;
}


