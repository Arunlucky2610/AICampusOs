export type Role = "STUDENT" | "FACULTY" | "PARENT" | "PLACEMENT_OFFICER" | "ADMIN";
export type User = { id: number; full_name: string; email: string; role: Role; is_active: boolean; is_verified: boolean; profile_picture?: string | null; created_at: string };

export type SemesterGpa = {
  semester: string;
  sgpa: number;
  cgpa: number;
  credits: number;
};

export type SubjectInfo = {
  code: string;
  name: string;
  faculty: string;
  credits: number;
  type: string;
};

export type SkillsData = {
  programming_languages: string[];
  frameworks: string[];
  ai_skills: string[];
  soft_skills: string[];
};

export type StudentProfile = {
  id: number;
  user_id: number;
  roll_number: string;
  registration_number: string | null;
  department: string;
  course: string | null;
  branch: string | null;
  section: string | null;
  year: number;
  semester: number | null;
  academic_year: string | null;
  date_of_birth: string | null;
  gender: string | null;
  phone_number: string | null;
  address: string | null;
  profile_photo_url: string | null;
  cgpa: number | null;
  current_semester_gpa: number | null;
  attendance_percentage: number | null;
  credits_earned: number | null;
  total_credits: number;
  faculty_advisor: string | null;
  placement_readiness_score: number | null;
  risk_score: number | null;
  skill_score: number | null;
  resume_score: number | null;
  coding_score: number | null;
  mock_interview_score: number | null;
  communication_score: number | null;
  applications: number | null;
  eligible_companies: number | null;
  offers: number | null;
  preferred_role: string | null;
  expected_package: string | null;
  semester_gpas: SemesterGpa[];
  subjects_data: SubjectInfo[];
  skills_data: SkillsData | Record<string, string[]>;
  certifications: string[];
  eligible_companies_list: any[];
  applied_companies_list: any[];
  github_url: string | null;
  linkedin_url: string | null;
  linkedin_headline: string | null;
  linkedin_about: string | null;
  linkedin_skills: string | null;
  linkedin_open_to_work: boolean;
  leetcode_url: string | null;
  portfolio_url: string | null;
  resume_url: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
};

export type OverallMetrics = {
  successScore: number;
  placementReadiness: number;
  academicRisk: string;
  aiConfidence: number;
  nextBestAction: string;
};

export type KpiItem = {
  label: string;
  value: string | number;
  trend: string;
  progress?: number;
};

export type RecommendationItem = {
  title: string;
  priority: string;
  reason: string;
  action: string;
};

export type RoadmapItem = {
  step: string;
  completed: number;
  status: string;
};

export type ActivityItem = {
  action: string;
  timestamp: string;
  type: string;
};

export type PlacementReadiness = {
  resumeQuality: number;
  mockInterviewScore: number;
  technicalSkills: number;
  communication: number;
  projectStrength: number;
};

export type Dashboard = {
  role: Role;
  user?: { full_name: string; email?: string };
  profile?: StudentProfile;
  overall?: OverallMetrics;
  kpis: KpiItem[];
  charts: Record<string, any>;
  coding_summary?: CodingSummary;
  recommendations?: RecommendationItem[];
  roadmap?: RoadmapItem[];
  placementReadiness?: PlacementReadiness;
  activities?: ActivityItem[];
  tables: Record<string, any>;
  notifications: any[];
  predictions: any[];
};

// =========================================
// FACULTY TYPES
// =========================================

export type FacultyProfile = {
  id: number;
  user_id: number;
  employee_id: string | null;
  department: string;
  designation: string;
  phone: string | null;
  subject_handling: string[];
  assigned_years: number[];
  assigned_sections: string[];
  class_advisor: boolean;
  office_room: string | null;
  experience: number;
  profile_picture: string | null;
  full_name: string;
  email: string;
};

export type FacultyRecentStudent = {
  id: number;
  name: string;
  roll_number: string;
  year: number;
  section: string | null;
  cgpa: number;
  attendance: number;
  risk: string;
  readiness: number;
};

export type FacultyDashboardData = {
  role: string;
  profile: FacultyProfile;
  kpis: KpiItem[];
  charts: Record<string, any>;
  recent_students: FacultyRecentStudent[];
  notifications: any[];
};

export type FacultyStudentListItem = {
  id: number;
  user_id: number;
  name: string;
  roll_number: string;
  registration_number: string | null;
  department: string;
  year: number;
  section: string | null;
  semester: number | null;
  cgpa: number;
  attendance_percentage: number;
  risk_score: number;
  ai_score: number;
  placement_readiness_score: number;
  profile_picture: string | null;
};

export type FacultyStudentDetail = FacultyStudentListItem & {
  email: string;
  course: string | null;
  branch: string | null;
  date_of_birth: string | null;
  gender: string | null;
  phone_number: string | null;
  address: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  current_semester_gpa: number;
  credits_earned: number;
  total_credits: number;
  faculty_advisor: string | null;
  skill_score: number;
  resume_score: number;
  coding_score: number;
  mock_interview_score: number;
  applications: number;
  eligible_companies: number;
  offers: number;
  semester_gpas: { semester: string; sgpa: number; cgpa: number; credits: number }[];
  subjects_data: any[];
  skills_data: Record<string, string[]>;
  certifications: string[];
  backlogs: string[];
  monthly_attendance: { month: string; percentage: number }[];
  assignment_completion: { total: number; submitted: number; pending: number };
  strengths: string[];
  weak_areas: string[];
  recommended_action: string;
  intervention_notes: string[];
  projects: ProjectData[];
  hackathons: HackathonData[];
  coding_profile: CodingProfileData;
  behavior_notes: string[];
  parent_details: ParentDetails;
  faculty_notes: FacultyNote[];
  timeline: TimelineEvent[];
  ai_summary: AISummaryData;
};

export type ProjectData = {
  id: number;
  title: string;
  description: string;
  tech_stack: string[];
  status: "Ongoing" | "Completed" | "Submitted";
  grade?: string;
  mentor: string;
};

export type HackathonData = {
  id: number;
  name: string;
  rank: string;
  date: string;
  prize: string;
};

export type CodingProfileData = {
  platform: string;
  username: string;
  rating: number;
  problems_solved: number;
  rank: string;
};

export type ParentDetails = {
  father_name: string;
  father_occupation: string;
  mother_name: string;
  mother_occupation: string;
  address: string;
  phone: string;
  email: string;
  income: string;
};

export type FacultyNote = {
  id: number;
  date: string;
  note: string;
  category: "Academic" | "Behavior" | "Placement" | "General";
};

export type TimelineEvent = {
  date: string;
  event: string;
  type: "Academic" | "Achievement" | "Activity" | "Alert";
};

export type AISummaryData = {
  risk_score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  career_prediction: string;
  learning_path: string[];
  placement_probability: number;
};

export type YearWiseSummary = {
  year: number;
  label: string;
  total_students: number;
  average_attendance: number;
  average_cgpa: number;
  at_risk_count: number;
};

export type AtRiskStudent = {
  id: number;
  name: string;
  roll_number: string;
  year: number;
  section: string | null;
  cgpa: number;
  attendance_percentage: number;
  risk_score: number;
  weak_areas: string[];
  recommended_action: string;
};

export type LiveCardData = {
  label: string;
  value: string | number;
  trend: string;
  icon: string;
  color: string;
};

export type PriorityItem = {
  id: number;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  type: "intervention" | "evaluation" | "deadline" | "alert";
};

export type CampusActivity = {
  id: number;
  type: "Live Class" | "Faculty" | "Student" | "Placement" | "Exam" | "Event" | "Notification";
  title: string;
  subtitle: string;
  time: string;
  status: "active" | "upcoming" | "completed";
};

export type WeekDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
export type HeatmapData = {
  subject: string;
  data: { day: WeekDay; value: number }[];
};

// =========================================
// CODING PROGRESS TYPES
// =========================================

export type LeetCodeStats = {
  total_solved: number;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
  ranking: number | null;
  contest_rating: number | null;
  reputation: number | null;
  recent_submissions: LeetCodeSubmission[];
};

export type LeetCodeSubmission = {
  title: string;
  title_slug: string;
  timestamp: string;
  status: string;
  lang: string;
};

export type GitHubStats = {
  public_repos: number;
  followers: number;
  following: number;
  recent_repos: GitHubRepo[];
  recent_activity_count: number;
  last_active_date: string | null;
  languages: Record<string, number>;
  profile_url: string | null;
  avatar_url: string | null;
};

export type GitHubRepo = {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  updated_at: string;
  html_url: string;
};

export type LinkedInStatus = {
  connected: boolean;
  url: string | null;
};

export type LinkedInProfileInfo = {
  username: string | null;
  headline: string | null;
  about: string | null;
  skills: string | null;
  open_to_work: boolean;
  profile_strength: number;
};

export type CodingProgressData = {
  github_url: string | null;
  leetcode_url: string | null;
  linkedin_url: string | null;
  github_username: string | null;
  leetcode_username: string | null;
  github_stats: GitHubStats | null;
  leetcode_stats: LeetCodeStats | null;
  linkedin_status: LinkedInStatus | null;
  linkedin_profile: LinkedInProfileInfo | null;
  coding_score: number;
  placement_readiness_score: number;
  last_synced_at: string | null;
};

export type CodingSummary = {
  leetcode_total_solved: number;
  github_public_repos: number;
  github_recent_activity: number;
  coding_score: number;
  placement_readiness_score: number;
  last_synced_at: string | null;
};
