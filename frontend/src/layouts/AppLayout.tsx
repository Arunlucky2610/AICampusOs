import { Bell, Bot, BrainCircuit, BriefcaseBusiness, ChevronLeft, ChevronRight, Command, Cpu, FileBarChart, GraduationCap, LayoutDashboard, LogOut, Menu, Search, Settings, Sparkles, UserRound } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { cn } from "../utils/cn";

const nav = [
  ["Dashboard", "dashboard", LayoutDashboard],
  ["Career AI", "career-assistant", Bot],
  ["Resume Analyzer", "resume-analyzer", BriefcaseBusiness],
  ["Skill Gap", "skill-gap", BrainCircuit],
  ["Prediction", "placement-prediction", GraduationCap],
  ["Roadmap", "learning-roadmap", FileBarChart],
  ["AI Engine", "ai-engine", Cpu],
  ["Reports", "reports", FileBarChart],
  ["Notifications", "notifications", Bell],
  ["Profile", "profile", UserRound],
  ["Settings", "settings", Settings],
] as const;

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const roleHome = user?.role === "FACULTY" ? "faculty" : user?.role === "PARENT" ? "parent" : user?.role === "PLACEMENT_OFFICER" ? "placement" : user?.role === "ADMIN" ? "admin" : "student";
  const pathParts = location.pathname.split("/").filter(Boolean);
  const page = pathParts[pathParts.length - 1]?.replace(/-/g, " ") || "dashboard";

  return <div className="min-h-screen bg-soft text-ink">
    <aside className={cn("fixed inset-y-0 left-0 z-40 hidden border-r border-line bg-white/95 p-4 backdrop-blur-xl transition-all lg:block", collapsed ? "w-24" : "w-80")}>
      <div className={cn("mb-8 flex items-center", collapsed ? "justify-center" : "justify-between")}>
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white shadow-lg shadow-primary/20">AI</div>
          {!collapsed && <div><p className="font-bold tracking-tight">AI CampusOS</p><p className="text-xs text-muted">Enterprise campus intelligence</p></div>}
        </div>
        {!collapsed && <button className="rounded-xl border border-line p-2 text-muted transition hover:bg-soft hover:text-ink" onClick={() => setCollapsed(true)} aria-label="Collapse sidebar"><ChevronLeft size={16}/></button>}
      </div>
      {collapsed && <button className="mx-auto mb-5 grid rounded-xl border border-line p-2 text-muted transition hover:bg-soft hover:text-ink" onClick={() => setCollapsed(false)} aria-label="Expand sidebar"><ChevronRight size={16}/></button>}
      {!collapsed && <div className="mb-5 rounded-[20px] border border-primary/15 bg-primary/5 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><Sparkles size={16}/> AI workspace</div>
        <p className="text-xs leading-5 text-muted">{user?.role.replace("_", " ")} insights, predictions, and recommended actions.</p>
      </div>}
      <nav className="space-y-1">
        {nav.map(([label, path, Icon]) => {
          const target = path === "dashboard" ? roleHome : path;
          return <NavLink key={path} to={`/app/${target}`} className={({ isActive }) => cn("group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-muted transition hover:bg-soft hover:text-ink", collapsed && "justify-center px-0", isActive && "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/20")}>
            <Icon size={18}/>
            {!collapsed && <span>{label}</span>}
          </NavLink>;
        })}
      </nav>
    </aside>

    {mobileOpen && <button className="fixed inset-0 z-30 bg-ink/20 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    <aside className={cn("fixed inset-y-0 left-0 z-40 w-80 border-r border-line bg-white p-4 transition lg:hidden", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
      <div className="mb-8 flex items-center justify-between"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-white">AI</div><b>AI CampusOS</b></div><Button variant="ghost" onClick={() => setMobileOpen(false)}>Close</Button></div>
      <nav className="space-y-1">{nav.map(([label, path, Icon]) => <NavLink key={path} onClick={() => setMobileOpen(false)} to={`/app/${path === "dashboard" ? roleHome : path}`} className={({ isActive }) => cn("flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-muted", isActive && "bg-primary text-white")}><Icon size={18}/>{label}</NavLink>)}</nav>
    </aside>

    <main className={cn("transition-all", collapsed ? "lg:pl-24" : "lg:pl-80")}>
      <header className="sticky top-0 z-20 border-b border-line bg-white/85 px-4 backdrop-blur-xl md:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <button className="rounded-xl border border-line p-2 text-muted lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={18}/></button>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Workspace / {user?.role.replace("_", " ")}</p>
              <h1 className="truncate text-lg font-semibold capitalize md:text-xl">{page}</h1>
            </div>
          </div>
          <div className="hidden h-11 min-w-[360px] items-center gap-3 rounded-2xl border border-line bg-soft px-3 text-sm text-muted md:flex">
            <Search size={17}/><span className="flex-1">Search students, alerts, reports...</span><span className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2 py-1 text-xs"><Command size={12}/>K</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative rounded-2xl border border-line bg-white p-3 text-muted transition hover:border-primary/30 hover:text-primary" aria-label="Notifications"><Bell size={18}/><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-warning" /></button>
            <div className="hidden items-center gap-3 rounded-2xl border border-line bg-white px-3 py-2 md:flex">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-xs font-bold text-primary">{user?.full_name?.slice(0, 2).toUpperCase()}</div>
              <div className="max-w-36"><p className="truncate text-sm font-semibold">{user?.full_name}</p><p className="truncate text-xs text-muted">{user?.email}</p></div>
            </div>
            <Button variant="secondary" onClick={() => { logout(); navigate("/login"); }}><LogOut size={16}/><span className="hidden sm:inline">Logout</span></Button>
          </div>
        </div>
      </header>
      <div className="p-4 md:p-8"><Outlet /></div>
    </main>
  </div>;
}
