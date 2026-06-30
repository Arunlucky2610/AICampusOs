import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, ArrowLeft, Award, BadgeCheck, BarChart3, Bell, BookOpen, Bot,
  Brain, Briefcase, CalendarDays, CheckCircle2, ChevronRight, Clock, Code2,
  Download, FileText, GraduationCap, Lightbulb, Mail, MessageSquare, Phone,
  Send, Sparkles, Star, Target, TrendingUp, Trophy, UserCheck, Users,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart as ReLineChart,
  PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PremiumCard } from "../../components/ui/PremiumCard";
import { AnimatedCounter } from "../../components/ui/AnimatedCounter";
import { CardSkeleton } from "../../components/ui/LoadingSkeleton";
import { generateStudentDetail } from "../../components/faculty/mockData";
import type { FacultyStudentDetail } from "../../types";

type TabId = "Overview" | "Academics" | "Attendance" | "Assignments" | "Projects" | "Hackathons" | "Coding" | "Resume" | "Placement" | "Certificates" | "AI Insights" | "Behavior" | "Parent Details" | "Faculty Notes" | "Timeline" | "AI Summary";

const tabs: TabId[] = [
  "Overview", "Academics", "Attendance", "Assignments", "Projects", "Hackathons",
  "Coding", "Resume", "Placement", "Certificates", "AI Insights", "Behavior",
  "Parent Details", "Faculty Notes", "Timeline", "AI Summary",
];

const palette = ["#6C4CF1", "#3B82F6", "#8B5CF6", "#22C55E", "#F59E0B", "#EF4444"];

export function FacultyStudentProfile() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const id = parseInt(studentId || "1");
  const [activeTab, setActiveTab] = useState<TabId>("Overview");

  const { data: apiStudent, isLoading } = useQuery({
    queryKey: ["faculty-student", id],
    queryFn: async () => (await api.get<FacultyStudentDetail>(`/faculty/students/${id}`)).data,
  });

  const student = apiStudent || generateStudentDetail(id);
  const s = student;
  const riskLabel = s.risk_score < 30 ? "Low" : s.risk_score < 60 ? "Medium" : "High";
  const riskColor = riskLabel === "Low" ? "text-green-600 bg-green-50" : riskLabel === "Medium" ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 shimmer-bg rounded-[20px]" />
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.slice(0, 6).map((t) => <div key={t} className="h-10 w-28 shrink-0 shimmer-bg rounded-xl" />)}
        </div>
        <CardSkeleton />
      </div>
    );
  }

  const rightPanel = (
    <div className="space-y-4">
      <PremiumCard className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target size={15} className="text-[#6C4CF1]" />
          <p className="text-sm font-semibold">AI Risk Score</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative h-20 w-20">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#F3F4F6" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={s.risk_score >= 70 ? "#EF4444" : s.risk_score >= 40 ? "#F59E0B" : "#22C55E"} strokeWidth="8"
                strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - s.risk_score / 100)}`} />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-lg font-bold">{s.risk_score}</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{riskLabel} Risk</p>
            <p className="text-xs text-muted">{s.ai_summary?.career_prediction || "Analyzing..."}</p>
          </div>
        </div>
      </PremiumCard>

      <PremiumCard className="p-5">
        <p className="mb-3 text-sm font-semibold">Strengths</p>
        <div className="flex flex-wrap gap-1.5">
          {(s.strengths || []).map((st, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-700">
              <Star size={11} /> {st}
            </span>
          ))}
        </div>
      </PremiumCard>

      <PremiumCard className="p-5">
        <p className="mb-3 text-sm font-semibold">Weaknesses</p>
        <div className="flex flex-wrap gap-1.5">
          {(s.weak_areas || []).map((w, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
              <AlertTriangle size={11} /> {w}
            </span>
          ))}
        </div>
      </PremiumCard>

      <PremiumCard className="p-5">
        <p className="mb-3 text-sm font-semibold">AI Recommendations</p>
        <div className="space-y-2">
          {(s.ai_summary?.recommendations || []).map((r, i) => (
            <div key={i} className="flex gap-2 rounded-xl border border-line p-2.5">
              <Lightbulb size={14} className="mt-0.5 shrink-0 text-[#6C4CF1]" />
              <p className="text-xs text-muted">{r}</p>
            </div>
          ))}
        </div>
      </PremiumCard>

      <PremiumCard className="p-5">
        <p className="mb-3 text-sm font-semibold">Career Prediction</p>
        <div className="rounded-xl bg-gradient-to-br from-[#6C4CF1]/10 to-[#3B82F6]/10 p-3 text-center">
          <Bot size={20} className="mx-auto mb-1 text-[#6C4CF1]" />
          <p className="text-sm font-bold text-[#6C4CF1]">{s.ai_summary?.career_prediction || "AI/ML Engineer"}</p>
        </div>
      </PremiumCard>

      <PremiumCard className="p-5">
        <p className="mb-2 text-sm font-semibold">Learning Path</p>
        <div className="space-y-1.5">
          {(s.ai_summary?.learning_path || []).map((lp, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className="h-2 w-2 rounded-full bg-[#6C4CF1]" />
              <span className="text-muted">{lp}</span>
            </div>
          ))}
        </div>
      </PremiumCard>

      <PremiumCard className="p-5">
        <p className="mb-2 text-sm font-semibold">Placement Probability</p>
        <div className="text-center">
          <p className="text-3xl font-bold text-[#6C4CF1]"><AnimatedCounter value={s.placement_readiness_score} suffix="%" /></p>
          <p className="text-xs text-muted">Based on AI analysis</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-gradient-to-r from-[#6C4CF1] to-[#3B82F6]" style={{ width: `${s.placement_readiness_score}%` }} />
          </div>
        </div>
      </PremiumCard>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12">
      {/* Back button */}
      <button onClick={() => navigate("/app/faculty/students")} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink">
        <ArrowLeft size={15} /> Back to Students
      </button>

      {/* ============================== */}
      {/* PREMIUM PROFILE HEADER */}
      {/* ============================== */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0F0A2E] via-[#1A0F3E] to-[#2D1B69] p-6 md:p-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#6C4CF1]/20 blur-[60px]" />
        <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-[#3B82F6]/15 blur-[40px]" />

        <div className="relative flex flex-col gap-6 md:flex-row">
          <div className="group relative shrink-0">
            <div className="absolute -inset-1 rounded-[24px] bg-gradient-to-r from-[#6C4CF1] to-[#3B82F6] opacity-40 blur transition group-hover:opacity-70" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] text-3xl font-bold text-white shadow-lg">
              {s.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-white md:text-3xl">{s.name}</h2>
                <p className="text-white/70">{s.roll_number} • {s.department}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${riskColor}`}>{riskLabel} Risk</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                  <Brain size={12} /> AI Score: {s.ai_score || Math.round(50 + s.cgpa * 4 + s.attendance_percentage * 0.3)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { icon: Mail, text: s.email },
                { icon: Phone, text: s.phone_number || "N/A" },
                { icon: GraduationCap, text: `Year ${s.year} • Sem ${s.semester}` },
                { icon: Users, text: `Section ${s.section}` },
                { icon: BookOpen, text: `${s.credits_earned}/${s.total_credits} Credits` },
              ].map((info, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm">
                  <info.icon size={12} /> {info.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============================== */}
      {/* TABS NAVIGATION */}
      {/* ============================== */}
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-1 pb-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-gradient-to-r from-[#6C4CF1] to-[#3B82F6] text-white shadow-md shadow-[#6C4CF1]/20"
                  : "border border-line bg-white text-muted hover:border-[#6C4CF1]/30 hover:text-ink"
              }`}
            >
              {tab === "AI Insights" && <Brain size={14} className="inline mr-1.5" />}
              {tab === "AI Summary" && <Sparkles size={14} className="inline mr-1.5" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ============================== */}
      {/* TAB CONTENT + RIGHT PANEL */}
      {/* ============================== */}
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {activeTab === "Overview" && <OverviewTab s={s} />}
          {activeTab === "Academics" && <AcademicsTab s={s} />}
          {activeTab === "Attendance" && <AttendanceTab s={s} />}
          {activeTab === "Assignments" && <AssignmentsTab s={s} />}
          {activeTab === "Projects" && <ProjectsTab s={s} />}
          {activeTab === "Hackathons" && <HackathonsTab s={s} />}
          {activeTab === "Coding" && <CodingTab s={s} />}
          {activeTab === "Resume" && <ResumeTab s={s} />}
          {activeTab === "Placement" && <PlacementTab s={s} />}
          {activeTab === "Certificates" && <CertificatesTab s={s} />}
          {activeTab === "AI Insights" && <AIInsightsTab s={s} />}
          {activeTab === "Behavior" && <BehaviorTab s={s} />}
          {activeTab === "Parent Details" && <ParentTab s={s} />}
          {activeTab === "Faculty Notes" && <FacultyNotesTab s={s} />}
          {activeTab === "Timeline" && <TimelineTab s={s} />}
          {activeTab === "AI Summary" && <AISummaryTab s={s} />}
        </div>

        {/* Right Panel */}
        {rightPanel}
      </div>

      {/* Faculty Actions */}
      <PremiumCard className="p-5">
        <p className="mb-4 text-sm font-semibold">Faculty Actions</p>
        <div className="flex flex-wrap gap-2">
          <Button><MessageSquare size={15} /> Add Note</Button>
          <Button variant="secondary"><Send size={15} /> Mark Intervention</Button>
          <Button variant="secondary"><Bell size={15} /> Send Notification</Button>
          <Button variant="secondary"><Download size={15} /> Generate Report</Button>
        </div>
      </PremiumCard>
    </motion.div>
  );
}

// ===================== TAB COMPONENTS =====================

function OverviewTab({ s }: { s: FacultyStudentDetail }) {
  const stats = [
    { label: "Current CGPA", value: s.cgpa, icon: Award, color: "from-purple-500 to-purple-600" },
    { label: "Semester GPA", value: s.current_semester_gpa, icon: TrendingUp, color: "from-blue-500 to-blue-600" },
    { label: "Attendance", value: `${s.attendance_percentage}%`, icon: Clock, color: "from-cyan-500 to-cyan-600" },
    { label: "Readiness", value: `${s.placement_readiness_score}%`, icon: Briefcase, color: "from-emerald-500 to-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <PremiumCard key={stat.label} hover={false} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${stat.color} grid place-items-center`}>
                <stat.icon size={17} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-muted">{stat.label}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            </div>
          </PremiumCard>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <PremiumCard className="p-5" hover={false}>
          <p className="mb-3 text-sm font-semibold">Personal Information</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Registration", s.registration_number || "N/A"], ["Department", s.department],
              ["Course", s.course || "B.Tech"], ["Year", String(s.year)],
              ["Semester", String(s.semester)], ["Section", s.section || "N/A"],
              ["DOB", s.date_of_birth || "N/A"], ["Gender", s.gender || "N/A"],
            ].map(([l, v]) => (
              <div key={String(l)} className="rounded-xl bg-soft px-4 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{l}</p>
                <p className="mt-0.5 text-sm font-semibold">{v}</p>
              </div>
            ))}
          </div>
        </PremiumCard>

        <PremiumCard className="p-5" hover={false}>
          <p className="mb-3 text-sm font-semibold">Skills Overview</p>
          <div className="space-y-3">
            {Object.entries(s.skills_data || {}).map(([cat, skills]) =>
              Array.isArray(skills) && skills.length > 0 ? (
                <div key={cat}>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">{cat.replace(/_/g, " ")}</p>
                  <div className="flex flex-wrap gap-1">
                    {skills.map((skill: string, i: number) => (
                      <span key={i} className="rounded-lg bg-soft px-2.5 py-1 text-xs font-medium">{skill}</span>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        </PremiumCard>
      </div>
    </div>
  );
}

function AcademicsTab({ s }: { s: FacultyStudentDetail }) {
  return (
    <div className="space-y-6">
      <PremiumCard className="p-5" hover={false}>
        <p className="mb-3 text-sm font-semibold">Semester-wise GPA</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={s.semester_gpas || []} barGap={6}>
            <CartesianGrid stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="semester" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="sgpa" fill="#6C4CF1" radius={[6, 6, 0, 0]} barSize={20} />
            <Bar dataKey="cgpa" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 space-y-1.5">
          {(s.semester_gpas || []).map((sem: any) => (
            <div key={sem.semester} className="flex items-center justify-between rounded-xl border border-line px-4 py-2">
              <span className="text-sm font-semibold">{sem.semester}</span>
              <div className="flex gap-4 text-sm">
                <span>SGPA: <strong>{sem.sgpa}</strong></span>
                <span>CGPA: <strong>{sem.cgpa}</strong></span>
                <span className="text-muted">Credits: {sem.credits}</span>
              </div>
            </div>
          ))}
        </div>
      </PremiumCard>

      <PremiumCard className="p-5" hover={false}>
        <p className="mb-3 text-sm font-semibold">Subject-wise Marks</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-soft text-xs uppercase tracking-wide text-muted">
                <th className="rounded-l-xl px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Subject</th>
                <th className="px-4 py-3 font-semibold">Internal</th>
                <th className="px-4 py-3 font-semibold">External</th>
                <th className="rounded-r-xl px-4 py-3 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {(s.subjects_data || []).map((sub: any, i: number) => (
                <tr key={i} className="border-t border-line transition hover:bg-soft/70">
                  <td className="px-4 py-3 font-medium">{sub.code}</td>
                  <td className="px-4 py-3">{sub.name}</td>
                  <td className="px-4 py-3">{sub.internal_marks ?? "-"}</td>
                  <td className="px-4 py-3">{sub.external_marks ?? "-"}</td>
                  <td className="px-4 py-3 font-semibold">{sub.total_marks ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PremiumCard>
    </div>
  );
}

function AttendanceTab({ s }: { s: FacultyStudentDetail }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <PremiumCard className="p-5" hover={false}>
        <p className="mb-3 text-sm font-semibold">Monthly Attendance</p>
        <ResponsiveContainer width="100%" height={260}>
          <ReLineChart data={s.monthly_attendance || []}>
            <CartesianGrid stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Line type="monotone" dataKey="percentage" stroke="#6C4CF1" strokeWidth={2.5} dot={{ r: 3 }} />
          </ReLineChart>
        </ResponsiveContainer>
      </PremiumCard>

      <PremiumCard className="p-5" hover={false}>
        <p className="mb-3 text-sm font-semibold">Attendance Summary</p>
        <div className="space-y-3">
          {[
            ["Overall", `${s.attendance_percentage}%`, s.attendance_percentage],
            ["This Month", `${Math.min(100, s.attendance_percentage + (id(s) % 10 - 5))}%`, Math.min(100, s.attendance_percentage + (id(s) % 10 - 5))],
            ["Last Month", `${Math.min(100, s.attendance_percentage - ((id(s) * 2) % 10 - 5))}%`, Math.min(100, s.attendance_percentage - ((id(s) * 2) % 10 - 5))],
          ].map(([label, value, score]) => (
            <div key={String(label)}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-muted">{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div className={`h-full rounded-full ${Number(score) >= 85 ? "bg-green-500" : Number(score) >= 75 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${score}%` }} />
              </div>
            </div>
          ))}
          <div className="mt-4 rounded-xl bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-700">⚠ Attendance Alert</p>
            <p className="text-xs text-amber-600 mt-1">{s.attendance_percentage < 75 ? "Below minimum required attendance (75%). Immediate intervention needed." : "Attendance is satisfactory. Maintain current trend."}</p>
          </div>
        </div>
      </PremiumCard>
    </div>
  );
}

function AssignmentsTab({ s }: { s: FacultyStudentDetail }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <PremiumCard className="p-5" hover={false}>
        <p className="mb-3 text-sm font-semibold">Completion Rate</p>
        <div className="flex items-center justify-center py-6">
          <div className="relative h-36 w-36">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#F3F4F6" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#6C4CF1" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - (s.assignment_completion?.submitted || 0) / Math.max(s.assignment_completion?.total || 1, 1))}`} />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-2xl font-bold text-[#6C4CF1]">{Math.round(((s.assignment_completion?.submitted || 0) / Math.max(s.assignment_completion?.total || 1, 1)) * 100)}%</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            ["Total", s.assignment_completion?.total || 0, "text-ink"],
            ["Submitted", s.assignment_completion?.submitted || 0, "text-green-600"],
            ["Pending", s.assignment_completion?.pending || 0, "text-amber-600"],
          ].map(([label, val, color]) => (
            <div key={String(label)}>
              <p className={`text-xl font-bold ${color}`}>{val}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
      </PremiumCard>

      <PremiumCard className="p-5" hover={false}>
        <p className="mb-3 text-sm font-semibold">Recent Assignments</p>
        <div className="space-y-2">
          {["ML Classification", "Neural Network Lab", "Data Structures", "Algorithm Analysis"].map((a, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-line p-3">
              <div>
                <p className="text-sm font-medium">{a}</p>
                <p className="text-xs text-muted">Due: 2026-07-0{5 + i}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${i < 2 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                {i < 2 ? "Submitted" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </PremiumCard>
    </div>
  );
}

function ProjectsTab({ s }: { s: FacultyStudentDetail }) {
  const projects = s.projects?.length ? s.projects : [
    { id: 1, title: "AI-Powered Chatbot", description: "NLP-based chatbot for campus queries", tech_stack: ["Python", "FastAPI", "React"], status: "Ongoing", mentor: "Dr. Nandini Reddy" } as any,
    { id: 2, title: "Attendance System", description: "Face recognition based attendance", tech_stack: ["Python", "OpenCV"], status: "Completed", grade: "A", mentor: "Dr. Nandini Reddy" } as any,
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {projects.map((p) => (
        <PremiumCard key={p.id} hover={false} className="p-5">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm font-semibold">{p.title}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.status === "Completed" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}>{p.status}</span>
          </div>
          <p className="text-xs text-muted">{p.description}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {(p.tech_stack || []).map((t: string, i: number) => (
              <span key={i} className="rounded-md bg-[#6C4CF1]/10 px-2 py-0.5 text-[10px] font-medium text-[#6C4CF1]">{t}</span>
            ))}
          </div>
          {p.grade && <p className="mt-2 text-xs font-semibold text-green-600">Grade: {p.grade}</p>}
        </PremiumCard>
      ))}
    </div>
  );
}

function HackathonsTab({ s }: { s: FacultyStudentDetail }) {
  const hackathons = s.hackathons?.length ? s.hackathons : [
    { id: 1, name: "Hackathon 2025", rank: "2nd Place", date: "2025-03-15", prize: "₹50,000" } as any,
    { id: 2, name: "CodeFest", rank: "Finalist", date: "2025-01-20", prize: "-" } as any,
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {hackathons.map((h) => (
        <PremiumCard key={h.id} hover={false} className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600">
              <Trophy size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{h.name}</p>
              <p className="text-xs text-muted">{h.date}</p>
              <div className="mt-2 flex gap-2">
                <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{h.rank}</span>
                {h.prize !== "-" && <span className="rounded-lg bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">{h.prize}</span>}
              </div>
            </div>
          </div>
        </PremiumCard>
      ))}
    </div>
  );
}

function CodingTab({ s }: { s: FacultyStudentDetail }) {
  const cp = s.coding_profile || { platform: "LeetCode", username: "user", rating: 1450, problems_solved: 120, rank: "3★" };
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <PremiumCard className="p-5" hover={false}>
        <p className="mb-3 text-sm font-semibold">Coding Profile</p>
        <div className="space-y-4">
          {[
            ["Platform", cp.platform], ["Username", cp.username],
            ["Rating", String(cp.rating)], ["Problems Solved", String(cp.problems_solved)],
            ["Rank", cp.rank],
          ].map(([l, v]) => (
            <div key={String(l)} className="flex items-center justify-between rounded-xl bg-soft px-4 py-2.5">
              <span className="text-xs text-muted">{l}</span>
              <span className="text-sm font-semibold">{v}</span>
            </div>
          ))}
        </div>
      </PremiumCard>

      <PremiumCard className="p-5" hover={false}>
        <p className="mb-3 text-sm font-semibold">Skill Scores</p>
        <div className="space-y-3">
          {[
            ["Skill Score", s.skill_score],
            ["Coding Score", s.coding_score],
            ["Resume Score", s.resume_score],
          ].map(([label, score]) => (
            <div key={String(label)}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-muted">{label}</span>
                <span className="font-semibold">{score}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-gradient-to-r from-[#6C4CF1] to-[#3B82F6]" style={{ width: `${score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </PremiumCard>
    </div>
  );
}

function ResumeTab({ s }: { s: FacultyStudentDetail }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <PremiumCard className="p-5" hover={false}>
        <p className="mb-3 text-sm font-semibold">Resume Analysis</p>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-soft px-4 py-3">
            <span className="text-xs text-muted">Resume Score</span>
            <span className="text-lg font-bold text-[#6C4CF1]">{s.resume_score}%</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-soft px-4 py-3">
            <span className="text-xs text-muted">Certifications</span>
            <span className="text-lg font-bold">{(s.certifications || []).length}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-soft px-4 py-3">
            <span className="text-xs text-muted">Projects</span>
            <span className="text-lg font-bold">{(s.projects || []).length}</span>
          </div>
          <div className="mt-4">
            <Button variant="secondary" className="w-full"><Download size={15} /> Download Resume</Button>
          </div>
        </div>
      </PremiumCard>

      <PremiumCard className="p-5" hover={false}>
        <p className="mb-3 text-sm font-semibold">Certifications</p>
        <div className="space-y-2">
          {(s.certifications || []).length > 0 ? (
            (s.certifications || []).map((cert, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-line p-3">
                <BadgeCheck size={16} className="text-green-500" />
                <span className="text-sm font-medium">{cert}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">No certifications added yet</p>
          )}
        </div>
      </PremiumCard>
    </div>
  );
}

function PlacementTab({ s }: { s: FacultyStudentDetail }) {
  const radarData = [
    { skill: "Technical", score: s.skill_score },
    { skill: "Coding", score: s.coding_score },
    { skill: "Resume", score: s.resume_score },
    { skill: "Mock Interview", score: s.mock_interview_score },
    { skill: "Readiness", score: s.placement_readiness_score },
  ];
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <PremiumCard className="p-5" hover={false}>
        <p className="mb-3 text-sm font-semibold">Placement Readiness</p>
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10 }} />
            <Radar dataKey="score" stroke="#6C4CF1" fill="#6C4CF1" fillOpacity={0.15} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </PremiumCard>

      <PremiumCard className="p-5" hover={false}>
        <p className="mb-3 text-sm font-semibold">Placement Stats</p>
        <div className="space-y-3">
          {[
            ["Applications", `${s.applications}`],
            ["Eligible Companies", `${s.eligible_companies}`],
            ["Offers", `${s.offers}`],
            ["Mock Interview", `${s.mock_interview_score}%`],
          ].map(([l, v]) => (
            <div key={String(l)} className="flex items-center justify-between rounded-xl bg-soft px-4 py-2.5">
              <span className="text-xs text-muted">{l}</span>
              <span className="text-sm font-semibold">{v}</span>
            </div>
          ))}
        </div>
      </PremiumCard>
    </div>
  );
}

function CertificatesTab({ s }: { s: FacultyStudentDetail }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {(s.certifications || []).length > 0 ? (
        (s.certifications || []).map((cert, i) => (
          <PremiumCard key={i} hover={false} className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                <BadgeCheck size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">{cert}</p>
                <p className="text-xs text-muted">Verified</p>
              </div>
            </div>
          </PremiumCard>
        ))
      ) : (
        <div className="col-span-full rounded-xl border border-dashed border-line p-8 text-center">
          <Award size={32} className="mx-auto mb-2 text-muted/40" />
          <p className="text-sm text-muted">No certifications yet</p>
        </div>
      )}
    </div>
  );
}

function AIInsightsTab({ s }: { s: FacultyStudentDetail }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <PremiumCard className="p-5" hover={false}>
          <p className="mb-3 text-sm font-semibold text-green-600">✨ Strengths</p>
          <div className="flex flex-wrap gap-2">
            {(s.strengths || []).map((st, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
                <Star size={12} /> {st}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm font-semibold text-amber-600">⚠ Weak Areas</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(s.weak_areas || []).map((w, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                <AlertTriangle size={12} /> {w}
              </span>
            ))}
          </div>
        </PremiumCard>

        <PremiumCard className="p-5" hover={false}>
          <p className="mb-3 text-sm font-semibold">AI Recommendations</p>
          <div className="space-y-2">
            {(s.ai_summary?.recommendations || s.recommended_action ? [s.recommended_action] : []).map((r, i) => (
              <div key={i} className="flex gap-2 rounded-xl border border-line p-3">
                <Lightbulb size={16} className="mt-0.5 shrink-0 text-[#6C4CF1]" />
                <p className="text-sm text-muted">{r}</p>
              </div>
            ))}
          </div>
        </PremiumCard>
      </div>

      <PremiumCard className="p-5" hover={false}>
        <p className="mb-3 text-sm font-semibold">Intervention Notes</p>
        <div className="space-y-2">
          {(s.intervention_notes || []).length > 0 ? (
            (s.intervention_notes || []).map((note, i) => (
              <div key={i} className="flex gap-2 rounded-xl border border-line p-3">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#6C4CF1]" />
                <p className="text-sm text-muted">{note}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">No intervention needed at this time</p>
          )}
        </div>
      </PremiumCard>
    </div>
  );
}

function BehaviorTab({ s }: { s: FacultyStudentDetail }) {
  const notes = s.behavior_notes?.length ? s.behavior_notes : ["Good behavior", "Active participant in class"];
  return (
    <div className="space-y-3">
      {notes.map((note, i) => (
        <PremiumCard key={i} hover={false} className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <UserCheck size={15} className="text-amber-600" />
            </div>
            <p className="text-sm text-muted flex-1">{note}</p>
          </div>
        </PremiumCard>
      ))}
    </div>
  );
}

function ParentTab({ s }: { s: FacultyStudentDetail }) {
  const pd = s.parent_details || {
    father_name: "N/A", father_occupation: "N/A", mother_name: "N/A",
    mother_occupation: "N/A", address: "N/A", phone: "N/A", email: "N/A", income: "N/A",
  };
  return (
    <PremiumCard className="p-5" hover={false}>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["Father's Name", pd.father_name], ["Father's Occupation", pd.father_occupation],
          ["Mother's Name", pd.mother_name], ["Mother's Occupation", pd.mother_occupation],
          ["Address", pd.address], ["Phone", pd.phone],
          ["Email", pd.email], ["Income", pd.income],
        ].map(([l, v]) => (
          <div key={String(l)} className="rounded-xl bg-soft px-4 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{l}</p>
            <p className="mt-0.5 text-sm font-semibold">{v}</p>
          </div>
        ))}
      </div>
    </PremiumCard>
  );
}

function FacultyNotesTab({ s }: { s: FacultyStudentDetail }) {
  const notes = s.faculty_notes?.length ? s.faculty_notes : [
    { id: 1, date: "2026-06-15", note: "Student showed significant improvement in ML practical sessions.", category: "Academic" },
    { id: 2, date: "2026-06-10", note: "Suggested participation in upcoming hackathon.", category: "General" },
  ];
  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <PremiumCard key={note.id} hover={false} className="p-4">
          <div className="flex items-start justify-between mb-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${note.category === "Academic" ? "bg-blue-50 text-blue-700" : "bg-gray-50 text-gray-700"}`}>{note.category}</span>
            <span className="text-xs text-muted">{note.date}</span>
          </div>
          <p className="text-sm text-muted">{note.note}</p>
        </PremiumCard>
      ))}
      <Button variant="secondary" className="w-full"><MessageSquare size={15} /> Add Note</Button>
    </div>
  );
}

function TimelineTab({ s }: { s: FacultyStudentDetail }) {
  const events = s.timeline?.length ? s.timeline : [
    { date: "2026-06-20", event: "Submitted ML Project", type: "Academic" },
    { date: "2026-06-15", event: "Scored 92% in Internal Assessment", type: "Achievement" },
    { date: "2026-06-10", event: "Attended AI Workshop", type: "Activity" },
    { date: "2026-06-01", event: "Attendance dropped below 75%", type: "Alert" },
  ];
  return (
    <div className="space-y-0">
      {events.map((ev, i) => (
        <div key={i} className="flex gap-4 pb-6 relative last:pb-0">
          <div className="flex flex-col items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
              ev.type === "Achievement" ? "bg-green-50 text-green-600" :
              ev.type === "Alert" ? "bg-red-50 text-red-600" :
              ev.type === "Academic" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
            }`}>
              {ev.type === "Achievement" ? <Award size={14} /> :
               ev.type === "Alert" ? <AlertTriangle size={14} /> :
               ev.type === "Academic" ? <BookOpen size={14} /> : <CalendarDays size={14} />}
            </div>
            {i < events.length - 1 && <div className="mt-1 w-px flex-1 bg-line" />}
          </div>
          <div className="flex-1 pb-2">
            <p className="text-sm font-medium">{ev.event}</p>
            <p className="text-xs text-muted">{ev.date}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AISummaryTab({ s }: { s: FacultyStudentDetail }) {
  const ai = s.ai_summary || {
    risk_score: s.risk_score, strengths: s.strengths, weaknesses: s.weak_areas,
    recommendations: [s.recommended_action], career_prediction: "AI/ML Engineer",
    learning_path: ["Python", "ML", "DL", "Cloud"], placement_probability: s.placement_readiness_score,
  };
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <PremiumCard className="p-5 text-center" hover={false}>
          <Brain size={24} className="mx-auto mb-2 text-[#6C4CF1]" />
          <p className="text-2xl font-bold">{ai.risk_score}</p>
          <p className="text-xs text-muted">Risk Score</p>
        </PremiumCard>
        <PremiumCard className="p-5 text-center" hover={false}>
          <Target size={24} className="mx-auto mb-2 text-[#6C4CF1]" />
          <p className="text-2xl font-bold">{ai.placement_probability}%</p>
          <p className="text-xs text-muted">Placement Probability</p>
        </PremiumCard>
        <PremiumCard className="p-5 text-center" hover={false}>
          <Sparkles size={24} className="mx-auto mb-2 text-[#6C4CF1]" />
          <p className="text-lg font-bold">{ai.career_prediction}</p>
          <p className="text-xs text-muted">Predicted Career Path</p>
        </PremiumCard>
      </div>

      <PremiumCard className="p-5" hover={false}>
        <p className="mb-3 text-sm font-semibold">📈 Learning Path</p>
        <div className="space-y-2">
          {(ai.learning_path || []).map((lp, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-[#6C4CF1] text-white" : "bg-soft"}`}>{i + 1}</div>
              <span className="text-sm">{lp}</span>
              {i < (ai.learning_path?.length || 0) - 1 && <ChevronRight size={14} className="text-muted/30" />}
            </div>
          ))}
        </div>
      </PremiumCard>
    </div>
  );
}

function id(s: FacultyStudentDetail): number { return s.id; }
