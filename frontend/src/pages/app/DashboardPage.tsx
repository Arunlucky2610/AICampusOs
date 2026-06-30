import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle, ArrowUpRight, Award, BarChart3, BookOpen, Brain, BriefcaseBusiness,
  CalendarDays, CheckCircle2, ChevronRight, Clock, Clock3, Download, FileText,
  Filter, GraduationCap, Lightbulb, MessageSquare, MoreHorizontal, Sparkles,
  Target, Timer, TrendingUp, Trophy, UserCheck, Users,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line as ReLine, LineChart as RChartLine,
  Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, RadialBar, RadialBarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useAuth } from "../../context/AuthContext";
import type { Dashboard, KpiItem } from "../../types";

const endpoint: Record<string, string> = { student: "/student/dashboard", faculty: "/faculty/dashboard", parent: "/parent/dashboard", placement: "/placement/dashboard", admin: "/admin/dashboard" };
type DashboardKind = "student" | "faculty" | "parent" | "placement" | "admin";
const palette = ["#6C4CF1", "#3B82F6", "#8B5CF6", "#22C55E", "#F59E0B", "#EF4444"];

const performanceTrend = [
  { month: "Jan", cgpa: 7.8, attendance: 82, readiness: 54 },
  { month: "Feb", cgpa: 8.0, attendance: 86, readiness: 62 },
  { month: "Mar", cgpa: 8.2, attendance: 88, readiness: 68 },
  { month: "Apr", cgpa: 8.4, attendance: 91, readiness: 78 },
  { month: "May", cgpa: 8.5, attendance: 93, readiness: 84 },
];
const radar = [{ skill: "Python", score: 82 }, { skill: "Java", score: 68 }, { skill: "React", score: 74 }, { skill: "FastAPI", score: 72 }, { skill: "SQL", score: 78 }, { skill: "AI/ML", score: 64 }];
const heatmap = Array.from({ length: 28 }, (_, i) => ({ day: i + 1, value: [92, 88, 96, 78, 84, 90, 75][i % 7] }));
const department = [{ name: "CSE", cgpa: 8.3, attendance: 91, readiness: 84 }, { name: "ECE", cgpa: 8.0, attendance: 87, readiness: 76 }, { name: "IT", cgpa: 8.2, attendance: 89, readiness: 81 }, { name: "AIML", cgpa: 8.5, attendance: 92, readiness: 88 }];
const risk = [{ name: "Low", value: 68 }, { name: "Medium", value: 23 }, { name: "High", value: 9 }];
const funnel = [{ stage: "Enrolled", value: 1200 }, { stage: "Active", value: 1080 }, { stage: "Eligible", value: 780 }, { stage: "Shortlisted", value: 430 }, { stage: "Placed", value: 286 }];
const packages = [{ month: "Jan", avg: 6.8, high: 18 }, { month: "Feb", avg: 7.2, high: 21 }, { month: "Mar", avg: 8.1, high: 24 }, { month: "Apr", avg: 8.6, high: 28 }];

const roleCopy = {
  student: ["Overall Success Score", "AI Career Roadmap", "Resume Quality Score", "Internship Tracker"],
  faculty: ["Class Health Score", "Intervention Planner", "Engagement Heatmap", "AI Teaching Suggestions"],
  placement: ["Company Pipeline", "Skill Demand Analytics", "Student Funnel", "Placement Prediction Table"],
  parent: ["Student Progress Summary", "Teacher Messages", "Upcoming Events", "Alerts Timeline"],
  admin: ["Role Distribution", "Department Health", "System Usage", "Audit Logs"],
};

const kpiIcons: Record<string, typeof TrendingUp> = {
  CGPA: GraduationCap, Attendance: CalendarDays, "Placement Readiness": BriefcaseBusiness,
  "Skill Score": Brain, "Resume Score": FileText, "Risk Score": AlertTriangle,
};

const defaultStudentDashboard: Dashboard = {
  role: "STUDENT",
  user: { full_name: "Student" },
  overall: { successScore: 82, placementReadiness: 78, academicRisk: "Low", aiConfidence: 94, nextBestAction: "Complete system design learning sprint this week." },
  kpis: [
    { label: "CGPA", value: "8.45", trend: "+0.3", progress: 84 },
    { label: "Attendance", value: "92%", trend: "+4%", progress: 92 },
    { label: "Placement Readiness", value: "78%", trend: "+8%", progress: 78 },
    { label: "Skill Score", value: "74%", trend: "+6%", progress: 74 },
    { label: "Resume Score", value: "81%", trend: "+12%", progress: 81 },
    { label: "Risk Score", value: "Low", trend: "-6%", progress: 25 },
  ],
  charts: {
    performanceTrend: [
      { month: "Jan", cgpa: 7.8, attendance: 82, readiness: 54 },
      { month: "Feb", cgpa: 8.0, attendance: 86, readiness: 62 },
      { month: "Mar", cgpa: 8.2, attendance: 88, readiness: 68 },
      { month: "Apr", cgpa: 8.4, attendance: 91, readiness: 78 },
      { month: "May", cgpa: 8.45, attendance: 92, readiness: 78 },
      { month: "Jun", cgpa: 8.45, attendance: 92, readiness: 78 },
    ],
    skillRadar: [
      { skill: "Python", score: 85 }, { skill: "Java", score: 70 }, { skill: "React", score: 78 },
      { skill: "FastAPI", score: 72 }, { skill: "SQL", score: 80 }, { skill: "AI/ML", score: 68 },
    ],
    skillGap: [
      { skill: "Python", current: 85, target: 92 }, { skill: "Java", current: 70, target: 82 },
      { skill: "React", current: 78, target: 88 }, { skill: "FastAPI", current: 72, target: 85 },
      { skill: "SQL", current: 80, target: 90 }, { skill: "AI/ML", current: 68, target: 82 },
    ],
    weeklyActivity: [
      { week: "W1", hours: 12, tasks: 8 }, { week: "W2", hours: 15, tasks: 10 },
      { week: "W3", hours: 18, tasks: 12 }, { week: "W4", hours: 14, tasks: 9 },
      { week: "W5", hours: 20, tasks: 14 }, { week: "W6", hours: 16, tasks: 11 },
    ],
    riskTimeline: [
      { event: "Low attendance warning resolved", date: "2 days ago", type: "resolved" },
      { event: "Resume improved", date: "5 days ago", type: "positive" },
      { event: "Mock interview pending", date: "Tomorrow", type: "pending" },
      { event: "Internship application due", date: "In 3 days", type: "warning" },
    ],
  },
  recommendations: [
    { title: "Complete System Design Sprint", priority: "High", reason: "Improves backend readiness and interview score.", action: "Start Sprint" },
    { title: "Book One Mock Interview", priority: "Medium", reason: "Placement readiness can improve by 12%.", action: "Book Now" },
    { title: "Improve AI/ML Skill Level", priority: "Medium", reason: "Your target role requires stronger ML basics.", action: "View Course" },
    { title: "Update Resume Projects Section", priority: "High", reason: "Resume score is currently 81%.", action: "Update Resume" },
  ],
  roadmap: [
    { step: "Strengthen DSA Basics", completed: 100, status: "done" },
    { step: "Complete FastAPI Backend Project", completed: 75, status: "in_progress" },
    { step: "Build Resume Projects", completed: 60, status: "in_progress" },
    { step: "Mock Interviews", completed: 30, status: "pending" },
    { step: "Apply for Internships", completed: 10, status: "pending" },
    { step: "Placement Ready", completed: 0, status: "pending" },
  ],
  placementReadiness: { resumeQuality: 81, mockInterviewScore: 72, technicalSkills: 76, communication: 68, projectStrength: 88 },
  activities: [
    { action: "Resume analyzed", timestamp: "2 hours ago", type: "analysis" },
    { action: "Skill gap report generated", timestamp: "1 day ago", type: "report" },
    { action: "Roadmap updated", timestamp: "2 days ago", type: "update" },
    { action: "Placement prediction refreshed", timestamp: "3 days ago", type: "prediction" },
    { action: "New AI recommendation created", timestamp: "4 days ago", type: "ai" },
  ],
  tables: {},
  notifications: [],
  predictions: [],
};

export function DashboardPage({ kind }: { kind: DashboardKind }) {
  const { data, isLoading, isError } = useQuery({ queryKey: ["dashboard", kind], queryFn: async () => (await api.get<Dashboard>(endpoint[kind])).data });

  if (kind === "student") {
    if (isLoading) return <DashboardSkeleton />;
    if (isError || !data) {
      return <StudentDashboard data={defaultStudentDashboard} />;
    }
    return <StudentDashboard data={{ ...defaultStudentDashboard, ...data, overall: { ...defaultStudentDashboard.overall!, ...data.overall }, kpis: data.kpis?.length ? data.kpis : defaultStudentDashboard.kpis, charts: { ...defaultStudentDashboard.charts, ...data.charts }, recommendations: data.recommendations?.length ? data.recommendations : defaultStudentDashboard.recommendations, roadmap: data.roadmap?.length ? data.roadmap : defaultStudentDashboard.roadmap, placementReadiness: data.placementReadiness ?? defaultStudentDashboard.placementReadiness, activities: data.activities?.length ? data.activities : defaultStudentDashboard.activities }} />;
  }

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) return <EmptyState />;
  const score = Number(String(data.kpis[2]?.value || "84").replace(/[^0-9.]/g, "")) || 84;
  const tableData = (Object.values(data.tables)[0] as any[]) || [];
  const recs = data.recommendations || [];

  return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
    <PageHeader role={data.role.replace("_", " ")} kind={kind} />
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{data.kpis.map((k, i) => <KpiCard key={k.label} item={k} index={i} />)}</section>
    <section className="grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
      <ChartCard title="Performance trend" subtitle="CGPA, attendance, and placement readiness over time">
        <ResponsiveContainer width="100%" height={320}><RChartLine data={performanceTrend}><CartesianGrid stroke="#E5E7EB" vertical={false}/><XAxis dataKey="month"/><YAxis/><Tooltip/><ReLine type="monotone" dataKey="cgpa" stroke="#6C4CF1" strokeWidth={3}/><ReLine type="monotone" dataKey="attendance" stroke="#3B82F6" strokeWidth={3}/><ReLine type="monotone" dataKey="readiness" stroke="#22C55E" strokeWidth={3}/></RChartLine></ResponsiveContainer>
      </ChartCard>
      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between"><div><p className="text-sm font-semibold text-primary">AI insight panel</p><h3 className="mt-1 text-xl font-semibold">Priority recommendations</h3></div><Brain className="text-primary"/></div>
        <div className="space-y-3">{recs.map((r: any, i: number) => <div key={i} className="rounded-2xl border border-line bg-soft p-4 transition hover:border-primary/30 hover:bg-white"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold text-muted">Priority {92 - i * 11}</span><span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">AI</span></div><p className="text-sm font-semibold">{r?.title ?? r}</p><p className="mt-1 text-xs leading-5 text-muted">Reason: detected from recent performance, readiness, and activity signals.</p></div>)}</div>
      </Card>
    </section>
    <section className="grid gap-6 xl:grid-cols-3">
      <ChartCard title="Skill radar" subtitle="Role readiness across six core competencies"><ResponsiveContainer width="100%" height={280}><RadarChart data={radar}><PolarGrid stroke="#E5E7EB"/><PolarAngleAxis dataKey="skill" tick={{ fontSize: 12 }}/><Radar dataKey="score" stroke="#6C4CF1" fill="#6C4CF1" fillOpacity={0.18}/><Tooltip/></RadarChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Readiness gauge" subtitle="Placement prediction with risk zones"><ResponsiveContainer width="100%" height={280}><RadialBarChart innerRadius="68%" outerRadius="94%" data={[{ name: "Score", value: score, fill: "#6C4CF1" }]} startAngle={180} endAngle={-180}><RadialBar dataKey="value" cornerRadius={18}/><Tooltip/></RadialBarChart></ResponsiveContainer><div className="-mt-40 grid place-items-center"><p className="text-5xl font-semibold">{score}%</p><p className="text-sm text-muted">readiness score</p></div></ChartCard>
      <ChartCard title="Risk distribution" subtitle="Low, medium, and high risk cohorts"><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={risk} dataKey="value" innerRadius={72} outerRadius={104} paddingAngle={4}>{risk.map((_, i) => <Cell key={i} fill={palette[i]} />)}</Pie><Tooltip/></PieChart></ResponsiveContainer></ChartCard>
    </section>
    <section className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
      <ChartCard title="Attendance heatmap" subtitle="Monthly engagement pattern"><div className="grid grid-cols-7 gap-2">{heatmap.map((d) => <div key={d.day} className="aspect-square rounded-xl border border-line" title={`${d.value}% attendance`} style={{ backgroundColor: `rgba(108,76,241,${0.12 + d.value / 130})` }}><span className="grid h-full place-items-center text-xs font-semibold text-primary">{d.day}</span></div>)}</div></ChartCard>
      <ChartCard title={kind === "placement" ? "Student funnel" : "Department comparison"} subtitle="Operational analytics across cohorts">{kind === "placement" ? <ResponsiveContainer width="100%" height={300}><BarChart data={funnel} layout="vertical"><CartesianGrid stroke="#E5E7EB"/><XAxis type="number"/><YAxis dataKey="stage" type="category" width={90}/><Tooltip/><Bar dataKey="value" fill="#6C4CF1" radius={[0, 14, 14, 0]}/></BarChart></ResponsiveContainer> : <ResponsiveContainer width="100%" height={300}><BarChart data={department}><CartesianGrid stroke="#E5E7EB" vertical={false}/><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="cgpa" fill="#6C4CF1" radius={[10,10,0,0]}/><Bar dataKey="readiness" fill="#3B82F6" radius={[10,10,0,0]}/></BarChart></ResponsiveContainer>}</ChartCard>
    </section>
    <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line p-6"><div><h3 className="text-xl font-semibold">Operational table</h3><p className="mt-1 text-sm text-muted">Recent records, alerts, users, companies, or roadmap items.</p></div><Button variant="secondary"><Filter size={16}/>Filter</Button></div>
        <DataTable data={tableData}/>
      </Card>
      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between"><div><h3 className="text-xl font-semibold">Activity timeline</h3><p className="mt-1 text-sm text-muted">Recent AI and campus events</p></div><Clock3 className="text-secondary"/></div>
        <div className="space-y-4">{["Prediction model refreshed", "New intervention task created", "Placement drive eligibility updated", "Advisor message delivered"].map((event, i) => <div key={event} className="flex gap-3"><span className="mt-1 grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">{i + 1}</span><div><p className="text-sm font-semibold">{event}</p><p className="text-xs text-muted">{i + 1}h ago • automated workflow</p></div></div>)}</div>
      </Card>
    </section>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{roleCopy[kind].map((item: string, i: number) => <Card key={item} className="p-5 transition hover:-translate-y-1 hover:border-primary/30"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">{[Target, Lightbulb, CheckCircle2, AlertTriangle].map((Icon, idx) => idx === i ? <Icon key={idx} size={18}/> : null)}</div><p className="font-semibold">{item}</p><p className="mt-2 text-sm leading-6 text-muted">Premium analytics module with filters, AI insights, and export-ready views.</p></Card>)}</section>
    {kind === "placement" && <ChartCard title="Placement analytics" subtitle="Package trend and company-wise hiring signals"><ResponsiveContainer width="100%" height={320}><AreaChart data={packages}><defs><linearGradient id="pkg" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#3B82F6" stopOpacity=".32"/><stop offset="100%" stopColor="#3B82F6" stopOpacity="0"/></linearGradient></defs><CartesianGrid stroke="#E5E7EB"/><XAxis dataKey="month"/><YAxis/><Tooltip/><Area dataKey="high" stroke="#6C4CF1" fill="url(#pkg)" strokeWidth={3}/><Area dataKey="avg" stroke="#3B82F6" fill="transparent" strokeWidth={3}/></AreaChart></ResponsiveContainer></ChartCard>}
  </motion.div>;
}

// =====================================================
// STUDENT DASHBOARD — Premium AI Success Workspace
// =====================================================

function StudentDashboard({ data }: { data: Dashboard }) {
  const { user } = useAuth();
  const name = data.user?.full_name || user?.full_name || "Student";
  const o = data.overall ?? defaultStudentDashboard.overall!;
  const kpis = data.kpis?.length ? data.kpis : defaultStudentDashboard.kpis;
  const charts = data.charts ?? defaultStudentDashboard.charts;
  const recommendations = data.recommendations?.length ? data.recommendations : defaultStudentDashboard.recommendations!;
  const roadmap = data.roadmap?.length ? data.roadmap : defaultStudentDashboard.roadmap!;
  const placement = data.placementReadiness ?? defaultStudentDashboard.placementReadiness!;
  const activities = data.activities?.length ? data.activities : defaultStudentDashboard.activities!;

  return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    {/* Header */}
    <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          <Brain size={14} /> AI-powered student intelligence
        </div>
        <h2 className="text-4xl font-semibold tracking-normal">Welcome back, {name.split(" ")[0]}</h2>
        <p className="mt-3 max-w-3xl text-muted">Your AI-powered academic, career, and placement intelligence dashboard.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary"><CalendarDays size={16} />Last 30 days</Button>
        <Button variant="secondary"><Download size={16} />Export</Button>
        <Button><Sparkles size={16} />Generate AI Report</Button>
      </div>
    </div>

    {/* Hero Intelligence Card */}
    <HeroIntelligenceCard overall={o} />

    {/* KPI Cards */}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {kpis.map((k, i) => <StudentKpiCard key={k.label} item={k} index={i} />)}
    </section>

    {/* Charts Row 1 — Performance + Skill Radar + Gauge */}
    <section className="grid gap-6 xl:grid-cols-3">
      <ChartCard title="Performance Trend" subtitle="CGPA, attendance, and placement readiness across months">
        <ResponsiveContainer width="100%" height={300}>
          <RChartLine data={charts.performanceTrend || performanceTrend}>
            <CartesianGrid stroke="#E5E7EB" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <ReLine type="monotone" dataKey="cgpa" stroke="#6C4CF1" strokeWidth={3} dot={{ r: 4 }} />
            <ReLine type="monotone" dataKey="attendance" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} />
            <ReLine type="monotone" dataKey="readiness" stroke="#22C55E" strokeWidth={3} dot={{ r: 4 }} />
          </RChartLine>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Skill Radar" subtitle="Role readiness across six core competencies">
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={charts.skillRadar || radar}>
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
            <Radar dataKey="score" stroke="#6C4CF1" fill="#6C4CF1" fillOpacity={0.18} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Placement Readiness Gauge" subtitle="Overall placement readiness score">
        <div className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={240}>
            <RadialBarChart innerRadius="62%" outerRadius="94%" data={[{ name: "Score", value: o.placementReadiness, fill: "#6C4CF1" }]} startAngle={180} endAngle={-180}>
              <RadialBar dataKey="value" cornerRadius={18} />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="-mt-44 grid place-items-center">
            <p className="text-5xl font-semibold">{o.placementReadiness}%</p>
            <p className="text-sm text-muted">readiness score</p>
          </div>
        </div>
      </ChartCard>
    </section>

    {/* Charts Row 2 — Skill Gap + Weekly Activity + Risk Timeline */}
    <section className="grid gap-6 xl:grid-cols-3">
      <ChartCard title="Skill Gap Analysis" subtitle="Current vs target skill levels">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={charts.skillGap || []} layout="vertical" barGap={4}>
            <CartesianGrid stroke="#E5E7EB" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} />
            <YAxis dataKey="skill" type="category" width={70} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="current" fill="#6C4CF1" radius={[0, 8, 8, 0]} barSize={10} />
            <Bar dataKey="target" fill="#3B82F6" radius={[0, 8, 8, 0]} barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Weekly Learning Activity" subtitle="Hours spent and tasks completed per week">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={charts.weeklyActivity || []} barGap={8}>
            <CartesianGrid stroke="#E5E7EB" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="hours" fill="#6C4CF1" radius={[8, 8, 0, 0]} barSize={14} />
            <Bar dataKey="tasks" fill="#8B5CF6" radius={[8, 8, 0, 0]} barSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Risk & Alerts Timeline</h3>
            <p className="mt-1 text-sm text-muted">Recent events and upcoming actions</p>
          </div>
          <Clock3 className="text-secondary" />
        </div>
        <div className="space-y-0">
          {(charts.riskTimeline || []).map((item: any, i: number) => (
            <div key={i} className="flex gap-3 border-b border-line py-3 last:border-0">
              <div className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-white ${
                item.type === "resolved" ? "bg-green-500" :
                item.type === "positive" ? "bg-primary" :
                item.type === "warning" ? "bg-amber-500" : "bg-gray-400"
              }`}>
                {item.type === "resolved" ? <CheckCircle2 size={14} /> :
                 item.type === "positive" ? <TrendingUp size={14} /> :
                 item.type === "warning" ? <AlertTriangle size={14} /> :
                 <Clock size={14} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{item.event}</p>
                <p className="text-xs text-muted">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>

    {/* AI Recommendations + Career Roadmap */}
    <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">AI Recommendations</p>
            <h3 className="mt-1 text-xl font-semibold">Personalized next steps</h3>
          </div>
          <Brain className="text-primary" />
        </div>
        <div className="space-y-3">
          {recommendations.map((r, i) => (
            <div key={i} className="group rounded-2xl border border-line bg-soft p-4 transition hover:border-primary/30 hover:bg-white hover:shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  r.priority === "High" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                }`}>{r.priority} Priority</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">AI</span>
              </div>
              <p className="text-sm font-semibold">{r.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{r.reason}</p>
              <button className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary transition hover:gap-2">
                {r.action} <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">AI Career Roadmap</p>
            <h3 className="mt-1 text-xl font-semibold">Your journey to placement</h3>
          </div>
          <Target className="text-primary" />
        </div>
        <div className="space-y-0">
          {roadmap.map((step, i) => (
            <div key={i} className="flex gap-4 border-b border-line py-3 last:border-0">
              <div className="flex flex-col items-center">
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${
                  step.status === "done" ? "bg-green-500" :
                  step.status === "in_progress" ? "bg-primary" : "bg-gray-200 text-gray-400"
                }`}>{i + 1}</div>
                {i < roadmap.length - 1 && <div className="mt-1 h-6 w-0.5 rounded-full bg-line" />}
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-semibold ${step.status === "pending" ? "text-muted" : ""}`}>{step.step}</p>
                  <span className={`text-xs font-semibold ${
                    step.status === "done" ? "text-green-600" :
                    step.status === "in_progress" ? "text-primary" : "text-muted"
                  }`}>{step.completed}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className={`h-full rounded-full transition-all ${
                    step.status === "done" ? "bg-green-500" :
                    step.status === "in_progress" ? "bg-primary" : "bg-gray-200"
                  }`} style={{ width: `${step.completed}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>

    {/* Placement Readiness */}
    <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Placement Readiness</p>
            <h3 className="mt-1 text-xl font-semibold">Breakdown by skill area</h3>
          </div>
          <Award className="text-primary" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "Resume Quality", value: placement.resumeQuality },
            { label: "Mock Interview Score", value: placement.mockInterviewScore },
            { label: "Technical Skills", value: placement.technicalSkills },
            { label: "Communication", value: placement.communication },
            { label: "Project Strength", value: placement.projectStrength },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-line p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted">{item.label}</p>
                <span className={`text-sm font-bold ${
                  item.value >= 80 ? "text-green-600" : item.value >= 60 ? "text-amber-600" : "text-red-600"
                }`}>{item.value}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div className={`h-full rounded-full ${
                  item.value >= 80 ? "bg-green-500" : item.value >= 60 ? "bg-amber-500" : "bg-red-500"
                }`} style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Recent Activity</p>
            <h3 className="mt-1 text-xl font-semibold">Your latest actions</h3>
          </div>
          <Timer className="text-secondary" />
        </div>
        <div className="space-y-0">
          {activities.map((act, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
              <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                act.type === "analysis" ? "bg-blue-100 text-blue-600" :
                act.type === "report" ? "bg-purple-100 text-purple-600" :
                act.type === "update" ? "bg-green-100 text-green-600" :
                act.type === "prediction" ? "bg-amber-100 text-amber-600" :
                "bg-primary/10 text-primary"
              }`}>
                {act.type === "analysis" ? <FileText size={15} /> :
                 act.type === "report" ? <BarChart3 size={15} /> :
                 act.type === "update" ? <RefreshIcon size={15} /> :
                 act.type === "prediction" ? <TrendingUp size={15} /> :
                 <Brain size={15} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{act.action}</p>
                <p className="text-xs text-muted">{act.timestamp}</p>
              </div>
              <ChevronRight size={14} className="text-muted/50" />
            </div>
          ))}
        </div>
      </Card>
    </section>

    {/* Bottom modules */}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {roleCopy.student.map((item: string, i: number) => (
        <Card key={item} className="p-5 transition hover:-translate-y-1 hover:border-primary/30">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {[Target, Trophy, FileText, BriefcaseBusiness].map((Icon, idx) => idx === i ? <Icon key={idx} size={18}/> : null)}
          </div>
          <p className="font-semibold">{item}</p>
          <p className="mt-2 text-sm leading-6 text-muted">Premium analytics module with filters, AI insights, and export-ready views.</p>
        </Card>
      ))}
    </section>
  </motion.div>;
}

// =====================================================
// HERO INTELLIGENCE CARD
// =====================================================

function HeroIntelligenceCard({ overall }: { overall: Dashboard["overall"] }) {
  const o = overall ?? defaultStudentDashboard.overall!;
  const items = [
    { label: "Success Score", value: o.successScore, color: "#6C4CF1", max: 100 },
    { label: "Placement Readiness", value: o.placementReadiness, color: "#3B82F6", max: 100 },
    { label: "AI Confidence", value: o.aiConfidence, color: "#22C55E", max: 100 },
  ];

  return <Card className="relative overflow-hidden p-6 md:p-8">
    <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/5 blur-3xl" />
    <div className="relative">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Student Success Intelligence</p>
          <h3 className="mt-1 text-2xl font-semibold">AI-powered success overview</h3>
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 sm:flex">
          <AlertTriangle size={14} /> Risk: {o.academicRisk}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col items-center">
            <div className="relative">
              <svg width="88" height="88" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#F3F4F6" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke={item.color} strokeWidth="8"
                  strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - item.value / item.max)}`}
                  transform="rotate(-90 50 50)" style={{ transition: "stroke-dashoffset 1s ease" }} />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <span className="text-xl font-bold" style={{ color: item.color }}>{item.value}{item.max === 100 ? "%" : ""}</span>
              </div>
            </div>
            <p className="mt-2 text-xs font-medium text-muted">{item.label}</p>
          </div>
        ))}
        <div className="flex flex-col justify-center rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
          <p className="text-xs font-semibold text-primary">Next Best Action</p>
          <p className="mt-1 text-sm font-semibold leading-snug">{o.nextBestAction}</p>
          <button className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary transition hover:gap-2">
            View Details <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  </Card>;
}

// =====================================================
// STUDENT KPI CARD
// =====================================================

function StudentKpiCard({ item, index }: { item: KpiItem; index: number }) {
  const Icon = kpiIcons[item.label] || [TrendingUp, Target, Brain, AlertTriangle, FileText, Award][index % 6];
  const isRisk = item.label === "Risk Score";
  const progress = item.progress ?? 0;

  return <Card className="p-5 transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-md">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-muted">{item.label}</p>
        <p className={`mt-2 text-3xl font-semibold ${isRisk ? "text-green-600" : ""}`}>{item.value}</p>
      </div>
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
        isRisk ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
      }`}><Icon size={19} /></div>
    </div>
    <div className="mt-4">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${isRisk ? "bg-green-500" : "bg-primary"}`}
          style={{ width: `${isRisk ? 100 - progress : progress}%` }} />
      </div>
    </div>
    <div className="mt-3 flex items-center justify-between text-sm">
      <span className={`inline-flex items-center gap-1 font-semibold ${
        item.trend.startsWith("+") ? "text-green-600" : "text-red-600"
      }`}>
        {item.trend} <ArrowUpRight size={14} className={item.trend.startsWith("-") ? "rotate-180" : ""} />
      </span>
      <span className="text-xs text-muted">vs last period</span>
    </div>
  </Card>;
}

// =====================================================
// SHARED COMPONENTS
// =====================================================

function PageHeader({ role, kind }: { role: string; kind: string }) {
  return <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
    <div>
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary"><Brain size={14} /> AI-powered {role.toLowerCase()} intelligence</div>
      <h2 className="text-4xl font-semibold tracking-normal">{role} Dashboard</h2>
      <p className="mt-3 max-w-3xl text-muted">Advanced analytics, predictive signals, alerts, and guided workflows for {kind.replace("-", " ")} operations.</p>
    </div>
    <div className="flex flex-wrap gap-3"><Button variant="secondary"><CalendarDays size={16} />Last 30 days</Button><Button variant="secondary"><MoreHorizontal size={16} />Export</Button><Button><SparkIcon />Generate report</Button></div>
  </div>;
}

function SparkIcon() { return <TrendingUp size={16} />; }

function KpiCard({ item, index }: { item: KpiItem; index: number }) {
  const Icon = [TrendingUp, Target, Brain, AlertTriangle][index % 4];
  return <Card className="p-5 transition hover:-translate-y-1 hover:border-primary/30">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-muted">{item.label}</p>
        <p className="mt-3 text-3xl font-semibold">{item.value}</p>
      </div>
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon size={19} /></div>
    </div>
    <div className="mt-5 flex items-center justify-between text-sm">
      <span className="font-semibold text-success">{item.trend}</span>
      <span className="inline-flex items-center gap-1 text-muted">vs last period <ArrowUpRight size={14} /></span>
    </div>
  </Card>;
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <Card className="p-6">
    <div className="mb-5">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>
    </div>
    {children}
  </Card>;
}

function DataTable({ data }: { data: any[] }) {
  if (!data.length) return <div className="p-8 text-center">
    <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-soft text-muted"><FileIcon /></div>
    <p className="font-semibold">No records yet</p>
    <p className="mt-1 text-sm text-muted">Data will appear here once the backend returns table records.</p>
  </div>;
  const keys = Object.keys(data[0]).slice(0, 5);
  return <div className="overflow-x-auto premium-scrollbar">
    <table className="w-full text-left text-sm">
      <thead className="bg-soft text-xs uppercase tracking-wide text-muted">
        <tr>{keys.map((k)=><th key={k} className="px-6 py-4 font-semibold">{k}</th>)}</tr>
      </thead>
      <tbody>{data.map((row,i)=><tr key={i} className="border-t border-line transition hover:bg-soft/70">{keys.map((k)=><td key={k} className="px-6 py-4">{String(row[k])}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}

function FileIcon() { return <MoreHorizontal size={18} />; }
function RefreshIcon({ size }: { size?: number }) { return <TrendingUp size={size || 15} />; }

function DashboardSkeleton() {
  return <div className="space-y-6">{[0,1,2].map((i)=><div key={i} className="h-40 animate-pulse rounded-[20px] bg-white shadow-sm" />)}</div>;
}

function EmptyState() {
  return <Card className="p-10 text-center">
    <AlertTriangle className="mx-auto mb-4 text-warning" />
    <h3 className="text-xl font-semibold">Dashboard unavailable</h3>
    <p className="mt-2 text-muted">The backend did not return dashboard data. Check the API and try again.</p>
  </Card>;
}
