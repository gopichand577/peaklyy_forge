import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_COMPILER_API_URL || "http://localhost:5000/api",
  timeout: 30000,
});

// P0 Compiler Execution
export const executeCode = async (language, code, input = "") => {
  const response = await client.post("/compiler/run", { language, code, input, stdin: input });
  return response.data;
};

// P1 Online Judge APIs
export const fetchProblems = async (params = {}) => {
  const response = await client.get("/judge/problems", { params });
  return response.data;
};

export const fetchProblem = async (id) => {
  const response = await client.get(`/judge/problems/${id}`);
  return response.data;
};

export const runJudgeCode = async (problemId, { language, code, customInput }) => {
  const response = await client.post(`/judge/problems/${problemId}/run`, {
    language,
    code,
    customInput,
  });
  return response.data;
};

export const submitJudgeSolution = async (problemId, { language, code }) => {
  const response = await client.post(`/judge/problems/${problemId}/submit`, {
    language,
    code,
  });
  return response.data;
};

export const fetchProblemSubmissions = async (problemId) => {
  const response = await client.get(`/judge/problems/${problemId}/submissions`);
  return response.data;
};

export const fetchSubmissionDetail = async (submissionId) => {
  const response = await client.get(`/judge/submissions/${submissionId}`);
  return response.data;
};

export const fetchProblemDraft = async (problemId, language) => {
  const response = await client.get(`/judge/problems/${problemId}/draft`, {
    params: { language },
  });
  return response.data;
};

export const saveProblemDraft = async (problemId, { language, code }) => {
  const response = await client.post(`/judge/problems/${problemId}/draft`, {
    language,
    code,
  });
  return response.data;
};

export const fetchMonitoringMetrics = async () => {
  const response = await client.get("/monitoring/metrics");
  return response.data;
};
