import type {
  PlacementDashboardData, PlacementStudentSummary, PlacementCompany,
  PlacementDrive, DepartmentPlacementSummary, SkillAnalytics, RankingEntry,
  ApplicationPipeline,
} from "../../types/placement";

const firstNames = [
  "Anika", "Arjun", "Bhavya", "Chirag", "Deepika", "Esha", "Farhan", "Gauri",
  "Harsh", "Ishita", "Jatin", "Kavya", "Lakshya", "Manya", "Naman", "Ojas",
  "Pranav", "Riya", "Sahil", "Tanvi", "Uday", "Vaishnavi", "Yash", "Zara",
  "Aarav", "Bhavna", "Chandan", "Divya", "Ekansh", "Falak",
];
const lastNames = ["Sharma", "Verma", "Patel", "Reddy", "Singh", "Gupta", "Kumar", "Rao", "Joshi", "Mehta"];
const departments = ["CSE", "AIML", "AIDS", "ECE", "EEE", "CIVIL", "MECH"];
const sections = ["A", "B"];

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function pick<T>(arr: T[], seed: number = 0): T {
  return arr[Math.floor(seededRandom(seed) * arr.length)];
}

const skillPool = [
  "Python", "Java", "React", "FastAPI", "SQL", "AI/ML", "DSA", "Cloud", "Docker", "Communication",
  "Teamwork", "Problem Solving", "JavaScript", "TypeScript", "Node.js", "C++", "Go", "Rust",
  "Kubernetes", "AWS", "Azure", "TensorFlow", "PyTorch", "NLP", "Computer Vision",
];

export function generatePlacementDashboard(userName: string = "Dr. Placement Officer"): PlacementDashboardData {
  return {
    totalEligibleStudents: 245,
    placementReadyStudents: 180,
    shortlistedStudents: 95,
    placedStudents: 62,
    activeDrives: 8,
    averagePackage: 12.5,
    highestPackage: 42,
    companiesVisiting: 45,
    totalStudents: 350,
    firstYearStudents: 90,
    secondYearStudents: 88,
    thirdYearStudents: 86,
    fourthYearStudents: 86,
    atRiskStudents: 28,
    averageAttendance: 85,
    pendingAssignments: 42,
    charts: {
      yearDistribution: [
        { year: "1st Year", count: 90 },
        { year: "2nd Year", count: 88 },
        { year: "3rd Year", count: 86 },
        { year: "4th Year", count: 86 },
      ],
      placementFunnel: [
        { stage: "Eligible", count: 245 },
        { stage: "Registered", count: 198 },
        { stage: "Shortlisted", count: 145 },
        { stage: "Interviewed", count: 112 },
        { stage: "Selected", count: 76 },
        { stage: "Offered", count: 62 },
      ],
      departmentComparison: [
        { dept: "CSE", placed: 22, eligible: 68 },
        { dept: "AIML", placed: 18, eligible: 55 },
        { dept: "AIDS", placed: 12, eligible: 40 },
        { dept: "ECE", placed: 8, eligible: 38 },
        { dept: "EEE", placed: 2, eligible: 18 },
        { dept: "CIVIL", placed: 0, eligible: 14 },
        { dept: "MECH", placed: 0, eligible: 12 },
      ],
      packageDistribution: [
        { range: "3-6 LPA", count: 12 },
        { range: "6-10 LPA", count: 18 },
        { range: "10-15 LPA", count: 16 },
        { range: "15-25 LPA", count: 10 },
        { range: "25+ LPA", count: 6 },
      ],
      skillDemand: [
        { skill: "Python", demand: 38, supply: 210 },
        { skill: "Java", demand: 32, supply: 180 },
        { skill: "AI/ML", demand: 28, supply: 95 },
        { skill: "DSA", demand: 35, supply: 150 },
        { skill: "React", demand: 22, supply: 120 },
        { skill: "SQL", demand: 30, supply: 200 },
        { skill: "Cloud", demand: 20, supply: 85 },
        { skill: "Docker", demand: 18, supply: 70 },
      ],
      resumeScoreDistribution: [
        { range: "0-25%", count: 22 },
        { range: "25-50%", count: 58 },
        { range: "50-75%", count: 85 },
        { range: "75-100%", count: 35 },
      ],
    },
    recentStudents: generatePlacementStudents().slice(0, 8),
    notifications: [
      { title: "Google Hiring Drive", message: "Google is visiting campus on July 20 for SDE roles.", type: "info" },
      { title: "Infosys Eligibility", message: "37 students match Infosys criteria. Review shortlist.", type: "warning" },
      { title: "Resume Improvement", message: "120 students need resume improvement before next drive.", type: "error" },
      { title: "Mock Interview Scores", message: "23 students need mock interview practice before placements.", type: "warning" },
    ],
  };
}

export function generatePlacementStudents(): PlacementStudentSummary[] {
  const students: PlacementStudentSummary[] = [];
  for (let i = 0; i < 100; i++) {
    const fi = i % firstNames.length;
    const li = (i * 7) % lastNames.length;
    const dept = departments[i % departments.length];
    const year = Math.min(4, Math.max(1, Math.floor(i / 25) + 1));
    const section = sections[i % 2];
    const cgpa = +(5.5 + (seededRandom(i * 13) * 4)).toFixed(2);
    const skills: string[] = [];
    const numSkills = 2 + Math.floor(seededRandom(i * 7) * 4);
    for (let s = 0; s < numSkills; s++) {
      skills.push(skillPool[(i * 11 + s * 17) % skillPool.length]);
    }
    const placementReadiness = Math.min(95, Math.max(20, Math.round(cgpa * 8 + seededRandom(i * 5) * 20)));
    students.push({
      id: i + 1,
      name: `${firstNames[fi]} ${lastNames[li]}`,
      roll_number: `${dept}${year}${section}${(i % 25 + 1).toString().padStart(2, "0")}`,
      department: dept,
      year,
      section,
      cgpa,
      topSkills: [...new Set(skills)],
      resumeScore: Math.min(95, Math.max(15, Math.round(placementReadiness * 0.8 + seededRandom(i * 3) * 10))),
      codingScore: Math.min(95, Math.max(10, Math.round(cgpa * 7 + seededRandom(i * 7) * 15))),
      communicationScore: Math.min(95, Math.max(30, Math.round(60 + seededRandom(i * 11) * 30))),
      mockInterviewScore: Math.min(90, Math.max(15, Math.round(placementReadiness * 0.65 + seededRandom(i * 13) * 15))),
      placementReadiness,
      eligibleCompanies: Math.max(0, Math.min(45, Math.round(placementReadiness * 0.4 + seededRandom(i * 17) * 10))),
      applicationStatus: year < 3 ? "Not Eligible" : seededRandom(i * 23) > 0.6 ? "Applied" : "Eligible",
    });
  }
  return students;
}

export function generateDepartments(): DepartmentPlacementSummary[] {
  return [
    { department: "CSE", totalStudents: 68, eligibleStudents: 55, placementReady: 48, placementReadyPercent: 87, avgCgpa: 8.2, avgResumeScore: 76, topSkills: ["Python", "DSA", "Java"], placedCount: 22, avgPackage: 16.5 },
    { department: "AIML", totalStudents: 55, eligibleStudents: 48, placementReady: 42, placementReadyPercent: 88, avgCgpa: 8.5, avgResumeScore: 80, topSkills: ["Python", "AI/ML", "TensorFlow"], placedCount: 18, avgPackage: 18.2 },
    { department: "AIDS", totalStudents: 40, eligibleStudents: 32, placementReady: 28, placementReadyPercent: 88, avgCgpa: 8.0, avgResumeScore: 72, topSkills: ["Python", "SQL", "AI/ML"], placedCount: 12, avgPackage: 14.0 },
    { department: "ECE", totalStudents: 38, eligibleStudents: 28, placementReady: 20, placementReadyPercent: 71, avgCgpa: 7.5, avgResumeScore: 65, topSkills: ["C++", "Python", "IoT"], placedCount: 8, avgPackage: 11.0 },
    { department: "EEE", totalStudents: 18, eligibleStudents: 12, placementReady: 8, placementReadyPercent: 67, avgCgpa: 7.2, avgResumeScore: 58, topSkills: ["Python", "C++", "MATLAB"], placedCount: 2, avgPackage: 8.5 },
    { department: "CIVIL", totalStudents: 14, eligibleStudents: 8, placementReady: 4, placementReadyPercent: 50, avgCgpa: 7.0, avgResumeScore: 52, topSkills: ["AutoCAD", "STAAD Pro", "Project Management"], placedCount: 0, avgPackage: 6.0 },
    { department: "MECH", totalStudents: 12, eligibleStudents: 6, placementReady: 3, placementReadyPercent: 50, avgCgpa: 6.8, avgResumeScore: 48, topSkills: ["SolidWorks", "AutoCAD", "Python"], placedCount: 0, avgPackage: 5.5 },
  ];
}

export function generateCompanies(): PlacementCompany[] {
  return [
    { id: 1, name: "Google", role: "SDE", requiredCgpa: 8.0, requiredSkills: ["DSA", "Python", "System Design"], allowedDepartments: ["CSE", "AIML", "AIDS", "ECE"], backlogPolicy: "No active backlogs", package: "42 LPA", eligibleStudents: 38, driveDate: "2026-07-20", status: "upcoming" },
    { id: 2, name: "Microsoft", role: "SWE", requiredCgpa: 7.5, requiredSkills: ["DSA", "C++", "Python"], allowedDepartments: ["CSE", "AIML", "AIDS", "ECE"], backlogPolicy: "Max 1 backlog", package: "35 LPA", eligibleStudents: 52, driveDate: "2026-07-25", status: "upcoming" },
    { id: 3, name: "Amazon", role: "SDE", requiredCgpa: 7.0, requiredSkills: ["DSA", "Java", "System Design"], allowedDepartments: ["CSE", "AIML", "AIDS", "ECE"], backlogPolicy: "Max 2 backlogs", package: "28 LPA", eligibleStudents: 68, driveDate: "2026-08-01", status: "active" },
    { id: 4, name: "Infosys", role: "Systems Engineer", requiredCgpa: 6.5, requiredSkills: ["Python", "Java", "SQL"], allowedDepartments: ["CSE", "AIML", "AIDS", "ECE", "EEE"], backlogPolicy: "Max 3 backlogs", package: "8 LPA", eligibleStudents: 95, driveDate: "2026-07-15", status: "active" },
    { id: 5, name: "TCS", role: "Digital", requiredCgpa: 6.0, requiredSkills: ["Python", "Java", "SQL"], allowedDepartments: ["CSE", "AIML", "AIDS", "ECE", "EEE", "CIVIL", "MECH"], backlogPolicy: "No restrictions", package: "7.5 LPA", eligibleStudents: 120, driveDate: "2026-07-10", status: "completed" },
    { id: 6, name: "Flipkart", role: "SDE", requiredCgpa: 7.5, requiredSkills: ["DSA", "React", "Node.js"], allowedDepartments: ["CSE", "AIML", "AIDS"], backlogPolicy: "No active backlogs", package: "25 LPA", eligibleStudents: 42, driveDate: "2026-08-10", status: "upcoming" },
    { id: 7, name: "Accenture", role: "ASE", requiredCgpa: 6.0, requiredSkills: ["Python", "Java", "SQL", "Communication"], allowedDepartments: ["CSE", "AIML", "AIDS", "ECE", "EEE"], backlogPolicy: "Max 2 backlogs", package: "9 LPA", eligibleStudents: 88, driveDate: "2026-08-15", status: "upcoming" },
    { id: 8, name: "Goldman Sachs", role: "Software Engineer", requiredCgpa: 8.5, requiredSkills: ["DSA", "Python", "Financial Modeling"], allowedDepartments: ["CSE", "AIML"], backlogPolicy: "No backlogs", package: "30 LPA", eligibleStudents: 22, driveDate: "2026-09-01", status: "upcoming" },
  ];
}

export function generateDrives(): PlacementDrive[] {
  return [
    { id: 1, company: "TCS", role: "Digital", date: "2026-07-10", eligible: 120, registered: 98, shortlisted: 75, selected: 28, offers: 22, package: "7.5 LPA", status: "completed" },
    { id: 2, company: "Infosys", role: "Systems Engineer", date: "2026-07-15", eligible: 95, registered: 82, shortlisted: 60, selected: 0, offers: 0, package: "8 LPA", status: "active" },
    { id: 3, company: "Amazon", role: "SDE", date: "2026-08-01", eligible: 68, registered: 55, shortlisted: 0, selected: 0, offers: 0, package: "28 LPA", status: "active" },
    { id: 4, company: "Google", role: "SDE", date: "2026-07-20", eligible: 38, registered: 30, shortlisted: 0, selected: 0, offers: 0, package: "42 LPA", status: "upcoming" },
    { id: 5, company: "Microsoft", role: "SWE", date: "2026-07-25", eligible: 52, registered: 40, shortlisted: 0, selected: 0, offers: 0, package: "35 LPA", status: "upcoming" },
    { id: 6, company: "Flipkart", role: "SDE", date: "2026-08-10", eligible: 42, registered: 28, shortlisted: 0, selected: 0, offers: 0, package: "25 LPA", status: "upcoming" },
  ];
}

export function generateSkillAnalytics(): SkillAnalytics[] {
  return [
    { skill: "Python", studentCount: 210, companyDemand: 38, gapPercent: 18, recommendedAction: "Advanced Python workshops" },
    { skill: "Java", studentCount: 180, companyDemand: 32, gapPercent: 22, recommendedAction: "Intermediate Java training" },
    { skill: "React", studentCount: 120, companyDemand: 22, gapPercent: 35, recommendedAction: "React bootcamp" },
    { skill: "FastAPI", studentCount: 65, companyDemand: 15, gapPercent: 55, recommendedAction: "Backend API development course" },
    { skill: "SQL", studentCount: 200, companyDemand: 30, gapPercent: 15, recommendedAction: "Advanced SQL & optimization" },
    { skill: "AI/ML", studentCount: 95, companyDemand: 28, gapPercent: 42, recommendedAction: "ML specialization track" },
    { skill: "DSA", studentCount: 150, companyDemand: 35, gapPercent: 25, recommendedAction: "DSA practice sessions" },
    { skill: "Cloud", studentCount: 85, companyDemand: 20, gapPercent: 48, recommendedAction: "Cloud certification program" },
    { skill: "Docker", studentCount: 70, companyDemand: 18, gapPercent: 52, recommendedAction: "Containerization workshop" },
    { skill: "Communication", studentCount: 250, companyDemand: 40, gapPercent: 12, recommendedAction: "Soft skills training" },
  ];
}

export function generateRankings(): Record<string, RankingEntry[]> {
  const students = generatePlacementStudents();
  const byCgpa = [...students].sort((a, b) => b.cgpa - a.cgpa).slice(0, 10).map((s, i) => ({ rank: i + 1, studentId: s.id, name: s.name, department: s.department, score: s.cgpa }));
  const bySkills = [...students].sort((a, b) => b.topSkills.length - a.topSkills.length).slice(0, 10).map((s, i) => ({ rank: i + 1, studentId: s.id, name: s.name, department: s.department, score: s.topSkills.length * 20 }));
  const byResume = [...students].sort((a, b) => b.resumeScore - a.resumeScore).slice(0, 10).map((s, i) => ({ rank: i + 1, studentId: s.id, name: s.name, department: s.department, score: s.resumeScore }));
  const byCoding = [...students].sort((a, b) => b.codingScore - a.codingScore).slice(0, 10).map((s, i) => ({ rank: i + 1, studentId: s.id, name: s.name, department: s.department, score: s.codingScore }));
  const byCommunication = [...students].sort((a, b) => b.communicationScore - a.communicationScore).slice(0, 10).map((s, i) => ({ rank: i + 1, studentId: s.id, name: s.name, department: s.department, score: s.communicationScore }));
  const byMockInterview = [...students].sort((a, b) => b.mockInterviewScore - a.mockInterviewScore).slice(0, 10).map((s, i) => ({ rank: i + 1, studentId: s.id, name: s.name, department: s.department, score: s.mockInterviewScore }));
  const byReadiness = [...students].sort((a, b) => b.placementReadiness - a.placementReadiness).slice(0, 10).map((s, i) => ({ rank: i + 1, studentId: s.id, name: s.name, department: s.department, score: s.placementReadiness }));
  return { byCgpa, bySkills, byResume, byCoding, byCommunication, byMockInterview, byReadiness };
}

export function generateApplicationPipeline(): ApplicationPipeline {
  return { eligible: 245, registered: 198, shortlisted: 145, interviewed: 112, selected: 76, offered: 62, joined: 55 };
}
