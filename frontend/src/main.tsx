import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { AppLayout } from "./layouts/AppLayout";
import { AiEnginePage, AssistantPage, AiInfoPage, NotificationsPage, ProfilePage, ReportsPage, SettingsPage } from "./pages/app/AiPages";
import { DashboardPage } from "./pages/app/DashboardPage";
import { ForgotPasswordPage, LoginPage, OtpPage, RegisterPage, ResetPasswordPage } from "./pages/auth/AuthPages";
import { LandingPage } from "./pages/landing/LandingPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password/:token?", element: <ResetPasswordPage /> },
  { path: "/otp", element: <OtpPage /> },
  { element: <ProtectedRoute />, children: [{ path: "/app", element: <AppLayout />, children: [
    { index: true, element: <Navigate to="/app/student" replace /> },
    { path: "student", element: <DashboardPage kind="student" /> },
    { path: "faculty", element: <DashboardPage kind="faculty" /> },
    { path: "parent", element: <DashboardPage kind="parent" /> },
    { path: "placement", element: <DashboardPage kind="placement" /> },
    { path: "admin", element: <DashboardPage kind="admin" /> },
    { path: "career-assistant", element: <AssistantPage /> },
    { path: "resume-analyzer", element: <AiInfoPage title="Resume Analyzer" endpoint="/ai/resume-analysis" method="post" /> },
    { path: "skill-gap", element: <AiInfoPage title="Skill Gap Analysis" endpoint="/ai/skill-gap" /> },
    { path: "placement-prediction", element: <AiInfoPage title="Placement Prediction" endpoint="/ai/placement-prediction" /> },
    { path: "learning-roadmap", element: <AiInfoPage title="Learning Roadmap" endpoint="/ai/learning-roadmap" /> },
    { path: "ai-engine", element: <AiEnginePage /> },
    { path: "reports", element: <ReportsPage /> },
    { path: "notifications", element: <NotificationsPage /> },
    { path: "profile", element: <ProfilePage /> },
    { path: "settings", element: <SettingsPage /> },
  ]}]},
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
