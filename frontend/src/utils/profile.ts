export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:8000";

export function getProfileUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${BASE_URL}${url}`;
}

export function getInitials(name: string | null | undefined, fallback = "AI"): string {
  if (!name) return fallback;
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || fallback;
}

const PROFILE_FIELD_MAP: Record<string, string> = {
  userId: "user_id",
  rollNumber: "roll_number",
  registrationNumber: "registration_number",
  academicYear: "academic_year",
  dateOfBirth: "date_of_birth",
  phoneNumber: "phone_number",
  profilePhotoUrl: "profile_photo_url",
  profilePhoto: "profile_photo_url",
  currentSGPA: "current_sgpa",
  currentSgpa: "current_sgpa",
  currentSemesterGpa: "current_semester_gpa",
  attendancePercentage: "attendance_percentage",
  creditsEarned: "credits_earned",
  totalCredits: "total_credits",
  facultyAdvisor: "faculty_advisor",
  placementReadinessScore: "placement_readiness_score",
  riskScore: "risk_score",
  skillScore: "skill_score",
  resumeScore: "resume_score",
  codingScore: "coding_score",
  mockInterviewScore: "mock_interview_score",
  communicationScore: "communication_score",
  preferredRole: "preferred_role",
  targetRole: "preferred_role",
  preferredCompanies: "preferred_companies",
  expectedPackage: "expected_package",
  semesterGpas: "semester_gpas",
  subjectsData: "subjects_data",
  skillsData: "skills_data",
  skills: "skills",
  projects: "projects",
  resume: "resume",
  eligibleCompaniesList: "eligible_companies_list",
  appliedCompaniesList: "applied_companies_list",
  githubUrl: "github_url",
  linkedinUrl: "linkedin_url",
  leetcodeUrl: "leetcode_url",
  portfolioUrl: "portfolio_url",
  resumeUrl: "resume_url",
  resumeText: "resume_text",
  linkedinHeadline: "linkedin_headline",
  linkedinAbout: "linkedin_about",
  linkedinSkills: "linkedin_skills",
  linkedinOpenToWork: "linkedin_open_to_work",
  parentName: "parent_name",
  parentPhone: "parent_phone",
  parentEmail: "parent_email",
  fullName: "full_name",
};

const REVERSE_PROFILE_FIELD_MAP = Object.fromEntries(
  Object.entries(PROFILE_FIELD_MAP).map(([camel, snake]) => [snake, camel]),
);

export function normalizeStudentProfile<T extends Record<string, any>>(profile: T): T {
  const normalized: Record<string, any> = { ...profile };
  for (const [camel, snake] of Object.entries(PROFILE_FIELD_MAP)) {
    const camelValue = normalized[camel];
    const snakeValue = normalized[snake];
    if (snakeValue !== undefined && camelValue === undefined) normalized[camel] = snakeValue;
    if (camelValue !== undefined && snakeValue === undefined) normalized[snake] = camelValue;
  }
  if (normalized.current_sgpa !== undefined && normalized.current_semester_gpa === undefined) {
    normalized.current_semester_gpa = normalized.current_sgpa;
  }
  if (normalized.current_semester_gpa !== undefined && normalized.currentSGPA === undefined) {
    normalized.currentSGPA = normalized.current_semester_gpa;
  }
  if (normalized.preferred_companies === undefined && normalized.preferredCompanies !== undefined) {
    normalized.preferred_companies = normalized.preferredCompanies;
  }
  if (normalized.preferredCompanies === undefined && normalized.preferred_companies !== undefined) {
    normalized.preferredCompanies = normalized.preferred_companies;
  }
  return normalized as T;
}

export function toProfileApiPayload<T extends Record<string, any>>(profile: T): T {
  const payload: Record<string, any> = { ...profile };
  for (const [snake, camel] of Object.entries(REVERSE_PROFILE_FIELD_MAP)) {
    if (payload[camel] !== undefined) payload[snake] = payload[camel];
  }
  return payload as T;
}
