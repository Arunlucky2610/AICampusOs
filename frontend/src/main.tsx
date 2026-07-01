import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import "./index.css";
import { AuthProvider, rolePath } from "./context/AuthContext";
import { StudentProfileProvider } from "./context/StudentProfileContext";
import { AppLayout } from "./layouts/AppLayout";
import {
  AiEnginePage, AssistantPage, AiInfoPage, NotificationsPage, ProfilePage,
  ReportsPage, SettingsPage,
} from "./pages/app/AiPages";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { DashboardPage } from "./pages/app/DashboardPage";
import { FacultyDashboard } from "./pages/app/FacultyDashboard";
import { FacultyStudents } from "./pages/app/FacultyStudents";
import { FacultyStudentProfile } from "./pages/app/FacultyStudentProfile";
import {
  FacultyYearWise, FacultyAttendance, FacultyMarks, FacultyAssignments,
  FacultyAtRisk, FacultyAIInsights, FacultyReports,
} from "./pages/app/FacultyModules";
import { StudentAcademicsDashboard } from "./pages/app/StudentAcademicsDashboard";
import { StudentPlacementDashboard } from "./pages/app/StudentPlacementDashboard";
import {
  StudentCgpaAnalytics, StudentAttendance, StudentInternalMarks,
  StudentSubjects, StudentAssignments, StudentTimetable, StudentFacultyFeedback,
} from "./pages/app/StudentAcademicModules";
import {
  StudentMockInterviews, StudentCodingProgress, StudentCompanyEligibility, StudentApplications,
} from "./pages/app/StudentPlacementModules";
import { StudentProfilePage } from "./pages/app/StudentProfilePage";
import { PlacementDashboard } from "./pages/app/PlacementDashboard";
import { PlacementStudents } from "./pages/app/PlacementStudents";
import { ParentDashboard } from "./pages/app/ParentDashboard";
import { PlacementStudentProfile } from "./pages/app/PlacementStudentProfile";
import {
  PlacementDepartments, PlacementCompanyEligibility, PlacementDrives,
  PlacementInsights, PlacementSkillAnalytics,
} from "./pages/app/PlacementModules";
import { ForgotPasswordPage, LoginPage, OtpPage, RegisterPage, ResetPasswordPage } from "./pages/auth/AuthPages";
import { LandingPage } from "./pages/landing/LandingPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

function RoleRedirect() {
  const { user } = useAuth();
  const target = user ? rolePath[user.role] : "/app/student";
  return <Navigate to={target} replace />;
}

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/otp", element: <OtpPage /> },
  {
    element: <ProtectedRoute />, children: [{
      path: "/app", element: (
        <ErrorBoundary name="AppLayout">
          <StudentProfileProvider>
            <AppLayout />
          </StudentProfileProvider>
        </ErrorBoundary>
      ), children: [
        { index: true, element: <RoleRedirect /> },

        // === STUDENT ROUTES ===
        {
          children: [
            { path: "student", element: <ErrorBoundary name="StudentDashboard"><StudentAcademicsDashboard /></ErrorBoundary> },
            { path: "student/placement", element: <ErrorBoundary name="StudentPlacement"><StudentPlacementDashboard /></ErrorBoundary> },
            { path: "student/cgpa-analytics", element: <ErrorBoundary name="CGPA"><StudentCgpaAnalytics /></ErrorBoundary> },
            { path: "student/attendance", element: <ErrorBoundary name="Attendance"><StudentAttendance /></ErrorBoundary> },
            { path: "student/internal-marks", element: <ErrorBoundary name="InternalMarks"><StudentInternalMarks /></ErrorBoundary> },
            { path: "student/semester-results", element: <Navigate to="/app/student/cgpa-analytics" replace /> },
            { path: "student/subjects", element: <ErrorBoundary name="Subjects"><StudentSubjects /></ErrorBoundary> },
            { path: "student/assignments", element: <ErrorBoundary name="Assignments"><StudentAssignments /></ErrorBoundary> },
            { path: "student/timetable", element: <ErrorBoundary name="Timetable"><StudentTimetable /></ErrorBoundary> },
            { path: "student/faculty-feedback", element: <ErrorBoundary name="FacultyFeedback"><StudentFacultyFeedback /></ErrorBoundary> },
            { path: "student/mock-interviews", element: <ErrorBoundary name="MockInterviews"><StudentMockInterviews /></ErrorBoundary> },
            { path: "student/coding-progress", element: <ErrorBoundary name="CodingProgress"><StudentCodingProgress /></ErrorBoundary> },
            { path: "student/company-eligibility", element: <ErrorBoundary name="CompElig"><StudentCompanyEligibility /></ErrorBoundary> },
            { path: "student/applications", element: <ErrorBoundary name="Applications"><StudentApplications /></ErrorBoundary> },
            { path: "student/profile", element: <ErrorBoundary name="StudentProfile"><StudentProfilePage /></ErrorBoundary> },
          ],
        },

        // === FACULTY ROUTES (no StudentProfileProvider) ===
        { path: "faculty", element: <ErrorBoundary name="FacultyDashboard"><FacultyDashboard /></ErrorBoundary> },
        { path: "faculty/students", element: <ErrorBoundary name="FacultyStudents"><FacultyStudents /></ErrorBoundary> },
        { path: "faculty/students/:studentId", element: <ErrorBoundary name="FacultyStudentProfile"><FacultyStudentProfile /></ErrorBoundary> },
        { path: "faculty/year-wise", element: <ErrorBoundary name="FacultyYearWise"><FacultyYearWise /></ErrorBoundary> },
        { path: "faculty/attendance", element: <ErrorBoundary name="FacultyAttendance"><FacultyAttendance /></ErrorBoundary> },
        { path: "faculty/marks", element: <ErrorBoundary name="FacultyMarks"><FacultyMarks /></ErrorBoundary> },
        { path: "faculty/assignments", element: <ErrorBoundary name="FacultyAssign"><FacultyAssignments /></ErrorBoundary> },
        { path: "faculty/at-risk", element: <ErrorBoundary name="FacultyAtRisk"><FacultyAtRisk /></ErrorBoundary> },
        { path: "faculty/ai-insights", element: <ErrorBoundary name="FacultyAI"><FacultyAIInsights /></ErrorBoundary> },
        { path: "faculty/reports", element: <ErrorBoundary name="FacultyReports"><FacultyReports /></ErrorBoundary> },
        { path: "faculty/notifications", element: <ErrorBoundary name="FacultyNotif"><NotificationsPage /></ErrorBoundary> },
        { path: "faculty/profile", element: <ErrorBoundary name="FacultyProfile"><ProfilePage /></ErrorBoundary> },
        { path: "faculty/settings", element: <ErrorBoundary name="FacultySettings"><SettingsPage /></ErrorBoundary> },

        // === PLACEMENT OFFICER ROUTES ===
        { path: "placement", element: <ErrorBoundary name="PlacementDash"><PlacementDashboard /></ErrorBoundary> },
        { path: "placement/students", element: <ErrorBoundary name="PlacementStudents"><PlacementStudents /></ErrorBoundary> },
        { path: "placement/students/:studentId", element: <ErrorBoundary name="PlacementStudentProfile"><PlacementStudentProfile /></ErrorBoundary> },
        { path: "placement/departments", element: <ErrorBoundary name="PlacementDepts"><PlacementDepartments /></ErrorBoundary> },
        { path: "placement/company-eligibility", element: <ErrorBoundary name="PlacementElig"><PlacementCompanyEligibility /></ErrorBoundary> },
        { path: "placement/drives", element: <ErrorBoundary name="PlacementDrives"><PlacementDrives /></ErrorBoundary> },
        { path: "placement/insights", element: <ErrorBoundary name="PlacementInsights"><PlacementInsights /></ErrorBoundary> },
        { path: "placement/skills", element: <ErrorBoundary name="PlacementSkills"><PlacementSkillAnalytics /></ErrorBoundary> },
        { path: "placement/notifications", element: <ErrorBoundary name="PlacementNotif"><NotificationsPage /></ErrorBoundary> },
        { path: "placement/profile", element: <ErrorBoundary name="PlacementProfile"><ProfilePage /></ErrorBoundary> },
        { path: "placement/settings", element: <ErrorBoundary name="PlacementSettings"><SettingsPage /></ErrorBoundary> },

        // === OTHER ROLE DASHBOARDS ===
        { path: "parent", element: <ErrorBoundary name="ParentDash"><ParentDashboard /></ErrorBoundary> },
        { path: "admin", element: <ErrorBoundary name="AdminDash"><DashboardPage kind="admin" /></ErrorBoundary> },

        // === SHARED AI/FEATURE PAGES ===
        { path: "career-assistant", element: <ErrorBoundary name="CareerAI"><AssistantPage /></ErrorBoundary> },
        { path: "resume-analyzer", element: <ErrorBoundary name="Resume"><AiInfoPage title="Resume Analyzer" endpoint="/ai/resume-analysis" method="post" /></ErrorBoundary> },
        { path: "skill-gap", element: <ErrorBoundary name="SkillGap"><AiInfoPage title="Skill Gap Analysis" endpoint="/ai/skill-gap" /></ErrorBoundary> },
        { path: "placement-prediction", element: <ErrorBoundary name="PlacementPred"><AiInfoPage title="Placement Prediction" endpoint="/ai/placement-prediction" /></ErrorBoundary> },
        { path: "learning-roadmap", element: <ErrorBoundary name="Roadmap"><AiInfoPage title="Learning Roadmap" endpoint="/ai/learning-roadmap" /></ErrorBoundary> },
        { path: "ai-engine", element: <ErrorBoundary name="AiEngine"><AiEnginePage /></ErrorBoundary> },
        { path: "reports", element: <ErrorBoundary name="Reports"><ReportsPage /></ErrorBoundary> },
        { path: "notifications", element: <ErrorBoundary name="Notif"><NotificationsPage /></ErrorBoundary> },
        { path: "profile", element: <ErrorBoundary name="Profile"><ProfilePage /></ErrorBoundary> },
        { path: "settings", element: <ErrorBoundary name="Settings"><SettingsPage /></ErrorBoundary> },
      ],
    }] },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
