import { createContext, ReactNode, useContext, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";
import type { Dashboard, StudentProfile } from "../types";
import type { CompanyData, StudentEligibilityResult } from "../types/placement";
import { normalizeStudentProfile, toProfileApiPayload } from "../utils/profile";

type ProfileCompletion = {
  percent: number;
  missing: string[];
};

type StudentProfileContextValue = {
  profile: StudentProfile | null;
  dashboard: Dashboard | null;
  intelligence: PlacementIntelligence | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  updateProfile: (data: Partial<StudentProfile>) => Promise<StudentProfile>;
  isUpdating: boolean;
  completion: ProfileCompletion;
};

export type PlacementIntelligence = {
  academicScore: number | null;
  codingScore: number | null;
  resumeScore: number | null;
  placementReadiness: number | null;
  interviewReadiness: number | null;
  skillGrowth: number | null;
  weeklyProgress: Array<{ week: string; score: number }>;
  githubStrength: number | null;
  leetcodeStrength: number | null;
  linkedinStrength: number | null;
  projectQuality: number | null;
  certificationScore: number | null;
  overallPlacementScore: number | null;
  strongAreas: string[];
  weakAreas: string[];
  recommendations: string[];
  missingConnections: string[];
  connected: { github: boolean; leetcode: boolean; linkedin: boolean };
  skills: string[];
  projects: string[];
  targetRole: string | null;
  preferredCompanies: string[];
};

const StudentProfileContext = createContext<StudentProfileContextValue | null>(null);

export function StudentProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isStudent = user?.role === "STUDENT";
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => normalizeStudentProfile((await api.get<StudentProfile>("/student/profile")).data),
    enabled: isStudent,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const mutation = useMutation({
    mutationFn: async (body: Partial<StudentProfile>) =>
      normalizeStudentProfile((await api.put<StudentProfile>("/student/profile", toProfileApiPayload(body))).data),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: ["student-profile", user?.id] });
      const previous = queryClient.getQueryData<StudentProfile>(["student-profile", user?.id]);
      if (previous) {
        queryClient.setQueryData(["student-profile", user?.id], normalizeStudentProfile({ ...previous, ...body }));
      }
      return { previous };
    },
    onError: (err, _body, context) => {
      if (context?.previous) queryClient.setQueryData(["student-profile", user?.id], context.previous);
      console.error("[StudentProfile] Save failed:", err);
    },
    onSuccess: async (saved) => {
      queryClient.setQueryData(["student-profile", user?.id], saved);
      queryClient.invalidateQueries({ queryKey: ["student-profile"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "student"] });
      queryClient.invalidateQueries({ queryKey: ["coding-progress"] });
    },
  });

  const profile = data ?? null;
  const intelligence = useMemo(() => profile ? buildPlacementIntelligence(profile) : null, [profile]);
  const dashboard = useMemo(() => profile && intelligence ? buildStudentDashboard(profile, intelligence, user?.full_name) : null, [profile, intelligence, user?.full_name]);

  useEffect(() => {
    if (profile) console.log("[PlacementOS] profile loaded", profile);
  }, [profile]);

  const completion = useMemo((): ProfileCompletion => {
    if (!profile) return { percent: 0, missing: [] };
    const checks: [string, boolean][] = [
      ["Profile Photo", !!getProfileValue(profile, ["profilePhoto", "profilePhotoUrl", "profile_photo_url"])],
      ["Roll Number", !!profile.roll_number && !profile.roll_number.startsWith("TEMP-")],
      ["Registration Number", !!profile.registration_number],
      ["Department", !!profile.department && profile.department !== "Not Set"],
      ["Course", !!profile.course],
      ["Branch", !!profile.branch],
      ["Section", !!profile.section],
      ["Year", profile.year > 0],
      ["Semester", !!profile.semester],
      ["Academic Year", !!profile.academic_year],
      ["Date of Birth", !!profile.date_of_birth],
      ["Gender", !!profile.gender],
      ["Phone Number", !!profile.phone_number],
      ["Address", !!profile.address],
      ["Faculty Advisor", !!profile.faculty_advisor],
      ["CGPA", profile.cgpa != null && profile.cgpa > 0],
      ["Skills", getProfileSkills(profile).length > 0],
      ["Certifications", profile.certifications.length > 0],
      ["GitHub", !!getProfileValue(profile, ["githubUrl", "github_url"])],
      ["LinkedIn", !!getProfileValue(profile, ["linkedinUrl", "linkedin_url"])],
      ["Parent Name", !!profile.parent_name],
    ];
    const filled = checks.filter(([, ok]) => ok).length;
    const missing = checks.filter(([, ok]) => !ok).map(([label]) => label);
    return { percent: Math.round((filled / checks.length) * 100), missing };
  }, [profile, data]);

  const value = useMemo(
    () => ({
      profile,
      dashboard,
      intelligence,
      loading: isLoading,
      error: error as Error | null,
      refetch,
      updateProfile: async (body: Partial<StudentProfile>) => mutation.mutateAsync(body),
      isUpdating: mutation.isPending,
      completion,
    }),
    [profile, dashboard, intelligence, isLoading, error, refetch, mutation.isPending, completion]
  );

  return <StudentProfileContext.Provider value={value}>{children}</StudentProfileContext.Provider>;
}

export function useStudentProfile() {
  const ctx = useContext(StudentProfileContext);
  if (!ctx) throw new Error("useStudentProfile must be used within StudentProfileProvider");
  return ctx;
}

export function useOptionalStudentProfile(): StudentProfileContextValue {
  try {
    return useStudentProfile();
  } catch {
    return {
      profile: null,
      dashboard: null,
      intelligence: null,
      loading: false,
      error: null,
      refetch: () => {},
      updateProfile: async () => { throw new Error("Not a student"); },
      isUpdating: false,
      completion: { percent: 0, missing: [] },
    };
  }
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(value)));
const hasValue = (value: unknown) => value !== null && value !== undefined && value !== "";

function scoreFromNullable(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? clamp(value) : null;
}

function flattenSkills(skillsData: StudentProfile["skills_data"]): string[] {
  if (!skillsData) return [];
  return Object.values(skillsData).flatMap((v) => Array.isArray(v) ? v : []).filter(Boolean);
}

function splitList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value !== "string") return [];
  return value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
}

function getProfileValue(profile: StudentProfile, keys: string[]): any {
  const source = profile as any;
  for (const key of keys) {
    if (hasValue(source[key])) return source[key];
  }
  return null;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function getProfileSkills(profile: StudentProfile): string[] {
  return Array.from(new Set([
    ...flattenSkills(getProfileValue(profile, ["skills_data", "skillsData"]) ?? {}),
    ...splitList(getProfileValue(profile, ["skills", "skill"])),
    ...splitList(profile.linkedin_skills),
  ].map((skill) => skill.trim()).filter(Boolean)));
}

function getProfileProjects(profile: StudentProfile): string[] {
  return splitList(getProfileValue(profile, ["projects", "projects_data", "projectData", "project_titles"]));
}

function getPreferredCompanies(profile: StudentProfile): string[] {
  return splitList(getProfileValue(profile, ["preferredCompanies", "preferred_companies", "preferred_company"]));
}

export function calculateResumeScore(profile: StudentProfile): number {
  const resume = getProfileValue(profile, ["resume", "resume_url", "resumeUrl", "resume_text", "resumeText"]);
  return resume ? 70 : 20;
}

export function calculateCodingScore(profile: StudentProfile, githubStats?: any, leetcodeStats?: any): number {
  const githubUrl = getProfileValue(profile, ["githubUrl", "github_url"]);
  const leetcodeUrl = getProfileValue(profile, ["leetcodeUrl", "leetcode_url"]);
  if (githubStats || leetcodeStats) {
    const liveScore = clamp(
      (githubStats?.public_repos ? Math.min(25, githubStats.public_repos * 4) : 0) +
      (githubStats?.recent_activity_count ? Math.min(15, githubStats.recent_activity_count * 2) : 0) +
      (leetcodeStats?.total_solved ? Math.min(45, leetcodeStats.total_solved / 6) : 0) +
      (leetcodeStats?.contest_rating ? 15 : 0)
    );
    if (liveScore > 0) return Math.max(65, liveScore);
  }
  return githubUrl || leetcodeUrl ? 65 : 10;
}

export function calculateSkillScore(profile: StudentProfile): number {
  const skills = getProfileSkills(profile);
  return skills.length ? Math.min(90, skills.length * 12) : 10;
}

export function calculateInterviewReadiness(profile: StudentProfile): number {
  const targetRole = getProfileValue(profile, ["targetRole", "preferredRole", "preferred_role"]);
  const skills = getProfileSkills(profile);
  return targetRole && skills.length ? 55 : 15;
}

export function calculateCompanyEligibilityScore(profile: StudentProfile): number {
  const cgpa = Number(getProfileValue(profile, ["cgpa"]) ?? 0);
  const skills = getProfileSkills(profile);
  return cgpa >= 7 && skills.length ? 60 : 25;
}

export function calculateOverallPlacementScore(profile: StudentProfile): number {
  const scores = [
    calculateResumeScore(profile),
    calculateCodingScore(profile),
    calculateSkillScore(profile),
    calculateInterviewReadiness(profile),
    calculateCompanyEligibilityScore(profile),
  ];
  return clamp(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

export function calculateCompanyEligibility(profile: StudentProfile, companies: CompanyData[] = []): StudentEligibilityResult[] {
  const skills = getProfileSkills(profile);
  const skillSet = new Set(skills.map(normalizeText));
  const projects = getProfileProjects(profile);
  const targetRole = String(getProfileValue(profile, ["targetRole", "preferred_role", "preferredRole"]) || "");
  const resumeScore = calculateResumeScore(profile);
  const codingScore = calculateCodingScore(profile);
  const skillScore = calculateSkillScore(profile);
  const cgpa = Number(profile.cgpa ?? 0);
  const department = String(profile.department || "").toLowerCase();

  const results = companies.map((company, index) => {
    const requiredSkills = (company.requiredSkills || []).filter(Boolean);
    const matchedSkills = requiredSkills.filter((skill) => skillSet.has(normalizeText(skill)));
    const missingSkills = requiredSkills.filter((skill) => !skillSet.has(normalizeText(skill)));
    const roleMatch = !targetRole || !company.role || normalizeText(company.role).includes(normalizeText(targetRole)) || normalizeText(targetRole).includes(normalizeText(company.role));
    const departmentMet = !company.allowedDepartments?.length || company.allowedDepartments.some((dept) => normalizeText(dept) === department || department.includes(normalizeText(dept)));
    const cgpaMet = !company.requiredCgpa || cgpa >= company.requiredCgpa;
    const skillsMet = requiredSkills.length === 0 || matchedSkills.length / requiredSkills.length >= 0.55;
    const resumeMet = resumeScore >= (company.minResumeScore ?? 60);
    const codingMet = codingScore >= (company.minCodingScore ?? 55);
    const projectsMet = projects.length > 0 || !!getProfileValue(profile, ["githubUrl", "github_url"]);
    const roleMet = roleMatch || !targetRole;
    const criteriaMet = { cgpa: cgpaMet, department: departmentMet, skills: skillsMet, coding: codingMet, resume: resumeMet, projects: projectsMet, target_role: roleMet };
    const matchScore = clamp(
      (cgpaMet ? 18 : Math.min(18, (cgpa / Math.max(company.requiredCgpa || 10, 1)) * 18)) +
      (departmentMet ? 10 : 0) +
      (requiredSkills.length ? (matchedSkills.length / requiredSkills.length) * 24 : Math.min(24, skillScore * 0.24)) +
      Math.min(18, codingScore * 0.18) +
      Math.min(14, resumeScore * 0.14) +
      (projectsMet ? 10 : 0) +
      (roleMet ? 6 : 0)
    );
    const missingRequirements = [
      !cgpaMet ? `CGPA below ${company.requiredCgpa}` : null,
      !departmentMet ? "Department not in company criteria" : null,
      !skillsMet ? `Missing skills: ${missingSkills.join(", ") || "role skills"}` : null,
      !codingMet ? "Coding score below company expectation" : null,
      !resumeMet ? "Resume score below company expectation" : null,
      !projectsMet ? "Add projects or GitHub repositories" : null,
      !roleMet ? "Target role does not match opening" : null,
    ].filter((v): v is string => !!v);
    const status = matchScore >= 75 && missingRequirements.length <= 1 ? "Eligible" : matchScore >= 50 ? "Almost Eligible" : "Not Eligible";
    return {
      companyId: company.id ?? index,
      companyName: company.name,
      role: company.role,
      package: company.package,
      driveDate: company.driveDate ?? null,
      status,
      eligible: status === "Eligible",
      reasons: missingRequirements.length ? missingRequirements : ["Profile matches company requirements."],
      matchScore,
      criteriaMet,
      matchedSkills,
      missingSkills,
      nextActions: missingRequirements.slice(0, 3).map((reason) => reason.startsWith("Missing skills") ? "Learn missing role skills" : reason),
    } as StudentEligibilityResult & { matchedSkills: string[]; missingSkills: string[]; nextActions: string[] };
  }).sort((a, b) => b.matchScore - a.matchScore);
  console.log("[PlacementOS] company eligibility calculated", results);
  return results;
}

export function buildPlacementIntelligence(profile: StudentProfile): PlacementIntelligence {
  const skills = getProfileSkills(profile);
  const projects = getProfileProjects(profile);
  const preferredCompanies = getPreferredCompanies(profile);
  const academicParts = [
    profile.cgpa != null ? profile.cgpa * 10 : null,
    profile.current_semester_gpa != null ? profile.current_semester_gpa * 10 : null,
    profile.attendance_percentage,
  ].filter((v): v is number => v != null);
  const academicScore = academicParts.length ? clamp(academicParts.reduce((a, b) => a + b, 0) / academicParts.length) : null;
  const skillGrowth = calculateSkillScore(profile);
  const projectQuality = projects.length ? clamp(projects.length * 22 + Math.min(skills.length, 8) * 3) : null;
  const certificationScore = profile.certifications.length ? clamp(profile.certifications.length * 20) : null;
  const githubUrl = getProfileValue(profile, ["githubUrl", "github_url"]);
  const leetcodeUrl = getProfileValue(profile, ["leetcodeUrl", "leetcode_url"]);
  const linkedinUrl = getProfileValue(profile, ["linkedinUrl", "linkedin_url"]);
  const githubStrength = githubUrl ? calculateCodingScore(profile) : null;
  const leetcodeStrength = leetcodeUrl ? calculateCodingScore(profile) : null;
  const linkedinStrength = linkedinUrl ? clamp(
    (hasValue(profile.linkedin_headline) ? 25 : 0) +
    (hasValue(profile.linkedin_about) ? 25 : 0) +
    (hasValue(profile.linkedin_skills) ? 25 : 0) +
    (profile.linkedin_open_to_work ? 10 : 0) +
    (profile.certifications.length ? 15 : 0)
  ) : null;
  const codingScore = calculateCodingScore(profile);
  const resumeScore = calculateResumeScore(profile);
  const interviewReadiness = calculateInterviewReadiness(profile);
  const scoreParts = [academicScore, codingScore, resumeScore, interviewReadiness, skillGrowth, githubStrength, leetcodeStrength, linkedinStrength, projectQuality, certificationScore]
    .filter((v): v is number => v != null);
  const overallPlacementScore = calculateOverallPlacementScore(profile);
  const placementReadiness = scoreFromNullable(profile.placement_readiness_score) && scoreFromNullable(profile.placement_readiness_score)! > 0 ? scoreFromNullable(profile.placement_readiness_score) : overallPlacementScore;
  const scoreMap = [
    ["Academics", academicScore], ["Coding", codingScore], ["Resume", resumeScore],
    ["Interview", interviewReadiness], ["Skills", skillGrowth], ["GitHub", githubStrength],
    ["LeetCode", leetcodeStrength], ["LinkedIn", linkedinStrength], ["Projects", projectQuality],
    ["Certifications", certificationScore],
  ] as const;
  const strongAreas = scoreMap.filter(([, score]) => score != null && score >= 75).map(([label]) => label);
  const weakAreas = scoreMap.filter(([, score]) => score != null && score < 60).map(([label]) => label);
  const missingConnections = [
    !githubUrl ? "GitHub" : null,
    !leetcodeUrl ? "LeetCode" : null,
    !linkedinUrl ? "LinkedIn" : null,
  ].filter((v): v is string => !!v);
  const recommendations = [
    resumeScore == null ? "Upload or paste your resume to generate ATS scoring." : resumeScore < 75 ? "Improve resume keywords, quantified impact, and project detail." : null,
    codingScore == null ? "Connect GitHub or LeetCode to unlock coding analytics." : codingScore < 70 ? "Increase DSA consistency and publish one polished project." : null,
    linkedinStrength == null ? "Connect LinkedIn for recruiter profile analysis." : linkedinStrength < 70 ? "Complete LinkedIn headline, about, skills, education, certifications, and projects." : null,
    academicScore != null && academicScore < 70 ? "Prioritize attendance and CGPA recovery for wider company eligibility." : null,
    interviewReadiness != null && interviewReadiness < 70 ? "Run a personalized mock interview for HR, technical, coding, and project rounds." : null,
  ].filter((v): v is string => !!v);
  const base = placementReadiness ?? overallPlacementScore ?? 0;
  console.log("[PlacementOS] placement scores calculated", { resumeScore, codingScore, skillGrowth, interviewReadiness, overallPlacementScore, placementReadiness });
  return {
    academicScore,
    codingScore,
    resumeScore,
    placementReadiness,
    interviewReadiness,
    skillGrowth,
    weeklyProgress: ["W1", "W2", "W3", "W4", "W5", "W6"].map((week, i) => ({ week, score: clamp(base - (5 - i) * 4) })),
    githubStrength,
    leetcodeStrength,
    linkedinStrength,
    projectQuality,
    certificationScore,
    overallPlacementScore,
    strongAreas,
    weakAreas,
    recommendations,
    missingConnections,
    connected: { github: !!githubUrl, leetcode: !!leetcodeUrl, linkedin: !!linkedinUrl },
    skills,
    projects,
    targetRole: profile.preferred_role,
    preferredCompanies,
  };
}

function formatScore(score: number | null, suffix = "%") {
  return score == null ? "Syncing" : `${score}${suffix}`;
}

export function buildStudentDashboard(profile: StudentProfile, intelligence: PlacementIntelligence, name = "Student"): Dashboard {
  const risk = intelligence.placementReadiness == null ? "Syncing" : intelligence.placementReadiness >= 75 ? "Low" : intelligence.placementReadiness >= 50 ? "Medium" : "High";
  return {
    role: "STUDENT",
    user: { full_name: name },
    profile,
    overall: {
      successScore: intelligence.overallPlacementScore ?? intelligence.placementReadiness ?? 0,
      placementReadiness: intelligence.placementReadiness ?? intelligence.overallPlacementScore ?? 0,
      academicRisk: risk,
      aiConfidence: intelligence.missingConnections.length ? 78 : 92,
      nextBestAction: intelligence.recommendations[0] ?? "Keep profile, coding, resume, and interview practice in sync.",
    },
    kpis: [
      { label: "Academic Score", value: formatScore(intelligence.academicScore), trend: "Live", progress: intelligence.academicScore ?? undefined },
      { label: "Coding Score", value: formatScore(intelligence.codingScore), trend: intelligence.connected.github || intelligence.connected.leetcode ? "Connected" : "Connect", progress: intelligence.codingScore ?? undefined },
      { label: "Resume Score", value: formatScore(intelligence.resumeScore), trend: profile.resume_url || profile.resume_text ? "Analyzed" : "Upload", progress: intelligence.resumeScore ?? undefined },
      { label: "Placement Readiness", value: formatScore(intelligence.placementReadiness), trend: "Live", progress: intelligence.placementReadiness ?? undefined },
      { label: "Interview Readiness", value: formatScore(intelligence.interviewReadiness), trend: "Personalized", progress: intelligence.interviewReadiness ?? undefined },
      { label: "Skill Growth", value: formatScore(intelligence.skillGrowth), trend: `${intelligence.skills.length} skills`, progress: intelligence.skillGrowth ?? undefined },
    ],
    charts: {
      weeklyActivity: intelligence.weeklyProgress.map((p) => ({ week: p.week, tasks: Math.max(1, Math.round(p.score / 12)), hours: Math.max(1, Math.round(p.score / 8)) })),
      performanceTrend: intelligence.weeklyProgress.map((p) => ({ month: p.week, cgpa: profile.cgpa ?? null, attendance: profile.attendance_percentage ?? null, readiness: p.score })),
      skillRadar: [
        { skill: "Academics", score: intelligence.academicScore ?? 0 },
        { skill: "Coding", score: intelligence.codingScore ?? 0 },
        { skill: "Resume", score: intelligence.resumeScore ?? 0 },
        { skill: "Interview", score: intelligence.interviewReadiness ?? 0 },
        { skill: "Projects", score: intelligence.projectQuality ?? 0 },
        { skill: "LinkedIn", score: intelligence.linkedinStrength ?? 0 },
      ],
      skillGap: intelligence.weakAreas.map((skill) => ({ skill, current: 55, target: 80 })),
    },
    recommendations: intelligence.recommendations.map((title, index) => ({ title, priority: index < 2 ? "High" : "Medium", reason: "Generated from your live student profile.", action: "Open Module" })),
    roadmap: intelligence.recommendations.map((step, index) => ({ step, completed: clamp((intelligence.overallPlacementScore ?? 35) - index * 8), status: index === 0 ? "in_progress" : "pending" })),
    placementReadiness: {
      resumeQuality: intelligence.resumeScore ?? 0,
      mockInterviewScore: intelligence.interviewReadiness ?? 0,
      technicalSkills: intelligence.codingScore ?? 0,
      communication: scoreFromNullable(profile.communication_score) ?? 0,
      projectStrength: intelligence.projectQuality ?? 0,
    },
    activities: [],
    tables: {},
    notifications: [],
    predictions: [],
  };
}
