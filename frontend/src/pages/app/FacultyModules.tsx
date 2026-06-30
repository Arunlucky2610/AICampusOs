import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle, ArrowUpRight, Award, BarChart3, BookOpen, Brain,
  CalendarDays, CheckCircle2, ChevronRight, Clock, Download, FileText,
  GraduationCap, Lightbulb, Sparkles, TrendingUp, UserCheck, Users, Zap,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart as ReLineChart,
  PolarAngleAxis, PolarGrid, Radar, RadarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PremiumCard } from "../../components/ui/PremiumCard";
import { AnimatedCounter } from "../../components/ui/AnimatedCounter";
import {
  generateAtRiskStudents, generateYearWiseData, generateStudentsByYear,
} from "../../components/faculty/mockData";

const palette = ["#6C4CF1", "#3B82F6", "#8B5CF6", "#22C55E", "#F59E0B", "#EF4444"];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemAnim = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

// =====================================================
// YEAR-WISE STUDENTS
// =====================================================
export function FacultyYearWise() {
  const navigate = useNavigate();
  const { data: apiData } = useQuery({
    queryKey: ["faculty-year-wise"],
    queryFn: async () => (await api.get("/faculty/year-wise")).data,
  });
  const years = apiData || generateYearWiseData();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">
      <motion.div variants={itemAnim}>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#6C4CF1]/10 px-3 py-1 text-[11px] font-semibold text-[#6C4CF1]">
          <GraduationCap size={13} /> Year Overview
        </div>
        <h2 className="text-2xl font-bold md:text-3xl">Year-wise Performance Intelligence</h2>
        <p className="mt-1 text-sm text-muted">Cross-year academic analytics and student distribution</p>
      </motion.div>

      <motion.div variants={itemAnim} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {years.map((yr: any, i: number) => (
          <PremiumCard key={yr.year} index={i}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] text-lg font-bold text-white">
                {yr.year}
              </div>
              <div>
                <h3 className="text-lg font-bold">{yr.label}</h3>
                <p className="text-xs text-muted">{yr.total_students} students</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: `${yr.average_attendance}%`, label: "Attendance", color: "text-[#6C4CF1]" },
                { value: yr.average_cgpa, label: "Avg CGPA", color: "text-[#3B82F6]" },
                { value: yr.at_risk_count, label: "At-Risk", color: "text-amber-600" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-soft p-2.5 text-center">
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="secondary" className="w-full" onClick={() => navigate(`/app/faculty/students?year=${yr.year}`)}>
                <Users size={14} /> View Students
              </Button>
            </div>
          </PremiumCard>
        ))}
      </motion.div>

      <motion.div variants={itemAnim}>
        <PremiumCard className="p-6" hover={false}>
          <div className="mb-4">
            <p className="text-sm font-semibold">Year-over-Year Comparison</p>
            <p className="text-xs text-muted">Attendance and CGPA trends</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={years} barGap={8}>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar yAxisId="left" dataKey="average_attendance" fill="#6C4CF1" radius={[6, 6, 0, 0]} barSize={28} name="Avg Attendance %" />
              <Bar yAxisId="right" dataKey="average_cgpa" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={28} name="Avg CGPA" />
            </BarChart>
          </ResponsiveContainer>
        </PremiumCard>
      </motion.div>
    </motion.div>
  );
}

// =====================================================
// ATTENDANCE
// =====================================================
const attendanceData = [
  { name: "Anika Sharma", roll: "AIML1A01", year: 1, section: "A", percentage: 92, status: "Good" },
  { name: "Arjun Verma", roll: "AIML1A02", year: 1, section: "A", percentage: 88, status: "Good" },
  { name: "Bhavya Patel", roll: "AIML2B01", year: 2, section: "B", percentage: 76, status: "Warning" },
  { name: "Chirag Reddy", roll: "AIML2A03", year: 2, section: "A", percentage: 95, status: "Excellent" },
  { name: "Deepika Singh", roll: "AIML3B02", year: 3, section: "B", percentage: 68, status: "Critical" },
  { name: "Esha Gupta", roll: "AIML3A04", year: 3, section: "A", percentage: 90, status: "Good" },
  { name: "Farhan Kumar", roll: "AIML4B03", year: 4, section: "B", percentage: 82, status: "Good" },
  { name: "Gauri Rao", roll: "AIML4A05", year: 4, section: "A", percentage: 96, status: "Excellent" },
  { name: "Harsh Joshi", roll: "CSE1B04", year: 1, section: "B", percentage: 72, status: "Warning" },
  { name: "Ishita Mehta", roll: "CSE2A06", year: 2, section: "A", percentage: 85, status: "Good" },
];

export function FacultyAttendance() {
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");

  const filtered = attendanceData.filter(s => {
    if (yearFilter !== "all" && String(s.year) !== yearFilter) return false;
    if (sectionFilter !== "all" && s.section !== sectionFilter) return false;
    return true;
  });

  const avgAtt = filtered.length ? Math.round(filtered.reduce((sum, s) => sum + s.percentage, 0) / filtered.length) : 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">
      <motion.div variants={itemAnim} className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#6C4CF1]/10 px-3 py-1 text-[11px] font-semibold text-[#6C4CF1]">
            <Clock size={13} /> Attendance Intelligence
          </div>
          <h2 className="text-2xl font-bold md:text-3xl">Attendance Tracker</h2>
          <p className="mt-1 text-sm text-muted">Real-time attendance monitoring and analytics</p>
        </div>
        <div className="flex gap-2">
          <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
            className="h-10 rounded-xl border border-line bg-white px-3 text-sm font-medium focus:border-[#6C4CF1]/40 focus:outline-none focus:ring-2 focus:ring-[#6C4CF1]/10">
            <option value="all">All Years</option>
            {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
          </select>
          <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}
            className="h-10 rounded-xl border border-line bg-white px-3 text-sm font-medium focus:border-[#6C4CF1]/40 focus:outline-none focus:ring-2 focus:ring-[#6C4CF1]/10">
            <option value="all">All Sections</option>
            {["A", "B", "C"].map(s => <option key={s} value={s}>Sec {s}</option>)}
          </select>
          <Button variant="secondary"><Download size={15} /> Export</Button>
        </div>
      </motion.div>

      <motion.div variants={itemAnim} className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Average Attendance", value: `${avgAtt}%`, color: "text-[#6C4CF1]", trend: "+2% vs last month" },
          { label: "Excellent (>90%)", value: attendanceData.filter(s => s.percentage >= 90).length, color: "text-green-600", trend: "Top performers" },
          { label: "Warning (75-89%)", value: attendanceData.filter(s => s.percentage >= 75 && s.percentage < 90).length, color: "text-amber-600", trend: "Needs monitoring" },
          { label: "Critical (<75%)", value: attendanceData.filter(s => s.percentage < 75).length, color: "text-red-600", trend: "Immediate action" },
        ].map((stat) => (
          <PremiumCard key={stat.label} hover={false} className="p-4">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted mt-1">{stat.label}</p>
            <p className="text-[10px] text-green-600 mt-0.5">{stat.trend}</p>
          </PremiumCard>
        ))}
      </motion.div>

      <motion.div variants={itemAnim}>
        <PremiumCard className="overflow-hidden" hover={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-soft text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Roll No</th>
                  <th className="px-4 py-3 font-semibold">Year</th>
                  <th className="px-4 py-3 font-semibold">Section</th>
                  <th className="px-4 py-3 font-semibold">Attendance</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={i} className="border-t border-line transition hover:bg-soft/70">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-muted">{s.roll}</td>
                    <td className="px-4 py-3">{s.year}</td>
                    <td className="px-4 py-3">{s.section}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-100">
                          <div className={`h-full rounded-full ${s.percentage >= 90 ? "bg-green-500" : s.percentage >= 75 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${s.percentage}%` }} />
                        </div>
                        <span className="text-xs font-semibold">{s.percentage}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.status === "Excellent" ? "bg-green-50 text-green-700" : s.status === "Good" ? "bg-blue-50 text-blue-700" : s.status === "Warning" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PremiumCard>
      </motion.div>
    </motion.div>
  );
}

// =====================================================
// MARKS & INTERNALS
// =====================================================
const marksData = [
  { name: "Anika Sharma", roll: "AIML1A01", subject: "Mathematics I", internal: 18, external: 68, total: 86, grade: "A" },
  { name: "Arjun Verma", roll: "AIML1A02", subject: "Physics", internal: 15, external: 62, total: 77, grade: "B+" },
  { name: "Bhavya Patel", roll: "AIML2B01", subject: "Data Structures", internal: 12, external: 55, total: 67, grade: "B" },
  { name: "Chirag Reddy", roll: "AIML2A03", subject: "Algorithms", internal: 19, external: 72, total: 91, grade: "A+" },
  { name: "Deepika Singh", roll: "AIML3B02", subject: "Machine Learning", internal: 10, external: 45, total: 55, grade: "C" },
  { name: "Esha Gupta", roll: "AIML3A04", subject: "Deep Learning", internal: 17, external: 65, total: 82, grade: "A" },
  { name: "Farhan Kumar", roll: "AIML4B03", subject: "NLP", internal: 14, external: 58, total: 72, grade: "B+" },
  { name: "Gauri Rao", roll: "AIML4A05", subject: "Computer Vision", internal: 20, external: 75, total: 95, grade: "A+" },
];

export function FacultyMarks() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">
      <motion.div variants={itemAnim} className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#6C4CF1]/10 px-3 py-1 text-[11px] font-semibold text-[#6C4CF1]">
            <FileText size={13} /> Assessment Center
          </div>
          <h2 className="text-2xl font-bold md:text-3xl">Marks & Internals</h2>
          <p className="mt-1 text-sm text-muted">Subject-wise internal and external marks analytics</p>
        </div>
        <Button variant="secondary"><Download size={15} /> Export</Button>
      </motion.div>

      <motion.div variants={itemAnim} className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total Records", value: marksData.length, color: "text-[#6C4CF1]" },
          { label: "Avg Internal", value: `${Math.round(marksData.reduce((s, r) => s + r.internal, 0) / marksData.length)}/20`, color: "text-green-600" },
          { label: "Avg External", value: `${Math.round(marksData.reduce((s, r) => s + r.external, 0) / marksData.length)}/80`, color: "text-blue-600" },
          { label: "Avg Total", value: `${Math.round(marksData.reduce((s, r) => s + r.total, 0) / marksData.length)}/100`, color: "text-amber-600" },
        ].map((stat) => (
          <PremiumCard key={stat.label} hover={false} className="p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted mt-1">{stat.label}</p>
          </PremiumCard>
        ))}
      </motion.div>

      <motion.div variants={itemAnim}>
        <PremiumCard className="overflow-hidden" hover={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-soft text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Roll No</th>
                  <th className="px-4 py-3 font-semibold">Subject</th>
                  <th className="px-4 py-3 font-semibold">Internal</th>
                  <th className="px-4 py-3 font-semibold">External</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Grade</th>
                </tr>
              </thead>
              <tbody>
                {marksData.map((r, i) => (
                  <tr key={i} className="border-t border-line transition hover:bg-soft/70">
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-muted">{r.roll}</td>
                    <td className="px-4 py-3">{r.subject}</td>
                    <td className="px-4 py-3">{r.internal}/20</td>
                    <td className="px-4 py-3">{r.external}/80</td>
                    <td className="px-4 py-3 font-semibold">{r.total}/100</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.grade.startsWith("A") ? "bg-green-50 text-green-700" : r.grade.startsWith("B") ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{r.grade}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PremiumCard>
      </motion.div>
    </motion.div>
  );
}

// =====================================================
// ASSIGNMENTS
// =====================================================
const assignmentsData = [
  { title: "ML Classification Report", course: "Machine Learning", year: 3, section: "A", due: "2026-07-05", submitted: 22, total: 28, status: "Active" },
  { title: "Neural Network Implementation", course: "Deep Learning", year: 3, section: "B", due: "2026-07-08", submitted: 18, total: 26, status: "Active" },
  { title: "Python Programming Lab", course: "Python", year: 1, section: "A", due: "2026-07-03", submitted: 30, total: 32, status: "Active" },
  { title: "Data Structures Assignment", course: "Data Structures", year: 2, section: "A", due: "2026-07-10", submitted: 15, total: 34, status: "Active" },
  { title: "Algorithm Analysis", course: "Algorithms", year: 2, section: "B", due: "2026-06-30", submitted: 28, total: 30, status: "Closed" },
  { title: "Research Paper Review", course: "NLP", year: 4, section: "A", due: "2026-07-12", submitted: 12, total: 29, status: "Active" },
];

export function FacultyAssignments() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">
      <motion.div variants={itemAnim} className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#6C4CF1]/10 px-3 py-1 text-[11px] font-semibold text-[#6C4CF1]">
            <BookOpen size={13} /> Assignment Hub
          </div>
          <h2 className="text-2xl font-bold md:text-3xl">Assignments</h2>
          <p className="mt-1 text-sm text-muted">Create, track, and manage assignments</p>
        </div>
        <Button><Sparkles size={15} /> Create Assignment</Button>
      </motion.div>

      <motion.div variants={itemAnim} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {assignmentsData.map((a, i) => (
          <PremiumCard key={i} index={i}>
            <div className="flex items-center justify-between mb-3">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${a.status === "Active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{a.status}</span>
              <span className="text-xs text-muted">Due: {a.due}</span>
            </div>
            <h4 className="text-sm font-semibold">{a.title}</h4>
            <p className="mt-1 text-xs text-muted">{a.course} • Year {a.year} • Section {a.section}</p>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Submissions</span>
                <span className="font-semibold">{a.submitted}/{a.total}</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-gradient-to-r from-[#6C4CF1] to-[#3B82F6]" style={{ width: `${(a.submitted / a.total) * 100}%` }} />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" className="!h-8 !text-xs !px-3">View</Button>
              <Button variant="ghost" className="!h-8 !text-xs !px-3">Remind</Button>
            </div>
          </PremiumCard>
        ))}
      </motion.div>
    </motion.div>
  );
}

// =====================================================
// AT-RISK STUDENTS
// =====================================================
export function FacultyAtRisk() {
  const atRiskData = generateAtRiskStudents();
  const highRisk = atRiskData.filter(s => s.risk_score >= 70).length;
  const medRisk = atRiskData.filter(s => s.risk_score >= 40 && s.risk_score < 70).length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">
      <motion.div variants={itemAnim}>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-600">
          <AlertTriangle size={13} /> At-Risk Monitoring
        </div>
        <h2 className="text-2xl font-bold md:text-3xl">At-Risk Students</h2>
        <p className="mt-1 text-sm text-muted">AI-powered identification of students needing intervention</p>
      </motion.div>

      <motion.div variants={itemAnim} className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "High Risk", value: highRisk, color: "text-red-600", desc: "Immediate intervention needed" },
          { label: "Medium Risk", value: medRisk, color: "text-amber-600", desc: "Needs monitoring" },
          { label: "At-Risk Total", value: atRiskData.length, color: "text-[#6C4CF1]", desc: "Requires attention" },
        ].map((stat) => (
          <PremiumCard key={stat.label} hover={false} className="p-4 text-center">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted mt-1">{stat.label}</p>
            <p className="text-[10px] text-green-600 mt-0.5">{stat.desc}</p>
          </PremiumCard>
        ))}
      </motion.div>

      <motion.div variants={itemAnim} className="space-y-3">
        {atRiskData.map((s, i) => (
          <PremiumCard key={i} index={i}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] text-sm font-bold text-white`}>
                  {s.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{s.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.risk_score >= 70 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                      {s.risk_score >= 70 ? "High" : "Medium"} Risk
                    </span>
                  </div>
                  <p className="text-xs text-muted">{s.roll_number} • Year {s.year} • Section {s.section} • CGPA {s.cgpa} • Attendance {s.attendance_percentage}%</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-muted">Risk Score</p>
                  <p className={`text-lg font-bold ${s.risk_score >= 70 ? "text-red-600" : "text-amber-600"}`}>{s.risk_score}</p>
                </div>
                <Button variant="secondary" className="!h-9 !text-xs">View</Button>
              </div>
            </div>
            <div className="mt-3 border-t border-line pt-3">
              <div className="flex flex-wrap gap-1.5">
                {(s.weak_areas || []).map((area, j) => (
                  <span key={j} className="rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">{area}</span>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">{s.recommended_action}</p>
            </div>
          </PremiumCard>
        ))}
      </motion.div>
    </motion.div>
  );
}

// =====================================================
// AI TEACHING INSIGHTS
// =====================================================
const radarData = [
  { skill: "Class Performance", score: 82 },
  { skill: "Engagement", score: 74 },
  { skill: "Attendance", score: 86 },
  { skill: "Assignment Quality", score: 78 },
  { skill: "Participation", score: 70 },
  { skill: "Improvement Rate", score: 76 },
];

const insights = [
  { title: "Class Performance Trend", description: "Overall class CGPA has improved by 0.3 points compared to last semester. 3rd Year students show the highest improvement rate.", icon: TrendingUp, color: "from-green-500 to-green-600" },
  { title: "Attendance Alert", description: "2nd Year B section has 5 students with attendance below 75%. Early intervention recommended to prevent further decline.", icon: AlertTriangle, color: "from-amber-500 to-amber-600" },
  { title: "Top Performers", description: "Chirag Reddy (CGPA 8.9) and Gauri Rao (CGPA 9.1) are top performers. Consider them for research assistant roles.", icon: Award, color: "from-purple-500 to-purple-600" },
  { title: "Teaching Effectiveness", description: "Your ML course has 92% average attendance. Students show strong engagement with practical lab sessions.", icon: Lightbulb, color: "from-blue-500 to-blue-600" },
  { title: "At-Risk Prediction", description: "AI predicts 2 more students may become at-risk next month based on current attendance trends. Proactive outreach recommended.", icon: Brain, color: "from-primary to-primary" },
  { title: "Assignment Insights", description: "Average assignment submission rate is 82%. Students who submit on time score 15% higher in external exams.", icon: CheckCircle2, color: "from-emerald-500 to-emerald-600" },
];

export function FacultyAIInsights() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">
      <motion.div variants={itemAnim}>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#6C4CF1]/10 px-3 py-1 text-[11px] font-semibold text-[#6C4CF1]">
          <Brain size={13} /> AI-Powered Analytics
        </div>
        <h2 className="text-2xl font-bold md:text-3xl">AI Teaching Insights</h2>
        <p className="mt-1 text-sm text-muted">Data-driven insights to improve teaching effectiveness</p>
      </motion.div>

      <motion.div variants={itemAnim} className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <PremiumCard className="p-6" hover={false}>
          <div className="mb-4">
            <p className="text-sm font-semibold">Class Health Radar</p>
            <p className="text-xs text-muted">Multi-dimensional performance analysis</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
              <Radar dataKey="score" stroke="#6C4CF1" fill="#6C4CF1" fillOpacity={0.18} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </PremiumCard>

        <PremiumCard className="p-6" hover={false}>
          <p className="mb-4 text-sm font-semibold">Key Metrics</p>
          <div className="space-y-4">
            {[
              { label: "Average Class CGPA", value: "7.65", change: "+0.3" },
              { label: "Overall Attendance", value: "85.2%", change: "+2.1%" },
              { label: "Assignment Submission", value: "82%", change: "+5%" },
              { label: "At-Risk Students", value: "14", change: "-3" },
              { label: "Teaching Score", value: "4.2/5", change: "+0.2" },
            ].map((m) => (
              <div key={m.label} className="flex items-center justify-between border-b border-line pb-3 last:border-0">
                <span className="text-sm text-muted">{m.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{m.value}</span>
                  <span className="flex items-center gap-0.5 text-xs font-semibold text-green-600">{m.change} <ArrowUpRight size={11} /></span>
                </div>
              </div>
            ))}
          </div>
        </PremiumCard>
      </motion.div>

      <motion.div variants={itemAnim} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {insights.map((insight, i) => (
          <PremiumCard key={i} index={i}>
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${insight.color}`}>
              <insight.icon size={17} className="text-white" />
            </div>
            <h4 className="text-sm font-semibold">{insight.title}</h4>
            <p className="mt-2 text-xs leading-relaxed text-muted">{insight.description}</p>
          </PremiumCard>
        ))}
      </motion.div>
    </motion.div>
  );
}

// =====================================================
// REPORTS
// =====================================================
const reportItems = [
  { title: "Class Performance Report", desc: "Comprehensive analysis of academic performance across all years and sections.", icon: BarChart3, color: "from-purple-500 to-purple-600" },
  { title: "Attendance Report", desc: "Monthly attendance summary with year and section-wise breakdowns.", icon: CalendarDays, color: "from-blue-500 to-blue-600" },
  { title: "At-Risk Student Report", desc: "Detailed report on at-risk students with risk factors and recommendations.", icon: AlertTriangle, color: "from-red-500 to-red-600" },
  { title: "Placement Readiness Report", desc: "Placement preparedness analysis across eligible students.", icon: TrendingUp, color: "from-green-500 to-green-600" },
  { title: "Subject-wise Performance", desc: "Subject-level performance analysis with grade distribution and trends.", icon: FileText, color: "from-amber-500 to-amber-600" },
  { title: "AI Insights Summary", desc: "AI-generated insights on teaching effectiveness and student engagement.", icon: Brain, color: "from-primary to-primary" },
];

export function FacultyReports() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">
      <motion.div variants={itemAnim}>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#6C4CF1]/10 px-3 py-1 text-[11px] font-semibold text-[#6C4CF1]">
          <BarChart3 size={13} /> Reports
        </div>
        <h2 className="text-2xl font-bold md:text-3xl">Reports Center</h2>
        <p className="mt-1 text-sm text-muted">Generate and view comprehensive academic reports</p>
      </motion.div>

      <motion.div variants={itemAnim} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportItems.map((r, i) => (
          <PremiumCard key={i} index={i}>
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${r.color}`}>
              <r.icon size={20} className="text-white" />
            </div>
            <h4 className="text-sm font-semibold">{r.title}</h4>
            <p className="mt-2 text-xs text-muted">{r.desc}</p>
            <div className="mt-4 flex items-center justify-between">
              <Button variant="secondary" className="!h-8 !text-xs">Generate</Button>
              <span className="flex items-center gap-1 text-xs font-medium text-[#6C4CF1]">View <ChevronRight size={12} /></span>
            </div>
          </PremiumCard>
        ))}
      </motion.div>
    </motion.div>
  );
}
