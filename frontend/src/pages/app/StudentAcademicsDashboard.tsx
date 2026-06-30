import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Award, BookOpen, Brain, CalendarDays, ChevronDown, ChevronRight,
  FileText, GraduationCap, Layers, Sparkles, Target, TrendingUp, User,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api } from "../../api/client";
import { Card } from "../../components/ui/Card";
import { useAuth } from "../../context/AuthContext";
import type { Dashboard } from "../../types";

const COLORS = ["#6C4CF1", "#3B82F6", "#8B5CF6", "#22C55E", "#F59E0B", "#EF4444"];

const semesterCgpaData = [
  { semester: "Sem 1", cgpa: 7.2 },
  { semester: "Sem 2", cgpa: 7.6 },
  { semester: "Sem 3", cgpa: 7.8 },
  { semester: "Sem 4", cgpa: 8.0 },
  { semester: "Sem 5", cgpa: 8.2 },
  { semester: "Sem 6", cgpa: 8.3 },
  { semester: "Sem 7", cgpa: 8.4 },
  { semester: "Sem 8", cgpa: 8.5 },
];

const monthlyAttendance = [
  { month: "Jan", percentage: 82, attended: 41, total: 50 },
  { month: "Feb", percentage: 86, attended: 43, total: 50 },
  { month: "Mar", percentage: 88, attended: 44, total: 50 },
  { month: "Apr", percentage: 91, attended: 46, total: 50 },
  { month: "May", percentage: 93, attended: 47, total: 50 },
  { month: "Jun", percentage: 92, attended: 46, total: 50 },
];

const subjectMarks = [
  { subject: "Machine Learning", internal: 42, external: 45, total: 87, grade: "A" },
  { subject: "Deep Learning", internal: 38, external: 42, total: 80, grade: "A" },
  { subject: "Data Structures", internal: 45, external: 48, total: 93, grade: "S" },
  { subject: "Database Systems", internal: 40, external: 40, total: 80, grade: "A" },
  { subject: "Computer Networks", internal: 36, external: 38, total: 74, grade: "B+" },
  { subject: "Software Engineering", internal: 44, external: 42, total: 86, grade: "A" },
];

const creditsData = [
  { name: "Completed", value: 148, color: "#6C4CF1" },
  { name: "Remaining", value: 32, color: "#E5E7EB" },
];

const heatmapData = Array.from({ length: 28 }, (_, i) => ({
  day: i + 1,
  value: [92, 88, 96, 78, 84, 90, 75][i % 7],
  date: new Date(2025, 5, i + 1),
}));

const aiInsights = [
  { icon: Brain, text: "Improve DSA to increase placement readiness by 12%.", color: "from-[#6C4CF1] to-[#8B5CF6]" },
  { icon: FileText, text: "Resume ATS score is low. Update projects section.", color: "from-[#3B82F6] to-[#60A5FA]" },
  { icon: Award, text: "You are eligible for 24 companies this placement season.", color: "from-[#22C55E] to-[#4ADE80]" },
  { icon: BookOpen, text: "Complete DBMS revision. Internal exams are in 2 weeks.", color: "from-[#F59E0B] to-[#FBBF24]" },
  { icon: CalendarDays, text: "Mock Interview scheduled for Friday. Prepare well!", color: "from-[#EF4444] to-[#F87171]" },
];

const defaultData: Dashboard = {
  role: "STUDENT",
  user: { full_name: "Arun Sudhaveni" },
  profile: { department: "AIML", year: 4, roll_number: "21AIML001", current_semester: 8 },
  overall: { successScore: 85, placementReadiness: 78, academicRisk: "Low", aiConfidence: 92, nextBestAction: "Complete system design learning sprint this week." },
  kpis: [
    { label: "CGPA", value: "8.45", trend: "+0.3", progress: 84 },
    { label: "Attendance", value: "92%", trend: "+4%", progress: 92 },
    { label: "Current SGPA", value: "8.7", trend: "+0.2", progress: 87 },
    { label: "Credits Earned", value: "148", trend: "+18", progress: 82 },
    { label: "Subjects", value: "6", trend: "Active", progress: 100 },
    { label: "Class Rank", value: "#12", trend: "+3", progress: 78 },
  ],
  charts: {},
  recommendations: [],
  roadmap: [],
  placementReadiness: { resumeQuality: 81, mockInterviewScore: 72, technicalSkills: 76, communication: 68, projectStrength: 88 },
  activities: [],
  tables: {},
  notifications: [],
  predictions: [],
};

export function StudentAcademicsDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: async () => (await api.get<Dashboard>("/student/dashboard")).data,
  });

  const d = data && data.user?.full_name ? { ...defaultData, ...data, profile: data.profile ?? defaultData.profile } : defaultData;
  const profile = d.profile!;
  const name = d.user?.full_name || user?.full_name || "Student";

  const [cgpaView, setCgpaView] = useState<"overall" | "semester">("overall");
  const [attendanceView, setAttendanceView] = useState<"overall" | "monthly">("overall");
  const [attendanceMonth, setAttendanceMonth] = useState("Jun");

  const cgpaChartData = cgpaView === "overall"
    ? [{ name: "CGPA", value: 8.45, fill: "#6C4CF1" }]
    : semesterCgpaData;

  const attData = attendanceView === "overall"
    ? [{ name: "Attendance", value: 92, fill: "#6C4CF1" }]
    : monthlyAttendance.find((m) => m.month === attendanceMonth)
      ? [{ name: attendanceMonth, percentage: monthlyAttendance.find((m) => m.month === attendanceMonth)!.percentage, attended: monthlyAttendance.find((m) => m.month === attendanceMonth)!.attended, total: monthlyAttendance.find((m) => m.month === attendanceMonth)!.total }]
      : [];

  if (isLoading) return <AcademicsSkeleton />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#6C4CF1]/15 bg-[#6C4CF1]/5 px-3.5 py-1.5 text-xs font-semibold text-[#6C4CF1]">
            <Sparkles size={13} /> AI-Powered Academic Intelligence
          </div>
          <h2 className="text-[32px] font-bold tracking-tight text-[#111827]">Welcome back, {name.split(" ")[0]}</h2>
          <div className="mt-2 flex items-center gap-2 text-sm text-[#6B7280]">
            <span className="font-semibold text-[#111827]">{name}</span>
            <span className="text-[#D1D5DB]">•</span>
            <span>{profile.department}</span>
            <span className="text-[#D1D5DB]">•</span>
            <span>{profile.year}{profile.year === 1 ? "st" : profile.year === 2 ? "nd" : profile.year === 3 ? "rd" : "th"} Year</span>
            <span className="text-[#D1D5DB]">•</span>
            <span>Sem {profile.current_semester}</span>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6B7280]">
            Your AI-powered academic control center. Track CGPA, attendance, internal marks, and semester performance in real-time.
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-[#E8ECF1] bg-white px-4 py-2.5 text-sm font-medium text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]">
            <CalendarDays size={15} /> This Semester
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#6C4CF1]/25 transition hover:shadow-xl hover:shadow-[#6C4CF1]/30">
            <Sparkles size={15} /> Generate Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {/* CGPA Card */}
        <Card className="group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-[#6B7280]">CGPA</p>
            <div className="relative">
              <select
                value={cgpaView}
                onChange={(e) => setCgpaView(e.target.value as any)}
                className="appearance-none rounded-lg border border-[#E8ECF1] bg-white px-2.5 py-1 pr-6 text-[11px] font-semibold text-[#6C4CF1] outline-none cursor-pointer"
              >
                <option value="overall">Overall</option>
                <option value="semester">Semester Wise</option>
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#6C4CF1]" />
            </div>
          </div>
          <p className="text-[32px] font-bold tracking-tight text-[#111827]">
            {cgpaView === "overall" ? "8.45" : "8.5"}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#22C55E]">
            <TrendingUp size={13} /> +0.3 vs last sem
          </div>
          {cgpaView === "semester" && (
            <div className="mt-4">
              <select
                value="Sem 8"
                onChange={() => {}}
                className="w-full rounded-lg border border-[#E8ECF1] bg-[#F5F7FA] px-2.5 py-1.5 text-xs font-medium text-[#6B7280] outline-none cursor-pointer"
              >
                {semesterCgpaData.map((s) => (
                  <option key={s.semester} value={s.semester}>{s.semester} - {s.cgpa}</option>
                ))}
              </select>
            </div>
          )}
        </Card>

        {/* Attendance Card */}
        <Card className="group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-[#6B7280]">Attendance</p>
            <div className="relative">
              <select
                value={attendanceView}
                onChange={(e) => setAttendanceView(e.target.value as any)}
                className="appearance-none rounded-lg border border-[#E8ECF1] bg-white px-2.5 py-1 pr-6 text-[11px] font-semibold text-[#6C4CF1] outline-none cursor-pointer"
              >
                <option value="overall">Overall</option>
                <option value="monthly">This Month</option>
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#6C4CF1]" />
            </div>
          </div>
          <p className="text-[32px] font-bold tracking-tight text-[#111827]">{attendanceView === "overall" ? "92%" : "93%"}</p>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="font-semibold text-[#22C55E]">46/50 classes</span>
            <span className="text-[#9CA3AF]">•</span>
            <span className="font-medium text-[#EF4444]">4 missed</span>
          </div>
          {attendanceView === "monthly" && (
            <div className="mt-4">
              <select
                value={attendanceMonth}
                onChange={(e) => setAttendanceMonth(e.target.value)}
                className="w-full rounded-lg border border-[#E8ECF1] bg-[#F5F7FA] px-2.5 py-1.5 text-xs font-medium text-[#6B7280] outline-none cursor-pointer"
              >
                {monthlyAttendance.map((m) => (
                  <option key={m.month} value={m.month}>{m.month} - {m.percentage}%</option>
                ))}
              </select>
            </div>
          )}
        </Card>

        {/* Internal Marks Card */}
        <Card className="group overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
          <p className="mb-3 text-sm font-medium text-[#6B7280]">Internal Marks Avg</p>
          <p className="text-[32px] font-bold tracking-tight text-[#111827]">82%</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#22C55E]">
            <TrendingUp size={13} /> +5% this semester
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
            <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6]" />
          </div>
        </Card>

        {/* Credits Card */}
        <Card className="group overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
          <p className="mb-3 text-sm font-medium text-[#6B7280]">Credits Earned</p>
          <p className="text-[32px] font-bold tracking-tight text-[#111827]">148</p>
          <p className="mt-2 text-xs font-medium text-[#6B7280]">of 180 total</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
            <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-[#22C55E] to-[#4ADE80]" />
          </div>
        </Card>

        {/* Current SGPA Card */}
        <Card className="group overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
          <p className="mb-3 text-sm font-medium text-[#6B7280]">Current SGPA</p>
          <p className="text-[32px] font-bold tracking-tight text-[#111827]">8.7</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#22C55E]">
            <TrendingUp size={13} /> +0.2 this sem
          </div>
        </Card>

        {/* Class Rank Card */}
        <Card className="group overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
          <p className="mb-3 text-sm font-medium text-[#6B7280]">Class Rank</p>
          <p className="text-[32px] font-bold tracking-tight text-[#111827]">#12</p>
          <p className="mt-2 text-xs font-medium text-[#6B7280]">Top 8% of class</p>
        </Card>
      </section>

      {/* Charts Row 1 */}
      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Semester CGPA Trend */}
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#6C4CF1]">ACADEMIC PROGRESSION</p>
              <h3 className="mt-1 text-xl font-bold text-[#111827]">Semester CGPA Trend</h3>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[#E8ECF1] bg-[#F5F7FA] px-3 py-1.5 text-xs font-medium text-[#6B7280]">
              <TrendingUp size={14} className="text-[#22C55E]" /> +1.3 growth
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={semesterCgpaData}>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="semester" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis domain={[6, 9]} tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
              />
              <Line type="monotone" dataKey="cgpa" stroke="#6C4CF1" strokeWidth={3} dot={{ r: 5, fill: "#6C4CF1", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Monthly Attendance */}
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#6C4CF1]">ENGAGEMENT</p>
              <h3 className="mt-1 text-xl font-bold text-[#111827]">Monthly Attendance</h3>
            </div>
            <span className="rounded-full bg-[#22C55E]/10 px-3 py-1 text-xs font-semibold text-[#22C55E]">92% avg</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyAttendance}>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
              />
              <Bar dataKey="percentage" fill="#6C4CF1" radius={[8, 8, 0, 0]} barSize={32}>
                {monthlyAttendance.map((entry, i) => (
                  <Cell key={i} fill={entry.percentage >= 90 ? "#22C55E" : entry.percentage >= 80 ? "#3B82F6" : "#F59E0B"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </section>

      {/* Charts Row 2 */}
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr_1fr]">
        {/* Subject Wise Marks */}
        <Card className="p-6">
          <div className="mb-6">
            <p className="text-sm font-semibold text-[#6C4CF1]">PERFORMANCE</p>
            <h3 className="mt-1 text-xl font-bold text-[#111827]">Subject Wise Marks</h3>
          </div>
          <div className="space-y-4">
            {subjectMarks.map((subj) => (
              <div key={subj.subject}>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-sm font-medium text-[#111827]">{subj.subject}</p>
                  <span className={`text-xs font-bold ${
                    subj.grade === "S" ? "text-[#6C4CF1]" : subj.grade === "A" ? "text-[#22C55E]" : "text-[#F59E0B]"
                  }`}>{subj.total}% ({subj.grade})</span>
                </div>
                <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-[#F3F4F6]">
                  <div
                    className="h-full rounded-l-full bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6]"
                    style={{ width: `${(subj.internal / 50) * 100}%` }}
                  />
                  <div
                    className="h-full rounded-r-full bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]"
                    style={{ width: `${(subj.external / 50) * 100}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] font-medium text-[#9CA3AF]">
                  <span>Internal: {subj.internal}/50</span>
                  <span>External: {subj.external}/50</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Credits Progress */}
        <Card className="p-6">
          <div className="mb-6">
            <p className="text-sm font-semibold text-[#6C4CF1]">PROGRESS</p>
            <h3 className="mt-1 text-xl font-bold text-[#111827]">Credits Progress</h3>
          </div>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={creditsData}
                  dataKey="value"
                  innerRadius={65}
                  outerRadius={90}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={4}
                >
                  {creditsData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="-mt-36 grid place-items-center">
              <p className="text-3xl font-bold text-[#111827]">82%</p>
              <p className="text-xs font-medium text-[#6B7280]">completed</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#E8ECF1] bg-[#F5F7FA] p-3 text-center">
              <p className="text-lg font-bold text-[#6C4CF1]">148</p>
              <p className="text-[11px] font-medium text-[#6B7280]">Earned</p>
            </div>
            <div className="rounded-xl border border-[#E8ECF1] bg-[#F5F7FA] p-3 text-center">
              <p className="text-lg font-bold text-[#F59E0B]">32</p>
              <p className="text-[11px] font-medium text-[#6B7280]">Remaining</p>
            </div>
          </div>
        </Card>

        {/* Attendance Heatmap */}
        <Card className="p-6">
          <div className="mb-6">
            <p className="text-sm font-semibold text-[#6C4CF1]">ENGAGEMENT PATTERN</p>
            <h3 className="mt-1 text-xl font-bold text-[#111827]">Attendance Heatmap</h3>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <p key={day} className="text-center text-[10px] font-semibold text-[#9CA3AF]">{day}</p>
            ))}
            {Array.from({ length: 5 }, (_, week) => (
              Array.from({ length: 7 }, (_, day) => {
                const idx = week * 7 + day;
                if (idx >= 28) return null;
                const val = heatmapData[idx]?.value || 0;
                return (
                  <div
                    key={`${week}-${day}`}
                    className="aspect-square rounded-lg border border-[#E8ECF1] transition hover:scale-110 hover:shadow-sm"
                    style={{ backgroundColor: `rgba(108,76,241,${0.08 + val / 120})` }}
                    title={`Day ${idx + 1}: ${val}%`}
                  >
                    <span className="grid h-full place-items-center text-[10px] font-semibold text-[#6C4CF1]">
                      {idx + 1}
                    </span>
                  </div>
                );
              })
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-[#E8ECF1] bg-[#F5F7FA] px-3 py-2">
            <span className="text-xs font-medium text-[#6B7280]">Monthly Average</span>
            <span className="text-sm font-bold text-[#22C55E]">92%</span>
          </div>
        </Card>
      </section>

      {/* AI Insights + Profile Summary */}
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        {/* AI Insights */}
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#6C4CF1]">AI INSIGHTS</p>
              <h3 className="mt-1 text-xl font-bold text-[#111827]">Personalized Intelligence</h3>
            </div>
            <Brain size={20} className="text-[#6C4CF1]" />
          </div>
          <div className="grid gap-3">
            {aiInsights.map((insight, i) => (
              <div
                key={i}
                className="group flex items-start gap-4 rounded-2xl border border-[#E8ECF1] bg-[#F5F7FA] p-4 transition hover:border-[#6C4CF1]/20 hover:bg-white hover:shadow-md"
              >
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${insight.color} text-white shadow-sm`}>
                  <insight.icon size={17} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold leading-relaxed text-[#111827]">{insight.text}</p>
                  <button className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-[#6C4CF1] transition hover:gap-2">
                    Take Action <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Profile Summary */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] p-6 text-white">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-white/20 text-2xl font-bold text-white shadow-lg backdrop-blur-sm">
              {name.slice(0, 2).toUpperCase()}
            </div>
            <h3 className="text-xl font-bold">{name}</h3>
            <p className="mt-1 text-sm text-white/80">{profile.department}</p>
          </div>
          <div className="divide-y divide-[#E8ECF1]">
            {[
              { icon: GraduationCap, label: "Year", value: `${profile.year}th Year` },
              { icon: Layers, label: "Semester", value: `Sem ${profile.current_semester}` },
              { icon: User, label: "Roll No", value: profile.roll_number },
              { icon: Award, label: "CGPA", value: "8.45 / 10" },
              { icon: Target, label: "Placement Readiness", value: "78%" },
              { icon: FileText, label: "Resume Score", value: "81%" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-3.5 transition hover:bg-[#F5F7FA]">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#6C4CF1]/10 text-[#6C4CF1]">
                  <item.icon size={15} />
                </div>
                <div className="flex w-full items-center justify-between">
                  <p className="text-sm font-medium text-[#6B7280]">{item.label}</p>
                  <p className="text-sm font-bold text-[#111827]">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Info cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Target, title: "Academic Goals", desc: "Set and track semester GPA targets, subject-wise goals, and credit completion milestones." },
          { icon: BookOpen, title: "Study Materials", desc: "Access curated notes, previous year papers, and AI-recommended resources for each subject." },
          { icon: CalendarDays, title: "Academic Calendar", desc: "View exam schedules, assignment deadlines, holiday list, and important academic events." },
          { icon: Brain, title: "AI Tutor", desc: "Get instant help with doubts, concept explanations, and personalized learning recommendations." },
        ].map((card, i) => (
          <Card key={i} className="group p-5 transition hover:-translate-y-0.5 hover:border-[#6C4CF1]/20 hover:shadow-lg">
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#6C4CF1]/10 to-[#8B5CF6]/10 text-[#6C4CF1]">
              <card.icon size={18} />
            </div>
            <p className="text-base font-bold text-[#111827]">{card.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{card.desc}</p>
          </Card>
        ))}
      </section>
    </motion.div>
  );
}

function AcademicsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-32 animate-pulse rounded-2xl bg-white shadow-sm" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-white shadow-sm" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm" />
        <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>
    </div>
  );
}
