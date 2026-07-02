import { api } from "./client";

export interface TutorAskRequest {
  subject: string;
  topic: string;
  question: string;
}

export interface TutorAskResponse {
  answer: string;
  examples: string[];
  related_topics: string[];
  difficulty_assessment: string;
  suggested_resources: string[];
}

export interface TutorExplainRequest {
  subject: string;
  topic: string;
  mode: "simple" | "advanced";
}

export interface TutorExplainResponse {
  explanation: string;
  examples: string[];
  analogies: string[];
  formulas: string[];
  code_examples: string[];
  key_takeaways: string[];
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
  questions: QuizQuestion[];
  total_questions: number;
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
  score: number;
  total: number;
  percentage: number;
  per_question_feedback: PerQuestionFeedback[];
  weak_topics: string[];
  strong_topics: string[];
  recommendations: string[];
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
  plan: StudyPlanDay[];
  total_hours: number;
  exam_strategy: string;
  prerequisites: string[];
  tips: string[];
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

export async function askDoubt(data: TutorAskRequest): Promise<TutorAskResponse> {
  const res = await api.post("/ai/tutor/ask", data);
  return res.data;
}

export async function explainTopic(data: TutorExplainRequest): Promise<TutorExplainResponse> {
  const res = await api.post("/ai/tutor/explain", data);
  return res.data;
}

export async function generateQuiz(data: TutorQuizRequest): Promise<TutorQuizResponse> {
  const res = await api.post("/ai/tutor/quiz", data);
  return res.data;
}

export async function evaluateQuiz(data: TutorEvaluateQuizRequest): Promise<TutorEvaluateQuizResponse> {
  const res = await api.post("/ai/tutor/evaluate-quiz", data);
  return res.data;
}

export async function createStudyPlan(data: TutorStudyPlanRequest): Promise<TutorStudyPlanResponse> {
  const res = await api.post("/ai/tutor/study-plan", data);
  return res.data;
}

export async function getTutorHistory(limit: number = 50): Promise<TutorHistoryResponse> {
  const res = await api.get(`/ai/tutor/history?limit=${limit}`);
  return res.data;
}
