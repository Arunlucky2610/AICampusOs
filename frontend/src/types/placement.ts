export type PlacementDashboardData = {
  totalEligibleStudents: number;
  placementReadyStudents: number;
  shortlistedStudents: number;
  placedStudents: number;
  activeDrives: number;
  averagePackage: number;
  highestPackage: number;
  companiesVisiting: number;
  totalStudents: number;
  firstYearStudents: number;
  secondYearStudents: number;
  thirdYearStudents: number;
  fourthYearStudents: number;
  atRiskStudents: number;
  averageAttendance: number;
  pendingAssignments: number;
  charts: Record<string, any>;
  recentStudents: PlacementStudentSummary[];
  notifications: any[];
};

export type PlacementStudentSummary = {
  id: number;
  name: string;
  roll_number: string;
  department: string;
  year: number;
  section: string;
  cgpa: number;
  topSkills: string[];
  resumeScore: number;
  codingScore: number;
  communicationScore: number;
  mockInterviewScore: number;
  placementReadiness: number;
  eligibleCompanies: number;
  applicationStatus: string;
  photo?: string | null;
};

export type PlacementCompany = {
  id: number;
  name: string;
  role: string;
  requiredCgpa: number;
  requiredSkills: string[];
  allowedDepartments: string[];
  backlogPolicy: string;
  package: string;
  eligibleStudents: number;
  driveDate?: string;
  status: "upcoming" | "active" | "completed";
};

export type PlacementDrive = {
  id: number;
  company: string;
  role: string;
  date: string;
  eligible: number;
  registered: number;
  shortlisted: number;
  selected: number;
  offers: number;
  package: string;
  status: "upcoming" | "active" | "completed";
};

export type DepartmentPlacementSummary = {
  department: string;
  totalStudents: number;
  eligibleStudents: number;
  placementReady: number;
  placementReadyPercent: number;
  avgCgpa: number;
  avgResumeScore: number;
  topSkills: string[];
  placedCount: number;
  avgPackage: number;
};

export type SkillAnalytics = {
  skill: string;
  studentCount: number;
  companyDemand: number;
  gapPercent: number;
  recommendedAction: string;
};

export type RankingEntry = {
  rank: number;
  studentId: number;
  name: string;
  department: string;
  score: number;
};

export type ApplicationPipeline = {
  eligible: number;
  registered: number;
  shortlisted: number;
  interviewed: number;
  selected: number;
  offered: number;
  joined: number;
};
