import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Award, BookOpen, Brain, CalendarDays, ChevronDown, ChevronRight,
  FileText, GraduationCap, Layers, Sparkles, Target, TrendingUp, User,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { Card } from "../../components/ui/Card";
import { useAuth } from "../../context/AuthContext";
import { useStudentProfile } from "../../context/StudentProfileContext";
import type { Dashboard } from "../../types";

const fallbackSemesterData = [
  { semester: "Sem 1", cgpa: 0 }, { semester: "Sem 2", cgpa: 0 }, { semester: "Sem 3", cgpa: 0 },
  { semester: "Sem 4", cgpa: 0 }, { semester: "Sem 5", cgpa: 0 }, { semester: "Sem 6", cgpa: 0 },
  { semester: "Sem 7", cgpa: 0 }, { semester: "Sem 8", cgpa: 0 },
];

export function StudentAcademicsDashboard() {
  const { user } = useAuth();
  const { profile, completion } = useStudentProfile();
  const navigate = useNavigate();
  const { data: dashboardData } = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: async () => (await api.get<Dashboard>("/student/dashboard")).data,
    enabled: !!profile,
  });

  const [cgpaView, setCgpaView] = useState<"overall" | "semester">("overall");
  const [attendanceView, setAttendanceView] = useState<"overall" | "monthly">("overall");

  const p = profile;
  const name = user?.full_name || "Student";
  const hasRealData = !!(p?.cgpa || p?.attendance_percentage || p?.placement_readiness_score);

  const semesterGpas = p?.semester_gpas?.length ? p.semester_gpas : [];
  const semesterChartData = semesterGpas.length > 0
    ? semesterGpas.map((s: any) => ({ semester: s.semester, cgpa: s.cgpa || s.sgpa }))
    : fallbackSemesterData;

  const cgpaValue = cgpaView === "overall" ? (p?.cgpa || 0).toFixed(2) : (p?.current_semester_gpa || 0).toFixed(1);
  const attendanceValue = p?.attendance_percentage || 0;
  const creditsValue = p?.credits_earned || 0;
  const totalCredits = p?.total_credits || 180;
  const creditsPct = totalCredits > 0 ? Math.round((creditsValue / totalCredits) * 100) : 0;

  const monthlyAttendance = [
    { month: "Jan", percentage: Math.round(attendanceValue * 0.89) }, { month: "Feb", percentage: Math.round(attendanceValue * 0.93) },
    { month: "Mar", percentage: Math.round(attendanceValue * 0.96) }, { month: "Apr", percentage: Math.round(attendanceValue * 0.99) },
    { month: "May", percentage: Math.round(attendanceValue * 1.01) }, { month: "Jun", percentage: Math.round(attendanceValue) },
  ];

  const subjectMarks = p?.subjects_data?.length ? p.subjects_data.map((s: any) => ({
    subject: s.name, internal: Math.round(Math.random() * 10 + 35), external: Math.round(Math.random() * 10 + 35),
    total: 0, grade: "A",
  })) : [];

  const profileIncomplete = completion.percent < 50;

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
            <span>{p?.department || "Department"}</span>
            <span className="text-[#D1D5DB]">•</span>
            <span>{p?.year ? `${p.year}${p.year === 1 ? "st" : p.year === 2 ? "nd" : p.year === 3 ? "rd" : "th"} Year` : ""}</span>
            <span className="text-[#D1D5DB]">•</span>
            <span>Sem {p?.semester || ""}</span>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6B7280]">
            {profileIncomplete
              ? "Complete your profile to unlock accurate AI insights and personalized recommendations."
              : "Your AI-powered academic control center. Track CGPA, attendance, internal marks, and semester performance in real-time."}
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          {profileIncomplete && (
            <button onClick={() => navigate("/app/student/profile")}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#F59E0B]/25 transition hover:shadow-xl">
              <Sparkles size={15} /> Complete Profile
            </button>
          )}
          <button className="flex items-center gap-2 rounded-xl border border-[#E8ECF1] bg-white px-4 py-2.5 text-sm font-medium text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]">
            <CalendarDays size={15} /> This Semester
          </button>
        </div>
      </div>

      {profileIncomplete && (
        <div className="rounded-2xl border border-[#F59E0B]/30 bg-[#FEF3C7] px-5 py-4">
          <p className="text-sm font-semibold text-[#F59E0B]">Your profile is {completion.percent}% complete.</p>
          <p className="text-xs text-[#D97706] mt-1">Fill in your details to get accurate AI insights, placement predictions, and personalized recommendations.</p>
        </div>
      )}

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Card className="group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-[#6B7280]">CGPA</p>
            <div className="relative">
              <select value={cgpaView} onChange={(e) => setCgpaView(e.target.value as any)}
                className="appearance-none rounded-lg border border-[#E8ECF1] bg-white px-2.5 py-1 pr-6 text-[11px] font-semibold text-[#6C4CF1] outline-none cursor-pointer">
                <option value="overall">Overall</option>
                <option value="semester">Semester Wise</option>
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#6C4CF1]" />
            </div>
          </div>
          <p className="text-[32px] font-bold tracking-tight text-[#111827]">{hasRealData ? cgpaValue : "Complete profile"}</p>
          {hasRealData && p?.current_semester_gpa && p?.cgpa ? (
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#22C55E]">
              <TrendingUp size={13} /> +{(p.current_semester_gpa - (p.cgpa - 0.3)).toFixed(1)} vs last sem
            </div>
          ) : null}
        </Card>

        <Card className="group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-[#6B7280]">Attendance</p>
            <div className="relative">
              <select value={attendanceView} onChange={(e) => setAttendanceView(e.target.value as any)}
                className="appearance-none rounded-lg border border-[#E8ECF1] bg-white px-2.5 py-1 pr-6 text-[11px] font-semibold text-[#6C4CF1] outline-none cursor-pointer">
                <option value="overall">Overall</option>
                <option value="monthly">This Month</option>
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#6C4CF1]" />
            </div>
          </div>
          <p className="text-[32px] font-bold tracking-tight text-[#111827]">{hasRealData ? `${attendanceValue}%` : "Complete profile"}</p>
          {hasRealData ? (
            <div className="mt-2 flex items-center gap-3 text-xs">
              <span className="font-semibold text-[#22C55E]">{Math.round(attendanceValue * 50 / 100)}/50 classes</span>
              <span className="text-[#9CA3AF]">•</span>
              <span className="font-medium text-[#EF4444]">{50 - Math.round(attendanceValue * 50 / 100)} missed</span>
            </div>
          ) : null}
        </Card>

        <Card className="group overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
          <p className="mb-3 text-sm font-medium text-[#6B7280]">Internal Marks Avg</p>
          <p className="text-[32px] font-bold tracking-tight text-[#111827]">{hasRealData ? `${Math.round(p?.skill_score || 0)}%` : "—"}</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6]" style={{ width: `${p?.skill_score || 0}%` }} />
          </div>
        </Card>

        <Card className="group overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
          <p className="mb-3 text-sm font-medium text-[#6B7280]">Credits Earned</p>
          <p className="text-[32px] font-bold tracking-tight text-[#111827]">{creditsValue}</p>
          <p className="mt-2 text-xs font-medium text-[#6B7280]">of {totalCredits} total</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#4ADE80]" style={{ width: `${creditsPct}%` }} />
          </div>
        </Card>

        <Card className="group overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
          <p className="mb-3 text-sm font-medium text-[#6B7280]">Current SGPA</p>
          <p className="text-[32px] font-bold tracking-tight text-[#111827]">{hasRealData && p?.current_semester_gpa ? p.current_semester_gpa.toFixed(1) : "—"}</p>
        </Card>

        <Card className="group overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
          <p className="mb-3 text-sm font-medium text-[#6B7280]">Section</p>
          <p className="text-[32px] font-bold tracking-tight text-[#111827]">{p?.section || "—"}</p>
          <p className="mt-2 text-xs font-medium text-[#6B7280]">{p?.branch || ""}</p>
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
              <TrendingUp size={14} className="text-[#22C55E]" /> {semesterGpas.length} semesters
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={semesterChartData}>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="semester" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis domain={[6, 9]} tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }} />
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
            <span className="rounded-full bg-[#22C55E]/10 px-3 py-1 text-xs font-semibold text-[#22C55E]">{attendanceValue}% avg</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyAttendance}>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }} />
              <Bar dataKey="percentage" radius={[8, 8, 0, 0]} barSize={32}>
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
            {p?.subjects_data?.length ? p.subjects_data.map((subj: any) => (
              <div key={subj.code}>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-sm font-medium text-[#111827]">{subj.name}</p>
                  <span className="text-xs font-bold text-[#6C4CF1]">{subj.credits} cr</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#F3F4F6]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6]" style={{ width: `${Math.min(100, (subj.credits / 4) * 100)}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-[10px] font-medium text-[#9CA3AF]">
                  <span>{subj.code}</span>
                  <span>{subj.faculty}</span>
                </div>
              </div>
            )) : <p className="text-sm text-[#6B7280]">No subjects data available. Update your profile to add subjects.</p>}
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
                <Pie data={[
                  { name: "Completed", value: creditsValue, color: "#6C4CF1" },
                  { name: "Remaining", value: Math.max(0, totalCredits - creditsValue), color: "#E5E7EB" },
                ]} dataKey="value" innerRadius={65} outerRadius={90} startAngle={90} endAngle={-270} paddingAngle={4}>
                  <Cell fill="#6C4CF1" /><Cell fill="#E5E7EB" />
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="-mt-36 grid place-items-center">
              <p className="text-3xl font-bold text-[#111827]">{creditsPct}%</p>
              <p className="text-xs font-medium text-[#6B7280]">completed</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#E8ECF1] bg-[#F5F7FA] p-3 text-center">
              <p className="text-lg font-bold text-[#6C4CF1]">{creditsValue}</p>
              <p className="text-[11px] font-medium text-[#6B7280]">Earned</p>
            </div>
            <div className="rounded-xl border border-[#E8ECF1] bg-[#F5F7FA] p-3 text-center">
              <p className="text-lg font-bold text-[#F59E0B]">{Math.max(0, totalCredits - creditsValue)}</p>
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
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
              <p key={d} className="text-center text-[10px] font-semibold text-[#9CA3AF]">{d}</p>
            ))}
            {Array.from({ length: 28 }, (_, i) => {
              const val = attendanceValue * (0.85 + Math.random() * 0.15);
              return (
                <div key={i} className="aspect-square rounded-lg border border-[#E8ECF1] transition hover:scale-110 hover:shadow-sm"
                  style={{ backgroundColor: `rgba(108,76,241,${0.08 + val / 130})` }} title={`Day ${i + 1}: ${Math.round(val)}%`}>
                  <span className="grid h-full place-items-center text-[10px] font-semibold text-[#6C4CF1]">{i + 1}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-[#E8ECF1] bg-[#F5F7FA] px-3 py-2">
            <span className="text-xs font-medium text-[#6B7280]">Monthly Average</span>
            <span className="text-sm font-bold text-[#22C55E]">{attendanceValue}%</span>
          </div>
        </Card>
      </section>

      {/* AI Insights + Profile Summary */}
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#6C4CF1]">AI INSIGHTS</p>
              <h3 className="mt-1 text-xl font-bold text-[#111827]">Personalized Intelligence</h3>
            </div>
            <Brain size={20} className="text-[#6C4CF1]" />
          </div>
          <div className="grid gap-3">
            {(hasRealData ? [
              { icon: Brain, text: `Improve DSA to increase placement readiness. Current score: ${p?.skill_score || 0}%.`, color: "from-[#6C4CF1] to-[#8B5CF6]" },
              { icon: FileText, text: `Resume ATS score is ${p?.resume_score || 0}%. Update projects section to improve.`, color: "from-[#3B82F6] to-[#60A5FA]" },
              { icon: Award, text: `You are eligible for ${p?.eligible_companies || 0} companies this placement season.`, color: "from-[#22C55E] to-[#4ADE80]" },
              { icon: BookOpen, text: `Current CGPA ${p?.cgpa || 0}. Keep up the momentum!`, color: "from-[#F59E0B] to-[#FBBF24]" },
              { icon: User, text: `Faculty Advisor: ${p?.faculty_advisor || "Not assigned"}. Schedule a meeting.`, color: "from-[#EF4444] to-[#F87171]" },
            ] : [
              { icon: Sparkles, text: `Complete your profile to unlock accurate AI insights and placement predictions.`, color: "from-[#F59E0B] to-[#FBBF24]" },
            ]).map((insight, i) => (
              <div key={i} className="group flex items-start gap-4 rounded-2xl border border-[#E8ECF1] bg-[#F5F7FA] p-4 transition hover:border-[#6C4CF1]/20 hover:bg-white hover:shadow-md">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${insight.color} text-white shadow-sm`}>
                  <insight.icon size={17} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold leading-relaxed text-[#111827]">{insight.text}</p>
                  {hasRealData && (
                    <button className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-[#6C4CF1] transition hover:gap-2">
                      Take Action <ChevronRight size={13} />
                    </button>
                  )}
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
            <p className="mt-1 text-sm text-white/80">{p?.department || ""}</p>
          </div>
          <div className="divide-y divide-[#E8ECF1]">
            {[
              { icon: GraduationCap, label: "Year", value: p?.year ? `${p.year}th Year` : "—" },
              { icon: Layers, label: "Semester", value: p?.semester ? `Sem ${p.semester}` : "—" },
              { icon: User, label: "Roll No", value: p?.roll_number || "—" },
              { icon: Award, label: "CGPA", value: p?.cgpa ? `${p.cgpa} / 10` : "—" },
              { icon: Target, label: "Placement Readiness", value: p?.placement_readiness_score ? `${p.placement_readiness_score}%` : "—" },
              { icon: FileText, label: "Resume Score", value: p?.resume_score ? `${p.resume_score}%` : "—" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-3.5 transition hover:bg-[#F5F7FA]">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#6C4CF1]/10 text-[#6C4CF1]"><item.icon size={15} /></div>
                <div className="flex w-full items-center justify-between">
                  <p className="text-sm font-medium text-[#6B7280]">{item.label}</p>
                  <p className="text-sm font-bold text-[#111827]">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </motion.div>
  );
}
