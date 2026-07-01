import { useState } from "react";
import { motion } from "framer-motion";
import {
  Award, BookOpen, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, Clock,
  Download, Edit3, FileText, GraduationCap, MessageSquare, Plus, Search, Sparkles,
  Star, TrendingUp, Users, Video,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card } from "../../components/ui/Card";
import { useStudentProfile } from "../../context/StudentProfileContext";
import { cn } from "../../utils/cn";

// =====================================================
// Academic Performance
// =====================================================

const semesterData = [
  { semester: "Sem 1", sgpa: 7.2, cgpa: 7.2, credits: 20, backlog: false },
  { semester: "Sem 2", sgpa: 7.6, cgpa: 7.4, credits: 22, backlog: false },
  { semester: "Sem 3", sgpa: 7.8, cgpa: 7.5, credits: 20, backlog: false },
  { semester: "Sem 4", sgpa: 8.0, cgpa: 7.7, credits: 22, backlog: true },
  { semester: "Sem 5", sgpa: 8.2, cgpa: 7.9, credits: 18, backlog: false },
  { semester: "Sem 6", sgpa: 8.3, cgpa: 8.0, credits: 20, backlog: false },
  { semester: "Sem 7", sgpa: 8.4, cgpa: 8.1, credits: 22, backlog: false },
  { semester: "Sem 8", sgpa: 8.5, cgpa: 8.45, credits: 24, backlog: false },
];

const subjectCgpaBreakdown = [
  { subject: "Machine Learning", grade: "A", points: 9, credits: 4 },
  { subject: "Deep Learning", grade: "A", points: 9, credits: 3 },
  { subject: "Data Structures", grade: "S", points: 10, credits: 4 },
  { subject: "Database Systems", grade: "A", points: 9, credits: 3 },
  { subject: "Computer Networks", grade: "B+", points: 8, credits: 3 },
  { subject: "Software Engineering", grade: "A", points: 9, credits: 3 },
];

export function StudentCgpaAnalytics() {
  const { profile } = useStudentProfile();
  const [view, setView] = useState<"sgpa" | "cgpa">("cgpa");
  const [activeTab, setActiveTab] = useState<"overview" | "results" | "subjects" | "grades">("overview");
  const [selectedSem, setSelectedSem] = useState("Sem 8");
  const p = profile;

  const semGpas = p?.semester_gpas?.length ? p.semester_gpas : [];
  const chartData = semGpas.length > 0 ? semGpas.map((s: any) => ({ semester: s.semester, sgpa: s.sgpa || 0, cgpa: s.cgpa || 0, credits: s.credits || 0 })) : semesterData;

  const totalCredits = chartData.reduce((acc: number, s: any) => acc + (s.credits || 0), 0);
  const resultData = chartData.map((s: any, index: number) => ({
    semester: s.semester,
    sgpa: s.sgpa || 0,
    cgpa: s.cgpa || 0,
    credits: s.credits || 0,
    totalMarks: allSemesterResults[index]?.totalMarks || Math.round((s.sgpa || 0) * 100),
    percentage: allSemesterResults[index]?.percentage || Math.round((s.sgpa || 0) * 10),
    rank: allSemesterResults[index]?.rank || 0,
    status: (s.sgpa || 0) >= 5 ? "Pass" : "Needs Attention",
  }));
  const current = resultData.find((s) => s.semester === selectedSem) || resultData[resultData.length - 1] || allSemesterResults[0];
  const subjects = p?.subjects_data?.length ? p.subjects_data : subjectCgpaBreakdown;
  const gradeSummary = [
    { grade: "S / O", count: subjects.filter((s: any) => (s.grade || "").includes("S") || (s.grade || "").includes("O")).length || 1, color: "#6C4CF1" },
    { grade: "A", count: subjects.filter((s: any) => (s.grade || "A").startsWith("A")).length || Math.max(1, Math.floor(subjects.length / 2)), color: "#22C55E" },
    { grade: "B", count: subjects.filter((s: any) => (s.grade || "").startsWith("B")).length || Math.max(0, subjects.length - 3), color: "#F59E0B" },
    { grade: "Backlog", count: resultData.filter((s) => s.status !== "Pass").length, color: "#EF4444" },
  ];

  return (
    <PageShell title="Academic Performance" subtitle="SGPA, CGPA, subject marks, semester results, and grade summary in one place.">
      <div className="mb-6 overflow-x-auto rounded-2xl border border-[#E8ECF1] bg-white p-1.5 no-scrollbar">
        <div className="flex min-w-max gap-1.5">
          {[
            { key: "overview", label: "SGPA / CGPA" },
            { key: "results", label: "Semester Results" },
            { key: "subjects", label: "Subject Marks" },
            { key: "grades", label: "Grade Summary" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold transition",
                activeTab === tab.key ? "bg-[#6C4CF1] text-white shadow-md shadow-[#6C4CF1]/20" : "text-[#6B7280] hover:bg-[#F5F7FA] hover:text-[#111827]",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Overall CGPA", value: p?.cgpa?.toFixed(2) || "—", sub: "Out of 10", color: "#6C4CF1" },
          { label: "Current SGPA", value: p?.current_semester_gpa?.toFixed(1) || "—", sub: `Semester ${p?.semester || ""}`, color: "#3B82F6" },
          { label: "Total Credits", value: String(p?.credits_earned || totalCredits || 0), sub: `Earned of ${p?.total_credits || 180}`, color: "#22C55E" },
          { label: "Semesters", value: String(chartData.length), sub: "Completed", color: "#F59E0B" },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <p className="text-sm font-medium text-[#6B7280]">{kpi.label}</p>
            <p className="mt-2 text-[32px] font-bold tracking-tight text-[#111827]" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="mt-1 text-xs font-medium text-[#6B7280]">{kpi.sub}</p>
          </Card>
        ))}
      </div>

      <Card className={cn("p-6", activeTab !== "overview" && "hidden")}>
        <div className="mb-6 flex items-center justify-between">
          <div><p className="text-sm font-semibold text-[#6C4CF1]">PERFORMANCE TREND</p><h3 className="mt-1 text-xl font-bold text-[#111827]">Semester-wise SGPA and Overall CGPA Trend</h3></div>
          <div className="flex gap-1.5 rounded-xl border border-[#E8ECF1] p-1">
            {(["sgpa", "cgpa"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={cn("rounded-lg px-4 py-1.5 text-xs font-semibold transition", view === v ? "bg-[#6C4CF1] text-white" : "text-[#6B7280] hover:text-[#111827]")}>{v.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="semester" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <YAxis domain={[6, 9]} tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }} />
            <Line type="monotone" dataKey={view} stroke="#6C4CF1" strokeWidth={3} dot={{ r: 5, fill: "#6C4CF1", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className={cn("grid gap-6 xl:grid-cols-[1.3fr_0.7fr]", activeTab !== "overview" && "hidden")}>
        <Card className="p-6">
          <div className="mb-4"><p className="text-sm font-semibold text-[#6C4CF1]">BREAKDOWN</p><h3 className="mt-1 text-xl font-bold text-[#111827]">Semester-wise Breakdown</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E8ECF1] text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                  <th className="py-3 pr-4">Semester</th><th className="py-3 pr-4">SGPA</th><th className="py-3 pr-4">CGPA</th><th className="py-3 pr-4">Credits</th><th className="py-3">Pass / Fail</th>
                </tr>
              </thead>
              <tbody>
                {(chartData.length > 0 ? chartData : semesterData).map((s: any) => (
                  <tr key={s.semester} className="border-b border-[#F3F4F6] transition hover:bg-[#F5F7FA]">
                    <td className="py-3.5 pr-4 font-semibold text-[#111827]">{s.semester}</td>
                    <td className="py-3.5 pr-4 font-medium text-[#111827]">{s.sgpa?.toFixed?.(1) || s.sgpa || "—"}</td>
                    <td className="py-3.5 pr-4 font-medium text-[#111827]">{s.cgpa?.toFixed?.(2) || s.cgpa || "—"}</td>
                    <td className="py-3.5 pr-4 font-medium text-[#6B7280]">{s.credits || "—"}</td>
                    <td className="py-3.5"><span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-xs font-semibold text-[#22C55E]">Pass</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4"><p className="text-sm font-semibold text-[#6C4CF1]">CURRENT SEM</p><h3 className="mt-1 text-xl font-bold text-[#111827]">Subject Grade Points</h3></div>
          <div className="space-y-3">
            {(p?.subjects_data?.length ? p.subjects_data : subjectCgpaBreakdown).map((s: any) => (
              <div key={s.name || s.subject} className="flex items-center justify-between rounded-xl border border-[#E8ECF1] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#6C4CF1]/10 text-xs font-bold text-[#6C4CF1]">{(s.code || s.subject)?.[0] || "S"}</div>
                  <div><p className="text-sm font-semibold text-[#111827]">{s.name || s.subject}</p><p className="text-xs text-[#6B7280]">{s.credits || 0} credits</p></div>
                </div>
                <span className="text-sm font-bold text-[#111827]">{s.credits || 0}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className={cn("space-y-6", activeTab !== "results" && "hidden")}>
        <div className="flex flex-wrap gap-2">
          {resultData.map((s) => (
            <button
              key={s.semester}
              onClick={() => setSelectedSem(s.semester)}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                selectedSem === s.semester ? "border-[#6C4CF1] bg-[#6C4CF1] text-white shadow-md" : "border-[#E8ECF1] text-[#6B7280] hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]",
              )}
            >
              {s.semester}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "SGPA", value: current.sgpa || "—", color: "#6C4CF1" },
            { label: "CGPA", value: current.cgpa || "—", color: "#3B82F6" },
            { label: "Credits", value: current.credits || "—", color: "#22C55E" },
            { label: "Status", value: current.status, color: current.status === "Pass" ? "#22C55E" : "#EF4444" },
          ].map((kpi) => (
            <Card key={kpi.label} className="p-5">
              <p className="text-sm font-medium text-[#6B7280]">{kpi.label}</p>
              <p className="mt-2 text-[30px] font-bold tracking-tight" style={{ color: kpi.color }}>{kpi.value}</p>
            </Card>
          ))}
        </div>
        <Card className="p-6">
          <div className="mb-4"><p className="text-sm font-semibold text-[#6C4CF1]">RESULT CARDS</p><h3 className="mt-1 text-xl font-bold text-[#111827]">Semester Result Cards</h3></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {resultData.map((s) => (
              <div key={s.semester} className="rounded-2xl border border-[#E8ECF1] bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-base font-bold text-[#111827]">{s.semester}</p>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", s.status === "Pass" ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-[#FEE2E2] text-[#DC2626]")}>{s.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-[#6B7280]">SGPA</p><p className="font-bold text-[#111827]">{s.sgpa}</p></div>
                  <div><p className="text-[#6B7280]">CGPA</p><p className="font-bold text-[#111827]">{s.cgpa}</p></div>
                  <div><p className="text-[#6B7280]">Credits</p><p className="font-bold text-[#111827]">{s.credits}</p></div>
                  <div><p className="text-[#6B7280]">Marks</p><p className="font-bold text-[#111827]">{s.totalMarks || "—"}</p></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className={cn("grid gap-6 xl:grid-cols-[1fr_.9fr]", activeTab !== "subjects" && "hidden")}>
        <Card className="p-6">
          <div className="mb-4"><p className="text-sm font-semibold text-[#6C4CF1]">SUBJECT MARKS</p><h3 className="mt-1 text-xl font-bold text-[#111827]">Subject-wise Marks and Grade Points</h3></div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subjects.map((s: any) => ({ name: s.name || s.subject || s.code, marks: (s.points || s.credits || 7) * 10 }))}>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1" }} />
              <Bar dataKey="marks" fill="#6C4CF1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-6">
          <div className="mb-4"><p className="text-sm font-semibold text-[#6C4CF1]">PASS / FAIL</p><h3 className="mt-1 text-xl font-bold text-[#111827]">Subject Status</h3></div>
          <div className="space-y-3">
            {subjects.map((s: any) => {
              const points = s.points || s.credits || 7;
              const passed = points >= 5;
              return (
                <div key={s.name || s.subject || s.code} className="flex items-center justify-between rounded-xl border border-[#E8ECF1] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">{s.name || s.subject || s.code}</p>
                    <p className="text-xs text-[#6B7280]">Grade {s.grade || "A"} • {s.credits || 0} credits</p>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", passed ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-[#FEE2E2] text-[#DC2626]")}>{passed ? "Pass" : "Fail"}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className={cn("grid gap-6 xl:grid-cols-[.8fr_1.2fr]", activeTab !== "grades" && "hidden")}>
        <Card className="p-6">
          <div className="mb-4"><p className="text-sm font-semibold text-[#6C4CF1]">GRADE SUMMARY</p><h3 className="mt-1 text-xl font-bold text-[#111827]">Grade Distribution</h3></div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={gradeSummary} innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="count">
                {gradeSummary.map((entry) => <Cell key={entry.grade} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1" }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-6">
          <div className="mb-4"><p className="text-sm font-semibold text-[#6C4CF1]">SUMMARY</p><h3 className="mt-1 text-xl font-bold text-[#111827]">Academic Grade Summary</h3></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {gradeSummary.map((grade) => (
              <div key={grade.grade} className="rounded-2xl border border-[#E8ECF1] p-4">
                <div className="mb-3 h-2 rounded-full" style={{ backgroundColor: grade.color }} />
                <p className="text-sm font-medium text-[#6B7280]">{grade.grade}</p>
                <p className="mt-1 text-2xl font-bold text-[#111827]">{grade.count}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

// =====================================================
// Attendance
// =====================================================

const attendanceBySubject = [
  { subject: "Machine Learning", attended: 28, total: 30, percentage: 93.3 },
  { subject: "Deep Learning", attended: 26, total: 28, percentage: 92.8 },
  { subject: "Data Structures", attended: 30, total: 32, percentage: 93.7 },
  { subject: "Database Systems", attended: 24, total: 28, percentage: 85.7 },
  { subject: "Computer Networks", attended: 22, total: 26, percentage: 84.6 },
  { subject: "Software Engineering", attended: 27, total: 30, percentage: 90.0 },
];

const monthlyAttData = [
  { month: "Jan", percentage: 82, attended: 41, total: 50 },
  { month: "Feb", percentage: 86, attended: 43, total: 50 },
  { month: "Mar", percentage: 88, attended: 44, total: 50 },
  { month: "Apr", percentage: 91, attended: 46, total: 50 },
  { month: "May", percentage: 93, attended: 47, total: 50 },
  { month: "Jun", percentage: 92, attended: 46, total: 50 },
];

export function StudentAttendance() {
  const { profile } = useStudentProfile();
  const p = profile;
  const attPct = p?.attendance_percentage || 0;
  const attended = Math.round(attPct * 170 / 100);
  const missed = 170 - attended;

  const monthlyData = monthlyAttData.map((m) => ({
    ...m,
    percentage: Math.round(attPct * (0.85 + Math.random() * 0.15)),
  }));

  return (
    <PageShell title="Attendance" subtitle="Monitor your class attendance across all subjects.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Overall Attendance", value: `${attPct}%`, sub: "Current semester", color: "#22C55E" },
          { label: "Classes Attended", value: String(attended), sub: "Out of 170", color: "#6C4CF1" },
          { label: "Classes Missed", value: String(missed), sub: "This semester", color: "#EF4444" },
          { label: "Roll Number", value: p?.roll_number || "—", sub: p?.section || "", color: "#3B82F6" },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <p className="text-sm font-medium text-[#6B7280]">{kpi.label}</p>
            <p className="mt-2 text-[32px] font-bold tracking-tight text-[#111827]" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="mt-1 text-xs font-medium text-[#6B7280]">{kpi.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card className="p-6">
          <div className="mb-4"><p className="text-sm font-semibold text-[#6C4CF1]">TREND</p><h3 className="mt-1 text-xl font-bold text-[#111827]">Monthly Attendance Trend</h3></div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1" }} />
              <Bar dataKey="percentage" radius={[8, 8, 0, 0]} barSize={36}>
                {monthlyData.map((entry, i) => (
                  <Cell key={i} fill={entry.percentage >= 90 ? "#22C55E" : entry.percentage >= 80 ? "#3B82F6" : "#F59E0B"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <div className="mb-4"><p className="text-sm font-semibold text-[#6C4CF1]">SUBJECTS</p><h3 className="mt-1 text-xl font-bold text-[#111827]">Subject-wise Attendance</h3></div>
          <div className="space-y-3">
            {(p?.subjects_data?.length ? p.subjects_data : attendanceBySubject).map((s: any) => {
              const subAttPct = Math.round(attPct * (0.92 + Math.random() * 0.08));
              return (
                <div key={s.name || s.subject}>
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-sm font-medium text-[#111827]">{s.name || s.subject}</p>
                    <span className={`text-xs font-bold ${subAttPct >= 90 ? "text-[#22C55E]" : subAttPct >= 85 ? "text-[#F59E0B]" : "text-[#EF4444]"}`}>{subAttPct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6]" style={{ width: `${subAttPct}%` }} />
                  </div>
                  <p className="mt-0.5 text-[11px] font-medium text-[#9CA3AF]">{s.code || ""}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

// =====================================================
// Internal Marks
// =====================================================

const internalMarksData = [
  { subject: "Machine Learning", cie1: 38, cie2: 42, cie3: 40, avg: 40, max: 50 },
  { subject: "Deep Learning", cie1: 35, cie2: 38, cie3: 42, avg: 38.3, max: 50 },
  { subject: "Data Structures", cie1: 45, cie2: 48, cie3: 44, avg: 45.7, max: 50 },
  { subject: "Database Systems", cie1: 40, cie2: 38, cie3: 42, avg: 40, max: 50 },
  { subject: "Computer Networks", cie1: 36, cie2: 34, cie3: 38, avg: 36, max: 50 },
  { subject: "Software Engineering", cie1: 42, cie2: 44, cie3: 46, avg: 44, max: 50 },
];

export function StudentInternalMarks() {
  return (
    <PageShell title="Internal Marks" subtitle="Track your Continuous Internal Evaluation (CIE) marks.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Overall Average", value: "82%", sub: "Across all subjects", color: "#6C4CF1" },
          { label: "Best Subject", value: "Data Structures", sub: "45.7/50 avg", color: "#22C55E" },
          { label: "Needs Improvement", value: "Computer Networks", sub: "36/50 avg", color: "#EF4444" },
          { label: "Total CIE Conducted", value: "18", sub: "3 per subject", color: "#3B82F6" },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <p className="text-sm font-medium text-[#6B7280]">{kpi.label}</p>
            <p className="mt-2 text-lg font-bold text-[#111827]" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="mt-1 text-xs font-medium text-[#6B7280]">{kpi.sub}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#6C4CF1]">CIE MARKS</p>
            <h3 className="mt-1 text-xl font-bold text-[#111827]">Internal Marks Breakdown</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#6C4CF1]" /> CIE 1</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#3B82F6]" /> CIE 2</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#22C55E]" /> CIE 3</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E8ECF1] text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                <th className="py-3 pr-4">Subject</th>
                <th className="py-3 pr-4">CIE 1</th>
                <th className="py-3 pr-4">CIE 2</th>
                <th className="py-3 pr-4">CIE 3</th>
                <th className="py-3 pr-4">Average</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {internalMarksData.map((s) => (
                <tr key={s.subject} className="border-b border-[#F3F4F6] transition hover:bg-[#F5F7FA]">
                  <td className="py-3.5 pr-4 font-semibold text-[#111827]">{s.subject}</td>
                  <td className="py-3.5 pr-4">{s.cie1}</td>
                  <td className="py-3.5 pr-4">{s.cie2}</td>
                  <td className="py-3.5 pr-4">{s.cie3}</td>
                  <td className="py-3.5 pr-4 font-semibold">{s.avg}</td>
                  <td className="py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      s.avg >= 40 ? "bg-[#DCFCE7] text-[#22C55E]" : "bg-[#FEE2E2] text-[#EF4444]"
                    }`}>{s.avg >= 40 ? "Good" : "Needs Work"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}

// =====================================================
// Semester Results
// =====================================================

const allSemesterResults = [
  { semester: "Sem 1", sgpa: 7.2, cgpa: 7.2, credits: 20, totalMarks: 680, percentage: 72.0, rank: 45 },
  { semester: "Sem 2", sgpa: 7.6, cgpa: 7.4, credits: 22, totalMarks: 720, percentage: 76.0, rank: 38 },
  { semester: "Sem 3", sgpa: 7.8, cgpa: 7.5, credits: 20, totalMarks: 750, percentage: 78.0, rank: 32 },
  { semester: "Sem 4", sgpa: 8.0, cgpa: 7.7, credits: 22, totalMarks: 780, percentage: 80.0, rank: 28 },
  { semester: "Sem 5", sgpa: 8.2, cgpa: 7.9, credits: 18, totalMarks: 800, percentage: 82.0, rank: 22 },
  { semester: "Sem 6", sgpa: 8.3, cgpa: 8.0, credits: 20, totalMarks: 815, percentage: 83.0, rank: 18 },
  { semester: "Sem 7", sgpa: 8.4, cgpa: 8.1, credits: 22, totalMarks: 835, percentage: 84.0, rank: 15 },
  { semester: "Sem 8", sgpa: 8.5, cgpa: 8.45, credits: 24, totalMarks: 0, percentage: 0, rank: 0 },
];

// =====================================================
// Subjects
// =====================================================

const subjectsData = [
  { code: "AIML801", name: "Machine Learning", faculty: "Dr. Sharma", credits: 4, type: "Core", schedule: "Mon/Wed/Fri 9-10AM" },
  { code: "AIML802", name: "Deep Learning", faculty: "Dr. Patel", credits: 3, type: "Core", schedule: "Tue/Thu 10-11:30AM" },
  { code: "AIML803", name: "Data Structures & Algorithms", faculty: "Prof. Verma", credits: 4, type: "Core", schedule: "Mon/Wed 2-3:30PM" },
  { code: "AIML804", name: "Database Management Systems", faculty: "Dr. Singh", credits: 3, type: "Core", schedule: "Tue/Fri 11AM-12:30PM" },
  { code: "AIML805", name: "Computer Networks", faculty: "Prof. Gupta", credits: 3, type: "Elective", schedule: "Thu 2-4PM" },
  { code: "AIML806", name: "Software Engineering", faculty: "Dr. Kumar", credits: 3, type: "Core", schedule: "Wed/Fri 3-4:30PM" },
];

export function StudentSubjects() {
  const { profile } = useStudentProfile();
  const p = profile;
  const subjects = p?.subjects_data?.length ? p.subjects_data : subjectsData;

  return (
    <PageShell title="Subjects" subtitle="Current semester subjects, faculty, and schedules.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {subjects.map((s: any) => (
          <Card key={s.code || s.name} className="group p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C4CF1]/10 to-[#8B5CF6]/10 text-[#6C4CF1]"><BookOpen size={18} /></div>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.type === "Core" ? "bg-[#6C4CF1]/10 text-[#6C4CF1]" : "bg-[#F59E0B]/10 text-[#F59E0B]"}`}>{s.type || "Core"}</span>
            </div>
            <p className="text-xs font-medium text-[#6C4CF1]">{s.code || ""}</p>
            <p className="mt-1 text-base font-bold text-[#111827]">{s.name || s.subject}</p>
            <div className="mt-3 space-y-1.5 text-xs text-[#6B7280]">
              <p className="flex items-center gap-2"><Users size={13} /> {s.faculty || "TBA"}</p>
              <p className="flex items-center gap-2"><Award size={13} /> {s.credits || 0} Credits</p>
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}

// =====================================================
// Assignments
// =====================================================

const assignmentsData = [
  { title: "ML Model Deployment", subject: "Machine Learning", due: "Jul 5, 2025", status: "Pending", priority: "High", type: "Individual" },
  { title: "Neural Network Implementation", subject: "Deep Learning", due: "Jul 8, 2025", status: "In Progress", priority: "High", type: "Individual" },
  { title: "Graph Algorithms Report", subject: "Data Structures", due: "Jul 12, 2025", status: "Pending", priority: "Medium", type: "Group" },
  { title: "ER Diagram Design", subject: "Database Systems", due: "Jun 28, 2025", status: "Submitted", priority: "Medium", type: "Individual" },
  { title: "Network Topology Analysis", subject: "Computer Networks", due: "Jul 2, 2025", status: "In Progress", priority: "Low", type: "Group" },
  { title: "SRS Documentation", subject: "Software Engineering", due: "Jun 25, 2025", status: "Submitted", priority: "High", type: "Group" },
];

export function StudentAssignments() {
  return (
    <PageShell title="Assignments" subtitle="Track your assignments, deadlines, and submissions.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {[
          { label: "Total Assignments", value: "12", color: "#6C4CF1" },
          { label: "Submitted", value: "5", color: "#22C55E" },
          { label: "In Progress", value: "3", color: "#3B82F6" },
          { label: "Pending", value: "4", color: "#EF4444" },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <p className="text-sm font-medium text-[#6B7280]">{kpi.label}</p>
            <p className="mt-2 text-[32px] font-bold tracking-tight text-[#111827]" style={{ color: kpi.color }}>{kpi.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#6C4CF1]">TRACKER</p>
            <h3 className="mt-1 text-xl font-bold text-[#111827]">Assignment Tracker</h3>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-[#6C4CF1] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-[#6C4CF1]/20 transition hover:shadow-xl">
            <Plus size={14} /> New Assignment
          </button>
        </div>
        <div className="space-y-2">
          {assignmentsData.map((a, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-[#E8ECF1] px-5 py-4 transition hover:border-[#6C4CF1]/20 hover:bg-[#F5F7FA]">
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white ${
                a.status === "Submitted" ? "bg-[#22C55E]" : a.status === "In Progress" ? "bg-[#3B82F6]" : "bg-[#F59E0B]"
              }`}>
                <FileText size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#111827]">{a.title}</p>
                <p className="text-xs text-[#6B7280]">{a.subject} • {a.type} • Due: {a.due}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  a.priority === "High" ? "bg-[#FEE2E2] text-[#EF4444]" : a.priority === "Medium" ? "bg-[#FEF3C7] text-[#F59E0B]" : "bg-[#E5E7EB] text-[#6B7280]"
                }`}>{a.priority}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  a.status === "Submitted" ? "bg-[#DCFCE7] text-[#22C55E]" : a.status === "In Progress" ? "bg-[#DBEAFE] text-[#3B82F6]" : "bg-[#FEF3C7] text-[#F59E0B]"
                }`}>{a.status}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}

// =====================================================
// Timetable
// =====================================================

const timetableSlots = [
  { day: "Monday", slots: [
    { time: "9:00 - 10:00", subject: "Machine Learning", code: "AIML801", faculty: "Dr. Sharma", room: "LH-301" },
    { time: "10:00 - 11:00", subject: "Deep Learning", code: "AIML802", faculty: "Dr. Patel", room: "LH-302" },
    { time: "11:00 - 12:00", subject: "Free", code: "", faculty: "", room: "" },
    { time: "2:00 - 3:30", subject: "Data Structures", code: "AIML803", faculty: "Prof. Verma", room: "CL-105" },
  ]},
  { day: "Tuesday", slots: [
    { time: "10:00 - 11:30", subject: "Deep Learning", code: "AIML802", faculty: "Dr. Patel", room: "LH-302" },
    { time: "11:00 - 12:30", subject: "Database Systems", code: "AIML804", faculty: "Dr. Singh", room: "LH-303" },
    { time: "2:00 - 3:00", subject: "Library", code: "", faculty: "", room: "" },
  ]},
  { day: "Wednesday", slots: [
    { time: "9:00 - 10:00", subject: "Machine Learning", code: "AIML801", faculty: "Dr. Sharma", room: "LH-301" },
    { time: "2:00 - 3:30", subject: "Data Structures", code: "AIML803", faculty: "Prof. Verma", room: "CL-105" },
    { time: "3:00 - 4:30", subject: "Software Engineering", code: "AIML806", faculty: "Dr. Kumar", room: "LH-304" },
  ]},
  { day: "Thursday", slots: [
    { time: "10:00 - 11:30", subject: "Deep Learning", code: "AIML802", faculty: "Dr. Patel", room: "LH-302" },
    { time: "2:00 - 4:00", subject: "Computer Networks", code: "AIML805", faculty: "Prof. Gupta", room: "CL-201" },
  ]},
  { day: "Friday", slots: [
    { time: "9:00 - 10:00", subject: "Machine Learning", code: "AIML801", faculty: "Dr. Sharma", room: "LH-301" },
    { time: "11:00 - 12:30", subject: "Database Systems", code: "AIML804", faculty: "Dr. Singh", room: "LH-303" },
    { time: "3:00 - 4:30", subject: "Software Engineering", code: "AIML806", faculty: "Dr. Kumar", room: "LH-304" },
  ]},
];

const dayColors: Record<string, string> = {
  Monday: "from-[#6C4CF1] to-[#8B5CF6]",
  Tuesday: "from-[#3B82F6] to-[#60A5FA]",
  Wednesday: "from-[#22C55E] to-[#4ADE80]",
  Thursday: "from-[#F59E0B] to-[#FBBF24]",
  Friday: "from-[#EF4444] to-[#F87171]",
};

export function StudentTimetable() {
  const [selectedDay, setSelectedDay] = useState("Monday");

  return (
    <PageShell title="Timetable" subtitle="View your class schedule for the current semester.">
      <div className="flex flex-wrap gap-2 mb-6">
        {timetableSlots.map((d) => (
          <button
            key={d.day}
            onClick={() => setSelectedDay(d.day)}
            className={cn(
              "rounded-xl border px-5 py-2.5 text-sm font-semibold transition",
              selectedDay === d.day
                ? "border-[#6C4CF1] bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] text-white shadow-md"
                : "border-[#E8ECF1] text-[#6B7280] hover:border-[#6C4CF1]/30"
            )}
          >
            {d.day}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Card className="p-6">
          <div className={`mb-6 rounded-2xl bg-gradient-to-r ${dayColors[selectedDay]} p-5 text-white`}>
            <p className="text-sm font-medium text-white/80">{selectedDay}'s Schedule</p>
            <p className="mt-1 text-2xl font-bold">{timetableSlots.find((d) => d.day === selectedDay)?.slots.length || 0} Classes</p>
          </div>
          <div className="space-y-3">
            {timetableSlots
              .find((d) => d.day === selectedDay)
              ?.slots.map((slot, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-4 transition hover:shadow-md ${
                    slot.subject === "Free" || slot.subject === "Library"
                      ? "border-dashed border-[#E8ECF1] bg-[#F5F7FA]"
                      : "border-[#E8ECF1] bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`grid h-9 w-9 place-items-center rounded-lg text-xs font-bold text-white ${
                        slot.subject === "Free" || slot.subject === "Library" ? "bg-[#9CA3AF]" : "bg-[#6C4CF1]"
                      }`}>{slot.subject === "Free" ? "—" : slot.subject === "Library" ? "LB" : slot.code.slice(-3)}</div>
                      <div>
                        <p className="text-sm font-semibold text-[#111827]">{slot.subject}</p>
                        {slot.faculty && <p className="text-xs text-[#6B7280]">{slot.faculty} • {slot.room}</p>}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#6C4CF1]">{slot.time}</span>
                  </div>
                </div>
              ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4">
            <p className="text-sm font-semibold text-[#6C4CF1]">WEEKLY VIEW</p>
            <h3 className="mt-1 text-xl font-bold text-[#111827]">Full Week Schedule</h3>
          </div>
          <div className="space-y-4">
            {timetableSlots.map((day) => (
              <div key={day.day} className="rounded-xl border border-[#E8ECF1] p-4 transition hover:border-[#6C4CF1]/20">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-bold text-[#111827]">{day.day}</p>
                  <span className="text-xs font-medium text-[#6B7280]">{day.slots.length} classes</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {day.slots.map((slot, i) => (
                    <span
                      key={i}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                        slot.subject === "Free" || slot.subject === "Library"
                          ? "bg-[#F3F4F6] text-[#9CA3AF]"
                          : "bg-[#6C4CF1]/10 text-[#6C4CF1]"
                      }`}
                    >
                      {slot.subject === "Free" || slot.subject === "Library" ? slot.subject : slot.code}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

// =====================================================
// Faculty Feedback
// =====================================================

const facultyFeedbackData = [
  { name: "Dr. Sharma", subject: "Machine Learning", rating: 4.5, teaching: 4.3, communication: 4.6, responsiveness: 4.4, feedback: "Excellent teaching methodology." },
  { name: "Dr. Patel", subject: "Deep Learning", rating: 4.2, teaching: 4.1, communication: 4.3, responsiveness: 4.2, feedback: "Clear concept explanations." },
  { name: "Prof. Verma", subject: "Data Structures", rating: 4.8, teaching: 4.9, communication: 4.7, responsiveness: 4.8, feedback: "Best DSA instructor." },
  { name: "Dr. Singh", subject: "Database Systems", rating: 4.0, teaching: 3.8, communication: 4.1, responsiveness: 4.2, feedback: "Good but needs more examples." },
  { name: "Prof. Gupta", subject: "Computer Networks", rating: 3.8, teaching: 3.6, communication: 4.0, responsiveness: 3.9, feedback: "Content coverage is good." },
  { name: "Dr. Kumar", subject: "Software Engineering", rating: 4.3, teaching: 4.2, communication: 4.4, responsiveness: 4.3, feedback: "Industry-relevant teaching." },
];

export function StudentFacultyFeedback() {
  return (
    <PageShell title="Faculty Feedback" subtitle="View and submit feedback for your faculty members.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {facultyFeedbackData.map((f) => (
          <Card key={f.name} className="group p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] text-sm font-bold text-white shadow-sm">
                {f.name.split(" ")[1]?.[0] || f.name[0]}
              </div>
              <div className="flex items-center gap-1">
                <Star size={14} className="text-[#F59E0B] fill-[#F59E0B]" />
                <span className="text-sm font-bold text-[#111827]">{f.rating}</span>
              </div>
            </div>
            <p className="text-base font-bold text-[#111827]">{f.name}</p>
            <p className="text-xs font-medium text-[#6C4CF1]">{f.subject}</p>
            <p className="mt-2 text-xs leading-relaxed text-[#6B7280]">"{f.feedback}"</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "Teaching", value: f.teaching },
                { label: "Comm.", value: f.communication },
                { label: "Resp.", value: f.responsiveness },
              ].map((m) => (
                <div key={m.label} className="rounded-lg bg-[#F5F7FA] p-2 text-center">
                  <p className="text-xs font-bold text-[#111827]">{m.value}</p>
                  <p className="text-[10px] font-medium text-[#6B7280]">{m.label}</p>
                </div>
              ))}
            </div>
            <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#E8ECF1] py-2 text-xs font-semibold text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]">
              <Edit3 size={13} /> Provide Feedback
            </button>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}

// =====================================================
// Page Shell
// =====================================================

function PageShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6C4CF1]">ACADEMICS / {title.replace(" ", " ").toUpperCase()}</p>
          <h2 className="mt-1 text-[28px] font-bold tracking-tight text-[#111827]">{title}</h2>
          <p className="mt-2 text-sm text-[#6B7280]">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-xl border border-[#E8ECF1] px-4 py-2 text-xs font-semibold text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]">
            <Search size={13} /> Filter
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-[#E8ECF1] px-4 py-2 text-xs font-semibold text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]">
            <Download size={13} /> Export
          </button>
        </div>
      </div>
      {children}
    </motion.div>
  );
}
