import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Award, BarChart3, Brain, BriefcaseBusiness, CalendarDays, ChevronRight,
  FileText, GraduationCap, MessageSquare, Send, Sparkles, Target, TrendingUp, Trophy, UserCheck, Users,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart as RBarChart, CartesianGrid, Cell, Line, LineChart,
  PolarAngleAxis, PolarGrid, Radar, RadarChart, RadialBar, RadialBarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api } from "../../api/client";
import { Card } from "../../components/ui/Card";
import { useAuth } from "../../context/AuthContext";
import type { Dashboard } from "../../types";

const placementKpis = [
  { label: "Placement Readiness", value: "78%", trend: "+8%", score: 78, color: "#6C4CF1" },
  { label: "Resume Score", value: "81%", trend: "+12%", score: 81, color: "#3B82F6" },
  { label: "Coding Score", value: "72%", trend: "+6%", score: 72, color: "#8B5CF6" },
  { label: "Communication", value: "68%", trend: "+4%", score: 68, color: "#22C55E" },
  { label: "Mock Interview Score", value: "72%", trend: "+15%", score: 72, color: "#F59E0B" },
  { label: "Company Eligibility", value: "24", trend: "+8", score: 80, color: "#EF4444" },
  { label: "Applications Sent", value: "12", trend: "+5", score: 60, color: "#6C4CF1" },
  { label: "Offers Received", value: "2", trend: "+2", score: 25, color: "#22C55E" },
];

const skillRadarData = [
  { skill: "DSA", score: 72 },
  { skill: "System Design", score: 65 },
  { skill: "Python", score: 85 },
  { skill: "SQL", score: 78 },
  { skill: "React", score: 74 },
  { skill: "Communication", score: 68 },
];

const codingProgressData = [
  { platform: "LeetCode", solved: 185, rating: 1650, target: 250 },
  { platform: "CodeChef", solved: 120, rating: 1420, target: 200 },
  { platform: "HackerRank", solved: 95, rating: 1380, target: 150 },
];

const applicationTimeline = [
  { month: "Jan", sent: 2, interviews: 0, offers: 0 },
  { month: "Feb", sent: 3, interviews: 1, offers: 0 },
  { month: "Mar", sent: 2, interviews: 0, offers: 0 },
  { month: "Apr", sent: 3, interviews: 2, offers: 1 },
  { month: "May", sent: 1, interviews: 1, offers: 0 },
  { month: "Jun", sent: 1, interviews: 2, offers: 1 },
];

const interviewPerformance = [
  { round: "Phone Screen", score: 82, avg: 70 },
  { round: "Technical", score: 74, avg: 65 },
  { round: "System Design", score: 68, avg: 60 },
  { round: "Behavioral", score: 85, avg: 72 },
  { round: "Managerial", score: 78, avg: 68 },
];

const resumeScoreTrend = [
  { month: "Jan", score: 62 },
  { month: "Feb", score: 65 },
  { month: "Mar", score: 68 },
  { month: "Apr", score: 72 },
  { month: "May", score: 78 },
  { month: "Jun", score: 81 },
];

const companies = [
  { name: "Google", eligible: true, role: "SDE", deadline: "Jul 15" },
  { name: "Microsoft", eligible: true, role: "SWE", deadline: "Jul 20" },
  { name: "Amazon", eligible: true, role: "SDE", deadline: "Jul 25" },
  { name: "Stripe", eligible: true, role: "Backend", deadline: "Aug 1" },
  { name: "Atlassian", eligible: false, role: "SDE", deadline: "Aug 5" },
  { name: "Adobe", eligible: true, role: "SDE", deadline: "Aug 10" },
];

const aiPlacementInsights = [
  { icon: Brain, text: "Complete 50 more LeetCode problems to increase coding score to 80%.", color: "from-[#6C4CF1] to-[#8B5CF6]" },
  { icon: FileText, text: "Your resume ATS score is 81%. Add project metrics to reach 90+.", color: "from-[#3B82F6] to-[#60A5FA]" },
  { icon: Users, text: "Practice system design interviews — your score is 68% vs avg 60%.", color: "from-[#22C55E] to-[#4ADE80]" },
  { icon: Target, text: "You're eligible for 24 companies. Start preparing for Google and Microsoft.", color: "from-[#F59E0B] to-[#FBBF24]" },
];

export function StudentPlacementDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: async () => (await api.get<Dashboard>("/student/dashboard")).data,
  });

  const [selectedInsight, setSelectedInsight] = useState(0);

  const name = data?.user?.full_name || user?.full_name || "Student";

  if (isLoading) return <PlacementSkeleton />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#6C4CF1]/15 bg-[#6C4CF1]/5 px-3.5 py-1.5 text-xs font-semibold text-[#6C4CF1]">
            <Sparkles size={13} /> AI-Powered Placement Intelligence
          </div>
          <h2 className="text-[32px] font-bold tracking-tight text-[#111827]">Placement Dashboard</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6B7280]">
            Track your placement readiness, coding progress, interview performance, and company eligibility — all powered by AI.
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-[#E8ECF1] bg-white px-4 py-2.5 text-sm font-medium text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]">
            <CalendarDays size={15} /> This Season
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#6C4CF1]/25 transition hover:shadow-xl hover:shadow-[#6C4CF1]/30">
            <Sparkles size={15} /> AI Career Plan
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {placementKpis.map((kpi, i) => (
          <Card key={kpi.label} className="group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-[#6B7280]">{kpi.label}</p>
              <div
                className="grid h-9 w-9 place-items-center rounded-xl text-white text-xs font-bold shadow-sm"
                style={{ backgroundColor: kpi.color }}
              >
                {i < 2 ? <Award size={16} /> : i < 4 ? <Brain size={16} /> : i < 6 ? <Target size={16} /> : <Send size={16} />}
              </div>
            </div>
            <p className="text-[28px] font-bold tracking-tight text-[#111827]">{kpi.value}</p>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#22C55E]">
              <TrendingUp size={13} /> {kpi.trend}
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${kpi.score}%`, backgroundColor: kpi.color }}
              />
            </div>
          </Card>
        ))}
      </section>

      {/* Charts Row 1 */}
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr_1fr]">
        {/* Placement Readiness Gauge */}
        <Card className="p-6">
          <div className="mb-4">
            <p className="text-sm font-semibold text-[#6C4CF1]">READINESS</p>
            <h3 className="mt-1 text-xl font-bold text-[#111827]">Placement Readiness Gauge</h3>
          </div>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={260}>
              <RadialBarChart innerRadius="60%" outerRadius="94%" data={[{ name: "Score", value: 78, fill: "#6C4CF1" }]} startAngle={180} endAngle={-180}>
                <RadialBar dataKey="value" cornerRadius={18} background={{ fill: "#F3F4F6" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1" }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="-mt-48 grid place-items-center">
              <p className="text-5xl font-bold text-[#111827]">78%</p>
              <p className="mt-1 text-sm font-medium text-[#6B7280]">readiness score</p>
              <span className="mt-2 rounded-full bg-[#22C55E]/10 px-3 py-1 text-xs font-semibold text-[#22C55E]">+8% this quarter</span>
            </div>
          </div>
        </Card>

        {/* Skill Radar */}
        <Card className="p-6">
          <div className="mb-4">
            <p className="text-sm font-semibold text-[#6C4CF1]">COMPETENCIES</p>
            <h3 className="mt-1 text-xl font-bold text-[#111827]">Skill Radar</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={skillRadarData}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "#6B7280" }} />
              <Radar dataKey="score" stroke="#6C4CF1" fill="#6C4CF1" fillOpacity={0.18} strokeWidth={2} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1" }} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Coding Progress */}
        <Card className="p-6">
          <div className="mb-4">
            <p className="text-sm font-semibold text-[#6C4CF1]">CODING</p>
            <h3 className="mt-1 text-xl font-bold text-[#111827]">Coding Progress</h3>
          </div>
          <div className="space-y-5">
            {codingProgressData.map((p) => (
              <div key={p.platform}>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#111827]">{p.platform}</p>
                  <span className="text-xs font-bold text-[#6C4CF1]">{p.solved}/{p.target}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6]"
                    style={{ width: `${(p.solved / p.target) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] font-medium text-[#9CA3AF]">Rating: {p.rating}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Charts Row 2 */}
      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        {/* Application Timeline */}
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#6C4CF1]">TRACKING</p>
              <h3 className="mt-1 text-xl font-bold text-[#111827]">Application Timeline</h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium text-[#6B7280]">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#6C4CF1]" /> Sent</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#3B82F6]" /> Interviews</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" /> Offers</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={applicationTimeline}>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1" }} />
              <Line type="monotone" dataKey="sent" stroke="#6C4CF1" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="interviews" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="offers" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Interview Performance */}
        <Card className="p-6">
          <div className="mb-6">
            <p className="text-sm font-semibold text-[#6C4CF1]">PERFORMANCE</p>
            <h3 className="mt-1 text-xl font-bold text-[#111827]">Interview Performance</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RBarChart data={interviewPerformance} layout="vertical" barGap={6}>
              <CartesianGrid stroke="#F3F4F6" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="round" type="category" width={100} tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1" }} />
              <Bar dataKey="score" fill="#6C4CF1" radius={[0, 6, 6, 0]} barSize={12} />
              <Bar dataKey="avg" fill="#E5E7EB" radius={[0, 6, 6, 0]} barSize={12} />
            </RBarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center justify-center gap-4 text-xs font-medium text-[#6B7280]">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#6C4CF1]" /> Your Score</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#E5E7EB]" /> Average</span>
          </div>
        </Card>
      </section>

      {/* Charts Row 3 */}
      <section className="grid gap-6 xl:grid-cols-[1fr_1fr_1.2fr]">
        {/* Resume Score Trend */}
        <Card className="p-6">
          <div className="mb-4">
            <p className="text-sm font-semibold text-[#6C4CF1]">RESUME</p>
            <h3 className="mt-1 text-xl font-bold text-[#111827]">Resume Score Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={resumeScoreTrend}>
              <defs>
                <linearGradient id="resumeGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#6C4CF1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6C4CF1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis domain={[55, 90]} tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1" }} />
              <Area type="monotone" dataKey="score" stroke="#6C4CF1" strokeWidth={2.5} fill="url(#resumeGrad)" dot={{ r: 4, fill: "#6C4CF1" }} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-3 rounded-xl border border-[#E8ECF1] bg-[#F5F7FA] p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-[#6B7280]">ATS Optimization</span>
              <span className="font-bold text-[#6C4CF1]">81%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
              <div className="h-full w-[81%] rounded-full bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6]" />
            </div>
          </div>
        </Card>

        {/* Eligible Companies */}
        <Card className="p-6">
          <div className="mb-4">
            <p className="text-sm font-semibold text-[#6C4CF1]">ELIGIBILITY</p>
            <h3 className="mt-1 text-xl font-bold text-[#111827]">Company Eligibility</h3>
          </div>
          <div className="space-y-2">
            {companies.map((c) => (
              <div
                key={c.name}
                className="flex items-center justify-between rounded-xl border border-[#E8ECF1] px-4 py-3 transition hover:border-[#6C4CF1]/20 hover:bg-[#F5F7FA]"
              >
                <div className="flex items-center gap-3">
                  <div className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold text-white ${
                    c.eligible ? "bg-[#22C55E]" : "bg-[#EF4444]"
                  }`}>
                    {c.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">{c.name}</p>
                    <p className="text-xs text-[#6B7280]">{c.role} • Deadline: {c.deadline}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold ${c.eligible ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                  {c.eligible ? "Eligible" : "Restricted"}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Placement Insights */}
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#6C4CF1]">AI INSIGHTS</p>
              <h3 className="mt-1 text-xl font-bold text-[#111827]">Placement Intelligence</h3>
            </div>
            <Brain size={20} className="text-[#6C4CF1]" />
          </div>
          <div className="mb-4 flex gap-1.5">
            {aiPlacementInsights.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedInsight(i)}
                className={`h-2 flex-1 rounded-full transition ${
                  i === selectedInsight ? "bg-[#6C4CF1]" : "bg-[#E5E7EB]"
                }`}
              />
            ))}
          </div>
          <div className="rounded-2xl border border-[#E8ECF1] bg-[#F5F7FA] p-5 transition hover:border-[#6C4CF1]/20">
            <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${aiPlacementInsights[selectedInsight].color} text-white shadow-sm`}>
              {(() => {
                const Icon = aiPlacementInsights[selectedInsight].icon;
                return <Icon size={17} />;
              })()}
            </div>
            <p className="text-sm font-semibold leading-relaxed text-[#111827]">
              {aiPlacementInsights[selectedInsight].text}
            </p>
            <button className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#6C4CF1] transition hover:gap-2">
              Take Action <ChevronRight size={13} />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: "Applications", value: "12", color: "#6C4CF1" },
              { label: "Interviews", value: "6", color: "#3B82F6" },
              { label: "Offers", value: "2", color: "#22C55E" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-[#E8ECF1] p-3 text-center">
                <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[10px] font-medium text-[#6B7280]">{stat.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Bottom cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Target, title: "Mock Interviews", desc: "Book AI-powered mock interviews with real-time feedback and performance analytics." },
          { icon: BarChart3, title: "Skill Gap Analysis", desc: "Identify missing skills and get personalized learning paths for target roles." },
          { icon: Send, title: "Applications", desc: "Track all your job applications, interview stages, and offer timelines in one place." },
          { icon: Users, title: "Career AI", desc: "Get personalized career recommendations, company insights, and salary benchmarks." },
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

function PlacementSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-white shadow-sm" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr_1fr]">
        <div className="h-72 animate-pulse rounded-2xl bg-white shadow-sm" />
        <div className="h-72 animate-pulse rounded-2xl bg-white shadow-sm" />
        <div className="h-72 animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>
    </div>
  );
}
