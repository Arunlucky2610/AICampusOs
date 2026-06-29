import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, Brain, CalendarDays, CheckCircle2, Clock3, Filter, Lightbulb, MoreHorizontal, Target, TrendingUp } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Dashboard } from "../../types";

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

export function DashboardPage({ kind }: { kind: DashboardKind }) {
  const { data, isLoading, isError } = useQuery({ queryKey: ["dashboard", kind], queryFn: async () => (await api.get<Dashboard>(endpoint[kind])).data });
  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) return <EmptyState />;
  const score = Number(String(data.kpis[2]?.value || "84").replace(/[^0-9.]/g, "")) || 84;
  const tableData = (Object.values(data.tables)[0] as any[]) || [];

  return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
    <PageHeader role={data.role.replace("_", " ")} kind={kind} />
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{data.kpis.map((k, i) => <KpiCard key={k.label} item={k} index={i} />)}</section>
    <section className="grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
      <ChartCard title="Performance trend" subtitle="CGPA, attendance, and placement readiness over time">
        <ResponsiveContainer width="100%" height={320}><LineChart data={performanceTrend}><CartesianGrid stroke="#E5E7EB" vertical={false}/><XAxis dataKey="month"/><YAxis/><Tooltip/><Line type="monotone" dataKey="cgpa" stroke="#6C4CF1" strokeWidth={3}/><Line type="monotone" dataKey="attendance" stroke="#3B82F6" strokeWidth={3}/><Line type="monotone" dataKey="readiness" stroke="#22C55E" strokeWidth={3}/></LineChart></ResponsiveContainer>
      </ChartCard>
      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between"><div><p className="text-sm font-semibold text-primary">AI insight panel</p><h3 className="mt-1 text-xl font-semibold">Priority recommendations</h3></div><Brain className="text-primary"/></div>
        <div className="space-y-3">{data.recommendations.map((r, i) => <div key={r} className="rounded-2xl border border-line bg-soft p-4 transition hover:border-primary/30 hover:bg-white"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold text-muted">Priority {92 - i * 11}</span><span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">AI</span></div><p className="text-sm font-semibold">{r}</p><p className="mt-1 text-xs leading-5 text-muted">Reason: detected from recent performance, readiness, and activity signals.</p></div>)}</div>
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

function PageHeader({ role, kind }: { role: string; kind: string }) {
  return <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
    <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary"><Brain size={14}/> AI-powered {role.toLowerCase()} intelligence</div><h2 className="text-4xl font-semibold tracking-normal">{role} Dashboard</h2><p className="mt-3 max-w-3xl text-muted">Advanced analytics, predictive signals, alerts, and guided workflows for {kind.replace("-", " ")} operations.</p></div>
    <div className="flex flex-wrap gap-3"><Button variant="secondary"><CalendarDays size={16}/>Last 30 days</Button><Button variant="secondary"><MoreHorizontal size={16}/>Export</Button><Button><SparkIcon/>Generate report</Button></div>
  </div>;
}

function SparkIcon() { return <TrendingUp size={16}/>; }

function KpiCard({ item, index }: { item: { label: string; value: string | number; trend: string }; index: number }) {
  const Icon = [TrendingUp, Target, Brain, AlertTriangle][index % 4];
  return <Card className="p-5 transition hover:-translate-y-1 hover:border-primary/30"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-muted">{item.label}</p><p className="mt-3 text-3xl font-semibold">{item.value}</p></div><div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon size={19}/></div></div><div className="mt-5 flex items-center justify-between text-sm"><span className="font-semibold text-success">{item.trend}</span><span className="inline-flex items-center gap-1 text-muted">vs last period <ArrowUpRight size={14}/></span></div></Card>;
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <Card className="p-6"><div className="mb-5"><h3 className="text-xl font-semibold">{title}</h3><p className="mt-1 text-sm text-muted">{subtitle}</p></div>{children}</Card>;
}

function DataTable({ data }: { data: any[] }) {
  if (!data.length) return <div className="p-8 text-center"><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-soft text-muted"><FileIcon/></div><p className="font-semibold">No records yet</p><p className="mt-1 text-sm text-muted">Data will appear here once the backend returns table records.</p></div>;
  const keys = Object.keys(data[0]).slice(0, 5);
  return <div className="overflow-x-auto premium-scrollbar"><table className="w-full text-left text-sm"><thead className="bg-soft text-xs uppercase tracking-wide text-muted"><tr>{keys.map((k)=><th key={k} className="px-6 py-4 font-semibold">{k}</th>)}</tr></thead><tbody>{data.map((row,i)=><tr key={i} className="border-t border-line transition hover:bg-soft/70">{keys.map((k)=><td key={k} className="px-6 py-4">{String(row[k])}</td>)}</tr>)}</tbody></table></div>;
}

function FileIcon() { return <MoreHorizontal size={18}/>; }
function DashboardSkeleton() { return <div className="space-y-6">{[0,1,2].map((i)=><div key={i} className="h-40 animate-pulse rounded-[20px] bg-white shadow-sm" />)}</div>; }
function EmptyState() { return <Card className="p-10 text-center"><AlertTriangle className="mx-auto mb-4 text-warning"/><h3 className="text-xl font-semibold">Dashboard unavailable</h3><p className="mt-2 text-muted">The backend did not return dashboard data. Check the API and try again.</p></Card>; }
