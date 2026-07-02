import { api } from "./client";

export interface ResumeAnalysisResult {
  atsScore: number;
  resumeStrengthScore: number;
  skillsMatch: number;
  projectImpact: number;
  experienceQuality: number;
  missingKeywords: string[];
  weakSections: string[];
  corrections: string[];
  improvedSummary: string;
  strengths: string[];
  weaknesses: string[];
  evidenceFromData: string[];
  exactWeakAreas: string[];
  improvementPlan: string[];
  nextActions: string[];
  missingData: string[];
}

export interface UploadResponse {
  resume_url: string;
  resume_text_length: number;
  message: string;
}

export async function uploadResume(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("resume", file);
  const res = await api.post<UploadResponse>("/student/resume/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });
  return res.data;
}

export async function runResumeAnalyzer(): Promise<ResumeAnalysisResult> {
  const res = await api.post<ResumeAnalysisResult>("/ai/run/resume_analyzer");
  return res.data;
}

export async function getLatestResumeAnalysis(): Promise<ResumeAnalysisResult | null> {
  try {
    const res = await api.get<ResumeAnalysisResult>("/ai/latest/resume_analyzer");
    return res.data;
  } catch {
    return null;
  }
}
