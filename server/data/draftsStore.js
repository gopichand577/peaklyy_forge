/**
 * Peaklyy Forge - Drafts Storage Layer (P1 Online Judge)
 *
 * Persists and retrieves draft solutions per problem and language.
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "temp", "data");
const DRAFTS_FILE = path.join(DATA_DIR, "drafts.json");

let draftsMap = {};

function initStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DRAFTS_FILE)) {
      const data = fs.readFileSync(DRAFTS_FILE, "utf-8");
      draftsMap = JSON.parse(data || "{}");
    } else {
      draftsMap = {};
      fs.writeFileSync(DRAFTS_FILE, JSON.stringify({}, null, 2));
    }
  } catch {
    draftsMap = {};
  }
}

initStore();

function persist() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DRAFTS_FILE, JSON.stringify(draftsMap, null, 2));
  } catch (err) {
    console.error("Failed to persist drafts to file:", err);
  }
}

function saveDraft(problemId, language, code) {
  const key = `${problemId}:${language}`;
  const record = {
    problemId,
    language,
    code,
    lastEditedAt: new Date().toISOString(),
  };

  draftsMap[key] = record;
  persist();
  return record;
}

function getDraft(problemId, language) {
  const key = `${problemId}:${language}`;
  return draftsMap[key] || null;
}

module.exports = {
  saveDraft,
  getDraft,
};
