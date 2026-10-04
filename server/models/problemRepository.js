/**
 * Peaklyy Forge - Problem Repository (P1 Online Judge)
 *
 * Enforces data access rules and security boundaries:
 * - Public APIs receive problems with sample test cases ONLY.
 * - Hidden test cases are NEVER exposed over public APIs or responses.
 */

const { PROBLEMS_DATA } = require("../data/problems");
const { getSolvedProblemIds, getSubmissionsByProblem } = require("../data/submissionsStore");

function getProblemRealStats(problemId) {
  const subs = getSubmissionsByProblem(problemId) || [];
  const prob = PROBLEMS_DATA.find((p) => p.id === problemId);
  if (subs.length === 0) {
    return {
      solvesCount: prob?.solvesCount || 0,
      acceptanceRate: prob?.acceptanceRate || null,
      totalSubmissions: prob?.solvesCount ? 1 : 0,
    };
  }
  const accepted = subs.filter((s) => s.verdict === "ACCEPTED").length;
  const rate = Math.round((accepted / subs.length) * 100);
  return {
    solvesCount: accepted > 0 ? accepted : (prob?.solvesCount || 0),
    acceptanceRate: rate > 0 ? `${rate}%` : (prob?.acceptanceRate || null),
    totalSubmissions: subs.length,
  };
}

function getAllProblems(query = {}) {
  const { search, difficulty, topic, status } = query;
  const solvedIds = getSolvedProblemIds();

  return PROBLEMS_DATA.map((p) => {
    const isSolved = solvedIds.has(p.id);
    const stats = getProblemRealStats(p.id);

    return {
      id: p.id,
      problemNumber: p.problemNumber,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      topics: p.topics,
      solvesCount: stats.solvesCount,
      acceptanceRate: stats.acceptanceRate,
      totalSubmissions: stats.totalSubmissions,
      isSolved,
      supportedLanguages: p.supportedLanguages,
    };
  }).filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchNum = String(p.problemNumber) === q;
      const matchId = p.id.toLowerCase().includes(q);
      const matchTopic = p.topics?.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchNum && !matchId && !matchTopic) return false;
    }

    if (difficulty && difficulty !== "All") {
      if (p.difficulty.toLowerCase() !== difficulty.toLowerCase()) return false;
    }

    if (topic && topic !== "All") {
      if (!p.topics?.some((t) => t.toLowerCase() === topic.toLowerCase())) return false;
    }

    if (status && status !== "All") {
      if (status === "Solved" && !p.isSolved) return false;
      if (status === "Unsolved" && p.isSolved) return false;
    }

    return true;
  });
}

function getPublicProblemById(id) {
  const problem = PROBLEMS_DATA.find((p) => p.id === id || String(p.problemNumber) === String(id));
  if (!problem) return null;

  const solvedIds = getSolvedProblemIds();
  const stats = getProblemRealStats(problem.id);

  // Create public clone - HIDDEN TEST CASES ARE STRICTLY OMITTED!
  return {
    id: problem.id,
    problemNumber: problem.problemNumber,
    title: problem.title,
    slug: problem.slug,
    difficulty: problem.difficulty,
    topics: problem.topics,
    solvesCount: stats.solvesCount,
    acceptanceRate: stats.acceptanceRate,
    totalSubmissions: stats.totalSubmissions,
    description: problem.description,
    inputFormat: problem.inputFormat,
    outputFormat: problem.outputFormat,
    constraints: problem.constraints,
    examples: problem.examples,
    starterCode: problem.starterCode,
    supportedLanguages: problem.supportedLanguages,
    sampleTestCases: problem.sampleTestCases.map((tc) => ({
      id: tc.id,
      title: tc.title,
      input: tc.input,
      expected: tc.expected,
    })),
    timeLimit: problem.timeLimit,
    memoryLimit: problem.memoryLimit,
    isSolved: solvedIds.has(problem.id) || !!problem.isSolved,
  };
}

function getProblemInternal(id) {
  return PROBLEMS_DATA.find((p) => p.id === id || String(p.problemNumber) === String(id)) || null;
}

module.exports = {
  getAllProblems,
  getPublicProblemById,
  getProblemInternal,
};
