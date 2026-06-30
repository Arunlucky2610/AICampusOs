import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle, ArrowRight, Award, BarChart3, Bell, BookOpen,
  Bot, Brain, Briefcase, CalendarDays, ChevronRight, Clock, Command,
  FileText, FlaskConical, GraduationCap, LayoutDashboard, LineChart,
  Sparkles, Target, TrendingUp, UserCheck, Users, Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart as ReLineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useAuth } from "../../context/AuthContext";
import { PremiumCard } from "../../components/ui/PremiumCard";
import { AnimatedCounter } from "../../components/ui/AnimatedCounter";
import { CardSkeleton } from "../../components/ui/LoadingSkeleton";
import {
  generateDashboardData, generateLiveCards, generatePriorities,
  generateCampusActivities, generateHeatmapData,
} from "../../components/faculty/mockData";
import type { FacultyDashboardData, FacultyProfile } from "../../types";

const palette = ["#6C4CF1", "#3B82F6", "#8B5CF6", "#22C55E", "#F59E0B", "#EF4444"];

const defaultFacultyProfile: FacultyProfile = {
  id: 0,
  user_id: 0,
  full_name: "Nandini Reddy",
  email: "237r1a6652@cmrtc.ac.in",
  employee_id: "FAC-AIML-102",
  department: "AIML",
  designation: "Assistant Professor",
  phone: null,
  subject_handling: ["Machine Learning", "Deep Learning", "Neural Networks"],
  assigned_years: [1, 2, 3, 4],
  assigned_sections: ["A", "B"],
  class_advisor: true,
  office_room: null,
  experience: 8,
  profile_picture: null,
};

const defaultCharts = {
  yearDistribution: [
    { year: "1st Year", count: 32 },
    { year: "2nd Year", count: 34 },
    { year: "3rd Year", count: 30 },
    { year: "4th Year", count: 29 },
  ],
  riskDistribution: [
    { name: "Low Risk", value: 78, color: "#22C55E" },
    { name: "Medium Risk", value: 33, color: "#F59E0B" },
    { name: "High Risk", value: 14, color: "#EF4444" },
  ],
  attendanceTrend: [
    { month: "Jul", percentage: 84 },
    { month: "Aug", percentage: 86 },
    { month: "Sep", percentage: 83 },
    { month: "Oct", percentage: 88 },
    { month: "Nov", percentage: 85 },
    { month: "Dec", percentage: 90 },
  ],
  cgpaDistribution: [
    { range: "6-7 CGPA", count: 28 },
    { range: "7-8 CGPA", count: 42 },
    { range: "8-9 CGPA", count: 38 },
    { range: "9-10 CGPA", count: 17 },
  ],
};

export function FacultyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["faculty-dashboard"],
    queryFn: async () => (await api.get<FacultyDashboardData>("/faculty/dashboard")).data,
    retry: 1,
    staleTime: 30_000,
  });

  const safeUserName = user?.full_name || "Dr. Nandini Reddy";
  const dashboard = data || generateDashboardData(safeUserName);
  const profile: FacultyProfile = dashboard?.profile ?? defaultFacultyProfile;
  const charts = dashboard?.charts ?? defaultCharts;
  const notifications = dashboard?.notifications ?? [];
  const liveCards = generateLiveCards();
  const priorities = generatePriorities();
  const activities = generateCampusActivities();
  const heatmap = generateHeatmapData();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const dailyPlan = [
    { time: "09:00 AM", task: "ML Lecture - 3rd Year A", duration: "1 hr" },
    { time: "10:30 AM", task: "Lab Session - 2nd Year", duration: "2 hrs" },
    { time: "02:00 PM", task: "Faculty Meeting", duration: "1 hr" },
    { time: "04:00 PM", task: "Mentor Hour - At Risk Students", duration: "1 hr" },
  ];

  const statsCards = [
    { label: "Today's Classes", value: 3, icon: BookOpen, color: "from-purple-500 to-purple-600" },
    { label: "Students Under Guidance", value: 125, icon: Users, color: "from-blue-500 to-blue-600" },
    { label: "AI Status", value: "Online", icon: Bot, color: "from-green-500 to-green-600" },
    { label: "Department", value: profile?.department ?? "AIML", icon: GraduationCap, color: "from-cyan-500 to-cyan-600" },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemAnim = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 shimmer-bg rounded-[20px]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <CardSkeleton /><CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">
      {/* API Error Banner */}
      {isError && (
        <motion.div variants={itemAnim}>
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle size={18} className="shrink-0 text-amber-600" />
            <span>Showing demo faculty insights because live profile data is unavailable.</span>
          </div>
        </motion.div>
      )}

      {/* ============================== */}
      {/* AI COMMAND CENTER HEADER */}
      {/* ============================== */}
      <motion.div variants={itemAnim}>
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0F0A2E] via-[#1A0F3E] to-[#2D1B69] p-6 md:p-8">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#6C4CF1]/20 blur-[80px]" />
          <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-[#3B82F6]/15 blur-[60px]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />

          <div className="relative">
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-sm">
                <LayoutDashboard size={12} /> AI COMMAND CENTER
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-[11px] font-semibold text-green-400">
                <Zap size={12} className="animate-pulse" /> Systems Online
              </span>
            </div>

            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="flex-1">
                <h1 className="text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
                  {greeting},
                </h1>
                <h2 className="mt-1 text-2xl font-bold text-white/90 md:text-3xl">
                  Dr. {profile?.full_name?.split(" ")[0] || "Faculty"}
                </h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  {statsCards.map((s) => (
                    <div key={s.label} className="inline-flex items-center gap-2 rounded-xl bg-white/8 px-3.5 py-2 backdrop-blur-sm">
                      <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${s.color} grid place-items-center`}>
                        <s.icon size={14} className="text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-white/50">{s.label}</p>
                        <p className="text-sm font-semibold text-white">{s.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="shrink-0">
                <div className="group relative">
                  <div className="absolute -inset-1 rounded-[22px] bg-gradient-to-r from-[#6C4CF1] to-[#3B82F6] opacity-40 blur transition group-hover:opacity-70" />
                  <div className="relative grid h-20 w-20 place-items-center rounded-[20px] bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] text-2xl font-bold text-white shadow-lg">
                    {profile?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "NR"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============================== */}
      {/* AI COPILOT + TODAY'S PRIORITIES */}
      {/* ============================== */}
      <motion.div variants={itemAnim} className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* AI Copilot Panel */}
        <PremiumCard gradient className="overflow-hidden p-0">
          <div className="relative bg-gradient-to-br from-[#6C4CF1]/5 to-[#3B82F6]/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6]">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">AI Copilot</h3>
                  <p className="text-[11px] text-muted">Your intelligent teaching assistant</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-700">
                <Sparkles size={12} /> Active
              </span>
            </div>

            <div className="mb-4 grid gap-2">
              {[
                { q: "Show students below 75% attendance", icon: Clock },
                { q: "Predict semester toppers", icon: TrendingUp },
                { q: "Generate class performance report", icon: FileText },
              ].map((suggestion, i) => (
                <button
                  key={i}
                  className="group flex items-center gap-3 rounded-xl border border-[rgba(108,76,241,0.08)] bg-white/70 px-4 py-2.5 text-left text-sm transition hover:border-[rgba(108,76,241,0.2)] hover:bg-white hover:shadow-sm"
                >
                  <suggestion.icon size={15} className="shrink-0 text-[#6C4CF1]" />
                  <span className="flex-1 text-muted group-hover:text-ink">{suggestion.q}</span>
                  <ChevronRight size={14} className="shrink-0 text-muted/40" />
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-[rgba(108,76,241,0.08)] bg-white/50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Today's Schedule</p>
                <span className="text-xs text-muted">4 events</span>
              </div>
              <div className="space-y-2">
                {dailyPlan.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-line bg-white p-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6C4CF1]/10 text-[11px] font-bold text-[#6C4CF1]">
                      {item.time.split(" ")[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.task}</p>
                      <p className="text-[11px] text-muted">{item.time} • {item.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button className="mt-4 w-full">
              <Sparkles size={16} /> Generate Daily Plan
            </Button>
          </div>
        </PremiumCard>

        {/* Today's Priorities */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-[#6C4CF1]" />
              <h3 className="text-sm font-semibold">Today's Priorities</h3>
            </div>
            <span className="text-xs text-muted">{priorities.length} items</span>
          </div>

          <div className="space-y-2">
            {priorities.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="group flex items-start gap-3 rounded-xl border border-line bg-white p-3.5 transition hover:border-[rgba(108,76,241,0.15)] hover:shadow-sm"
              >
                <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg ${
                  p.priority === "high" ? "bg-red-50 text-red-600" :
                  p.priority === "medium" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                }`}>
                  {p.type === "intervention" ? <AlertTriangle size={13} /> :
                   p.type === "evaluation" ? <FileText size={13} /> :
                   p.type === "deadline" ? <Clock size={13} /> : <Bell size={13} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{p.title}</p>
                  <p className="text-xs text-muted mt-0.5">{p.description}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  p.priority === "high" ? "bg-red-50 text-red-700" :
                  p.priority === "medium" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
                }`}>
                  {p.priority}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ============================== */}
      {/* LIVE CAMPUS OVERVIEW */}
      {/* ============================== */}
      <motion.div variants={itemAnim}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-[#6C4CF1]" />
            <h3 className="text-sm font-semibold">Live Campus Overview</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {liveCards.slice(0, 7).map((card, i) => (
            <PremiumCard key={card.label} index={i} hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold">
                    {typeof card.value === "number" ? (
                      <AnimatedCounter value={card.value} />
                    ) : (
                      card.value
                    )}
                  </p>
                </div>
                <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${card.color} grid place-items-center`}>
                  {card.label === "Total Students" && <Users size={16} className="text-white" />}
                  {card.label === "Attendance Today" && <Clock size={16} className="text-white" />}
                  {card.label === "Assignments Pending" && <FileText size={16} className="text-white" />}
                  {card.label === "Average Performance" && <Award size={16} className="text-white" />}
                  {card.label === "Placement Ready" && <Briefcase size={16} className="text-white" />}
                  {card.label === "Research Progress" && <FlaskConical size={16} className="text-white" />}
                  {card.label === "Students At Risk" && <AlertTriangle size={16} className="text-white" />}
                </div>
              </div>
              <p className="mt-2 text-xs text-green-600">{card.trend}</p>
            </PremiumCard>
          ))}
        </div>
      </motion.div>

      {/* ============================== */}
      {/* ACADEMIC INTELLIGENCE */}
      {/* ============================== */}
      <motion.div variants={itemAnim}>
        <div className="mb-4 flex items-center gap-2">
          <Brain size={16} className="text-[#6C4CF1]" />
          <h3 className="text-sm font-semibold">Academic Intelligence</h3>
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          {/* Attendance Heatmap */}
          <PremiumCard className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Attendance Heatmap</p>
                <p className="text-[11px] text-muted">Subject-wise weekly</p>
              </div>
              <BarChart3 size={15} className="text-muted/40" />
            </div>
            <div className="space-y-2">
              {heatmap.slice(0, 4).map((item) => (
                <div key={item.subject} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-muted">{item.subject}</span>
                    <span className="font-semibold">{Math.round(item.data.reduce((a, b) => a + b.value, 0) / item.data.length)}%</span>
                  </div>
                  <div className="flex gap-1">
                    {item.data.map((d) => (
                      <div
                        key={d.day}
                        className="h-6 flex-1 rounded-md transition-colors"
                        style={{
                          backgroundColor: d.value >= 90 ? "#22C55E" : d.value >= 80 ? "#6C4CF1" : d.value >= 70 ? "#F59E0B" : "#EF4444",
                          opacity: 0.7 + (d.value / 100) * 0.3,
                        }}
                        title={`${d.day}: ${d.value}%`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </PremiumCard>

          {/* CGPA Distribution */}
          <PremiumCard className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">CGPA Distribution</p>
                <p className="text-[11px] text-muted">Student performance ranges</p>
              </div>
              <LineChart size={15} className="text-muted/40" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={charts.cgpaDistribution || []} dataKey="count" innerRadius={48} outerRadius={72} paddingAngle={3}>
                  {(charts.cgpaDistribution || []).map((_: any, i: number) => (
                    <Cell key={i} fill={palette[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-2 text-[11px]">
              {(charts.cgpaDistribution || []).map((d: any, i: number) => (
                <div key={d.range} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: palette[i] }} />
                  <span className="text-muted">{d.range}</span>
                </div>
              ))}
            </div>
          </PremiumCard>

          {/* Weak Subject Detection */}
          <PremiumCard className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Subject-wise Performance</p>
                <p className="text-[11px] text-muted">Average scores across subjects</p>
              </div>
              <TrendingUp size={15} className="text-muted/40" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={heatmap.slice(0, 6).map(h => ({ name: h.subject.split(" ")[0], score: Math.round(h.data.reduce((a, b) => a + b.value, 0) / h.data.length) }))} barGap={4}>
                <CartesianGrid stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={20}>
                  {heatmap.slice(0, 6).map((_, i) => (
                    <Cell key={i} fill={i < 2 ? "#EF4444" : i < 4 ? "#F59E0B" : "#22C55E"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </PremiumCard>
        </div>
      </motion.div>

      {/* ============================== */}
      {/* TWO COLUMN: CHARTS + LIVE */}
      {/* ============================== */}
      <motion.div variants={itemAnim} className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        {/* Attendance Trend + Year Distribution */}
        <PremiumCard className="p-0 overflow-hidden">
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-line">
            <div className="p-5">
              <div className="mb-3">
                <p className="text-sm font-semibold">Attendance Trend</p>
                <p className="text-[11px] text-muted">Monthly average</p>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <ReLineChart data={charts.attendanceTrend || []}>
                  <CartesianGrid stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[70, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="percentage" stroke="#6C4CF1" strokeWidth={2.5} dot={{ r: 3, fill: "#6C4CF1" }} />
                </ReLineChart>
              </ResponsiveContainer>
            </div>
            <div className="p-5">
              <div className="mb-3">
                <p className="text-sm font-semibold">Year Distribution</p>
                <p className="text-[11px] text-muted">Students per year</p>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.yearDistribution || []} barGap={6}>
                  <CartesianGrid stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6C4CF1" radius={[8, 8, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </PremiumCard>

        {/* Live Campus Feed */}
        <PremiumCard className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Live Campus</p>
              <p className="text-[11px] text-muted">Real-time activity feed</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE
            </span>
          </div>
          <div className="space-y-2">
            {activities.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-line p-2.5 transition hover:border-[rgba(108,76,241,0.12)]">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  a.status === "active" ? "bg-green-50 text-green-600" :
                  a.status === "upcoming" ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400"
                }`}>
                  {a.type === "Live Class" && <BookOpen size={14} />}
                  {a.type === "Faculty" && <Users size={14} />}
                  {a.type === "Student" && <UserCheck size={14} />}
                  {a.type === "Placement" && <Briefcase size={14} />}
                  {a.type === "Exam" && <FileText size={14} />}
                  {a.type === "Event" && <CalendarDays size={14} />}
                  {a.type === "Notification" && <Bell size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-[11px] text-muted">{a.subtitle}</p>
                </div>
                <span className={`shrink-0 text-[11px] font-medium ${
                  a.status === "active" ? "text-green-600" :
                  a.status === "upcoming" ? "text-blue-600" : "text-muted"
                }`}>{a.time}</span>
              </div>
            ))}
          </div>
        </PremiumCard>
      </motion.div>

      {/* ============================== */}
      {/* FACULTY WORKFLOW - QUICK ACTIONS */}
      {/* ============================== */}
      <motion.div variants={itemAnim}>
        <div className="mb-4 flex items-center gap-2">
          <Command size={16} className="text-[#6C4CF1]" />
          <h3 className="text-sm font-semibold">Quick Action Dock</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
          {[
            { label: "Take Attendance", icon: Clock, color: "from-purple-500 to-purple-600", action: () => navigate("/app/faculty/attendance") },
            { label: "Upload Marks", icon: FileText, color: "from-blue-500 to-blue-600", action: () => navigate("/app/faculty/marks") },
            { label: "Create Assignment", icon: BookOpen, color: "from-cyan-500 to-cyan-600", action: () => navigate("/app/faculty/assignments") },
            { label: "Schedule Class", icon: CalendarDays, color: "from-emerald-500 to-emerald-600", action: () => navigate("/app/faculty/attendance") },
            { label: "Generate QP", icon: FileText, color: "from-amber-500 to-amber-600", action: () => navigate("/app/faculty/reports") },
            { label: "Send Announcement", icon: Bell, color: "from-rose-500 to-rose-600", action: () => navigate("/app/faculty/notifications") },
            { label: "Approve Leave", icon: UserCheck, color: "from-violet-500 to-violet-600", action: () => navigate("/app/faculty/attendance") },
            { label: "View Reports", icon: BarChart3, color: "from-indigo-500 to-indigo-600", action: () => navigate("/app/faculty/reports") },
          ].map((item, i) => (
            <motion.button
              key={item.label}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={item.action}
              className="group flex flex-col items-center gap-2 rounded-xl border border-line bg-white p-3 transition hover:border-[rgba(108,76,241,0.15)] hover:shadow-sm"
            >
              <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${item.color} grid place-items-center transition group-hover:scale-110`}>
                <item.icon size={16} className="text-white" />
              </div>
              <span className="text-[11px] font-medium text-muted group-hover:text-ink">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ============================== */}
      {/* AI ANALYTICS */}
      {/* ============================== */}
      <motion.div variants={itemAnim}>
        <div className="mb-4 flex items-center gap-2">
          <Brain size={16} className="text-[#6C4CF1]" />
          <h3 className="text-sm font-semibold">AI Analytics & Predictions</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Risk Heatmap", value: "14 Students", desc: "High risk detected", icon: AlertTriangle, color: "from-red-500 to-red-600", score: 78 },
            { label: "Skill Distribution", value: "B+ Average", desc: "Across all departments", icon: Users, color: "from-blue-500 to-blue-600", score: 82 },
            { label: "Placement Funnel", value: "42 Ready", desc: "68% of eligible batch", icon: Briefcase, color: "from-emerald-500 to-emerald-600", score: 68 },
            { label: "Career Readiness", value: "76%", desc: "+8% this quarter", icon: TrendingUp, color: "from-purple-500 to-purple-600", score: 76 },
          ].map((card, i) => (
            <PremiumCard key={card.label} index={i}>
              <div className="flex items-start justify-between">
                <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${card.color} grid place-items-center`}>
                  <card.icon size={16} className="text-white" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#6C4CF1]/10 px-2 py-0.5 text-[10px] font-semibold text-[#6C4CF1]">
                  {card.score}%
                </span>
              </div>
              <p className="mt-3 text-xl font-bold">{card.value}</p>
              <p className="text-xs text-muted">{card.desc}</p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-gradient-to-r from-[#6C4CF1] to-[#3B82F6]" style={{ width: `${card.score}%` }} />
              </div>
            </PremiumCard>
          ))}
        </div>
      </motion.div>

      {/* Notifications bar */}
      {notifications.length > 0 && (
        <motion.div variants={itemAnim}>
          <div className="flex items-center gap-2 mb-3">
            <Bell size={15} className="text-muted" />
            <p className="text-sm font-semibold">Latest Updates</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {notifications.map((n: any, i: number) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-line bg-white p-3.5">
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  n.type === "error" ? "bg-red-50 text-red-600" :
                  n.type === "warning" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                }`}>
                  <AlertTriangle size={13} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="text-xs text-muted mt-0.5">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
