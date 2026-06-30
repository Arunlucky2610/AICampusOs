export type Role = "STUDENT" | "FACULTY" | "PARENT" | "PLACEMENT_OFFICER" | "ADMIN";
export type User = { id: number; full_name: string; email: string; role: Role; is_active: boolean; is_verified: boolean; created_at: string };

export type StudentProfile = {
  department: string;
  year: number;
  roll_number: string;
  current_semester: number;
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

export type SemesterCgpa = {
  semester: number;
  cgpa: number;
};

export type SubjectMarks = {
  subject: string;
  internal: number;
  external: number;
  total: number;
  grade: string;
};

export type AttendanceRecord = {
  month: string;
  percentage: number;
  attended: number;
  total: number;
};

export type PlacementKpi = {
  label: string;
  value: string | number;
  trend: string;
  icon: string;
};

export type CodingProfile = {
  platform: string;
  rating: number;
  problemsSolved: number;
  contestRank: string;
};

export type CompanyEligibility = {
  name: string;
  eligible: boolean;
  criteria: string;
  deadline: string;
};

export type Dashboard = {
  role: Role;
  user?: { full_name: string };
  profile?: StudentProfile;
  overall?: OverallMetrics;
  kpis: KpiItem[];
  charts: Record<string, any>;
  recommendations?: RecommendationItem[];
  roadmap?: RoadmapItem[];
  placementReadiness?: PlacementReadiness;
  activities?: ActivityItem[];
  tables: Record<string, any>;
  notifications: any[];
  predictions: any[];
};
