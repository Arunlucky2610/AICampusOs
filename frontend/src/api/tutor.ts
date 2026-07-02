import { api, apiBaseUrl } from "./client";

export interface TutorAskRequest {
  subject: string;
  topic: string;
  question: string;
}

export interface TutorAskResponse {
  answer: string;
  explanation: string;
  summary: string;
  examples: string[];
  key_points: string[];
  next_steps: string[];
  related_topics: string[];
  difficulty_assessment: string;
  suggested_resources: string[];
  error: string | null;
}

export interface TutorExplainRequest {
  subject: string;
  topic: string;
  mode: "simple" | "advanced";
}

export interface TutorExplainResponse {
  answer: string;
  explanation: string;
  summary: string;
  examples: string[];
  key_points: string[];
  next_steps: string[];
  analogies: string[];
  formulas: string[];
  code_examples: string[];
  key_takeaways: string[];
  error: string | null;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation: string;
  difficulty: string;
}

export interface TutorQuizRequest {
  subject: string;
  topic: string;
  question_count: number;
  difficulty: string;
}

export interface TutorQuizResponse {
  answer: string;
  explanation: string;
  summary: string;
  examples: string[];
  key_points: string[];
  next_steps: string[];
  questions: QuizQuestion[];
  total_questions: number;
  error: string | null;
}

export interface QuizAnswerPayload {
  question_id: number;
  question: string;
  selected_answer: string;
  correct_answer: string;
}

export interface TutorEvaluateQuizRequest {
  subject: string;
  topic: string;
  answers: QuizAnswerPayload[];
}

export interface PerQuestionFeedback {
  question_id: number;
  correct: boolean;
  feedback: string;
}

export interface TutorEvaluateQuizResponse {
  answer: string;
  explanation: string;
  summary: string;
  examples: string[];
  key_points: string[];
  next_steps: string[];
  score: number;
  total: number;
  percentage: number;
  per_question_feedback: PerQuestionFeedback[];
  weak_topics: string[];
  strong_topics: string[];
  recommendations: string[];
  error: string | null;
}

export interface StudyPlanDay {
  day: number;
  topics: string[];
  duration_hours: number;
  activities: string[];
  resources: string[];
}

export interface TutorStudyPlanRequest {
  subject: string;
  exam_date: string;
  duration_days: 7 | 30;
}

export interface TutorStudyPlanResponse {
  answer: string;
  explanation: string;
  summary: string;
  examples: string[];
  key_points: string[];
  next_steps: string[];
  plan: StudyPlanDay[];
  total_hours: number;
  exam_strategy: string;
  prerequisites: string[];
  tips: string[];
  error: string | null;
}

export interface TutorHistoryItem {
  id: number;
  session_type: string;
  subject: string | null;
  topic: string | null;
  question: string | null;
  answer: Record<string, any> | null;
  created_at: string;
}

export interface TutorHistoryResponse {
  history: TutorHistoryItem[];
}

export async function askDoubt(data: TutorAskRequest, useFallback?: boolean): Promise<TutorAskResponse> {
  const res = await api.post("/ai/tutor/ask", data, { params: useFallback ? { model: "fallback" } : {} });
  return res.data;
}

export async function explainTopic(data: TutorExplainRequest, useFallback?: boolean): Promise<TutorExplainResponse> {
  const res = await api.post("/ai/tutor/explain", data, { params: useFallback ? { model: "fallback" } : {} });
  return res.data;
}

export async function generateQuiz(data: TutorQuizRequest, useFallback?: boolean): Promise<TutorQuizResponse> {
  const res = await api.post("/ai/tutor/quiz", data, { params: useFallback ? { model: "fallback" } : {} });
  return res.data;
}

export async function evaluateQuiz(data: TutorEvaluateQuizRequest, useFallback?: boolean): Promise<TutorEvaluateQuizResponse> {
  const res = await api.post("/ai/tutor/evaluate-quiz", data, { params: useFallback ? { model: "fallback" } : {} });
  return res.data;
}

export async function createStudyPlan(data: TutorStudyPlanRequest, useFallback?: boolean): Promise<TutorStudyPlanResponse> {
  const res = await api.post("/ai/tutor/study-plan", data, { params: useFallback ? { model: "fallback" } : {} });
  return res.data;
}

export async function getTutorHistory(limit: number = 50): Promise<TutorHistoryResponse> {
  const res = await api.get(`/ai/tutor/history?limit=${limit}`);
  return res.data;
}

// ── Streaming ────────────────────────────────────────────────────────────────────

export async function askDoubtStream(
  data: TutorAskRequest,
  onToken: (token: string) => void,
  onResult: (result: any) => void,
  onError: (error: string) => void,
  signal?: AbortSignal,
  useFallback?: boolean,
): Promise<void> {
  const token = localStorage.getItem("access_token");
  const url = `${apiBaseUrl}/ai/tutor/ask/stream${useFallback ? "?model=fallback" : ""}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(data),
      signal,
    });
    if (!res.ok) { onError(`HTTP ${res.status}`); return; }
    const reader = res.body?.getReader();
    if (!reader) { onError("No response body"); return; }
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") return;
        try {
          const evt = JSON.parse(raw);
          if (evt.type === "token") onToken(evt.content);
          else if (evt.type === "result") onResult(evt.content);
          else if (evt.type === "error") onError(evt.content);
        } catch { /* skip malformed */ }
      }
    }
  } catch (err: any) {
    if (err.name !== "AbortError") onError(err.message || "Stream error");
  }
}

export async function explainTopicStream(
  data: TutorExplainRequest,
  onToken: (token: string) => void,
  onResult: (result: any) => void,
  onError: (error: string) => void,
  signal?: AbortSignal,
  useFallback?: boolean,
): Promise<void> {
  const tokenStr = localStorage.getItem("access_token");
  const url = `${apiBaseUrl}/ai/tutor/explain/stream${useFallback ? "?model=fallback" : ""}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(tokenStr ? { Authorization: `Bearer ${tokenStr}` } : {}) },
      body: JSON.stringify(data),
      signal,
    });
    if (!res.ok) { onError(`HTTP ${res.status}`); return; }
    const reader = res.body?.getReader();
    if (!reader) { onError("No response body"); return; }
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") return;
        try {
          const evt = JSON.parse(raw);
          if (evt.type === "token") onToken(evt.content);
          else if (evt.type === "result") onResult(evt.content);
          else if (evt.type === "error") onError(evt.content);
        } catch { /* skip malformed */ }
      }
    }
  } catch (err: any) {
    if (err.name !== "AbortError") onError(err.message || "Stream error");
  }
}
