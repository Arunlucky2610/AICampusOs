import type {
  FacultyProfile, FacultyDashboardData, FacultyStudentListItem, FacultyStudentDetail,
  LiveCardData, PriorityItem, CampusActivity, HeatmapData, AtRiskStudent,
  YearWiseSummary, ProjectData, HackathonData, CodingProfileData,
  ParentDetails, FacultyNote, TimelineEvent, AISummaryData,
} from "../../types";

const firstNames = [
  "Anika", "Arjun", "Bhavya", "Chirag", "Deepika", "Esha", "Farhan", "Gauri",
  "Harsh", "Ishita", "Jatin", "Kavya", "Lakshya", "Manya", "Naman", "Ojas",
  "Pranav", "Riya", "Sahil", "Tanvi", "Uday", "Vaishnavi", "Yash", "Zara",
  "Aarav", "Bhavna", "Chandan", "Divya", "Ekansh", "Falak",
];
const lastNames = ["Sharma", "Verma", "Patel", "Reddy", "Singh", "Gupta", "Kumar", "Rao", "Joshi", "Mehta"];
const departments = ["AIML", "CSE", "ECE", "IT"];
const sections = ["A", "B"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

export function generateFacultyProfile(userName: string = "Dr. Nandini Reddy"): FacultyProfile {
  return {
    id: 1, user_id: 1,
    full_name: userName,
    email: userName.toLowerCase().replace(/\s+/g, ".").replace("dr.", "") + "@campus.edu",
    employee_id: "FAC-AIML-102",
    department: "AIML",
    designation: "Assistant Professor",
    phone: "+91-9876543210",
    subject_handling: ["Machine Learning", "Deep Learning", "Neural Networks", "Python Programming"],
    assigned_years: [1, 2, 3, 4],
    assigned_sections: ["A", "B"],
    class_advisor: true,
    office_room: "Block C, Room 301",
    experience: 8,
    profile_picture: null,
  };
}

export function generateDashboardData(userName: string): FacultyDashboardData {
  const p = generateFacultyProfile(userName);
  return {
    role: "FACULTY",
    profile: p,
    kpis: [
      { label: "Total Students", value: 125, trend: "+5", progress: 100 },
      { label: "1st Year Students", value: 32, trend: "+2", progress: 26 },
      { label: "2nd Year Students", value: 34, trend: "+1", progress: 27 },
      { label: "3rd Year Students", value: 30, trend: "+1", progress: 24 },
      { label: "4th Year Students", value: 29, trend: "0", progress: 23 },
      { label: "At-Risk Students", value: 14, trend: "-4", progress: 11 },
      { label: "Average Attendance", value: "86%", trend: "+2%", progress: 86 },
      { label: "Pending Assignments", value: 23, trend: "-8", progress: 65 },
    ],
    charts: {
      yearDistribution: [
        { year: "1st Year", count: 32 },
        { year: "2nd Year", count: 34 },
        { year: "3rd Year", count: 30 },
        { year: "4th Year", count: 29 },
      ],
      riskDistribution: [
        { name: "Low Risk", value: 78, color: "#22C55E" },
        { name: "Medium Risk", value: 33, color: "#F59E0B" },
        { name: "High Risk", value: 14, color: "#EF4444" },
      ],
      attendanceTrend: [
        { month: "Jul", percentage: 84 },
        { month: "Aug", percentage: 86 },
        { month: "Sep", percentage: 83 },
        { month: "Oct", percentage: 88 },
        { month: "Nov", percentage: 85 },
        { month: "Dec", percentage: 90 },
      ],
      cgpaDistribution: [
        { range: "6-7 CGPA", count: 28 },
        { range: "7-8 CGPA", count: 42 },
        { range: "8-9 CGPA", count: 38 },
        { range: "9-10 CGPA", count: 17 },
      ],
    },
    recent_students: [
      { id: 1, name: "Anika Sharma", roll_number: "AIML1A01", year: 1, section: "A", cgpa: 8.5, attendance: 92, risk: "Low", readiness: 84 },
      { id: 2, name: "Arjun Verma", roll_number: "AIML1A02", year: 1, section: "A", cgpa: 7.8, attendance: 88, risk: "Low", readiness: 72 },
      { id: 3, name: "Bhavya Patel", roll_number: "AIML2B01", year: 2, section: "B", cgpa: 6.2, attendance: 76, risk: "Medium", readiness: 55 },
      { id: 4, name: "Chirag Reddy", roll_number: "AIML2A03", year: 2, section: "A", cgpa: 8.9, attendance: 95, risk: "Low", readiness: 91 },
      { id: 5, name: "Deepika Singh", roll_number: "AIML3B02", year: 3, section: "B", cgpa: 5.8, attendance: 68, risk: "High", readiness: 38 },
      { id: 6, name: "Esha Gupta", roll_number: "AIML3A04", year: 3, section: "A", cgpa: 8.2, attendance: 90, risk: "Low", readiness: 78 },
      { id: 7, name: "Farhan Kumar", roll_number: "AIML4B03", year: 4, section: "B", cgpa: 7.4, attendance: 82, risk: "Medium", readiness: 65 },
      { id: 8, name: "Gauri Rao", roll_number: "AIML4A05", year: 4, section: "A", cgpa: 9.1, attendance: 96, risk: "Low", readiness: 94 },
    ],
    notifications: [
      { title: "Assignment Deadline", message: "ML assignment submission due tomorrow for 3rd Year A section.", type: "warning" },
      { title: "At-Risk Alert", message: "5 students in 2nd Year B section have attendance below 75%.", type: "error" },
      { title: "Mentor Review", message: "Weekly mentor review pending for 12 students.", type: "info" },
      { title: "Exam Schedule", message: "Mid-semester exams starting next month. Please submit question papers.", type: "info" },
    ],
  };
}

export function generateLiveCards(): LiveCardData[] {
  return [
    { label: "Total Students", value: 125, trend: "+5 this semester", icon: "Users", color: "from-purple-500 to-purple-600" },
    { label: "Attendance Today", value: "91%", trend: "+2% vs yesterday", icon: "Clock", color: "from-blue-500 to-blue-600" },
    { label: "Assignments Pending", value: 23, trend: "8 overdue", icon: "FileText", color: "from-amber-500 to-amber-600" },
    { label: "Average Performance", value: "B+", trend: "7.65 CGPA avg", icon: "Award", color: "from-green-500 to-green-600" },
    { label: "Placement Ready", value: 42, trend: "68% of eligible", icon: "Briefcase", color: "from-emerald-500 to-emerald-600" },
    { label: "Research Progress", value: "76%", trend: "+12% this quarter", icon: "FlaskConical", color: "from-cyan-500 to-cyan-600" },
    { label: "Students At Risk", value: 14, trend: "-4 from last month", icon: "AlertTriangle", color: "from-red-500 to-red-600" },
  ];
}

export function generatePriorities(): PriorityItem[] {
  return [
    { id: 1, title: "Intervention Required", description: "5 students in 2nd Year B have attendance <75%", priority: "high", type: "intervention" },
    { id: 2, title: "Pending Evaluations", description: "12 mid-semester answer sheets pending evaluation", priority: "high", type: "evaluation" },
    { id: 3, title: "Assignment Deadline", description: "ML Assignment due tomorrow for 3rd Year", priority: "medium", type: "deadline" },
    { id: 4, title: "Parent Meeting", description: "Schedule parent meeting for Deepika Singh", priority: "medium", type: "alert" },
    { id: 5, title: "Question Paper Submission", description: "Semester exam question papers due in 2 weeks", priority: "low", type: "deadline" },
  ];
}

export function generateCampusActivities(): CampusActivity[] {
  return [
    { id: 1, type: "Live Class", title: "Machine Learning", subtitle: "3rd Year A • Block C-301", time: "In Progress", status: "active" },
    { id: 2, type: "Faculty", title: "12 Faculty Online", subtitle: "4 departments active", time: "Live", status: "active" },
    { id: 3, type: "Student", title: "86 Students Online", subtitle: "Campus platform active users", time: "Live", status: "active" },
    { id: 4, type: "Placement", title: "Google Hiring Drive", subtitle: "2026 batch • 12 shortlisted", time: "Today 2 PM", status: "upcoming" },
    { id: 5, type: "Exam", title: "Mid-Semester Exams", subtitle: "Starting July 15", time: "In 2 weeks", status: "upcoming" },
    { id: 6, type: "Event", title: "AI Workshop", subtitle: "Guest lecture by IIT Professor", time: "Jul 20", status: "upcoming" },
    { id: 7, type: "Notification", title: "Holiday Notice", subtitle: "Campus closed on Aug 15", time: "1 hour ago", status: "completed" },
  ];
}

export function generateHeatmapData(): HeatmapData[] {
  const subjects = ["Mathematics", "Physics", "Programming", "Data Structures", "Algorithms", "Machine Learning", "Deep Learning"];
  const days: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat")[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return subjects.map((subject) => ({
    subject,
    data: days.map((day) => ({
      day,
      value: 60 + Math.floor(seededRandom(subject.length + days.indexOf(day)) * 40),
    })),
  }));
}

let studentIdCounter = 1;
export function generateStudentsByYear(year: number, count: number = 8): FacultyStudentListItem[] {
  const students: FacultyStudentListItem[] = [];
  for (let i = 0; i < count; i++) {
    const fi = (year * 10 + i) % firstNames.length;
    const li = (year * 7 + i) % lastNames.length;
    const dept = departments[(year + i) % departments.length];
    const section = sections[i % sections.length];
    const cgpa = +(5.5 + ((firstNames.length * li + fi) % 35) / 10).toFixed(2);
    const att = 70 + ((lastNames.length * fi + li) % 25);
    const risk = cgpa > 7.5 && att > 85 ? 15 : cgpa > 6.0 ? 45 : 75;
    const id = studentIdCounter++;
    students.push({
      id, user_id: id,
      name: `${firstNames[fi]} ${lastNames[li]}`,
      roll_number: `${dept}${year}${section}${(i + 1).toString().padStart(2, "0")}`,
      registration_number: `REG-${2025 - year}-${(i + 1).toString().padStart(4, "0")}`,
      department: dept, year, section, semester: year * 2 - 1,
      cgpa, attendance_percentage: att,
      ai_score: Math.round(50 + cgpa * 4 + att * 0.3),
      risk_score: risk,
      placement_readiness_score: Math.min(95, Math.max(30, Math.round(cgpa * 8 + att * 0.2 - 20))),
      profile_picture: null,
    });
  }
  return students;
}

export function generateAllStudents(): FacultyStudentListItem[] {
  studentIdCounter = 1;
  return [
    ...generateStudentsByYear(1, 10),
    ...generateStudentsByYear(2, 10),
    ...generateStudentsByYear(3, 10),
    ...generateStudentsByYear(4, 10),
  ];
}

export function generateStudentDetail(id: number): FacultyStudentDetail {
  const depts = ["AIML", "CSE", "ECE", "IT"];
  const year = Math.ceil(id / 10) || 1;
  const section = id % 2 === 0 ? "A" : "B";
  const dept = depts[(year + id) % depts.length];
  const cgpa = +(5.5 + ((id * 7) % 35) / 10).toFixed(2);
  const att = 70 + ((id * 3) % 25);
  const risk = cgpa > 7.5 && att > 85 ? 15 : cgpa > 6.0 ? 45 : 75;
  const readiness = Math.min(95, Math.max(30, Math.round(cgpa * 8 + att * 0.2 - 20)));
  const fi = id % firstNames.length;
  const li = (id * 7) % lastNames.length;
  const name = `${firstNames[fi]} ${lastNames[li]}`;
  const semesters = year * 2 - 1;
  const subs = ["Mathematics", "Physics", "Programming", "Data Structures", "Algorithms", "Machine Learning", "Deep Learning", "AI", "Cloud Computing", "NLP"];
  const subjCount = 4 + (year % 3);

  return {
    id, user_id: id,
    name, email: `${firstNames[fi].toLowerCase()}.${lastNames[li].toLowerCase()}@campus.edu`,
    roll_number: `${dept}${year}${section}${(id % 25 + 1).toString().padStart(2, "0")}`,
    registration_number: `REG-${2025 - year}-${String(id).padStart(4, "0")}`,
    department: dept, course: "B.Tech", branch: dept,
    section, year, semester: semesters,
    date_of_birth: `20${2006 - year + 1}-${(id % 12 + 1).toString().padStart(2, "0")}-${(id % 28 + 1).toString().padStart(2, "0")}`,
    gender: id % 2 === 0 ? "Female" : "Male",
    phone_number: `+91-${9000000000 + id}`,
    address: `${id + 100}, Main Street, Hyderabad, Telangana`,
    parent_name: `${lastNames[li]} Family`,
    parent_phone: `+91-${8000000000 + id}`,
    cgpa, current_semester_gpa: +(cgpa + ((id * 5) % 10 - 5) / 10).toFixed(2),
    attendance_percentage: att,
    credits_earned: Math.min(160, year * 35 + (id % 10) * 2), total_credits: 180,
    faculty_advisor: "Dr. Nandini Reddy",
    placement_readiness_score: readiness, risk_score: risk,
    skill_score: Math.min(95, Math.max(30, Math.round(cgpa * 8 + 15))),
    resume_score: Math.min(95, Math.max(25, Math.round(readiness * 0.85 + 10))),
    coding_score: Math.min(95, Math.max(20, Math.round(cgpa * 7 + att * 0.15))),
    mock_interview_score: Math.min(90, Math.max(20, Math.round(readiness * 0.7 + 15))),
    ai_score: Math.round(50 + cgpa * 4 + att * 0.3),
    applications: year < 3 ? 0 : (id % 5) * 2 + 1,
    eligible_companies: year < 3 ? 0 : 5 + (id % 10),
    offers: year < 4 ? 0 : (id % 3 === 0 ? 1 : 0),
    semester_gpas: Array.from({ length: semesters }, (_, i) => ({
      semester: `Sem ${i + 1}`, sgpa: +(cgpa + (i * 3 % 10 - 5) / 10).toFixed(2), cgpa: +(cgpa + (i * 2 % 5) / 10).toFixed(2), credits: 24,
    })),
    subjects_data: subs.slice(0, subjCount).map((s, i) => ({
      code: `SUB${year}${String(i + 1).padStart(2, "0")}`, name: s, faculty: "Dr. Nandini Reddy",
      credits: 4, type: "Theory",
      internal_marks: 12 + ((id + i) % 18), external_marks: 38 + ((id * i) % 30), total_marks: 55 + ((id + i * 3) % 35),
    })),
    skills_data: {
      programming_languages: ["Python", "Java", "C++"].slice(0, 1 + (id % 3)),
      frameworks: ["React", "FastAPI", "TensorFlow"].slice(0, id % 3),
      ai_skills: ["Machine Learning", "Deep Learning", "NLP"].slice(0, id % 3),
      soft_skills: ["Communication", "Teamwork", "Leadership"].slice(0, 2 + (id % 2)),
    },
    certifications: ["AWS", "Azure", "Google Cloud", "Python", "Data Science"].slice(0, id % 5).map(c => `${c} Certification`),
    backlogs: cgpa > 7.0 ? [] : cgpa > 6.0 ? [`Backlog in ${subs[0]}`] : [`Backlog in ${subs[0]}`, `Backlog in ${subs[1]}`],
    monthly_attendance: [
      { month: "Jul", percentage: Math.min(100, att + (id % 10 - 5)) },
      { month: "Aug", percentage: Math.min(100, att - ((id * 2) % 10 - 5)) },
      { month: "Sep", percentage: Math.min(100, att + ((id * 3) % 10 - 5)) },
      { month: "Oct", percentage: Math.min(100, att - ((id * 5) % 10 - 5)) },
      { month: "Nov", percentage: Math.min(100, att + ((id * 7) % 10 - 5)) },
      { month: "Dec", percentage: Math.min(100, att - ((id * 11) % 10 - 5)) },
    ],
    assignment_completion: { total: 12 + year * 2, submitted: 8 + year * 2 - (id % 4), pending: 2 + (id % 4) },
    strengths: ["Analytical Thinking", "Problem Solving", "Team Collaboration", "Quick Learner"].slice(0, 2 + (id % 3)),
    weak_areas: ["Communication Skills", "Time Management", "Advanced Mathematics"].slice(0, 1 + (id % 3)),
    recommended_action: risk < 30
      ? "Continue current pace. Consider advanced elective courses and research projects."
      : risk < 60
        ? "Focus on improving practical implementation skills through lab sessions and extra tutorials."
        : "Immediate intervention required. Schedule mentor meeting and parents consultation.",
    intervention_notes: risk < 30 ? [] : risk < 60 ? ["Monitor attendance closely", "Suggest peer tutoring"] : ["Schedule parent meeting", "Create improvement plan", "Weekly progress review"],
    profile_picture: null,
    projects: [
      { id: 1, title: "AI-Powered Chatbot", description: "NLP-based chatbot for campus queries", tech_stack: ["Python", "FastAPI", "React"], status: "Ongoing", mentor: "Dr. Nandini Reddy" },
      { id: 2, title: "Attendance System", description: "Face recognition based attendance", tech_stack: ["Python", "OpenCV", "TensorFlow"], status: "Completed", grade: "A", mentor: "Dr. Nandini Reddy" },
    ],
    hackathons: [
      { id: 1, name: "Hackathon 2025", rank: "2nd Place", date: "2025-03-15", prize: "₹50,000" },
      { id: 2, name: "CodeFest", rank: "Finalist", date: "2025-01-20", prize: "-" },
    ],
    coding_profile: {
      platform: "LeetCode", username: firstNames[fi].toLowerCase() + li,
      rating: 1200 + (id * 150) % 800, problems_solved: 50 + (id * 10) % 200, rank: "3★",
    },
    behavior_notes: risk > 50 ? ["Irregular in submitting assignments", "Needs improvement in classroom participation"] : ["Good behavior", "Active participant"],
    parent_details: {
      father_name: `${lastNames[li]} ${firstNames[fi].slice(0, 3)}`,
      father_occupation: pick(["Engineer", "Doctor", "Business Owner", "Professor", "Civil Servant"]),
      mother_name: `${lastNames[li]} ${firstNames[(fi + 5) % firstNames.length]}`,
      mother_occupation: pick(["Teacher", "Software Engineer", "Homemaker", "Doctor", "Banker"]),
      address: `${id + 100}, Main Street, Hyderabad, Telangana`,
      phone: `+91-${8000000000 + id}`,
      email: `parent.${lastNames[li].toLowerCase()}@email.com`,
      income: pick(["₹8-12 LPA", "₹12-18 LPA", "₹18-25 LPA", "₹25+ LPA"]),
    },
    faculty_notes: [
      { id: 1, date: "2026-06-15", note: "Student showed significant improvement in ML practical sessions.", category: "Academic" },
      { id: 2, date: "2026-06-10", note: "Suggested participation in upcoming hackathon.", category: "General" },
    ],
    timeline: [
      { date: "2026-06-20", event: "Submitted ML Project", type: "Academic" },
      { date: "2026-06-15", event: "Scored 92% in Internal Assessment", type: "Achievement" },
      { date: "2026-06-10", event: "Attended AI Workshop", type: "Activity" },
      { date: "2026-06-01", event: "Attendance dropped below 75%", type: "Alert" },
    ],
    ai_summary: {
      risk_score: risk,
      strengths: ["Analytical Thinking", "Problem Solving", "Quick Learner"].slice(0, 2 + (id % 2)),
      weaknesses: ["Time Management", "Public Speaking"].slice(0, 1 + (id % 2)),
      recommendations: [
        "Focus on strengthening Data Structures fundamentals",
        "Participate in at least 2 hackathons this semester",
        "Improve communication skills through group discussions",
      ],
      career_prediction: pick(["AI/ML Engineer", "Data Scientist", "Software Engineer", "Research Scientist"]),
      learning_path: ["Python Advanced", "Machine Learning Specialization", "Deep Learning", "Cloud Computing"],
      placement_probability: readiness,
    },
  };
}

export function generateAtRiskStudents(): AtRiskStudent[] {
  const data = [
    { name: "Deepika Singh", roll: "AIML3B02", year: 3, section: "B", cgpa: 5.8, att: 68, risk: 78, areas: ["Communication Skills", "Advanced Mathematics"] },
    { name: "Bhavya Patel", roll: "AIML2B01", year: 2, section: "B", cgpa: 6.2, att: 76, risk: 58, areas: ["Time Management"] },
    { name: "Harsh Joshi", roll: "CSE1B04", year: 1, section: "B", cgpa: 6.0, att: 72, risk: 55, areas: ["Advanced Mathematics", "Problem Solving"] },
    { name: "Farhan Kumar", roll: "AIML4B03", year: 4, section: "B", cgpa: 7.4, att: 82, risk: 42, areas: ["Coding Skills"] },
    { name: "Jatin Nair", roll: "ECE2A05", year: 2, section: "A", cgpa: 6.8, att: 78, risk: 48, areas: ["Communication Skills"] },
    { name: "Lakshya Iyer", roll: "IT3B03", year: 3, section: "B", cgpa: 5.5, att: 65, risk: 82, areas: ["Time Management", "Advanced Mathematics", "Coding Skills"] },
  ];
  return data.map((d, i) => ({
    id: i + 100, name: d.name, roll_number: d.roll, year: d.year, section: d.section,
    cgpa: d.cgpa, attendance_percentage: d.att, risk_score: d.risk,
    weak_areas: d.areas, recommended_action: d.risk >= 70 ? "URGENT: Schedule parent-teacher meeting. Create improvement plan." : "Monitor attendance. Suggest peer tutoring.",
  }));
}

export function generateYearWiseData(): YearWiseSummary[] {
  return [
    { year: 1, label: "1st Year", total_students: 32, average_attendance: 87.5, average_cgpa: 7.2, at_risk_count: 3 },
    { year: 2, label: "2nd Year", total_students: 34, average_attendance: 84.2, average_cgpa: 7.5, at_risk_count: 5 },
    { year: 3, label: "3rd Year", total_students: 30, average_attendance: 82.8, average_cgpa: 7.8, at_risk_count: 4 },
    { year: 4, label: "4th Year", total_students: 29, average_attendance: 85.6, average_cgpa: 8.1, at_risk_count: 2 },
  ];
}
