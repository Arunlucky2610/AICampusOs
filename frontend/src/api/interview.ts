import { api } from "./client";

export interface StartInterviewRequest {
  role: string;
  skills?: string[];
  interview_type?: string;
}

export interface StartInterviewResponse {
  session_id: number;
  question: InterviewQuestion;
  question_number: number;
  total_questions: number;
}

export interface InterviewQuestion {
  id: number;
  type: string;
  question: string;
  expected_keywords?: string[];
  difficulty?: string;
  category?: string;
}

export interface AnswerRequest {
  session_id: number;
  answer_text: string;
  question_number: number;
}

export interface AnswerResponse {
  next_question: InterviewQuestion | null;
  question_number: number;
  total_questions: number;
  is_complete: boolean;
  question_score: number;
  question_feedback: string;
}

export interface ResumeResponse {
  session_id: number;
  status: string;
  question_number: number;
  total_questions: number;
  next_question: InterviewQuestion | null;
  is_complete: boolean;
}

export interface AnalyzeResponse {
  session_id: number;
  analysis: InterviewAnalysis;
  score: number;
  feedback: string | null;
}

export interface InterviewAnalysis {
  communicationScore: number;
  confidenceScore: number;
  clarityScore: number;
  technicalScore: number;
  projectKnowledgeScore: number;
  grammarFeedback: string;
  strengths: string[];
  weaknesses: string[];
  exactWeakAreas: string[];
  idealAnswer: string;
  followUpQuestion: string;
  improvementPlan: string[];
  finalVerdict: string;
}

export interface SessionStatus {
  session_id: number;
  role_applied_for: string | null;
  status: string;
  interview_type: string;
  questions: InterviewQuestion[];
  answers: any[];
  transcripts: string[];
  recording_urls: string[];
  analysis: InterviewAnalysis | null;
  score: number | null;
  feedback: string | null;
  started_at: string;
  ended_at: string | null;
}

export interface SessionListItem {
  session_id: number;
  role: string | null;
  status: string;
  score: number | null;
  question_count: number;
  answer_count: number;
  started_at: string | null;
  ended_at: string | null;
}

export async function startInterview(data: StartInterviewRequest): Promise<StartInterviewResponse> {
  const res = await api.post("/mock-interview/start", data, { timeout: 8000 });
  return res.data;
}

export async function submitAnswer(data: AnswerRequest): Promise<AnswerResponse> {
  const res = await api.post("/mock-interview/answer", data, { timeout: 8000 });
  return res.data;
}

export async function analyzeInterview(session_id: number): Promise<AnalyzeResponse> {
  const res = await api.post("/ai/mock/analyze", { session_id });
  return res.data;
}

export async function uploadRecording(
  session_id: number,
  question_number: number,
  blob: Blob,
  filename: string = "recording.webm"
): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append("file", blob, filename);
  const res = await api.post(
    `/ai/mock/upload-recording?session_id=${session_id}&question_number=${question_number}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}

export async function getSessionStatus(session_id: number): Promise<SessionStatus> {
  const res = await api.get(`/ai/mock/session/${session_id}`);
  return res.data;
}

export async function listSessions(): Promise<SessionListItem[]> {
  const res = await api.get("/ai/mock/sessions");
  return res.data;
}

export async function resumeSession(session_id: number): Promise<ResumeResponse> {
  const res = await api.post(`/ai/mock/resume?session_id=${session_id}`);
  return res.data;
}

export async function transcribeAudio(blob: Blob, filename = "audio.webm"): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", blob, filename);
  try {
    const res = await api.post("/ai/mock/transcribe", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30000,
    });
    return res.data.text;
  } catch {
    return null;
  }
}

export async function synthesizeSpeech(text: string, signal?: AbortSignal): Promise<Blob | null> {
  try {
    const res = await api.post(`/ai/mock/synthesize?text=${encodeURIComponent(text)}`, null, {
      responseType: "blob",
      timeout: 15000,
      signal,
    });
    return res.data;
  } catch {
    return null;
  }
}
