import {
  Award, Bell, BookOpen, Bot, BrainCircuit, BriefcaseBusiness, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Clock, Code2,
  Command, FileBarChart, FileText, GraduationCap, LayoutDashboard, LogOut,
  Menu, MessageSquare, Search, Send, Settings, Sparkles, TrendingUp,
  UserRound, Users,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { cn } from "../utils/cn";

type NavItem = { label: string; path: string; icon: React.ElementType };
type NavSection = { title: string; items: NavItem[] };

const studentNav: NavSection[] = [
  {
    title: "ACADEMICS",
    items: [
      { label: "Dashboard", path: "student", icon: LayoutDashboard },
      { label: "CGPA Analytics", path: "student/cgpa-analytics", icon: TrendingUp },
      { label: "Attendance", path: "student/attendance", icon: CalendarDays },
      { label: "Internal Marks", path: "student/internal-marks", icon: FileText },
      { label: "Semester Results", path: "student/semester-results", icon: Award },
      { label: "Subjects", path: "student/subjects", icon: BookOpen },
      { label: "Assignments", path: "student/assignments", icon: ClipboardList },
      { label: "Timetable", path: "student/timetable", icon: Clock },
      { label: "Faculty Feedback", path: "student/faculty-feedback", icon: MessageSquare },
    ],
  },
  {
    title: "PLACEMENTS",
    items: [
      { label: "Placement Dashboard", path: "student/placement", icon: BriefcaseBusiness },
      { label: "Resume Analyzer", path: "resume-analyzer", icon: FileText },
      { label: "Skill Gap Analysis", path: "skill-gap", icon: BrainCircuit },
      { label: "Mock Interviews", path: "student/mock-interviews", icon: Users },
      { label: "Coding Progress", path: "student/coding-progress", icon: Code2 },
      { label: "Career AI", path: "career-assistant", icon: Bot },
      { label: "Company Eligibility", path: "student/company-eligibility", icon: CheckCircle2 },
      { label: "Applications", path: "student/applications", icon: Send },
      { label: "Placement Prediction", path: "placement-prediction", icon: GraduationCap },
    ],
  },
  {
    title: "TOOLS",
    items: [
      { label: "AI Assistant", path: "career-assistant", icon: Sparkles },
      { label: "Reports", path: "reports", icon: FileBarChart },
      { label: "Notifications", path: "notifications", icon: Bell },
      { label: "Profile", path: "profile", icon: UserRound },
      { label: "Settings", path: "settings", icon: Settings },
    ],
  },
];

const otherNav: NavItem[] = [
  { label: "Dashboard", path: "dashboard", icon: LayoutDashboard },
  { label: "Career AI", path: "career-assistant", icon: Bot },
  { label: "Resume Analyzer", path: "resume-analyzer", icon: BriefcaseBusiness },
  { label: "Skill Gap", path: "skill-gap", icon: BrainCircuit },
  { label: "Prediction", path: "placement-prediction", icon: GraduationCap },
  { label: "Roadmap", path: "learning-roadmap", icon: FileBarChart },
  { label: "AI Engine", path: "ai-engine", icon: Sparkles },
  { label: "Reports", path: "reports", icon: FileBarChart },
  { label: "Notifications", path: "notifications", icon: Bell },
  { label: "Profile", path: "profile", icon: UserRound },
  { label: "Settings", path: "settings", icon: Settings },
];

function CalendarDays({ size }: { size?: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    ACADEMICS: true,
    PLACEMENTS: true,
    TOOLS: true,
  });

  const isStudent = user?.role === "STUDENT";
  const roleHome = !isStudent
    ? user?.role === "FACULTY" ? "faculty" : user?.role === "PARENT" ? "parent" : user?.role === "PLACEMENT_OFFICER" ? "placement" : user?.role === "ADMIN" ? "admin" : "student"
    : "student";
  const pathParts = location.pathname.split("/").filter(Boolean);
  const page = pathParts[pathParts.length - 1]?.replace(/-/g, " ") || "dashboard";

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (path: string) => {
    if (path === "student") return location.pathname === "/app/student";
    if (path === "student/placement") return location.pathname === "/app/student/placement";
    if (path.startsWith("student/")) return location.pathname === `/app/${path}`;
    return location.pathname === `/app/${path}` || location.pathname.startsWith(`/app/${path}/`);
  };

  const initials = user?.full_name?.slice(0, 2).toUpperCase() || "AI";

  return <div className="min-h-screen bg-[#F5F7FA] text-ink">
    {/* Desktop Sidebar */}
    <aside className={cn(
      "fixed inset-y-0 left-0 z-40 hidden border-r border-[#E8ECF1] bg-white transition-all lg:block",
      collapsed ? "w-[88px]" : "w-[280px]"
    )}>
      {/* Logo */}
      <div className={cn("flex h-[72px] items-center px-5", collapsed && "justify-center px-0")}>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] text-sm font-bold text-white shadow-lg shadow-[#6C4CF1]/25">AI</div>
          {!collapsed && (
            <div>
              <p className="text-[15px] font-bold tracking-tight text-[#111827]">AI CampusOS</p>
              <p className="text-[11px] font-medium text-[#6B7280]">Student Operating System</p>
            </div>
          )}
        </div>
      </div>

      <div className={cn("px-3", collapsed && "px-2")}>
        <div className="h-px bg-[#E8ECF1]" />
      </div>

      {/* Collapse toggle */}
      {collapsed ? (
        <button className="mx-auto mt-4 grid h-8 w-8 place-items-center rounded-lg text-[#9CA3AF] transition hover:bg-[#F5F7FA] hover:text-[#111827]" onClick={() => setCollapsed(false)} aria-label="Expand sidebar">
          <ChevronRight size={16} />
        </button>
      ) : (
        <div className="flex justify-end px-4 pt-3">
          <button className="grid h-7 w-7 place-items-center rounded-lg text-[#9CA3AF] transition hover:bg-[#F5F7FA] hover:text-[#111827]" onClick={() => setCollapsed(true)} aria-label="Collapse sidebar">
            <ChevronLeft size={15} />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className={cn("mt-2 overflow-y-auto", collapsed ? "px-2" : "px-3")} style={{ height: "calc(100vh - 180px)" }}>
        {isStudent ? (
          /* Student premium sidebar with sections */
          studentNav.map((section) => (
            <div key={section.title} className="mb-4">
              {!collapsed && (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF] transition hover:text-[#6B7280]"
                >
                  {section.title}
                  <ChevronDown
                    size={14}
                    className={cn("transition", expandedSections[section.title] && "rotate-180")}
                  />
                </button>
              )}
              {expandedSections[section.title] && (
                <div className={cn("space-y-0.5", collapsed && "mt-3 space-y-2")}>
                  {section.items.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <NavLink
                        key={item.path}
                        to={`/app/${item.path}`}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl px-3 py-[10px] text-sm font-medium transition-all duration-150",
                          collapsed && "justify-center px-0 py-3",
                          active
                            ? "bg-[#6C4CF1] text-white shadow-md shadow-[#6C4CF1]/20"
                            : "text-[#6B7280] hover:bg-[#F5F7FA] hover:text-[#111827]"
                        )}
                      >
                        <item.icon size={collapsed ? 20 : 18} className={cn("shrink-0", active ? "text-white" : "text-[#9CA3AF] group-hover:text-[#6B7280]")} />
                        {!collapsed && <span>{item.label}</span>}
                        {!collapsed && active && (
                          <span className="ml-auto h-2 w-2 rounded-full bg-white/60" />
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        ) : (
          /* Non-student simple sidebar */
          <div className="space-y-0.5">
            {otherNav.map((item) => {
              const target = item.path === "dashboard" ? roleHome : item.path;
              const active = location.pathname === `/app/${target}`;
              return (
                <NavLink
                  key={item.path}
                  to={`/app/${target}`}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-[10px] text-sm font-medium transition-all duration-150",
                    collapsed && "justify-center px-0 py-3",
                    active
                      ? "bg-[#6C4CF1] text-white shadow-md shadow-[#6C4CF1]/20"
                      : "text-[#6B7280] hover:bg-[#F5F7FA] hover:text-[#111827]"
                  )}
                >
                  <item.icon size={collapsed ? 20 : 18} className={cn("shrink-0", active ? "text-white" : "text-[#9CA3AF] group-hover:text-[#6B7280]")} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        )}
      </nav>

      {/* Bottom profile summary */}
      {!collapsed && isStudent && (
        <div className="absolute bottom-0 left-0 right-0 border-t border-[#E8ECF1] bg-white p-4">
          <div className="flex items-center gap-3 rounded-xl bg-[#F5F7FA] p-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] text-xs font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#111827]">{user?.full_name || "Student"}</p>
              <p className="truncate text-xs text-[#6B7280]">AIML • 4th Year • Sem 8</p>
            </div>
          </div>
        </div>
      )}
    </aside>

    {/* Mobile overlay */}
    {mobileOpen && <button className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}

    {/* Mobile sidebar */}
    <aside className={cn(
      "fixed inset-y-0 left-0 z-40 w-[280px] border-r border-[#E8ECF1] bg-white p-4 transition lg:hidden",
      mobileOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] text-xs font-bold text-white">AI</div>
          <b className="text-sm">AI CampusOS</b>
        </div>
        <button className="rounded-lg border border-[#E8ECF1] px-3 py-1.5 text-xs font-medium text-[#6B7280]" onClick={() => setMobileOpen(false)}>Close</button>
      </div>
      <nav className="space-y-0.5">
        {isStudent ? (
          studentNav.map((section) => (
            <div key={section.title} className="mb-3">
              <p className="mb-1 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">{section.title}</p>
              {section.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={`/app/${item.path}`}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-[10px] text-sm font-medium transition",
                      active ? "bg-[#6C4CF1] text-white" : "text-[#6B7280] hover:bg-[#F5F7FA]"
                    )}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          ))
        ) : (
          otherNav.map((item) => {
            const target = item.path === "dashboard" ? roleHome : item.path;
            const active = location.pathname === `/app/${target}`;
            return (
              <NavLink
                key={item.path}
                to={`/app/${target}`}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-[10px] text-sm font-medium transition",
                  active ? "bg-[#6C4CF1] text-white" : "text-[#6B7280] hover:bg-[#F5F7FA]"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            );
          })
        )}
      </nav>
    </aside>

    {/* Main content */}
    <main className={cn("transition-all duration-200", collapsed ? "lg:ml-[88px]" : "lg:ml-[280px]")}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[#E8ECF1] bg-white/90 backdrop-blur-xl">
        <div className="flex h-[72px] items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <button className="rounded-xl border border-[#E8ECF1] p-2 text-[#6B7280] lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#9CA3AF]">
                {isStudent ? "STUDENT WORKSPACE" : `${user?.role?.replace("_", " ")} WORKSPACE`}
              </p>
              <h1 className="truncate text-lg font-bold capitalize text-[#111827] md:text-xl">{page}</h1>
            </div>
          </div>

          <div className="hidden h-10 min-w-[320px] items-center gap-3 rounded-xl border border-[#E8ECF1] bg-[#F5F7FA] px-3.5 text-sm text-[#9CA3AF] md:flex">
            <Search size={16} />
            <span className="flex-1">Search anything...</span>
            <span className="inline-flex items-center gap-1 rounded-lg border border-[#E8ECF1] bg-white px-2 py-0.5 text-[11px] font-medium">
              <Command size={11} />K
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative grid h-9 w-9 place-items-center rounded-xl border border-[#E8ECF1] bg-white text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]" aria-label="Notifications">
              <Bell size={17} />
              <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full bg-[#F59E0B] ring-2 ring-white" />
            </button>
            <div className="hidden items-center gap-3 md:flex">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] text-[11px] font-bold text-white shadow-sm">
                {initials}
              </div>
              <div className="max-w-[140px]">
                <p className="truncate text-sm font-semibold text-[#111827]">{user?.full_name}</p>
                <p className="truncate text-[11px] font-medium text-[#6B7280]">{user?.email}</p>
              </div>
            </div>
            <Button variant="secondary" className="!rounded-xl !h-9 !px-3 !text-sm" onClick={() => { logout(); navigate("/login"); }}>
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <div className="p-4 md:p-8">
        <Outlet />
      </div>
    </main>
  </div>;
}
