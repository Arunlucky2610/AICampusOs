import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle, Award, BarChart3, Bell, BookOpen, Bot, Brain, Briefcase,
  Building2, CalendarDays, ChevronRight, Clock, FileText, GraduationCap,
  LayoutDashboard, Sparkles, Target, TrendingUp, UserCheck, Users, Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart as ReLineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PremiumCard } from "../../components/ui/PremiumCard";
import { useAuth } from "../../context/AuthContext";
import { AnimatedCounter } from "../../components/ui/AnimatedCounter";
import { CardSkeleton } from "../../components/ui/LoadingSkeleton";
import { generatePlacementDashboard } from "../../components/placement/mockData";
import type { PlacementDashboardData } from "../../types/placement";

const palette = ["#6C4CF1", "#3B82F6", "#8B5CF6", "#22C55E", "#F59E0B", "#EF4444"];

const defaultPlacementData = {
  totalEligibleStudents: 486, placementReadyStudents: 312, shortlistedStudents: 128,
  placedStudents: 96, activeDrives: 14, averagePackage: 8.6, highestPackage: 24,
  companiesVisiting: 32, totalStudents: 350, firstYearStudents: 90, secondYearStudents: 88,
  thirdYearStudents: 86, fourthYearStudents: 86, atRiskStudents: 28, averageAttendance: 85,
  pendingAssignments: 42,
  charts: {
    placementFunnel: [
      { stage: "Eligible", count: 245 }, { stage: "Registered", count: 198 },
      { stage: "Shortlisted", count: 145 }, { stage: "Interviewed", count: 112 },
      { stage: "Selected", count: 76 }, { stage: "Offered", count: 62 },
    ],
    departmentComparison: [
      { dept: "CSE", placed: 22, eligible: 68 }, { dept: "AIML", placed: 18, eligible: 55 },
      { dept: "AIDS", placed: 12, eligible: 40 }, { dept: "ECE", placed: 8, eligible: 38 },
      { dept: "EEE", placed: 2, eligible: 18 }, { dept: "CIVIL", placed: 0, eligible: 14 },
    ],
    packageDistribution: [
      { range: "3-6 LPA", count: 12 }, { range: "6-10 LPA", count: 18 },
      { range: "10-15 LPA", count: 16 }, { range: "15-25 LPA", count: 10 },
      { range: "25+ LPA", count: 6 },
    ],
    resumeScoreDistribution: [
      { range: "0-25%", count: 22 }, { range: "25-50%", count: 58 },
      { range: "50-75%", count: 85 }, { range: "75-100%", count: 35 },
    ],
    skillDemand: [
      { skill: "Python", demand: 38, supply: 210 }, { skill: "Java", demand: 32, supply: 180 },
      { skill: "AI/ML", demand: 28, supply: 95 }, { skill: "DSA", demand: 35, supply: 150 },
    ],
  },
  recentStudents: [
    { id: 1, name: "Anika Sharma", roll_number: "CSE1A01", department: "CSE", year: 4, section: "A", cgpa: 8.5, topSkills: ["Python", "DSA"], resumeScore: 78, codingScore: 82, communicationScore: 75, mockInterviewScore: 70, placementReadiness: 85, eligibleCompanies: 12, applicationStatus: "Eligible" },
    { id: 2, name: "Chirag Reddy", roll_number: "AIML4A03", department: "AIML", year: 4, section: "A", cgpa: 8.9, topSkills: ["Python", "ML", "DSA"], resumeScore: 88, codingScore: 90, communicationScore: 80, mockInterviewScore: 85, placementReadiness: 92, eligibleCompanies: 18, applicationStatus: "Shortlisted" },
    { id: 3, name: "Gauri Rao", roll_number: "AIML4A05", department: "AIML", year: 4, section: "A", cgpa: 9.1, topSkills: ["Python", "TensorFlow", "NLP"], resumeScore: 92, codingScore: 88, communicationScore: 85, mockInterviewScore: 82, placementReadiness: 95, eligibleCompanies: 22, applicationStatus: "Applied" },
    { id: 4, name: "Deepika Singh", roll_number: "AIML3B02", department: "AIML", year: 3, section: "B", cgpa: 5.8, topSkills: ["Python"], resumeScore: 45, codingScore: 38, communicationScore: 55, mockInterviewScore: 35, placementReadiness: 42, eligibleCompanies: 3, applicationStatus: "Not Eligible" },
    { id: 5, name: "Esha Gupta", roll_number: "AIML3A04", department: "AIML", year: 3, section: "A", cgpa: 8.2, topSkills: ["Python", "ML", "SQL"], resumeScore: 76, codingScore: 72, communicationScore: 82, mockInterviewScore: 70, placementReadiness: 80, eligibleCompanies: 10, applicationStatus: "Eligible" },
    { id: 6, name: "Farhan Kumar", roll_number: "AIML4B03", department: "AIML", year: 4, section: "B", cgpa: 7.4, topSkills: ["Java", "SQL"], resumeScore: 62, codingScore: 58, communicationScore: 70, mockInterviewScore: 55, placementReadiness: 68, eligibleCompanies: 6, applicationStatus: "Eligible" },
    { id: 7, name: "Bhavya Patel", roll_number: "AIML2B01", department: "AIML", year: 2, section: "B", cgpa: 6.2, topSkills: ["Python", "C++"], resumeScore: 52, codingScore: 48, communicationScore: 60, mockInterviewScore: 40, placementReadiness: 55, eligibleCompanies: 4, applicationStatus: "Not Eligible" },
    { id: 8, name: "Harsh Joshi", roll_number: "CSE1B04", department: "CSE", year: 1, section: "B", cgpa: 6.0, topSkills: ["C++", "Python"], resumeScore: 48, codingScore: 45, communicationScore: 58, mockInterviewScore: 38, placementReadiness: 50, eligibleCompanies: 2, applicationStatus: "Not Eligible" },
  ],
  notifications: [
    { title: "Google Hiring Drive", message: "Google is visiting campus on July 20 for SDE roles.", type: "info" },
    { title: "Infosys Eligibility", message: "37 students match Infosys criteria. Review shortlist.", type: "warning" },
    { title: "Resume Improvement", message: "120 students need resume improvement before next drive.", type: "error" },
    { title: "Mock Interview Scores", message: "23 students need mock interview practice before placements.", type: "warning" },
  ],
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemAnim = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export function PlacementDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["placement-dashboard"],
    queryFn: async () => (await api.get<PlacementDashboardData>("/placement/dashboard")).data,
    retry: 1,
    staleTime: 30_000,
  });

  const safeName = user?.full_name || "Placement Officer";
  const raw = data || generatePlacementDashboard(safeName);
  const d = { ...defaultPlacementData, ...raw, charts: { ...defaultPlacementData.charts, ...raw.charts } };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 shimmer-bg rounded-[20px]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">
      {isError && (
        <motion.div variants={itemAnim}>
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle size={18} className="shrink-0 text-amber-600" />
            <span>Showing demo placement insights because live data is unavailable.</span>
          </div>
        </motion.div>
      )}

      {/* AI COMMAND CENTER HEADER */}
      <motion.div variants={itemAnim}>
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0F0A2E] via-[#1A0F3E] to-[#2D1B69] p-6 md:p-8">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#6C4CF1]/20 blur-[80px]" />
          <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-[#3B82F6]/15 blur-[60px]" />
          <div className="relative">
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-sm">
                <Building2 size={12} /> PLACEMENT COMMAND CENTER
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
                  {safeName}
                </h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  {[
                    { label: "Placement Cell", value: "Active", icon: Building2, color: "from-purple-500 to-purple-600" },
                    { label: "Active Drives", value: d.activeDrives, icon: CalendarDays, color: "from-blue-500 to-blue-600" },
                    { label: "Companies Managed", value: d.companiesVisiting, icon: Briefcase, color: "from-green-500 to-green-600" },
                    { label: "Hiring Season", value: "2026-27", icon: GraduationCap, color: "from-cyan-500 to-cyan-600" },
                    { label: "AI Status", value: "Online", icon: Bot, color: "from-emerald-500 to-emerald-600" },
                  ].map((s) => (
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
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI CARDS */}
      <motion.div variants={itemAnim} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Eligible Students", value: d.totalEligibleStudents, icon: Users, color: "from-purple-500 to-purple-600", trend: `${d.totalStudents} total enrollment` },
          { label: "Placement Ready", value: d.placementReadyStudents, icon: Award, color: "from-blue-500 to-blue-600", trend: `${Math.round(d.placementReadyStudents / Math.max(d.totalEligibleStudents, 1) * 100)}% of eligible` },
          { label: "Shortlisted", value: d.shortlistedStudents, icon: UserCheck, color: "from-cyan-500 to-cyan-600", trend: "In interview pipeline" },
          { label: "Placed Students", value: d.placedStudents, icon: Briefcase, color: "from-green-500 to-green-600", trend: `${d.placedStudents} offers accepted` },
          { label: "Active Drives", value: d.activeDrives, icon: CalendarDays, color: "from-amber-500 to-amber-600", trend: "8 upcoming drives" },
          { label: "Average Package", value: `₹${d.averagePackage} LPA`, icon: TrendingUp, color: "from-emerald-500 to-emerald-600", trend: "+12% vs last year" },
          { label: "Highest Package", value: `₹${d.highestPackage} LPA`, icon: Zap, color: "from-rose-500 to-rose-600", trend: "Google SDE 2026" },
          { label: "Companies Visiting", value: d.companiesVisiting, icon: Building2, color: "from-indigo-500 to-indigo-600", trend: "+8 this season" },
        ].map((stat, i) => (
          <PremiumCard key={stat.label} index={i}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold">
                  {typeof stat.value === "number" ? <AnimatedCounter value={stat.value} /> : stat.value}
                </p>
              </div>
              <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${stat.color} grid place-items-center`}>
                <stat.icon size={16} className="text-white" />
              </div>
            </div>
            <p className="mt-2 text-xs text-green-600">{stat.trend}</p>
          </PremiumCard>
        ))}
      </motion.div>

      {/* CHARTS ROW */}
      <motion.div variants={itemAnim} className="grid gap-6 xl:grid-cols-2">
        {/* Placement Funnel */}
        <PremiumCard className="p-5" hover={false}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Placement Funnel</p>
              <p className="text-[11px] text-muted">Application pipeline progress</p>
            </div>
            <BarChart3 size={15} className="text-muted/40" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={d.charts?.placementFunnel || []} layout="vertical" barGap={4}>
              <CartesianGrid stroke="#F3F4F6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="stage" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
                {(d.charts?.placementFunnel || []).map((_: any, i: number) => (
                  <Cell key={i} fill={palette[i % palette.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </PremiumCard>

        {/* Department Placement Comparison */}
        <PremiumCard className="p-5" hover={false}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Department Placement</p>
              <p className="text-[11px] text-muted">Eligible vs Placed by dept</p>
            </div>
            <GraduationCap size={15} className="text-muted/40" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={d.charts?.departmentComparison || []} barGap={4}>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="dept" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="eligible" fill="#6C4CF1" radius={[6, 6, 0, 0]} barSize={18} name="Eligible" />
              <Bar dataKey="placed" fill="#22C55E" radius={[6, 6, 0, 0]} barSize={18} name="Placed" />
            </BarChart>
          </ResponsiveContainer>
        </PremiumCard>
      </motion.div>

      {/* SECOND CHARTS ROW */}
      <motion.div variants={itemAnim} className="grid gap-6 xl:grid-cols-2">
        {/* Package Distribution */}
        <PremiumCard className="p-5" hover={false}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Package Distribution</p>
              <p className="text-[11px] text-muted">Offers by package range</p>
            </div>
            <TrendingUp size={15} className="text-muted/40" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={d.charts?.packageDistribution || []} dataKey="count" nameKey="range" cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3}>
                {(d.charts?.packageDistribution || []).map((_: any, i: number) => (
                  <Cell key={i} fill={palette[i % palette.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-[11px]">
            {(d.charts?.packageDistribution || []).map((pkg: any, i: number) => (
              <div key={pkg.range} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: palette[i % palette.length] }} />
                <span className="text-muted">{pkg.range}</span>
              </div>
            ))}
          </div>
        </PremiumCard>

        {/* Resume Score Distribution */}
        <PremiumCard className="p-5" hover={false}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Resume Score Distribution</p>
              <p className="text-[11px] text-muted">Quality of student resumes</p>
            </div>
            <FileText size={15} className="text-muted/40" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={d.charts?.resumeScoreDistribution || []} barGap={6}>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={40}>
                {(d.charts?.resumeScoreDistribution || []).map((_: any, i: number) => (
                  <Cell key={i} fill={i >= 3 ? "#22C55E" : i >= 2 ? "#6C4CF1" : i >= 1 ? "#F59E0B" : "#EF4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </PremiumCard>
      </motion.div>

      {/* AI INSIGHTS */}
      <motion.div variants={itemAnim}>
        <PremiumCard className="p-5" hover={false}>
          <div className="mb-4 flex items-center gap-2">
            <Brain size={16} className="text-[#6C4CF1]" />
            <p className="text-sm font-semibold">AI Placement Insights</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { icon: FileText, label: "Resume Improvement", value: "120 students", desc: "Need resume improvement", color: "from-amber-500 to-amber-600", action: "View Students" },
              { icon: Award, label: "Product Ready", value: "48 students", desc: "Ready for product companies", color: "from-green-500 to-green-600", action: "Shortlist" },
              { icon: Brain, label: "Python Readiness", value: "AIML Highest", desc: "AIML has best Python skills", color: "from-blue-500 to-blue-600", action: "View Dept" },
              { icon: TrendingUp, label: "DSA Training", value: "ECE Need", desc: "ECE students need DSA focus", color: "from-purple-500 to-purple-600", action: "Schedule Training" },
              { icon: UserCheck, label: "Infosys Match", value: "37 students", desc: "Match Infosys criteria", color: "from-cyan-500 to-cyan-600", action: "Generate Shortlist" },
              { icon: Zap, label: "High Package Potential", value: "18 students", desc: "Potential for 25+ LPA", color: "from-rose-500 to-rose-600", action: "View Potential" },
              { icon: Users, label: "Mock Interview Needed", value: "23 students", desc: "Need mock interview practice", color: "from-indigo-500 to-indigo-600", action: "Schedule Mock" },
              { icon: Target, label: "Training Plan", value: "Generate Now", desc: "For skill gaps identified", color: "from-emerald-500 to-emerald-600", action: "Generate Plan" },
            ].map((insight, i) => (
              <button key={i} className="group rounded-xl border border-line bg-white p-3.5 text-left transition hover:border-[#6C4CF1]/20 hover:shadow-sm">
                <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${insight.color}`}>
                  <insight.icon size={14} className="text-white" />
                </div>
                <p className="text-xs text-muted">{insight.label}</p>
                <p className="text-sm font-bold">{insight.value}</p>
                <p className="text-[11px] text-muted">{insight.desc}</p>
                <span className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-medium text-[#6C4CF1] group-hover:underline">{insight.action} <ChevronRight size={11} /></span>
              </button>
            ))}
          </div>
        </PremiumCard>
      </motion.div>

      {/* RECENT STUDENTS */}
      <motion.div variants={itemAnim}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#6C4CF1]" />
            <p className="text-sm font-semibold">Recent Student Activity</p>
          </div>
          <Button variant="ghost" className="!h-8 !text-xs" onClick={() => navigate("/app/placement/students")}>
            View All <ChevronRight size={13} />
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(d.recentStudents ?? []).slice(0, 8).map((s) => (
            <PremiumCard key={s.id} hover className="cursor-pointer" onClick={() => navigate(`/app/placement/students/${s.id}`)}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] text-xs font-bold text-white">
                  {s.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.name}</p>
                  <p className="truncate text-xs text-muted">{s.roll_number} • {s.department}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted">CGPA: <strong>{s.cgpa}</strong></span>
                <span className="text-muted">Ready: <strong>{s.placementReadiness}%</strong></span>
              </div>
            </PremiumCard>
          ))}
        </div>
      </motion.div>

      {/* NOTIFICATIONS */}
      {(d.notifications ?? []).length > 0 && (
        <motion.div variants={itemAnim}>
          <div className="mb-3 flex items-center gap-2">
            <Bell size={15} className="text-muted" />
            <p className="text-sm font-semibold">Placement Alerts</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {d.notifications.map((n: any, i: number) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-line bg-white p-3.5">
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${n.type === "error" ? "bg-red-50 text-red-600" : n.type === "warning" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>
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
