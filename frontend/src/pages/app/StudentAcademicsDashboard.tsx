import { useMemo } from "react";
import type { ElementType, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  ClipboardList,
  FileText,
  GraduationCap,
  Layers,
  UserRound,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../../api/client";
import { AnimatedCounter } from "../../components/ui/AnimatedCounter";
import { Avatar } from "../../components/ui/Avatar";
import { useAuth } from "../../context/AuthContext";
import { useStudentProfile } from "../../context/StudentProfileContext";
import { cn } from "../../utils/cn";
import type { Dashboard } from "../../types";

const PRIMARY = "#6D5DF6";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.055 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1 },
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function scoreTone(score: number) {
  if (score >= 80) return "#16A34A";
  if (score >= 60) return PRIMARY;
  if (score >= 40) return "#F59E0B";
  return "#EF4444";
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function getGreetingIcon() {
  const hour = new Date().getHours();
  if (hour < 12) return "☀️";
  if (hour < 17) return "🌤️";
  return "🌙";
}

export function StudentAcademicsDashboard() {
  const { user } = useAuth();
  const { profile, loading } = useStudentProfile();

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: async () => (await api.get<Dashboard>("/student/dashboard")).data,
    enabled: !!profile,
  });

  const p = profile;
  const name = dashboardData?.user?.full_name || user?.full_name || "Student";
  const firstName = name.split(" ")[0] || "Student";
  const cgpa = asNumber(p?.cgpa);
  const sgpa = asNumber(p?.current_semester_gpa);
  const attendance = asNumber(p?.attendance_percentage);
  const credits = asNumber(p?.credits_earned);
  const totalCredits = asNumber(p?.total_credits, 180) || 180;
  const creditsScore = totalCredits > 0 ? (credits / totalCredits) * 100 : 0;
  const skillScore = asNumber(p?.skill_score);
  const subjects = p?.subjects_data || [];
  const semesterGpas = p?.semester_gpas || [];
  const roadmap = dashboardData?.roadmap || [];
  const notifications = dashboardData?.notifications || [];
  const activities = dashboardData?.activities || [];

  const timeline = useMemo(() => {
    if (semesterGpas.length) {
      return semesterGpas.map((sem: any, index) => ({
        label: sem.semester || `Semester ${index + 1}`,
        cgpa: asNumber(sem.cgpa ?? sem.sgpa),
        sgpa: asNumber(sem.sgpa ?? sem.cgpa),
        credits: asNumber(sem.credits),
        active: String(sem.semester || "").includes(String(p?.semester || "")),
      }));
    }
    return Array.from({ length: Math.max(asNumber(p?.semester, 1), 1) }, (_, index) => ({
      label: `Semester ${index + 1}`,
      cgpa: index + 1 === p?.semester ? cgpa : 0,
      sgpa: index + 1 === p?.semester ? sgpa : 0,
      credits: index + 1 === p?.semester ? credits : 0,
      active: index + 1 === p?.semester,
    }));
  }, [semesterGpas, p?.semester, cgpa, sgpa, credits]);

  const analyticsData = timeline.map((item, index) => {
    const attendanceTrend = clampScore(attendance - Math.max(timeline.length - index - 1, 0) * 2);
    return {
      name: item.label.replace("Semester ", "Sem "),
      attendance: attendanceTrend,
      cgpa: item.cgpa ? item.cgpa * 10 : cgpa * 10,
      credits: item.credits || Math.min(credits, Math.round(((index + 1) / Math.max(timeline.length, 1)) * credits)),
    };
  });

  const chartLegend = [
    { label: "Attendance Trend", color: PRIMARY },
    { label: "CGPA Trend", color: "#111827" },
    { label: "Credits Earned", color: "#0EA5E9" },
  ];

  const recentActivity = [
    ...activities.map((activity: any) => ({
      label: activity.action || activity.title || "Activity",
      meta: activity.timestamp || activity.type || "Recently",
      icon: Clock,
    })),
    ...roadmap.slice(0, 3).map((item: any) => ({
      label: item.step || item.title || "Roadmap item",
      meta: item.status || "In progress",
      icon: CheckCircle2,
    })),
  ].slice(0, 8);

  const upcomingEvents = [
    ...subjects.slice(0, 3).map((subject: any) => ({ label: subject.name || subject.code || "Subject", meta: subject.type || "Class", icon: BookOpen })),
    ...notifications.slice(0, 3).map((item: any) => ({ label: item.title || item.message || "Notification", meta: item.type || "Campus", icon: Bell })),
    ...roadmap.slice(0, 2).map((item: any) => ({ label: item.step || item.title || "Deadline", meta: item.status || "Upcoming", icon: CalendarDays })),
  ].slice(0, 7);

  const subjectPerformance = subjects.length
    ? subjects.slice(0, 6).map((subject: any, index) => ({
        subject: subject.code || subject.name || `Subject ${index + 1}`,
        performance: clampScore((cgpa || sgpa || 7) * 10 - index * 3 + (attendance >= 75 ? 4 : -4)),
      }))
    : [
        { subject: "Core", performance: clampScore(cgpa * 10 || 72) },
        { subject: "Labs", performance: clampScore(sgpa * 10 || 76) },
        { subject: "Projects", performance: clampScore(skillScore || 68) },
      ];

  const academicTasks = [
    ...subjects.slice(0, 2).map((subject: any) => ({
      label: subject.name || subject.code || "Subject review",
      meta: subject.type || "Upcoming class",
      icon: BookOpen,
    })),
    ...roadmap.slice(0, 2).map((item: any) => ({
      label: item.step || item.title || "Academic milestone",
      meta: item.status || "In progress",
      icon: CheckCircle2,
    })),
    ...notifications.slice(0, 2).map((item: any) => ({
      label: item.title || item.message || "Campus update",
      meta: item.type || "Notification",
      icon: CalendarDays,
    })),
  ].slice(0, 5);

  const heroChips = [
    { label: "Department", value: p?.department || "Not set" },
    { label: "Year", value: p?.year ? `Year ${p.year}` : "Not set" },
    { label: "Semester", value: p?.semester ? `Semester ${p.semester}` : "Not set" },
    { label: "Roll No.", value: p?.roll_number || "Not set" },
    { label: "Section", value: p?.section || "Not set" },
  ];
  const academicModules = [
    { icon: CalendarDays, title: "Attendance", detail: `${clampScore(attendance)}% current attendance`, value: `${clampScore(attendance)}%` },
    { icon: GraduationCap, title: "SGPA / CGPA", detail: `SGPA ${sgpa ? sgpa.toFixed(2) : "0.00"} • CGPA ${cgpa ? cgpa.toFixed(2) : "0.00"}`, value: cgpa ? cgpa.toFixed(2) : "0.00" },
    { icon: Layers, title: "Credits", detail: `${Math.max(totalCredits - credits, 0)} credits remaining`, value: `${credits}/${totalCredits}` },
    { icon: BookOpen, title: "Subjects", detail: `${subjects.length} active subjects`, value: String(subjects.length) },
    { icon: FileText, title: "Internal Marks", detail: "Current semester assessment tracking", value: sgpa ? `${Math.round(sgpa * 10)}%` : "0%" },
    { icon: Award, title: "Semester Results", detail: `${timeline.length} semester records`, value: String(timeline.length) },
    { icon: ClipboardList, title: "Assignments", detail: `${academicTasks.length} academic workload items`, value: String(academicTasks.length) },
    { icon: Clock, title: "Timetable", detail: "Classes and lab schedule", value: p?.section || "—" },
    { icon: UserRound, title: "Faculty", detail: p?.faculty_advisor || "Faculty advisor not assigned", value: p?.faculty_advisor ? "Set" : "—" },
    { icon: CheckCircle2, title: "Exams", detail: `${upcomingEvents.length} upcoming academic items`, value: String(upcomingEvents.length) },
    { icon: CalendarDays, title: "Academic Calendar", detail: p?.academic_year || "Academic year not set", value: p?.academic_year || "—" },
  ];

  if (loading || dashboardLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="relative min-h-screen space-y-6 bg-white pb-8 font-sans text-[#101225]"
    >
      <motion.section variants={itemVariants} className="relative rounded-[32px] border border-[#EEF0F5] bg-[#F8F9FC] p-5 pr-28 shadow-[0_18px_50px_rgba(16,18,37,0.045)] md:pr-36">
        <div className="absolute right-5 top-5 rounded-[28px] border border-white bg-white p-2 shadow-[0_14px_38px_rgba(16,18,37,0.08)]">
          <Avatar src={p?.profile_photo_url} name={name} size="lg" rounded="2xl" />
        </div>
        <p className="text-sm font-semibold text-[#6B7280]">{getGreeting()} <span aria-hidden>{getGreetingIcon()}</span></p>
        <h1 className="mt-2 text-3xl font-bold leading-tight tracking-normal text-[#101225] md:text-[42px]">
          Welcome back, {firstName} <span aria-hidden>👋</span>
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#6B7280]">Here's your academic snapshot for today.</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {heroChips.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-2 rounded-full border border-[#ECEBFF] bg-white px-3.5 py-2 text-xs shadow-[0_8px_22px_rgba(16,18,37,0.035)]">
              <span className="font-semibold text-[#8B8FA3]">{item.label}</span>
              <span className="font-bold text-[#101225]">{item.value}</span>
            </span>
          ))}
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={CalendarDays} label="Attendance" value={attendance} suffix="%" detail="Weekly trend" progress={attendance} trend={attendance >= 75 ? "Stable eligibility signal" : "Needs recovery this week"} />
        <MetricCard icon={GraduationCap} label="CGPA" value={cgpa} decimals={2} detail="Semester trend" progress={cgpa * 10} trend={sgpa && cgpa && sgpa >= cgpa ? "Current SGPA is improving" : "Focus subjects this week"} />
        <MetricCard icon={Layers} label="Credits" value={credits} detail={`${Math.max(totalCredits - credits, 0)} credits remaining`} progress={creditsScore} trend={`${credits}/${totalCredits} completed`} />
        <MetricCard icon={BookOpen} label="Subjects" value={subjects.length} detail="Active academic modules" progress={Math.min(subjects.length * 12, 100)} trend={subjects.length ? "Current semester subjects loaded" : "No subjects saved yet"} />
      </motion.section>

      <motion.section variants={itemVariants}>
        <SectionHeader eyebrow="Academic Modules" title="Academic command center" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {academicModules.map((item) => (
            <ModuleCard key={item.title} {...item} />
          ))}
        </div>
      </motion.section>

      <motion.section variants={itemVariants}>
        <SectionHeader eyebrow="Academic Timeline" title="Semester roadmap" />
        <GlassPanel className="overflow-x-auto p-5 premium-scrollbar">
          <div className="flex min-w-[760px] items-center gap-3">
            {timeline.map((item, index) => (
              <div key={`${item.label}-${index}`} className="flex flex-1 items-center">
                <motion.div
                  whileHover={{ y: -4 }}
                  className={cn(
                    "relative min-h-[116px] flex-1 rounded-[24px] border p-4",
                    item.active ? "border-[#6D5DF6] bg-[#6D5DF6] text-white shadow-[0_16px_36px_rgba(109,93,246,0.22)]" : "border-[#ECEBFF] bg-white text-[#101225]",
                  )}
                >
                  {item.active && <div className="absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.32),transparent_36%)]" />}
                  <p className={cn("relative text-xs font-bold uppercase tracking-[0.16em]", item.active ? "text-white/75" : "text-[#8B8FA3]")}>{item.active ? "Current" : "Milestone"}</p>
                  <h3 className="relative mt-3 text-lg font-bold">{item.label}</h3>
                  <p className={cn("relative mt-3 text-sm", item.active ? "text-white/80" : "text-[#6B7280]")}>CGPA {item.cgpa || "—"} • SGPA {item.sgpa || "—"}</p>
                </motion.div>
                {index < timeline.length - 1 && <div className="h-px w-8 bg-gradient-to-r from-[#DDD6FE] to-[#6D5DF6]/50" />}
              </div>
            ))}
          </div>
        </GlassPanel>
      </motion.section>

      <motion.section variants={itemVariants}>
        <SectionHeader eyebrow="Performance Analytics" title="Live academic signal graph" />
        <GlassPanel className="p-6">
          <div className="mb-5 flex flex-wrap gap-3">
            {chartLegend.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-2 rounded-full border border-[#ECEBFF] bg-white/70 px-3 py-1.5 text-xs font-bold text-[#6B7280]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
          {analyticsData.length ? (
            <ResponsiveContainer width="100%" height={360}>
              <AreaChart data={analyticsData}>
                <defs>
                  <linearGradient id="purpleArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.32} />
                    <stop offset="95%" stopColor={PRIMARY} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="creditArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#F1F0FF" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#8B8FA3", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8B8FA3", fontSize: 12 }} />
                <Tooltip contentStyle={{ border: "1px solid #ECEBFF", borderRadius: 18, boxShadow: "0 18px 45px rgba(16,18,37,0.08)" }} />
                <Area type="monotone" dataKey="attendance" name="Attendance Trend" stroke={PRIMARY} strokeWidth={3} fill="url(#purpleArea)" />
                <Area type="monotone" dataKey="credits" name="Credits Earned" stroke="#0EA5E9" strokeWidth={2.5} fill="url(#creditArea)" />
                <Line type="monotone" dataKey="cgpa" name="CGPA Trend" stroke="#111827" strokeWidth={3} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label="Performance analytics appears after semester data is saved." />
          )}
        </GlassPanel>
      </motion.section>

      <motion.section variants={itemVariants}>
        <SectionHeader eyebrow="Academic Overview" title="Semester performance and workload" />
        <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
          <GlassPanel className="p-6">
            <SectionHeader eyebrow="Semester-wise SGPA" title="SGPA and CGPA trend" compact />
            <div className="mt-5 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData}>
                  <CartesianGrid stroke="#EEF0F5" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#8B8FA3", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8B8FA3", fontSize: 12 }} />
                  <Tooltip contentStyle={{ border: "1px solid #ECEBFF", borderRadius: 18 }} />
                  <Area type="monotone" dataKey="cgpa" name="CGPA Trend" stroke={PRIMARY} strokeWidth={3} fill="rgba(109,93,246,0.10)" />
                  <Line type="monotone" dataKey="attendance" name="Attendance Trend" stroke="#111827" strokeWidth={2.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>
          <GlassPanel className="p-6">
            <SectionHeader eyebrow="Credits Progress" title={`${credits}/${totalCredits} credits earned`} compact />
            <div className="mt-6 grid gap-5 sm:grid-cols-[150px_1fr] sm:items-center">
              <MiniRing value={creditsScore} size={140} />
              <div className="space-y-4">
                <ProgressRow label="Attendance Trend" value={attendance} suffix="%" />
                <ProgressRow label="Current SGPA" value={sgpa * 10} suffix="%" />
                <ProgressRow label="Credits Completed" value={creditsScore} suffix="%" />
              </div>
            </div>
          </GlassPanel>
          <GlassPanel className="p-6">
            <SectionHeader eyebrow="Subject Performance" title="Current semester subjects" compact />
            <div className="mt-5 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformance}>
                  <CartesianGrid stroke="#EEF0F5" vertical={false} />
                  <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: "#8B8FA3", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8B8FA3", fontSize: 12 }} />
                  <Tooltip contentStyle={{ border: "1px solid #ECEBFF", borderRadius: 18 }} />
                  <Bar dataKey="performance" name="Performance" fill={PRIMARY} radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>
          <GlassPanel className="p-6">
            <SectionHeader eyebrow="Upcoming Exams & Assignments" title="Academic workload" compact />
            <Timeline items={academicTasks} empty="No academic workload items available yet." />
          </GlassPanel>
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="grid gap-6 xl:grid-cols-[1fr_.9fr]">
        <GlassPanel className="max-h-[520px] overflow-y-auto p-6">
          <SectionHeader eyebrow="Recent Activities" title="Live timeline" compact />
          <Timeline items={recentActivity} empty="No recent activities available yet." />
        </GlassPanel>
        <GlassPanel className="max-h-[520px] overflow-y-auto p-6">
          <SectionHeader eyebrow="Upcoming Events" title="Calendar timeline" compact />
          <Timeline items={upcomingEvents} empty="No upcoming events available yet." />
        </GlassPanel>
      </motion.section>
    </motion.div>
  );
}

function GlassPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "rounded-[30px] border border-[#ECEBFF] bg-white shadow-[0_18px_50px_rgba(16,18,37,0.055)]",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

function SectionHeader({ eyebrow, title, compact = false }: { eyebrow: string; title: string; compact?: boolean }) {
  return (
    <div className={cn(!compact && "mb-5")}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6D5DF6]">{eyebrow}</p>
      <h2 className={cn("mt-2 font-bold tracking-normal text-[#101225]", compact ? "text-2xl" : "text-3xl")}>{title}</h2>
    </div>
  );
}

function ProgressRow({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  const progress = clampScore(value);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-[#6B7280]">{label}</span>
        <span className="text-sm font-bold text-[#101225]"><AnimatedCounter value={progress} suffix={suffix} /></span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF0F5]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="h-full rounded-full bg-[#6D5DF6]"
        />
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, suffix = "", decimals = 0, detail, progress, trend }: { icon: ElementType; label: string; value: number; suffix?: string; decimals?: number; detail: string; progress: number; trend: string }) {
  return (
    <GlassPanel className="group p-5 transition hover:-translate-y-1 hover:shadow-[0_24px_54px_rgba(16,18,37,0.08)]">
      <div className="flex items-start justify-between">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#6D5DF6]/10 text-[#6D5DF6]">
          <Icon size={20} />
        </div>
        <MiniRing value={progress} size={62} />
      </div>
      <p className="mt-5 text-sm font-semibold text-[#6B7280]">{label}</p>
      <p className="mt-2 text-4xl font-bold text-[#101225]">
        <AnimatedCounter value={value || 0} suffix={suffix} decimals={decimals} />
      </p>
      <p className="mt-3 text-sm font-semibold text-[#6D5DF6]">{detail}</p>
      <p className="mt-1 text-xs text-[#8B8FA3]">{trend}</p>
    </GlassPanel>
  );
}

function MiniRing({ value, size = 72 }: { value: number; size?: number }) {
  return (
    <div style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ value: clampScore(value), fill: scoreTone(value) }]} startAngle={90} endAngle={-270}>
          <RadialBar dataKey="value" cornerRadius={14} background={{ fill: "#F0EEFF" }} />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ModuleCard({ icon: Icon, title, detail, value }: { icon: ElementType; title: string; detail: string; value: string }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="rounded-[24px] border border-[#ECEBFF] bg-white p-4 shadow-[0_14px_40px_rgba(16,18,37,0.04)]">
      <div className="flex items-center justify-between">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F5F3FF] text-[#6D5DF6]">
          <Icon size={18} />
        </div>
        <span className="max-w-[84px] truncate text-right text-sm font-bold text-[#101225]">{value}</span>
      </div>
      <h3 className="mt-4 text-base font-bold text-[#101225]">{title}</h3>
      <p className="mt-1 min-h-[40px] text-sm leading-5 text-[#6B7280]">{detail}</p>
    </motion.div>
  );
}

function Timeline({ items, empty }: { items: { label: string; meta: string; icon: ElementType }[]; empty: string }) {
  if (!items.length) return <EmptyState label={empty} />;
  return (
    <div className="mt-6 space-y-4">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={`${item.label}-${index}`} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F4F2FF] text-[#6D5DF6]">
                <Icon size={17} />
              </div>
              {index < items.length - 1 && <div className="mt-2 h-8 w-px bg-[#E7E4FF]" />}
            </div>
            <motion.div whileHover={{ x: 3 }} className="flex-1 rounded-[22px] border border-[#ECEBFF] bg-white/70 p-4 shadow-[0_10px_30px_rgba(16,18,37,0.035)]">
              <p className="text-sm font-bold text-[#101225]">{item.label}</p>
              <p className="mt-1 text-xs font-semibold text-[#8B8FA3]">{item.meta}</p>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#D8D2FF] bg-[#FAFAFF] p-6 text-center text-sm font-semibold text-[#8B8FA3]">
      {label}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 bg-white">
      <div className="h-16 animate-pulse rounded-[30px] bg-[#F4F2FF]" />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="h-72 animate-pulse rounded-[32px] bg-[#F8F7FF]" />
        <div className="h-72 animate-pulse rounded-[32px] bg-[#F8F7FF]" />
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-48 animate-pulse rounded-[30px] bg-[#F8F7FF]" />)}
      </div>
      <div className="h-96 animate-pulse rounded-[30px] bg-[#F8F7FF]" />
    </div>
  );
}
