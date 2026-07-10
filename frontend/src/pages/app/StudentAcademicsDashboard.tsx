import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Brain,
  CalendarDays,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  Layers,
  LineChart,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { AnimatedCounter } from "../../components/ui/AnimatedCounter";
import { Avatar } from "../../components/ui/Avatar";
import { useAuth } from "../../context/AuthContext";
import { useStudentProfile } from "../../context/StudentProfileContext";
import { cn } from "../../utils/cn";
import type { Dashboard } from "../../types";

const PRIMARY = "#6D5DF6";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } },
};

function clampScore(v: number) {
  return Math.max(0, Math.min(100, Math.round(v || 0)));
}

function asNum(v: unknown, fb = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fb;
}

function scoreColor(v: number) {
  if (v >= 80) return "#16A34A";
  if (v >= 60) return PRIMARY;
  if (v >= 40) return "#F59E0B";
  return "#EF4444";
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
}

function glassCard(className = "") {
  return cn(
    "rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]",
    "dark:border-white/[0.06] dark:bg-[#0d0d0e] dark:shadow-none",
    className,
  );
}

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary/70">{label}</p>
      <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-[#101225] dark:text-white/90">{title}</h2>
    </div>
  );
}

function MiniRing({ value, size = 56 }: { value: number; size?: number }) {
  const v = clampScore(value);
  return (
    <div style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="70%"
          outerRadius="100%"
          data={[{ value: v, fill: scoreColor(v) }]}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar dataKey="value" cornerRadius={50} background={{ fill: "#F0EEFF" }} />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#D8D2FF] bg-[#FAFAFF] px-6 py-10 text-center dark:border-white/[0.06] dark:bg-white/[0.02]">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon size={18} />
      </div>
      <p className="max-w-xs text-sm text-[#8B8FA3] dark:text-white/40">{label}</p>
    </div>
  );
}

export function StudentAcademicsDashboard() {
  const { user } = useAuth();
  const { profile, loading } = useStudentProfile();

  const { data: dashboardData, isLoading: dashLoading } = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: async () => (await api.get<Dashboard>("/student/dashboard")).data,
    enabled: !!profile,
  });

  const p = profile;
  const name = dashboardData?.user?.full_name || user?.full_name || "Student";
  const firstName = name.split(" ")[0] || "Student";
  const cgpa = asNum(p?.cgpa);
  const sgpa = asNum(p?.current_semester_gpa);
  const attendance = asNum(p?.attendance_percentage);
  const credits = asNum(p?.credits_earned);
  const totalCredits = asNum(p?.total_credits, 180) || 180;
  const subjects = p?.subjects_data || [];
  const semesterGpas = p?.semester_gpas || [];
  const facultyAdvisor = p?.faculty_advisor;
  const recommendations = dashboardData?.recommendations || [];
  const notifications = dashboardData?.notifications || [];

  const healthScore = useMemo(() => {
    const c = cgpa ? clampScore(cgpa * 10) : 0;
    const a = attendance ? clampScore(attendance) : 0;
    const cr = totalCredits > 0 ? clampScore((credits / totalCredits) * 100) : 0;
    return Math.round(c * 0.4 + a * 0.3 + cr * 0.3);
  }, [cgpa, attendance, credits, totalCredits]);

  const timeline = useMemo(() => {
    if (semesterGpas.length) {
      return semesterGpas.map((sem: any) => ({
        label: sem.semester || "Sem",
        cgpa: asNum(sem.cgpa ?? sem.sgpa),
        sgpa: asNum(sem.sgpa ?? sem.cgpa),
        credits: asNum(sem.credits),
        active: String(sem.semester).includes(String(p?.semester || "")),
      }));
    }
    return Array.from({ length: Math.max(asNum(p?.semester, 1), 1) }, (_, i) => ({
      label: `Sem ${i + 1}`,
      cgpa: i + 1 === p?.semester ? cgpa : 0,
      sgpa: i + 1 === p?.semester ? sgpa : 0,
      credits: i + 1 === p?.semester ? credits : 0,
      active: i + 1 === p?.semester,
    }));
  }, [semesterGpas, p?.semester, cgpa, sgpa, credits]);

  const chartData = timeline.map((t, i) => ({
    name: t.label.replace("Semester ", "Sem "),
    sgpa: t.sgpa,
    cgpa: t.cgpa,
  }));

  const subjectCards = useMemo(() => {
    if (!subjects.length) return [];
    return subjects.map((s: any) => ({
      code: s.code || "—",
      name: s.name || "Subject",
      faculty: s.faculty || "—",
      credits: asNum(s.credits),
      type: s.type || "Core",
    }));
  }, [subjects]);

  const upcomingItems = useMemo(() => {
    const items: { label: string; meta: string; icon: any }[] = [];
    for (const n of notifications.slice(0, 4)) {
      items.push({ label: n.title || n.message || "Update", meta: n.type || "Notice", icon: Bell });
    }
    return items;
  }, [notifications]);

  const chips = [
    { label: "Department", value: p?.department || "—" },
    { label: "Year", value: p?.year ? `Year ${p.year}` : "—" },
    { label: "Semester", value: p?.semester ? `Sem ${p.semester}` : "—" },
    { label: "Roll No.", value: p?.roll_number || "—" },
    { label: "Section", value: p?.section || "—" },
  ];

  const isLoading = loading || dashLoading;

  if (isLoading) return <DashboardSkeleton />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto min-h-screen max-w-7xl space-y-10 px-4 py-8 pb-16">
      {/* ── Hero ── */}
      <motion.section variants={item}>
        <div className="relative overflow-hidden rounded-3xl border border-[rgba(0,0,0,0.05)] bg-gradient-to-br from-[#FAFAFF] to-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:border-white/[0.05] dark:from-[#0d0d0e] dark:to-[#0d0d0e]">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/[0.04] blur-3xl" />
          <div className="relative z-10 flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex-1">
              <div className="flex items-start gap-5">
                <div className="block md:hidden">
                  <Avatar src={p?.profile_photo_url} name={name} size="lg" rounded="2xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#6B7280] dark:text-white/50">{greeting()}</p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#101225] dark:text-white md:text-3xl">
                    {firstName}
                  </h1>
                  <p className="mt-1 text-sm text-[#6B7280] dark:text-white/40">Here&apos;s your academic overview.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {chips.map((c) => (
                      <span
                        key={c.label}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,0,0,0.05)] bg-white px-3 py-1.5 text-xs font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)] dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white/60"
                      >
                        <span className="text-[#8B8FA3] dark:text-white/40">{c.label}</span>
                        <span className="font-semibold text-[#101225] dark:text-white/80">{c.value}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden shrink-0 md:block">
              <Avatar src={p?.profile_photo_url} name={name} size="xl" rounded="2xl" />
            </div>
            <div className="flex shrink-0 items-center gap-4 md:flex-col md:items-end">
              <div className="flex items-center gap-3">
                <MiniRing value={healthScore} size={72} />
                <div>
                  <p className="text-sm font-semibold text-[#6B7280] dark:text-white/50">Academic Health</p>
                  <p className="text-2xl font-bold text-[#101225] dark:text-white">
                    <AnimatedCounter value={healthScore} suffix="%" />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── KPI Grid ── */}
      <motion.section variants={item} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={GraduationCap}
          label="CGPA"
          value={`${cgpa.toFixed(2)}`}
          ringValue={cgpa * 10}
          subtitle={sgpa >= cgpa && sgpa > 0 ? "SGPA improving ↑" : `${cgpa > 0 ? "Current GPA" : "No data yet"}`}
        />
        <KpiCard
          icon={TrendingUp}
          label="SGPA"
          value={sgpa > 0 ? sgpa.toFixed(2) : "—"}
          ringValue={sgpa * 10}
          subtitle={sgpa > 0 ? "Current semester" : "Not available"}
        />
        <KpiCard
          icon={CalendarDays}
          label="Attendance"
          value={`${clampScore(attendance)}%`}
          ringValue={attendance}
          subtitle={attendance >= 75 ? "Eligibility stable" : attendance > 0 ? "Needs improvement" : "No data"}
        />
        <KpiCard
          icon={Layers}
          label="Credits"
          value={`${credits}`}
          ringValue={totalCredits > 0 ? (credits / totalCredits) * 100 : 0}
          subtitle={`${totalCredits - credits} remaining of ${totalCredits}`}
        />
      </motion.section>

      {/* ── SGPA Trend ── */}
      {chartData.length > 1 && (
        <motion.section variants={item}>
          <div className={glassCard("p-6")}>
            <SectionHeader label="Performance Trend" title="SGPA & CGPA Progression" />
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="sgpaGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="cgpaGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#111827" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#111827" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#F0EEFF" vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#8B8FA3", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8B8FA3", fontSize: 12 }} domain={[0, "auto"]} />
                  <Tooltip
                    contentStyle={{
                      border: "1px solid rgba(0,0,0,0.06)",
                      borderRadius: 16,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                      background: "rgba(255,255,255,0.9)",
                      backdropFilter: "blur(12px)",
                    }}
                  />
                  <Area type="monotone" dataKey="sgpa" stroke={PRIMARY} strokeWidth={2.5} fill="url(#sgpaGrad)" name="SGPA" />
                  <Area type="monotone" dataKey="cgpa" stroke="#111827" strokeWidth={2} fill="url(#cgpaGrad)" name="CGPA" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.section>
      )}

      {/* ── Subject Performance + AI Recommendations ── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {subjectCards.length > 0 && (
          <motion.section variants={item}>
            <div className={glassCard("p-6")}>
              <SectionHeader label="Course Load" title={`${subjectCards.length} Active Subjects`} />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {subjectCards.map((s) => (
                  <div
                    key={s.code}
                    className="group rounded-xl border border-[rgba(0,0,0,0.05)] bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_4px_16px_rgba(109,93,246,0.08)] dark:border-white/[0.05] dark:bg-white/[0.02] dark:hover:border-primary/30"
                  >
                    <div className="flex items-start justify-between">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/15">
                        <BookOpen size={16} />
                      </div>
                      <span className="rounded-md bg-[#F0EEFF] px-2 py-0.5 text-[11px] font-medium text-primary/80 dark:bg-white/[0.04] dark:text-primary/60">
                        {s.credits} cr
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-medium text-[#8B8FA3] dark:text-white/40">{s.code}</p>
                    <p className="mt-0.5 text-sm font-semibold text-[#101225] dark:text-white/90">{s.name}</p>
                    <p className="mt-2 text-xs text-[#8B8FA3] dark:text-white/40">{s.type} &middot; {s.faculty}</p>
                  </div>
                ))}
              </div>
              <Link
                to="/app/student/internal-marks"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                View detailed marks <ArrowRight size={14} />
              </Link>
            </div>
          </motion.section>
        )}

        {/* ── AI Recommendations ── */}
        {(recommendations.length > 0 || healthScore > 0) && (
          <motion.section variants={item}>
            <div className={glassCard("p-6")}>
              <SectionHeader label="AI Insights" title="Recommendations" />
              <div className="space-y-3">
                {recommendations.length > 0 ? (
                  recommendations.slice(0, 4).map((r: any, i: number) => (
                    <div
                      key={i}
                      className="group rounded-xl border border-[rgba(0,0,0,0.04)] bg-white p-4 transition-all duration-200 hover:border-primary/15 hover:shadow-[0_2px_8px_rgba(109,93,246,0.06)] dark:border-white/[0.04] dark:bg-white/[0.015] dark:hover:border-primary/20"
                    >
                      <div className="flex items-start gap-3">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                          <Brain size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#101225] dark:text-white/90">{r.title}</p>
                          <p className="mt-0.5 text-xs text-[#8B8FA3] dark:text-white/40">{r.reason || r.action}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : healthScore < 80 && (
                  <div className="rounded-xl border border-[rgba(0,0,0,0.04)] bg-white p-4 dark:border-white/[0.04] dark:bg-white/[0.015]">
                    <div className="flex items-start gap-3">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                        <Target size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#101225] dark:text-white/90">Improve Academic Score</p>
                        <p className="mt-0.5 text-xs text-[#8B8FA3] dark:text-white/40">
                          Focus on attendance and CGPA to boost your overall academic health.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        )}
      </div>

      {/* ── Academic Timeline + Upcoming ── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        {/* Timeline */}
        {timeline.length > 0 && (
          <motion.section variants={item}>
            <div className={glassCard("p-6")}>
              <SectionHeader label="Milestones" title="Academic Timeline" />
              <div className="flex items-start gap-1 overflow-x-auto pb-2">
                {timeline.map((t, i) => (
                  <div key={i} className="flex items-center">
                    <div
                      className={cn(
                        "relative min-w-[130px] rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5",
                        t.active
                          ? "border-primary/30 bg-primary/5 shadow-[0_4px_16px_rgba(109,93,246,0.10)] dark:border-primary/30 dark:bg-primary/[0.06]"
                          : "border-[rgba(0,0,0,0.05)] bg-white dark:border-white/[0.05] dark:bg-white/[0.02]",
                      )}
                    >
                      {t.active && (
                        <span className="absolute -top-2 left-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                          Current
                        </span>
                      )}
                      <p className="text-xs font-semibold text-[#8B8FA3] dark:text-white/40">{t.label}</p>
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#6B7280] dark:text-white/50">SGPA</span>
                          <span className="font-semibold text-[#101225] dark:text-white/80">{t.sgpa > 0 ? t.sgpa.toFixed(2) : "—"}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#6B7280] dark:text-white/50">CGPA</span>
                          <span className="font-semibold text-[#101225] dark:text-white/80">{t.cgpa > 0 ? t.cgpa.toFixed(2) : "—"}</span>
                        </div>
                      </div>
                    </div>
                    {i < timeline.length - 1 && (
                      <div className="mx-1 h-px w-6 bg-gradient-to-r from-primary/40 to-primary/10" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* Upcoming / Faculty Support */}
        <motion.section variants={item}>
          <div className={glassCard("p-6")}>
            <SectionHeader label="Support" title="Faculty & Updates" />
            <div className="space-y-4">
              {facultyAdvisor ? (
                <div className="flex items-center gap-4 rounded-xl border border-[rgba(0,0,0,0.04)] bg-white p-4 dark:border-white/[0.04] dark:bg-white/[0.015]">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <UserRound size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#101225] dark:text-white/90">Faculty Advisor</p>
                    <p className="text-sm text-[#6B7280] dark:text-white/50">{facultyAdvisor}</p>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Attendance", path: "/app/student/attendance", icon: CalendarDays },
                  { label: "CGPA", path: "/app/student/cgpa-analytics", icon: LineChart },
                  { label: "Assignments", path: "/app/student/assignments", icon: FileText },
                  { label: "Timetable", path: "/app/student/timetable", icon: Clock },
                ].map((link) => (
                  <Link
                    key={link.label}
                    to={link.path}
                    className="flex items-center gap-3 rounded-xl border border-[rgba(0,0,0,0.04)] bg-white p-3 text-sm font-medium text-[#6B7280] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/15 hover:text-primary hover:shadow-[0_4px_12px_rgba(109,93,246,0.06)] dark:border-white/[0.04] dark:bg-white/[0.015] dark:text-white/50 dark:hover:border-primary/20 dark:hover:text-primary"
                  >
                    <link.icon size={16} />
                    <span>{link.label}</span>
                    <ChevronRight size={14} className="ml-auto opacity-40" />
                  </Link>
                ))}
              </div>

              {upcomingItems.length > 0 && (
                <div className="pt-2">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#8B8FA3] dark:text-white/40">
                    Recent Updates
                  </p>
                  <div className="space-y-2">
                    {upcomingItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/5 text-primary/60">
                          <item.icon size={13} />
                        </div>
                        <span className="text-[#6B7280] dark:text-white/50">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}

/* ── Sub-components ── */

function KpiCard({
  icon: Icon,
  label,
  value,
  ringValue,
  subtitle,
}: {
  icon: any;
  label: string;
  value: string;
  ringValue: number;
  subtitle: string;
}) {
  return (
    <motion.div
      variants={item}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-5 transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_8px_24px_rgba(109,93,246,0.08)]",
        "dark:border-white/[0.06] dark:bg-[#0d0d0e] dark:hover:border-primary/30 dark:hover:shadow-[0_8px_24px_rgba(109,93,246,0.04)]",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary">
          <Icon size={18} />
        </div>
        <MiniRing value={ringValue} size={48} />
      </div>
      <p className="mt-4 text-xs font-medium text-[#8B8FA3] dark:text-white/40">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-[#101225] dark:text-white">{value}</p>
      <p className="mt-1.5 text-xs text-[#6B7280] dark:text-white/50">{subtitle}</p>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <div className="h-40 animate-pulse rounded-3xl bg-[#F4F2FF]/60 dark:bg-white/[0.03]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-[#F8F7FF]/50 dark:bg-white/[0.02]" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-[#F8F7FF]/50 dark:bg-white/[0.02]" />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="h-64 animate-pulse rounded-2xl bg-[#F8F7FF]/50 dark:bg-white/[0.02]" />
        <div className="h-64 animate-pulse rounded-2xl bg-[#F8F7FF]/50 dark:bg-white/[0.02]" />
      </div>
    </div>
  );
}
