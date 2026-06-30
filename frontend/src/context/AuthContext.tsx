import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { Role, User } from "../types";

type AuthContextValue = { user: User | null; loading: boolean; login: (email: string, password: string) => Promise<Role>; register: (full_name: string, email: string, password: string, role: Role) => Promise<Role>; logout: () => void; refreshUser: () => Promise<User>; };
const AuthContext = createContext<AuthContextValue | null>(null);

export const rolePath: Record<Role, string> = { STUDENT: "/app/student", FACULTY: "/app/faculty", PARENT: "/app/parent", PLACEMENT_OFFICER: "/app/placement", ADMIN: "/app/admin" };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const loadMe = async () => {
    const { data } = await api.get<User>("/auth/me");
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data));
    return data;
  };
  useEffect(() => {
    if (!localStorage.getItem("access_token")) { setLoading(false); return; }
    loadMe().catch(() => logout()).finally(() => setLoading(false));
  }, []);
  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.role as Role;
  };
  const register = async (full_name: string, email: string, password: string, role: Role) => {
    const { data } = await api.post("/auth/register", { full_name, email, password, role });
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.role as Role;
  };
  const logout = () => { localStorage.removeItem("access_token"); localStorage.removeItem("refresh_token"); localStorage.removeItem("user"); setUser(null); };
  const value = useMemo(() => ({ user, loading, login, register, logout, refreshUser: loadMe }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
