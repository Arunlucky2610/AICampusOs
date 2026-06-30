import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { AppLayout } from "./layouts/AppLayout";
import {
  AiEnginePage, AssistantPage, AiInfoPage, NotificationsPage, ProfilePage,
  ReportsPage, SettingsPage,
} from "./pages/app/AiPages";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { DashboardPage } from "./pages/app/DashboardPage";
import { StudentAcademicsDashboard } from "./pages/app/StudentAcademicsDashboard";
import { StudentPlacementDashboard } from "./pages/app/StudentPlacementDashboard";
import {
  StudentCgpaAnalytics, StudentAttendance, StudentInternalMarks, StudentSemesterResults,
  StudentSubjects, StudentAssignments, StudentTimetable, StudentFacultyFeedback,
} from "./pages/app/StudentAcademicModules";
import {
  StudentMockInterviews, StudentCodingProgress, StudentCompanyEligibility, StudentApplications,
} from "./pages/app/StudentPlacementModules";
import { ForgotPasswordPage, LoginPage, OtpPage, RegisterPage, ResetPasswordPage } from "./pages/auth/AuthPages";
import { LandingPage } from "./pages/landing/LandingPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/otp", element: <OtpPage /> },
  {
    element: <ProtectedRoute />, children: [{
      path: "/app", element: <ErrorBoundary><AppLayout /></ErrorBoundary>, children: [
        { index: true, element: <Navigate to="/app/student" replace /> },

        // Role-based dashboards
        { path: "student", element: <ErrorBoundary><StudentAcademicsDashboard /></ErrorBoundary> },
        { path: "student/placement", element: <ErrorBoundary><StudentPlacementDashboard /></ErrorBoundary> },
        { path: "student/cgpa-analytics", element: <ErrorBoundary><StudentCgpaAnalytics /></ErrorBoundary> },
        { path: "student/attendance", element: <ErrorBoundary><StudentAttendance /></ErrorBoundary> },
        { path: "student/internal-marks", element: <ErrorBoundary><StudentInternalMarks /></ErrorBoundary> },
        { path: "student/semester-results", element: <ErrorBoundary><StudentSemesterResults /></ErrorBoundary> },
        { path: "student/subjects", element: <ErrorBoundary><StudentSubjects /></ErrorBoundary> },
        { path: "student/assignments", element: <ErrorBoundary><StudentAssignments /></ErrorBoundary> },
        { path: "student/timetable", element: <ErrorBoundary><StudentTimetable /></ErrorBoundary> },
        { path: "student/faculty-feedback", element: <ErrorBoundary><StudentFacultyFeedback /></ErrorBoundary> },
        { path: "student/mock-interviews", element: <ErrorBoundary><StudentMockInterviews /></ErrorBoundary> },
        { path: "student/coding-progress", element: <ErrorBoundary><StudentCodingProgress /></ErrorBoundary> },
        { path: "student/company-eligibility", element: <ErrorBoundary><StudentCompanyEligibility /></ErrorBoundary> },
        { path: "student/applications", element: <ErrorBoundary><StudentApplications /></ErrorBoundary> },

        // Non-student dashboards
        { path: "faculty", element: <ErrorBoundary><DashboardPage kind="faculty" /></ErrorBoundary> },
        { path: "parent", element: <ErrorBoundary><DashboardPage kind="parent" /></ErrorBoundary> },
        { path: "placement", element: <ErrorBoundary><DashboardPage kind="placement" /></ErrorBoundary> },
        { path: "admin", element: <ErrorBoundary><DashboardPage kind="admin" /></ErrorBoundary> },

        // Shared ai/feature pages
        { path: "career-assistant", element: <ErrorBoundary><AssistantPage /></ErrorBoundary> },
        { path: "resume-analyzer", element: <ErrorBoundary><AiInfoPage title="Resume Analyzer" endpoint="/ai/resume-analysis" method="post" /></ErrorBoundary> },
        { path: "skill-gap", element: <ErrorBoundary><AiInfoPage title="Skill Gap Analysis" endpoint="/ai/skill-gap" /></ErrorBoundary> },
        { path: "placement-prediction", element: <ErrorBoundary><AiInfoPage title="Placement Prediction" endpoint="/ai/placement-prediction" /></ErrorBoundary> },
        { path: "learning-roadmap", element: <ErrorBoundary><AiInfoPage title="Learning Roadmap" endpoint="/ai/learning-roadmap" /></ErrorBoundary> },
        { path: "ai-engine", element: <ErrorBoundary><AiEnginePage /></ErrorBoundary> },
        { path: "reports", element: <ErrorBoundary><ReportsPage /></ErrorBoundary> },
        { path: "notifications", element: <ErrorBoundary><NotificationsPage /></ErrorBoundary> },
        { path: "profile", element: <ErrorBoundary><ProfilePage /></ErrorBoundary> },
        { path: "settings", element: <ErrorBoundary><SettingsPage /></ErrorBoundary> },
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
