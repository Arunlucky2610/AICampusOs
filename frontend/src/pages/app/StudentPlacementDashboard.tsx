import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Activity, AlertTriangle, ArrowRight, Award, BookOpen, Brain, BriefcaseBusiness,
  CalendarDays, CheckCircle2, ChevronRight, Clock, Code2, FileText, Flame,
  GraduationCap, Loader2, MapPin, Sparkles, Star, Target, TrendingUp, Trophy,
  User, Users, Zap,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, PolarAngleAxis, PolarGrid,
  Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import { useStudentProfile } from "../../context/StudentProfileContext";
import { fetchMyEligibility } from "../../api/company";
import { AnimatedCounter } from "../../components/ui/AnimatedCounter";

const PURPLE = "#6D5DF6";
const PURPLE_LIGHT = "#8B7BF7";
const PURPLE_BG = "rgba(109,93,246,0.08)";
const PURPLE_BG_STRONG = "rgba(109,93,246,0.14)";

function getStatus(score: number | null) {
  if (score == null) return { label: "Not Set", color: "#9CA3AF", emoji: "—" };
  if (score >= 80) return { label: "Excellent", color: "#22C55E", emoji: "🚀" };
  if (score >= 60) return { label: "Good", color: "#F59E0B", emoji: "💪" };
  return { label: "Needs Work", color: "#EF4444", emoji: "🎯" };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const MINI_CHART_DATA = [
  { m: "Jan", v: 40 }, { m: "Feb", v: 55 }, { m: "Mar", v: 50 },
  { m: "Apr", v: 65 }, { m: "May", v: 72 }, { m: "Jun", v: 85 },
];

const JOURNEY_STEPS = [
  { key: "resume", label: "Resume", icon: FileText, route: "/app/resume-analyzer", desc: "ATS-ready resume" },
  { key: "skills", label: "Skills", icon: BookOpen, route: "/app/student/ai-tutor?mode=skills", desc: "Technical skills" },
  { key: "coding", label: "Coding", icon: Code2, route: "/app/student/coding-progress", desc: "DSA & problem solving" },
  { key: "mock", label: "Mock Interview", icon: Brain, route: "/app/student/mock-interviews", desc: "Interview practice" },
  { key: "eligibility", label: "Eligibility", icon: BriefcaseBusiness, route: "/app/student/company-eligibility", desc: "Company matching" },
  { key: "ready", label: "Placement Ready", icon: Award, route: "/app/student/placement", desc: "Fully prepared" },
];

const QUICK_ACTIONS = [
  { label: "Analyze Resume", icon: FileText, route: "/app/resume-analyzer", color: "#6D5DF6" },
  { label: "Continue Coding", icon: Code2, route: "/app/student/coding-progress", color: "#8B5CF6" },
  { label: "Mock Interview", icon: Brain, route: "/app/student/mock-interviews", color: "#22C55E" },
  { label: "Improve Skills", icon: BookOpen, route: "/app/student/ai-tutor", color: "#F59E0B" },
  { label: "Check Eligibility", icon: Target, route: "/app/student/company-eligibility", color: "#EF4444" },
];

const DREAM_COMPANY_LOGOS: Record<string, string> = {
  Google: "G", Microsoft: "M", Amazon: "A", Adobe: "A", Atlassian: "A", NVIDIA: "N",
};

const ACTIVITIES = [
  { icon: FileText, label: "Resume Updated", time: "2 hours ago", color: "#6D5DF6" },
  { icon: Code2, label: "Coding Problem Solved", time: "Yesterday", color: "#22C55E" },
  { icon: Brain, label: "Mock Interview Completed", time: "2 days ago", color: "#F59E0B" },
  { icon: Award, label: "Eligibility Improved", time: "3 days ago", color: "#8B5CF6" },
];

const EVENTS = [
  { label: "Amazon Drive", date: "Mar 15", type: "drive", icon: BriefcaseBusiness },
  { label: "Resume Deadline", date: "Mar 18", type: "deadline", icon: Clock },
  { label: "Coding Assessment", date: "Mar 22", type: "assessment", icon: Code2 },
  { label: "Google Interview", date: "Mar 28", type: "interview", icon: Brain },
];

export function StudentPlacementDashboard() {
  const { profile, completion } = useStudentProfile();
  const { user } = useAuth();
  const navigate = useNavigate();

  const p = profile;
  const readiness = p?.placement_readiness_score ?? 0;
  const resumeScore = p?.resume_score ?? 0;
  const codingScore = p?.coding_score ?? 0;
  const skillScore = p?.skill_score ?? 0;
  const mockScore = p?.mock_interview_score ?? 0;
  const commScore = p?.communication_score ?? 0;
  const eligibleCos = p?.eligible_companies ?? 0;
  const appsSent = p?.applications ?? 0;

  const status = getStatus(readiness);
  const overallPlacementScore = Math.round(
    (readiness + resumeScore + codingScore + skillScore + mockScore + commScore) / 6
  );

  const { data: eligibilityData } = useQuery({
    queryKey: ["student-company-eligibility"],
    queryFn: fetchMyEligibility,
    staleTime: 30_000,
    enabled: !!profile,
  });

  const dreamCompanies = useMemo(() => {
    const valid = (eligibilityData ?? []).filter((e) =>
      ["Google", "Microsoft", "Amazon", "Adobe", "Atlassian", "NVIDIA"].includes(e.companyName)
    );
    if (valid.length === 6) return valid;
    return (eligibilityData ?? []).slice(0, 6);
  }, [eligibilityData]);

  const metrics = useMemo(() => [
    { label: "Resume Score", value: resumeScore, icon: FileText, color: "#6D5DF6", suffix: "%" },
    { label: "Coding Score", value: codingScore, icon: Code2, color: "#8B5CF6", suffix: "%" },
    { label: "Skill Score", value: skillScore, icon: BookOpen, color: "#22C55E", suffix: "%" },
    { label: "Mock Interview", value: mockScore, icon: Brain, color: "#F59E0B", suffix: "%" },
    { label: "Company Eligibility", value: eligibleCos, icon: Trophy, color: "#EF4444", suffix: "" },
    { label: "Overall Score", value: overallPlacementScore, icon: Award, color: "#6D5DF6", suffix: "%" },
  ], [resumeScore, codingScore, skillScore, mockScore, eligibleCos, overallPlacementScore]);

  const skillRadarData = useMemo(() => [
    { skill: "Coding", score: Math.max(10, codingScore || 40) },
    { skill: "DSA", score: Math.max(10, Math.round((codingScore || 40) * 0.85)) },
    { skill: "Projects", score: Math.max(10, Math.round((resumeScore || 40) * 0.9)) },
    { skill: "Communication", score: Math.max(10, commScore || 40) },
    { skill: "Resume", score: Math.max(10, resumeScore || 40) },
    { skill: "Interview", score: Math.max(10, mockScore || 40) },
  ], [codingScore, resumeScore, commScore, mockScore]);

  const weeklyProgressData = useMemo(() => [
    { week: "W1", readiness: Math.max(0, readiness - 24), overall: Math.max(0, overallPlacementScore - 22) },
    { week: "W2", readiness: Math.max(0, readiness - 18), overall: Math.max(0, overallPlacementScore - 16) },
    { week: "W3", readiness: Math.max(0, readiness - 12), overall: Math.max(0, overallPlacementScore - 11) },
    { week: "W4", readiness: Math.max(0, readiness - 7), overall: Math.max(0, overallPlacementScore - 6) },
    { week: "W5", readiness: Math.max(0, readiness - 3), overall: Math.max(0, overallPlacementScore - 3) },
    { week: "W6", readiness, overall: overallPlacementScore },
  ], [readiness, overallPlacementScore]);

  const getJourneyProgress = useCallback((key: string) => {
    switch (key) {
      case "resume": return resumeScore;
      case "skills": return skillScore;
      case "coding": return codingScore;
      case "mock": return mockScore;
      case "eligibility": return Math.min(100, eligibleCos * 16);
      case "ready": return readiness;
      default: return 0;
    }
  }, [resumeScore, skillScore, codingScore, mockScore, eligibleCos, readiness]);

  const aiTasks = useMemo(() => {
    const tasks: { text: string; priority: "high" | "medium" | "low" }[] = [];
    if (resumeScore < 75) tasks.push({ text: "Optimize your resume for ATS — target 80%+", priority: "high" });
    if (codingScore < 70) tasks.push({ text: `Complete ${Math.round((70 - codingScore) * 2)} more coding problems this week`, priority: "high" });
    if (mockScore < 60) tasks.push({ text: "Book a mock interview session to boost confidence", priority: "medium" });
    if (skillScore < 65) tasks.push({ text: "Focus on skill development — practice core technologies", priority: "medium" });
    if (commScore < 60) tasks.push({ text: "Improve communication skills for HR rounds", priority: "low" });
    if (tasks.length === 0) tasks.push({ text: "You're on track! Keep up the great work.", priority: "low" });
    if (tasks.length < 3) tasks.push({ text: "Review company eligibility criteria & prepare accordingly", priority: "medium" });
    return tasks.slice(0, 5);
  }, [resumeScore, codingScore, mockScore, skillScore, commScore]);

  const nextGoal = useMemo(() => {
    if (readiness < 80) return `Reach 80% Placement Readiness (${Math.round(80 - readiness)}% to go)`;
    if (codingScore < 80) return "Push Coding Score above 80%";
    if (resumeScore < 85) return "Get Resume Score to 85%+";
    if (mockScore < 75) return "Aim for 75%+ in Mock Interviews";
    return "You're fully prepared — explore dream companies!";
  }, [readiness, codingScore, resumeScore, mockScore]);

  const leaderboardRank = useMemo(() => {
    if (!readiness) return { rank: "—", total: "—", label: "No data" };
    const estimatedRank = Math.max(1, Math.round(50 - readiness * 0.5));
    return { rank: String(estimatedRank), total: "120", label: `Top ${Math.round((estimatedRank / 120) * 100)}%` };
  }, [readiness]);

  if (!profile) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-[1320px] space-y-6 pb-16">
      {/* ── Hero ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[28px] border border-[#6D5DF6]/10 bg-white p-6 shadow-[0_18px_50px_rgba(16,18,37,0.055)] md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-[#6D5DF6]/8 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-gradient-to-tr from-[#8B5CF6]/6 to-transparent blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto_1fr]">
          {/* Welcome */}
          <div className="flex flex-col justify-center">
            <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-[#6D5DF6]/12 bg-[#6D5DF6]/5 px-3 py-1 text-xs font-semibold text-[#6D5DF6]">
              <Sparkles size={12} /> Placement Command Center
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111827] md:text-3xl">
              {getGreeting()}, {user?.full_name?.split(" ")[0] || "Student"} <span className="inline-block animate-wave">👋</span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-lg bg-[#6D5DF6]/8 px-2.5 py-1 text-xs font-semibold text-[#6D5DF6]">
                <MapPin size={12} /> {p?.department || "CSE"} • Year {p?.year || "—"}
              </div>
              {completion.percent < 100 && (
                <div className="flex items-center gap-1.5 rounded-lg bg-[#F59E0B]/10 px-2.5 py-1 text-xs font-semibold text-[#F59E0B]">
                  <AlertTriangle size={12} /> Profile {completion.percent}% complete
                </div>
              )}
            </div>
            <p className="mt-2 text-sm text-[#6B7280]">Here's your placement readiness overview for today.</p>
          </div>

          {/* Radial Score */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              <svg width="140" height="140" className="-rotate-90">
                <circle cx="70" cy="70" r="60" fill="none" stroke="#F3F4F6" strokeWidth="8" />
                <motion.circle cx="70" cy="70" r="60" fill="none" stroke={status.color} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 60}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 60 * (1 - readiness / 100) }}
                  transition={{ duration: 1.5, ease: "easeOut" }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-[#111827] tabular-nums">{readiness}%</span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-[#6B7280]">Readiness</span>
              </div>
            </div>
          </div>

          {/* Status + Goal + Dream Match */}
          <div className="flex flex-col justify-center gap-3 md:items-end">
            <div className="flex items-center gap-2 rounded-2xl border border-[#E8ECF1] bg-white px-4 py-2.5 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: PURPLE_BG }}>
                <Zap size={15} className="text-[#6D5DF6]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">Current Status</p>
                <p className="text-sm font-bold" style={{ color: status.color }}>{status.emoji} {status.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-[#E8ECF1] bg-white px-4 py-2.5 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: PURPLE_BG }}>
                <Target size={15} className="text-[#6D5DF6]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">Next Goal</p>
                <p className="text-sm font-bold text-[#111827]">{nextGoal}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-[#E8ECF1] bg-white px-4 py-2.5 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: PURPLE_BG }}>
                <Star size={15} className="text-[#6D5DF6]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">Dream Match</p>
                <p className="text-sm font-bold text-[#111827]">
                  {dreamCompanies.length > 0
                    ? `${dreamCompanies[0].companyName} — ${dreamCompanies[0].matchScore}%`
                    : "Update profile to find matches"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Metrics Row ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.4 }}
            className="group relative overflow-hidden rounded-[20px] border border-[rgba(109,93,246,0.06)] bg-white/80 p-4 shadow-[0_8px_30px_rgba(16,18,37,0.04)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(109,93,246,0.15)] hover:shadow-[0_12px_40px_rgba(109,93,246,0.08)]">
            <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `radial-gradient(circle, ${m.color}15, transparent)` }} />
            <div className="mb-2 flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110" style={{ background: `${m.color}12` }}>
                <m.icon size={14} style={{ color: m.color }} />
              </div>
              <div className="h-10 w-16">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MINI_CHART_DATA}>
                    <defs><linearGradient id={`miniGrad${i}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={m.color} stopOpacity={0.25} /><stop offset="100%" stopColor={m.color} stopOpacity={0} /></linearGradient></defs>
                    <Area type="monotone" dataKey="v" stroke={m.color} strokeWidth={1.5} fill={`url(#miniGrad${i})`} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">{m.label}</p>
            <div className="mt-1 flex items-baseline gap-1">
              <AnimatedCounter value={m.value} suffix={m.suffix} className="text-xl font-bold text-[#111827]" />
              <span className="text-xs font-semibold text-[#22C55E]">
                {m.value > 0 ? "+" + Math.round(m.value * 0.12) : ""}
              </span>
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
              <motion.div className="h-full rounded-full" style={{ background: m.color }}
                initial={{ width: 0 }} animate={{ width: `${Math.min(100, m.value)}%` }} transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Placement Journey + Quick Actions ── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* Journey */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-[24px] border border-[rgba(109,93,246,0.06)] bg-white/80 p-5 shadow-[0_8px_30px_rgba(16,18,37,0.04)] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5DF6]">Placement Journey</p>
              <h3 className="mt-0.5 text-base font-bold text-[#111827]">Your Roadmap to Placement Readiness</h3>
            </div>
            <button onClick={() => navigate("/app/student/company-eligibility")}
              className="flex items-center gap-1 text-xs font-semibold text-[#6D5DF6] hover:gap-2 transition-all">
              View Full <ChevronRight size={13} />
            </button>
          </div>
          <div className="relative">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-gradient-to-r from-[#6D5DF6]/10 via-[#6D5DF6]/30 to-[#6D5DF6]/10" />
            <div className="grid grid-cols-6 gap-2">
              {JOURNEY_STEPS.map((step, i) => {
                const progress = getJourneyProgress(step.key);
                const Icon = step.icon;
                const completed = progress >= 80;
                const inProgress = progress >= 30 && progress < 80;
                return (
                  <motion.button key={step.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(step.route)}
                    className="group relative flex flex-col items-center gap-1.5 rounded-2xl p-3 transition-all duration-300 hover:bg-[#6D5DF6]/5 hover:shadow-sm">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                      style={{ background: completed ? "#6D5DF6" : inProgress ? `${PURPLE_BG_STRONG}` : "#F5F7FA" }}>
                      <Icon size={18} className={completed ? "text-white" : inProgress ? "text-[#6D5DF6]" : "text-[#9CA3AF]"} />
                      <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold"
                        style={{ background: completed ? "#22C55E" : inProgress ? "#F59E0B" : "#E5E7EB", color: completed || inProgress ? "white" : "#9CA3AF" }}>
                        {completed ? <CheckCircle2 size={10} /> : `${progress}%`}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-[#111827] group-hover:text-[#6D5DF6] transition-colors">{step.label}</span>
                    <span className="text-[8px] text-[#9CA3AF]">{step.desc}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-[24px] border border-[rgba(109,93,246,0.06)] bg-white/80 p-5 shadow-[0_8px_30px_rgba(16,18,37,0.04)] backdrop-blur-xl">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5DF6]">Quick Actions</p>
          <div className="space-y-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <motion.button key={action.label} whileHover={{ x: 4 }} onClick={() => navigate(action.route)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-[#E8ECF1] bg-white px-4 py-3 text-left text-sm font-semibold text-[#111827] transition-all hover:border-[rgba(109,93,246,0.2)] hover:shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${action.color}12` }}>
                    <Icon size={15} style={{ color: action.color }} />
                  </div>
                  <span className="flex-1">{action.label}</span>
                  <ChevronRight size={14} className="text-[#9CA3AF]" />
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ── Dream Companies ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="rounded-[24px] border border-[rgba(109,93,246,0.06)] bg-white/80 p-5 shadow-[0_8px_30px_rgba(16,18,37,0.04)] backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5DF6]">Dream Companies</p>
            <h3 className="mt-0.5 text-base font-bold text-[#111827]">Your Target Companies</h3>
          </div>
          <button onClick={() => navigate("/app/student/company-eligibility")}
            className="flex items-center gap-1 text-xs font-semibold text-[#6D5DF6] hover:gap-2 transition-all">
            View All <ChevronRight size={13} />
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {dreamCompanies.length > 0 ? dreamCompanies.map((c, i) => {
            const matchedCriteria = Object.values(c.criteriaMet).filter(Boolean).length;
            const totalCriteria = Object.keys(c.criteriaMet).length;
            const missingSkills = c.reasons.filter(r => r.toLowerCase().includes("skill") || r.toLowerCase().includes("missing")).slice(0, 2);
            return (
              <motion.div key={c.companyId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="group relative overflow-hidden rounded-[20px] border border-[rgba(109,93,246,0.06)] bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(109,93,246,0.15)] hover:shadow-[0_12px_40px_rgba(109,93,246,0.08)]">
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-br from-[#6D5DF6]/6 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6D5DF6] to-[#8B5CF6] text-sm font-bold text-white shadow-sm">
                    {DREAM_COMPANY_LOGOS[c.companyName] || c.companyName[0]}
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-[#6D5DF6]/8 px-2 py-0.5 text-[10px] font-bold text-[#6D5DF6]">
                    <Star size={10} /> {c.matchScore}%
                  </div>
                </div>
                <p className="text-sm font-bold text-[#111827]">{c.companyName}</p>
                <p className="text-[11px] text-[#6B7280]">{c.role} • {c.package}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  {c.eligible ? (
                    <span className="flex items-center gap-1 rounded-full bg-[#22C55E]/10 px-2 py-0.5 text-[10px] font-semibold text-[#22C55E]">
                      <CheckCircle2 size={10} /> Eligible
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-[#EF4444]/10 px-2 py-0.5 text-[10px] font-semibold text-[#EF4444]">
                      <AlertTriangle size={10} /> {matchedCriteria}/{totalCriteria} met
                    </span>
                  )}
                </div>
                {missingSkills.length > 0 && (
                  <p className="mt-1 text-[9px] text-red-500 leading-tight">{missingSkills[0]}</p>
                )}
                <button onClick={() => navigate(`/app/student/company-eligibility?company=${encodeURIComponent(c.companyName)}`)}
                  className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6D5DF6] to-[#8B5CF6] py-2 text-[11px] font-bold text-white shadow-sm transition-all hover:shadow-md hover:opacity-90">
                  {c.eligible ? "Apply Now" : "View Details"} <ArrowRight size={12} />
                </button>
              </motion.div>
            );
          }) : (
            <div className="col-span-full flex flex-col items-center justify-center py-8 text-center">
              <BriefcaseBusiness size={32} className="text-[#D1D5DB]" />
              <p className="mt-2 text-sm font-semibold text-[#6B7280]">No company data yet</p>
              <p className="text-xs text-[#9CA3AF]">Complete your profile to see company matches</p>
              <button onClick={() => navigate("/app/student/profile")}
                className="mt-3 rounded-xl bg-[#6D5DF6] px-4 py-2 text-xs font-semibold text-white">Update Profile</button>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── AI Coach ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="relative overflow-hidden rounded-[28px] border border-[#6D5DF6]/12 bg-gradient-to-br from-[#6D5DF6]/5 via-white to-[#8B5CF6]/5 p-6 shadow-[0_18px_50px_rgba(109,93,246,0.08)] md:p-8">
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-gradient-to-br from-[#6D5DF6]/10 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-gradient-to-tr from-[#8B5CF6]/8 to-transparent blur-3xl" />
        <div className="relative">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D5DF6] to-[#8B5CF6] shadow-lg shadow-[#6D5DF6]/25">
              <Brain size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6D5DF6]">AI Placement Coach</p>
              <h3 className="text-lg font-bold text-[#111827]">What should I do today?</h3>
            </div>
          </div>
          <div className="grid gap-2.5 md:grid-cols-2">
            {aiTasks.map((task, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.08 }}
                className="flex items-start gap-3 rounded-2xl border border-[rgba(109,93,246,0.06)] bg-white/70 px-4 py-3 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-[rgba(109,93,246,0.12)] hover:shadow-md">
                <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${
                  task.priority === "high" ? "bg-red-100 text-red-600" :
                  task.priority === "medium" ? "bg-amber-100 text-amber-600" :
                  "bg-green-100 text-green-600"
                }`}>
                  {task.priority === "high" ? "!" : task.priority === "medium" ? "→" : "✓"}
                </div>
                <p className="text-sm font-medium leading-relaxed text-[#374151]">{task.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Charts Row ── */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr_0.8fr]">
        {/* Weekly Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-[24px] border border-[rgba(109,93,246,0.06)] bg-white/80 p-5 shadow-[0_8px_30px_rgba(16,18,37,0.04)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5DF6]">Progress</p>
              <h3 className="mt-0.5 text-base font-bold text-[#111827]">Weekly Progress</h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-medium text-[#6B7280]">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#6D5DF6]" /> Readiness</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#8B5CF6]" /> Overall</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyProgressData}>
              <defs>
                <linearGradient id="readinessGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#6D5DF6" stopOpacity={0.25} /><stop offset="100%" stopColor="#6D5DF6" stopOpacity={0} /></linearGradient>
                <linearGradient id="overallGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.2} /><stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1", fontSize: 12 }} />
              <Area type="monotone" dataKey="readiness" stroke="#6D5DF6" strokeWidth={2.5} fill="url(#readinessGrad)" dot={{ r: 3, fill: "#6D5DF6" }} />
              <Area type="monotone" dataKey="overall" stroke="#8B5CF6" strokeWidth={2} fill="url(#overallGrad)" dot={{ r: 3, fill: "#8B5CF6" }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Skill Radar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-[24px] border border-[rgba(109,93,246,0.06)] bg-white/80 p-5 shadow-[0_8px_30px_rgba(16,18,37,0.04)] backdrop-blur-xl">
          <div className="mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5DF6]">Skills</p>
            <h3 className="mt-0.5 text-base font-bold text-[#111827]">Skill Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={skillRadarData}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: "#6B7280" }} />
              <Radar dataKey="score" stroke="#6D5DF6" fill="#6D5DF6" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: "#6D5DF6" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1" }} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Activity Timeline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="rounded-[24px] border border-[rgba(109,93,246,0.06)] bg-white/80 p-5 shadow-[0_8px_30px_rgba(16,18,37,0.04)] backdrop-blur-xl">
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5DF6]">Activity</p>
            <h3 className="mt-0.5 text-base font-bold text-[#111827]">Recent Activity</h3>
          </div>
          <div className="space-y-2">
            {ACTIVITIES.map((a, i) => {
              const Icon = a.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.06 }}
                  className="flex items-center gap-3 rounded-2xl border border-[#E8ECF1] bg-white px-3.5 py-2.5 transition-all hover:border-[rgba(109,93,246,0.1)] hover:shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${a.color}12` }}>
                    <Icon size={15} style={{ color: a.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#111827]">{a.label}</p>
                    <p className="text-[10px] text-[#9CA3AF]">{a.time}</p>
                  </div>
                  <Activity size={13} className="text-[#D1D5DB]" />
                </motion.div>
              );
            })}
          </div>
          <button onClick={() => navigate("/app/student/ai-tutor")}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#D1D5DB] py-2.5 text-xs font-semibold text-[#6B7280] transition-all hover:border-[#6D5DF6]/30 hover:text-[#6D5DF6]">
            <Brain size={13} /> Ask AI for more insights
          </button>
        </motion.div>
      </div>

      {/* ── Bottom Row: Leaderboard + Events ── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        {/* Leaderboard */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-[24px] border border-[rgba(109,93,246,0.06)] bg-white/80 p-5 shadow-[0_8px_30px_rgba(16,18,37,0.04)] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5DF6]">Leaderboard</p>
              <h3 className="mt-0.5 text-base font-bold text-[#111827]">Placement Readiness Rank</h3>
            </div>
            <Trophy size={18} className="text-[#F59E0B]" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D5DF6] to-[#8B5CF6] shadow-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-white tabular-nums">{leaderboardRank.rank}</p>
                <p className="text-[8px] font-semibold uppercase tracking-wider text-white/80">Rank</p>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-[#111827]">Among {leaderboardRank.total} students</span>
                <span className="text-xs font-bold text-[#6D5DF6]">{leaderboardRank.label}</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-[#6D5DF6] to-[#8B5CF6]"
                  initial={{ width: 0 }} animate={{ width: `${Math.max(5, readiness)}%` }} transition={{ duration: 1.2, ease: "easeOut" }} />
              </div>
              <p className="mt-1 text-[10px] text-[#9CA3AF]">Based on placement readiness score</p>
            </div>
          </div>
        </motion.div>

        {/* Upcoming Events */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="rounded-[24px] border border-[rgba(109,93,246,0.06)] bg-white/80 p-5 shadow-[0_8px_30px_rgba(16,18,37,0.04)] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5DF6]">Events</p>
              <h3 className="mt-0.5 text-base font-bold text-[#111827]">Upcoming Events</h3>
            </div>
            <CalendarDays size={16} className="text-[#6B7280]" />
          </div>
          <div className="space-y-2">
            {EVENTS.map((ev, i) => {
              const Icon = ev.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.06 }}
                  className="flex items-center gap-3 rounded-2xl border border-[#E8ECF1] bg-white px-3.5 py-2.5 transition-all hover:border-[rgba(109,93,246,0.1)] hover:shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6D5DF6]/10 text-[#6D5DF6]">
                    <Icon size={15} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#111827]">{ev.label}</p>
                    <p className="text-[10px] text-[#9CA3AF]">{ev.date}</p>
                  </div>
                  <div className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    ev.type === "drive" ? "bg-green-100 text-green-700" :
                    ev.type === "deadline" ? "bg-red-100 text-red-700" :
                    ev.type === "assessment" ? "bg-amber-100 text-amber-700" :
                    "bg-purple-100 text-purple-700"
                  }`}>
                    {ev.type}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ── Footer CTA ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#6D5DF6] to-[#8B5CF6] p-6 shadow-[0_18px_50px_rgba(109,93,246,0.2)] md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
        <div className="relative flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
          <div>
            <h3 className="text-xl font-bold text-white">Continue Your Placement Journey</h3>
            <p className="mt-1 text-sm text-white/80">Stay consistent, track progress, and land your dream role.</p>
          </div>
          <button onClick={() => navigate("/app/student/company-eligibility")}
            className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-[#6D5DF6] shadow-lg transition-all hover:shadow-xl hover:scale-105">
            Explore Companies <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
