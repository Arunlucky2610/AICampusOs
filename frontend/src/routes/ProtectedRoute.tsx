import { Navigate, Outlet } from "react-router-dom";
import { Role } from "../types";
import { rolePath, useAuth } from "../context/AuthContext";

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-muted">Loading AI CampusOS...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={rolePath[user.role]} replace />;
  return <Outlet />;
}
