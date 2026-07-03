import { api } from "./client";

export interface ResumeAnalysisResult {
  atsScore?: number;
  resumeStrengthScore?: number;
  skillsMatch?: number;
  projectImpact?: number;
  experienceQuality?: number;
  missingKeywords?: string[];
  weakSections?: string[];
  corrections?: string[];
  improvedSummary?: string;
  strengths?: string[];
  weaknesses?: string[];
  evidenceFromData?: string[];
  exactWeakAreas?: string[];
  improvementPlan?: string[];
  nextActions?: string[];
  missingData?: string[];
  error?: string;
  error_type?: string;
}

export interface GitHubProjectAnalysisResult {
  projectScore?: number;
  repoQuality?: number;
  commitConsistency?: number;
  readmeQuality?: number;
  techStackDepth?: number;
  projectKnowledge?: number;
  strengths?: string[];
  weaknesses?: string[];
  exactWeakAreas?: string[];
  improvementPlan?: string[];
  nextActions?: string[];
  evidenceFromData?: string[];
}

export interface LinkedInAnalysisResult {
  profile_completeness?: number;
  headline_score?: number;
  about_section_feedback?: string;
  skill_endorsements?: string;
  recommendations?: string;
}

export interface LeetCodeAnalysisResult {
  codingScore?: number;
  dsaReadinessScore?: number;
  easyMediumHardBalance?: { easy_pct?: number; medium_pct?: number; hard_pct?: number };
  strongTopics?: string[];
  weakTopics?: string[];
  consistency?: number;
  problemSolvingLevel?: number;
  placementCodingReadiness?: number;
  exactWeakAreas?: string[];
  improvementPlan?: string[];
  nextActions?: string[];
  evidenceFromData?: string[];
  missingData?: string[];
}

export interface CareerCopilotResult {
  recommended_roles?: Array<{
    title: string;
    match_percentage: number;
    top_companies: string[];
    missing_skills: string[];
    expected_salary?: string;
    difficulty?: string;
  }>;
  skill_gaps?: Array<{
    skill: string;
    current: number;
    target: number;
    priority?: string;
  }>;
  suggested_courses?: Array<{
    title: string;
    platform: string;
    url: string;
  }>;
  next_steps?: string[];
  learning_roadmap?: Array<{
    priority: "High" | "Medium" | "Low";
    task: string;
    difficulty: string;
    eta: string;
    resource: string;
    progress: number;
    status: "pending" | "in_progress" | "completed";
  }>;
}

export interface CodingProgressResult {
  github_username?: string;
  leetcode_username?: string;
  github_stats?: {
    public_repos?: number;
    followers?: number;
    following?: number;
    languages?: Record<string, number>;
    avatar_url?: string;
    profile_url?: string;
    recent_repos?: Array<{ name: string; language?: string; stars?: number }>;
    recent_activity_count?: number;
  };
  leetcode_stats?: {
    total_solved?: number;
    easy_solved?: number;
    medium_solved?: number;
    hard_solved?: number;
    contest_rating?: number;
    ranking?: number;
    reputation?: number;
  };
  linkedin_profile?: {
    headline?: string;
    about?: string;
    skills?: string;
    profile_strength?: number;
    open_to_work?: boolean;
  };
  coding_score?: number;
  placement_readiness_score?: number;
}

export interface DashboardResult {
  overall?: {
    successScore?: number;
    placementReadiness?: number;
    academicRisk?: string;
    aiConfidence?: number;
    nextBestAction?: string;
  };
  placementReadiness?: {
    resumeQuality?: number;
    mockInterviewScore?: number;
    technicalSkills?: number;
    communication?: number;
    projectStrength?: number;
  };
  charts?: {
    skillGap?: Array<{ skill: string; current: number; target: number }>;
    skillRadar?: Array<{ skill: string; score: number }>;
  };
  roadmap?: Array<{ step: string; completed: number; status: string }>;
  recommendations?: Array<{ title: string; priority: string; reason: string; action: string }>;
}

export interface MockInterviewResult {
  session_id?: number;
  score?: number;
  analysis?: {
    communicationScore?: number;
    confidenceScore?: number;
    clarityScore?: number;
    technicalScore?: number;
    projectKnowledgeScore?: number;
    strengths?: string[];
    weaknesses?: string[];
    improvementPlan?: string[];
    finalVerdict?: string;
  };
  feedback?: string;
}

export interface CareerIntelligenceState {
  profile: any;
  resumeAnalysis: ResumeAnalysisResult;
  gitHubAnalysis: GitHubProjectAnalysisResult;
  linkedInAnalysis: LinkedInAnalysisResult;
  leetCodeAnalysis: LeetCodeAnalysisResult;
  careerCopilot: CareerCopilotResult;
  codingProgress: CodingProgressResult | null;
  dashboard: DashboardResult | null;
  mockInterview: MockInterviewResult | null;
}

export async function fetchLatestAnalysis<T>(moduleType: string): Promise<T | null> {
  try {
    const res = await api.get<T>(`/ai/latest/${moduleType}`);
    return res.data;
  } catch {
    return null;
  }
}

export async function runAIModule<T>(moduleType: string): Promise<T | null> {
  try {
    const res = await api.post<T>(`/ai/run/${moduleType}`);
    return res.data;
  } catch {
    return null;
  }
}

export async function fetchCodingProgress(): Promise<CodingProgressResult | null> {
  try {
    const res = await api.get<CodingProgressResult>("/student/coding-progress");
    return res.data;
  } catch {
    return null;
  }
}

export async function fetchDashboard(): Promise<DashboardResult | null> {
  try {
    const res = await api.get<DashboardResult>("/student/dashboard");
    return res.data;
  } catch {
    return null;
  }
}

export async function fetchLatestMockInterview(): Promise<MockInterviewResult | null> {
  try {
    const sessions = await api.get<Array<{ session_id: number; score?: number }>>("/ai/mock/sessions");
    const latest = sessions.data?.[0];
    if (!latest?.session_id) return null;
    const session = await api.get<any>(`/ai/mock/session/${latest.session_id}`);
    const d = session.data;
    return {
      session_id: d.session_id,
      score: d.score,
      analysis: d.analysis,
      feedback: d.feedback,
    };
  } catch {
    return null;
  }
}

export async function fetchAllCareerData(): Promise<CareerIntelligenceState> {
  const [resume, github, linkedin, leetcode, career, coding, dash, interview] = await Promise.all([
    fetchLatestAnalysis<ResumeAnalysisResult>("resume_analyzer"),
    fetchLatestAnalysis<GitHubProjectAnalysisResult>("github_project_analyzer"),
    fetchLatestAnalysis<LinkedInAnalysisResult>("linkedin_analyzer"),
    fetchLatestAnalysis<LeetCodeAnalysisResult>("leetcode_analyzer"),
    fetchLatestAnalysis<CareerCopilotResult>("career_copilot"),
    fetchCodingProgress(),
    fetchDashboard(),
    fetchLatestMockInterview(),
  ]);
  return {
    profile: null,
    resumeAnalysis: resume || {},
    gitHubAnalysis: github || {},
    linkedInAnalysis: linkedin || {},
    leetCodeAnalysis: leetcode || {},
    careerCopilot: career || {},
    codingProgress: coding,
    dashboard: dash,
    mockInterview: interview,
  };
}

export async function runAllModules(
  onProgress: (label: string) => void,
): Promise<CareerIntelligenceState> {
  const modules: Array<{ key: keyof CareerIntelligenceState; label: string; type: string; isModule: boolean }> = [
    { key: "resumeAnalysis" as any, label: "Resume Analysis", type: "resume_analyzer", isModule: true },
    { key: "gitHubAnalysis" as any, label: "GitHub Analysis", type: "github_project_analyzer", isModule: true },
    { key: "linkedInAnalysis" as any, label: "LinkedIn Analysis", type: "linkedin_analyzer", isModule: true },
    { key: "leetCodeAnalysis" as any, label: "Coding Analysis", type: "leetcode_analyzer", isModule: true },
    { key: "careerCopilot" as any, label: "Career Copilot", type: "career_copilot", isModule: true },
  ];
  const state: CareerIntelligenceState = {
    profile: null,
    resumeAnalysis: {},
    gitHubAnalysis: {},
    linkedInAnalysis: {},
    leetCodeAnalysis: {},
    careerCopilot: {},
    codingProgress: null,
    dashboard: null,
    mockInterview: null,
  };
  for (const mod of modules) {
    onProgress(mod.label);
    if (mod.isModule) {
      const res = await runAIModule<any>(mod.type);
      if (res) (state as any)[mod.key] = res;
    }
  }
  onProgress("Coding Progress");
  state.codingProgress = await fetchCodingProgress();
  onProgress("Dashboard");
  state.dashboard = await fetchDashboard();
  onProgress("Interview Data");
  state.mockInterview = await fetchLatestMockInterview();
  return state;
}
