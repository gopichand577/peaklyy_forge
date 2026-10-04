/**
 * Peaklyy Forge - Monaco Editor Dark Crimson Theme Definition
 * Matches the cyberpunk/forge syntax coloring exactly:
 * - Keywords (def, class, for, in, if, return): Magenta/Pink #ff79c6
 * - Functions & Classes (twoSum, Solution): Gold/Yellow #f1fa8c
 * - Parameters & Types: Cyan/Sky Blue #8be9fd / #61afef
 * - Numbers: Purple #bd93f9
 * - Comments: Muted slate #64748b italic
 * - Background: Dark Obsidian #0e0d13
 */

export const defineMonacoTheme = (monaco) => {
  if (!monaco?.editor) return;
  monaco.editor.defineTheme("peaklyy-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "64748b", fontStyle: "italic" },
      { token: "keyword", foreground: "ff79c6" },
      { token: "keyword.python", foreground: "ff79c6" },
      { token: "keyword.control", foreground: "ff79c6" },
      { token: "string", foreground: "50fa7b" },
      { token: "number", foreground: "bd93f9" },
      { token: "identifier", foreground: "f8fafc" },
      { token: "variable", foreground: "f8fafc" },
      { token: "variable.parameter", foreground: "8be9fd" },
      { token: "function", foreground: "f1fa8c" },
      { token: "entity.name.function", foreground: "f1fa8c" },
      { token: "type", foreground: "8be9fd" },
      { token: "class", foreground: "f1fa8c" },
      { token: "delimiter", foreground: "e2e8f0" },
      { token: "operator", foreground: "ff79c6" },
    ],
    colors: {
      "editor.background": "#0e0d13",
      "editor.foreground": "#f8fafc",
      "editor.lineHighlightBackground": "#161520",
      "editorLineNumber.foreground": "#4b5563",
      "editorLineNumber.activeForeground": "#ef4444",
      "editorCursor.foreground": "#ef4444",
      "editor.selectionBackground": "#ef444433",
      "editor.inactiveSelectionBackground": "#ef44441a",
      "editorGutter.background": "#0e0d13",
    },
  });
};
