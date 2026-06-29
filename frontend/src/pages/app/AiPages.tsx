import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, Brain, CheckCircle2, Database, FileBarChart, Filter, GitBranch, Lightbulb, MessageSquare, Send, Settings, ShieldCheck, Sparkles, Target, Workflow } from "lucide-react";
import { FormEvent, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";

const trend = [{ m: "Jan", score: 54 }, { m: "Feb", score: 66 }, { m: "Mar", score: 78 }, { m: "Apr", score: 84 }];
const table = [{ item: "Resume optimization", owner: "AI", status: "Ready", priority: 92 }, { item: "Skill gap sprint", owner: "Mentor", status: "In progress", priority: 86 }, { item: "Mock interview", owner: "Placement", status: "Scheduled", priority: 78 }];

export function AiInfoPage({ title, endpoint, method = "get" }: { title: string; endpoint: string; method?: "get" | "post" }) {
  const { data, isLoading, isError } = useQuery({ queryKey: [endpoint], queryFn: async () => method === "get" ? (await api.get(endpoint)).data : (await api.post(endpoint, {})).data });
  return <ModuleShell title={title} subtitle="AI-backed analytics, recommendations, and action planning." icon={<Brain/>}>
    <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <ChartPanel title="Score trajectory" subtitle="Model confidence and outcome trend"><ResponsiveContainer width="100%" height={280}><LineChart data={trend}><CartesianGrid stroke="#E5E7EB"/><XAxis dataKey="m"/><YAxis/><Tooltip/><Line dataKey="score" stroke="#6C4CF1" strokeWidth={3}/></LineChart></ResponsiveContainer></ChartPanel>
      <Card className="p-6"><div className="mb-5 flex items-center justify-between"><div><h3 className="text-xl font-semibold">AI insight</h3><p className="text-sm text-muted">Generated from backend response</p></div><Sparkles className="text-primary"/></div>{isLoading ? <Skeleton/> : isError ? <p className="text-sm text-error">Unable to load module data.</p> : <Insight data={data}/>}</Card>
    </div>
    {data?.gaps && <ChartPanel title="Current vs target skills" subtitle="Skill gap analysis by competency"><ResponsiveContainer width="100%" height={320}><BarChart data={data.gaps}><CartesianGrid stroke="#E5E7EB"/><XAxis dataKey="skill"/><YAxis/><Tooltip/><Bar dataKey="current" fill="#6C4CF1" radius={[12,12,0,0]}/><Bar dataKey="target" fill="#3B82F6" radius={[12,12,0,0]}/></BarChart></ResponsiveContainer></ChartPanel>}
    <AdvancedTable/>
  </ModuleShell>;
}

export function AssistantPage() {
  const [messages, setMessages] = useState<string[]>(["Welcome. Ask me for a placement plan, resume review, or skill roadmap."]);
  const [message, setMessage] = useState("");
  const mutation = useMutation({ mutationFn: async (text: string) => (await api.post("/ai/assistant", { message: text })).data, onSuccess: (data) => setMessages((m) => [...m, data.reply]) });
  function submit(e: FormEvent) { e.preventDefault(); if (!message.trim()) return; setMessages((m)=>[...m, message]); mutation.mutate(message); setMessage(""); }
  return <ModuleShell title="AI Career Assistant" subtitle="A guided copilot for student outcomes, placement readiness, and weekly action plans." icon={<MessageSquare/>}>
    <div className="grid gap-6 xl:grid-cols-[1fr_.7fr]">
      <Card className="p-5"><div className="space-y-3">{messages.map((m,i)=><div key={i} className={`rounded-2xl p-4 text-sm leading-6 ${i%2 ? "bg-gradient-to-r from-primary to-secondary text-white" : "bg-soft text-ink"}`}>{m}</div>)}</div><form onSubmit={submit} className="mt-5 flex gap-3"><Input value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Ask about placements, skills, resume, or roadmaps"/><Button><Send size={16}/></Button></form></Card>
      <Card className="p-6"><h3 className="text-xl font-semibold">Suggested prompts</h3><div className="mt-5 space-y-3">{["Create a 4-week interview plan", "Analyze my placement readiness", "Suggest resume improvements", "Prioritize my skill gaps"].map((p)=><button key={p} onClick={()=>setMessage(p)} className="w-full rounded-2xl border border-line p-4 text-left text-sm font-semibold transition hover:border-primary/30 hover:bg-soft">{p}</button>)}</div></Card>
    </div>
  </ModuleShell>;
}

export function AiEnginePage() {
  const steps = [["Data ingestion", Database], ["Feature engineering", GitBranch], ["ML models", Brain], ["Explainable AI", Lightbulb], ["Recommendations", Target], ["Notifications", Bell]];
  return <ModuleShell title="AI Engine" subtitle="Transparent prediction pipeline with model health, explainability, and notification orchestration." icon={<Workflow/>}>
    <div className="grid gap-4 lg:grid-cols-6">{steps.map(([label, Icon], i)=><Card key={String(label)} className="p-5"><div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon size={18}/></div><p className="font-semibold">{label as string}</p><p className="mt-2 text-sm text-muted">Status: healthy</p><p className="mt-3 text-xs font-semibold text-success">Latency {42+i*7}ms</p></Card>)}</div>
    <ChartPanel title="Prediction pipeline throughput" subtitle="Daily model requests and recommendation delivery"><ResponsiveContainer width="100%" height={320}><LineChart data={[{d:"Mon",v:220},{d:"Tue",v:340},{d:"Wed",v:410},{d:"Thu",v:390},{d:"Fri",v:520}]}><CartesianGrid stroke="#E5E7EB"/><XAxis dataKey="d"/><YAxis/><Tooltip/><Line dataKey="v" stroke="#6C4CF1" strokeWidth={3}/></LineChart></ResponsiveContainer></ChartPanel>
  </ModuleShell>;
}

export function NotificationsPage() { return <StaticModule title="Notifications" icon={<Bell/>} items={["Resume review complete", "Placement drive opens Friday", "Mentor meeting scheduled", "Risk alert resolved"]}/>; }
export function ProfilePage() { return <StaticModule title="Profile" icon={<ShieldCheck/>} items={["Verified account", "Role-based workspace", "Campus identity connected", "JWT session active"]}/>; }
export function SettingsPage() { return <StaticModule title="Settings" icon={<Settings/>} items={["Security preferences", "Notification controls", "AI data permissions", "Export settings"]}/>; }
export function ReportsPage() { return <StaticModule title="Reports" icon={<FileBarChart/>} items={["Placement readiness report", "Department health report", "At-risk student report", "AI model audit report"]}/>; }

function ModuleShell({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">{icon} AI CampusOS module</div><h2 className="text-4xl font-semibold">{title}</h2><p className="mt-3 max-w-3xl text-muted">{subtitle}</p></div><div className="flex gap-3"><Button variant="secondary"><Filter size={16}/>Filters</Button><Button><Sparkles size={16}/>Run analysis</Button></div></div>
    <div className="grid gap-4 md:grid-cols-4">{["AI confidence 94%", "Data freshness 2m", "Open actions 12", "Model status healthy"].map((k)=>{ const parts = k.split(" "); return <Card key={k} className="p-5"><p className="text-sm text-muted">{parts.slice(0,-1).join(" ")}</p><p className="mt-3 text-2xl font-semibold">{parts[parts.length - 1]}</p></Card>; })}</div>
    {children}
  </motion.div>;
}

function ChartPanel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <Card className="p-6"><h3 className="text-xl font-semibold">{title}</h3><p className="mb-5 mt-1 text-sm text-muted">{subtitle}</p>{children}</Card>; }
function Insight({ data }: { data: any }) { return <div className="rounded-2xl bg-soft p-4"><pre className="max-h-64 overflow-auto whitespace-pre-wrap text-sm leading-7 text-ink premium-scrollbar">{JSON.stringify(data, null, 2)}</pre></div>; }
function Skeleton() { return <div className="h-40 animate-pulse rounded-2xl bg-soft" />; }
function AdvancedTable() { return <Card className="overflow-hidden"><div className="border-b border-line p-6"><h3 className="text-xl font-semibold">Action table</h3><p className="text-sm text-muted">Recommended next steps with owners and priority scores.</p></div><table className="w-full text-left text-sm"><thead className="bg-soft text-xs uppercase tracking-wide text-muted"><tr><th className="px-6 py-4">Item</th><th className="px-6 py-4">Owner</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Priority</th></tr></thead><tbody>{table.map((r)=><tr key={r.item} className="border-t border-line"><td className="px-6 py-4 font-semibold">{r.item}</td><td className="px-6 py-4">{r.owner}</td><td className="px-6 py-4"><span className="rounded-full bg-success/10 px-2 py-1 text-xs font-semibold text-success">{r.status}</span></td><td className="px-6 py-4">{r.priority}</td></tr>)}</tbody></table></Card>; }
function StaticModule({ title, icon, items }: { title: string; icon: React.ReactNode; items: string[] }) { return <ModuleShell title={title} subtitle="A polished operational view with alerts, records, filters, and AI-ready workflows." icon={icon}><div className="grid gap-4 md:grid-cols-2">{items.map((x)=><Card key={x} className="p-5"><CheckCircle2 className="mb-4 text-success"/><p className="font-semibold">{x}</p><p className="mt-2 text-sm text-muted">Available for review, filtering, and export.</p></Card>)}</div><AdvancedTable/></ModuleShell>; }
