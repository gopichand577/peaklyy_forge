export const languageMeta = {
  python: { label: "Python", extension: "py", icon: "Py", badgeColor: "#387eb8" },
  java: { label: "Java", extension: "java", icon: "Ja", badgeColor: "#e76f00" },
  javascript: { label: "JavaScript", extension: "js", icon: "JS", badgeColor: "#f7df1e" },
  html: { label: "HTML", extension: "html", icon: "<>", badgeColor: "#e44d26" },
  css: { label: "CSS", extension: "css", icon: "#", badgeColor: "#264de4" },
};

export const RUNNABLE_LANGUAGES = ["python", "java", "javascript", "html", "css", "cpp"];

export const getFileLanguage = (fileName = "", defaultLang = "python") => {
  if (!fileName || typeof fileName !== "string") return defaultLang || "plaintext";
  const hasExt = fileName.includes(".") && !fileName.endsWith(".");
  if (!hasExt) return defaultLang || "plaintext";
  const ext = fileName.split(".").pop().toLowerCase();
  switch (ext) {
    case "py":
      return "python";
    case "java":
      return "java";
    case "js":
    case "mjs":
    case "cjs":
    case "jsx":
    case "ts":
    case "tsx":
      return "javascript";
    case "html":
    case "htm":
      return "html";
    case "css":
      return "css";
    case "json":
      return "json";
    case "md":
      return "markdown";
    case "sql":
      return "sql";
    case "cpp":
    case "c":
    case "cc":
    case "cxx":
    case "h":
    case "hpp":
      return "cpp";
    default:
      return "plaintext";
  }
};

export const starterCode = {
  python: `def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()
`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
  javascript: `function main() {
    console.log("Hello, World!");
}

main();
`,
  html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Peaklyy Forge</title>
</head>
<body>

    <h1>Hello, World!</h1>

</body>
</html>
`,
  css: `body {
    margin: 0;
    font-family: Arial, sans-serif;
}

h1 {
    color: #ff3b4a;
}
`,
};

export const initialOutput = {
  status: "IDLE",
  output: "Your program output will appear here.",
  error: null,
  executionTime: null,
  memoryUsage: null,
  exitCode: null,
  type: "idle",
  value: "Your program output will appear here.",
};
