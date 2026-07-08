import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCompanies } from "../../api/company";
import {
  calculateCodingScore,
  calculateCompanyEligibility,
  calculateCompanyEligibilityScore,
  calculateInterviewReadiness,
  calculateResumeScore,
  calculateSkillScore,
  useStudentProfile,
} from "../../context/StudentProfileContext";
import type { StudentEligibilityResult } from "../../types/placement";
import { motion } from "framer-motion";
import {
  Activity, AlertCircle, AlertTriangle, Award, BookOpen, Brain, BriefcaseBusiness,
  CalendarDays, CheckCircle2, ChevronRight, Clock, Code2, Download, Edit3,
  ExternalLink, FileText, Flame, GitBranch, GitCommitHorizontal, Globe,
  GraduationCap, LayoutDashboard, Loader2, RefreshCw, Search, Send,
  ShieldCheck, Sparkles, Star, Target, Timer, TrendingUp, Trophy, Users, Video, X,
} from "lucide-react";
import {
  Bar, BarChart, Cell, Line,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { Card } from "../../components/ui/Card";
import { PremiumCard } from "../../components/ui/PremiumCard";
import { AnimatedCounter } from "../../components/ui/AnimatedCounter";
import { useOptionalStudentProfile } from "../../context/StudentProfileContext";
import { cn } from "../../utils/cn";
import type {
  CodingProgressData, GitHubRepo, LeetCodeStats,
  LeetCodeSubmission, StudentProfile,
} from "../../types";

// =====================================================
// Mock Interviews
// =====================================================

const mockInterviews = [
  { company: "Google", role: "SDE-1", date: "Jul 5, 2025", status: "Scheduled", type: "Technical", duration: "60 min" },
  { company: "Microsoft", role: "SWE", date: "Jul 12, 2025", status: "Scheduled", type: "System Design", duration: "45 min" },
  { company: "Amazon", role: "SDE-1", date: "Jun 20, 2025", status: "Completed", type: "Technical", duration: "60 min", score: 74 },
  { company: "Stripe", role: "Backend", date: "Jun 15, 2025", status: "Completed", type: "Coding", duration: "45 min", score: 82 },
  { company: "Google", role: "SDE-1", date: "May 28, 2025", status: "Completed", type: "Phone Screen", duration: "30 min", score: 85 },
];

const interviewStats = [
  { label: "Total Interviews", value: "5", color: "#6C4CF1" },
  { label: "Completed", value: "3", color: "#22C55E" },
  { label: "Avg Score", value: "80%", color: "#3B82F6" },
  { label: "Scheduled", value: "2", color: "#F59E0B" },
];

export function StudentMockInterviews() {
  return (
    <PageShell title="Mock Interviews" subtitle="Track and book mock interviews with AI-powered feedback.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {interviewStats.map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <p className="text-sm font-medium text-[#6B7280]">{kpi.label}</p>
            <p className="mt-2 text-[32px] font-bold tracking-tight text-[#111827]" style={{ color: kpi.color }}>{kpi.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#6C4CF1]">INTERVIEWS</p>
            <h3 className="mt-1 text-xl font-bold text-[#111827]">Interview History</h3>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-[#6C4CF1]/20 transition hover:shadow-xl">
            <Video size={14} /> Book Interview
          </button>
        </div>
        <div className="space-y-2">
          {mockInterviews.map((m, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-[#E8ECF1] px-5 py-4 transition hover:border-[#6C4CF1]/20 hover:bg-[#F5F7FA]">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold text-white ${
                m.status === "Completed" ? "bg-[#22C55E]" : "bg-[#6C4CF1]"
              }`}>{m.company[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#111827]">{m.company} • {m.role}</p>
                <p className="text-xs text-[#6B7280]">{m.type} • {m.duration} • {m.date}</p>
              </div>
              <div className="flex items-center gap-3">
                {m.score && (
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#6C4CF1]">{m.score}%</p>
                    <p className="text-[10px] text-[#6B7280]">Score</p>
                  </div>
                )}
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  m.status === "Completed" ? "bg-[#DCFCE7] text-[#22C55E]" :
                  m.status === "Scheduled" ? "bg-[#DBEAFE] text-[#3B82F6]" :
                  "bg-[#FEF3C7] text-[#F59E0B]"
                }`}>{m.status}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}

// =====================================================
// Coding Progress — Real-time from saved profile links
// =====================================================

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatRelativeTime(isoStr: string | null): string {
  if (!isoStr) return "Never";
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatTimestamp(ts: string): string {
  const num = parseInt(ts);
  if (isNaN(num)) return ts;
  const d = new Date(num * 1000);
  return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-[20px] bg-white shadow-sm" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="h-80 animate-pulse rounded-[20px] bg-white shadow-sm" />
        <div className="h-80 animate-pulse rounded-[20px] bg-white shadow-sm" />
      </div>
    </div>
  );
}

type Insight = { message: string; type: "positive" | "warning" | "info" };

function generateInsights(data: CodingProgressData): Insight[] {
  const insights: Insight[] = [];
  const lc = data.leetcode_stats;
  const gh = data.github_stats;
  const linkedinProfile = data.linkedin_profile;
  if (!lc && !gh && !data.linkedin_url && !data.linkedin_status?.connected) return [{
    message: "Sync your coding profiles to get personalized AI insights.",
    type: "info",
  }];
  if (lc) {
    if (lc.total_solved < 100) {
      insights.push({
        message: "You've solved fewer than 100 LeetCode problems. Consistent DSA practice (2-3 problems/day) can significantly boost your coding score.",
        type: "warning",
      });
    } else if (lc.total_solved >= 300) {
      insights.push({
        message: `Excellent LeetCode progress with ${lc.total_solved} problems solved! Focus on contest participation and system design next.`,
        type: "positive",
      });
    } else {
      insights.push({
        message: `Good progress with ${lc.total_solved} problems solved. Aim for 300+ to be competitive at top tech companies.`,
        type: "info",
      });
    }
  }
  if (gh) {
    if (gh.recent_activity_count < 5) {
      insights.push({
        message: "Low recent GitHub activity. Pushing projects weekly builds a stronger portfolio for interviews.",
        type: "warning",
      });
    } else if (gh.public_repos >= 10) {
      insights.push({
        message: `Strong GitHub presence with ${gh.public_repos} public repos! Keep contributing to open source for greater visibility.`,
        type: "positive",
      });
    } else {
      insights.push({
        message: `You have ${gh.public_repos} public repos. Building 2-3 quality projects with good documentation strengthens your resume.`,
        type: "info",
      });
    }
  }
  if (!data?.linkedin_url && !data?.linkedin_status?.connected) {
    insights.push({
      message: "Add your LinkedIn profile in Settings to build your professional network and attract recruiters.",
      type: "warning",
    });
  }
  if (data?.linkedin_url || data?.linkedin_status?.connected) {
    if (!linkedinProfile?.headline?.trim()) {
      insights.push({ message: "Add a strong LinkedIn headline.", type: "warning" });
    }
    if (!linkedinProfile?.about?.trim()) {
      insights.push({ message: "Add About section for recruiter visibility.", type: "warning" });
    }
    if (!linkedinProfile?.skills?.trim()) {
      insights.push({ message: "Add top skills like React, FastAPI, Python, AI/ML.", type: "warning" });
    }
  }
  if (insights.length === 0) {
    insights.push({
      message: "Your coding profile looks great! Keep up the consistent work.",
      type: "positive",
    });
  }
  return insights;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "#22C55E";
  if (score >= 40) return "#F59E0B";
  return "#EF4444";
}

function ProgressBar({ value, max = 100, color, size = "md" }: { value: number; max?: number; color?: string; size?: "sm" | "md" }) {
  const pct = Math.min(100, (value / max) * 100);
  const c = color || getScoreColor(pct);
  return (
    <div className={cn("w-full rounded-full bg-[#F3F4F6]", size === "sm" ? "h-1.5" : "h-2.5")}>
      <div className="rounded-full transition-all duration-700" style={{ width: `${pct}%`, height: "100%", backgroundColor: c }} />
    </div>
  );
}

// ============================================================
// REDESIGNED: AI Coding Intelligence Dashboard
// ============================================================

const PURPLE = "#6C4CF1";
const PURPLE_LIGHT = "#8B5CF6";
const PURPLE_GLOW = "rgba(108,76,241,0.15)";

const heatmapMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function generateContributionData(lc: LeetCodeStats | null | undefined) {
  const days = 52;
  const arr: { date: string; count: number; level: number }[] = [];
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const count = lc?.recent_submissions?.filter((s) => {
      const sd = new Date(parseInt(s.timestamp) * 1000);
      return sd.toDateString() === d.toDateString();
    }).length || 0;
    arr.push({
      date: `${weekDays[d.getDay()]} ${d.getDate()}`,
      count,
      level: count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : 3,
    });
  }
  return arr;
}

function generateProblemsChartData(lc: LeetCodeStats | null | undefined) {
  return [
    { label: "Easy", value: lc?.easy_solved ?? 0, color: "#22C55E" },
    { label: "Medium", value: lc?.medium_solved ?? 0, color: "#3B82F6" },
    { label: "Hard", value: lc?.hard_solved ?? 0, color: "#EF4444" },
  ];
}

function getLanguageColor(lang: string): string {
  const colors: Record<string, string> = {
    Python: "#3776AB", Java: "#ED8B00", "C++": "#00599C",
    JavaScript: "#F7DF1E", TypeScript: "#3178C6", SQL: "#E38C00",
    React: "#61DAFB", "Node.js": "#339933", FastAPI: "#009688",
    Go: "#00ADD8", Rust: "#DEA584", Ruby: "#CC342D",
  };
  return colors[lang] || PURPLE;
}

function getLanguagesData(gh: CodingProgressData["github_stats"] | null | undefined) {
  if (!gh?.languages || Object.keys(gh.languages).length === 0) return [];
  const langMap: Record<string, string> = {
    Python: "Python", Java: "Java", "C++": "C++", JavaScript: "JavaScript",
    TypeScript: "TypeScript", SQL: "SQL", Go: "Go", Rust: "Rust", Ruby: "Ruby",
    "C#": "C#", PHP: "PHP", Swift: "Swift", Kotlin: "Kotlin", Shell: "Shell",
  };
  return Object.entries(gh.languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([lang, count]) => ({
      name: langMap[lang] || lang,
      value: count,
      color: getLanguageColor(langMap[lang] || lang),
    }));
}

type TopicInfo = {
  name: string; score: number; color: string;
};

function getTopicMastery(lc: LeetCodeStats | null | undefined): TopicInfo[] {
  const total = lc?.total_solved ?? 0;
  if (total === 0) return [];
  const easy = lc?.easy_solved ?? 0;
  const medium = lc?.medium_solved ?? 0;
  const hard = lc?.hard_solved ?? 0;
  return [
    { name: "Arrays", score: Math.min(100, Math.round((total / 500) * 85 + 10)), color: "#6C4CF1" },
    { name: "Strings", score: Math.min(100, Math.round((total / 500) * 75 + 10)), color: "#3B82F6" },
    { name: "Linked List", score: Math.min(100, Math.round((medium / 200) * 70 + 10)), color: "#22C55E" },
    { name: "Stack", score: Math.min(100, Math.round((medium / 300) * 65 + 15)), color: "#F59E0B" },
    { name: "Queue", score: Math.min(100, Math.round((medium / 400) * 60 + 10)), color: "#EC4899" },
    { name: "Trees", score: Math.min(100, Math.round((medium / 250) * 75 + 10)), color: "#8B5CF6" },
    { name: "Graphs", score: Math.min(100, Math.round((hard / 100) * 70 + 10)), color: "#EF4444" },
    { name: "DP", score: Math.min(100, Math.round((medium / 300) * 80 + 10)), color: "#14B8A6" },
    { name: "Greedy", score: Math.min(100, Math.round((medium / 200) * 70 + 15)), color: "#F97316" },
    { name: "System Design", score: Math.min(100, Math.round((hard / 50) * 60 + 10)), color: "#6366F1" },
  ];
}

function getWeakTopics(topics: TopicInfo[]): { name: string; score: number; badge: "Critical" | "Medium" | "Good" }[] {
  return topics
    .slice()
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map((t) => ({
      name: t.name,
      score: t.score,
      badge: t.score < 30 ? "Critical" : t.score < 60 ? "Medium" : "Good" as const,
    }));
}

function getRecentActivityItems(lc: LeetCodeStats | null | undefined, gh: CodingProgressData["github_stats"] | null | undefined) {
  const items: { icon: string; text: string; time: string; color: string }[] = [];
  const lcSubs = lc?.recent_submissions?.slice(0, 2) || [];
  lcSubs.forEach((s) => {
    items.push({
      icon: "Code2",
      text: `Solved ${s.title}`,
      time: formatTimestamp(s.timestamp),
      color: s.status === "Accepted" ? "#22C55E" : "#EF4444",
    });
  });
  if (gh?.recent_activity_count && gh.recent_activity_count > 0) {
    items.push({
      icon: "GitCommitHorizontal",
      text: `Pushed GitHub commits`,
      time: gh.last_active_date ? formatRelativeTime(gh.last_active_date) : "Recent",
      color: PURPLE,
    });
  }
  if (lc?.contest_rating) {
    items.push({
      icon: "Trophy",
      text: `Contest Rating ${lc.contest_rating}`,
      time: "Latest",
      color: "#F59E0B",
    });
  }
  const repos = gh?.recent_repos?.slice(0, 2) || [];
  repos.forEach((r) => {
    items.push({
      icon: "GitBranch",
      text: `Updated ${r.name}`,
      time: "Recent",
      color: "#3B82F6",
    });
  });
  return items.slice(0, 5);
}

function getAchievements(lc: LeetCodeStats | null | undefined, gh: CodingProgressData["github_stats"] | null | undefined, codingScore: number | null) {
  const achievements: { title: string; desc: string; icon: string; color: string; bg: string }[] = [];
  const total = lc?.total_solved ?? 0;
  if (total >= 50) achievements.push({ title: `${total} Problems`, desc: "LeetCode Solved", icon: "Code2", color: PURPLE, bg: "bg-[#6C4CF1]/10" });
  if (gh?.public_repos && gh.public_repos >= 5) achievements.push({ title: `${gh.public_repos} Repos`, desc: "GitHub Projects", icon: "GitBranch", color: "#111827", bg: "bg-[#111827]/5" });
  if (total >= 100) achievements.push({ title: "100+ Club", desc: "Problems Solved", icon: "Award", color: "#F59E0B", bg: "bg-[#F59E0B]/10" });
  if (codingScore != null && codingScore >= 70) achievements.push({ title: "Top Performer", desc: "Coding Score ≥ 70%", icon: "Trophy", color: "#22C55E", bg: "bg-[#22C55E]/10" });
  if (gh?.followers && gh.followers >= 5) achievements.push({ title: `${gh.followers} Followers`, desc: "GitHub Community", icon: "Users", color: "#3B82F6", bg: "bg-[#3B82F6]/10" });
  if (lc?.contest_rating && lc.contest_rating >= 1500) achievements.push({ title: "Contest Star", desc: `Rating ${lc.contest_rating}`, icon: "Star", color: "#EC4899", bg: "bg-[#EC4899]/10" });
  return achievements;
}

const codingCoachTopics = ["Arrays", "Strings", "DP", "Trees", "Graphs"];

function getWeeklyGoal(totalSolved: number) {
  if (totalSolved < 50) return { mission: "Solve 10 Easy problems", goal: "Build DSA foundation" };
  if (totalSolved < 150) return { mission: "Solve 7 Medium problems", goal: "Strengthen core topics" };
  if (totalSolved < 300) return { mission: "Solve 5 Hard problems", goal: "Master advanced DSA" };
  return { mission: "Participate in weekly contest", goal: "Compete & improve rating" };
}

// ============================================================
// Main Component
// ============================================================

export function StudentCodingProgress() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyFromUrl = searchParams.get("company") || "";
  const roleFromUrl = searchParams.get("role") || "";
  const codingFocusFromUrl = searchParams.get("codingFocus") || "";
  const missingFromUrl = searchParams.get("missing") || "";
  const queryClient = useQueryClient();
  const { profile } = useOptionalStudentProfile();
  const profileLinks = useMemo(() => ({
    githubUrl: profile?.github_url || null,
    leetcodeUrl: profile?.leetcode_url || null,
    linkedinUrl: profile?.linkedin_url || null,
  }), [profile?.github_url, profile?.leetcode_url, profile?.linkedin_url]);
  const hasProfileLinks = !!(profileLinks.githubUrl || profileLinks.leetcodeUrl || profileLinks.linkedinUrl);

  const { data: codingData, isLoading: codingLoading } = useQuery<CodingProgressData>({
    queryKey: ["coding-progress", profileLinks],
    queryFn: async () => (await api.get("/student/coding-progress")).data,
    staleTime: 30_000,
    enabled: hasProfileLinks,
    retry: 1,
  });

  const syncMutation = useMutation({
    mutationFn: async () => (await api.post("/student/coding-progress/sync")).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coding-progress"] });
      queryClient.invalidateQueries({ queryKey: ["student-profile"] });
    },
  });

  const handleSync = useCallback(() => syncMutation.mutate(), [syncMutation]);

  const data = codingData;

  const links = useMemo(() => ({
    githubUrl: data?.github_url || profileLinks.githubUrl,
    leetcodeUrl: data?.leetcode_url || profileLinks.leetcodeUrl,
    linkedinUrl: data?.linkedin_url || profileLinks.linkedinUrl,
  }), [data, profileLinks]);

  const hasLinks = links.githubUrl || links.leetcodeUrl || links.linkedinUrl;

  const autoSyncRef = useRef(false);
  useEffect(() => {
    if (autoSyncRef.current) return;
    if (!hasLinks || codingLoading || syncMutation.isPending) return;
    if (data?.last_synced_at) return;
    autoSyncRef.current = true;
    syncMutation.mutate();
  }, [hasLinks, codingLoading, data?.last_synced_at, syncMutation.isPending]);

  const lc = data?.leetcode_stats;
  const gh = data?.github_stats;

  const codingScore = data?.coding_score ?? (profile ? calculateCodingScore(profile, data?.github_stats, data?.leetcode_stats) : null);
  const readiness = data?.placement_readiness_score ?? profile?.placement_readiness_score ?? null;

  const contributionData = useMemo(() => generateContributionData(lc), [lc]);
  const problemsChart = useMemo(() => generateProblemsChartData(lc), [lc]);
  const languagesData = useMemo(() => getLanguagesData(gh), [gh]);
  const topicMastery = useMemo(() => getTopicMastery(lc), [lc]);
  const weakTopics = useMemo(() => getWeakTopics(topicMastery), [topicMastery]);
  const recentActivity = useMemo(() => getRecentActivityItems(lc, gh), [lc, gh]);
  const achievements = useMemo(() => getAchievements(lc, gh, codingScore), [lc, gh, codingScore]);
  const weeklyGoal = useMemo(() => getWeeklyGoal(lc?.total_solved ?? 0), [lc]);

  const readyPct = Math.round(
    ((lc?.total_solved ?? 0) / 500) * 30 +
    ((codingScore ?? 0) / 100) * 30 +
    ((readiness ?? 0) / 100) * 25 +
    ((gh?.public_repos ?? 0) / 10) * 15
  );

  if (codingLoading && hasProfileLinks) return <LoadingSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* ========== HERO ========== */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#6C4CF1]/20 bg-white/80 px-4 py-1.5 text-xs font-semibold text-[#6C4CF1] shadow-sm backdrop-blur-sm">
            <Sparkles size={13} /> AI CODING INTELLIGENCE
          </div>
          {companyFromUrl && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[#6C4CF1]/15 bg-gradient-to-r from-[#6C4CF1]/5 to-[#8B5CF6]/5 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#6C4CF1]">
                <Target size={15} /> Coding Focus for {companyFromUrl}{roleFromUrl ? ` ${roleFromUrl}` : ""}
              </div>
              {codingFocusFromUrl && (
                <div className="flex flex-wrap gap-1.5">
                  {codingFocusFromUrl.split(",").map(topic => (
                    <span key={topic} className="rounded-full bg-[#6C4CF1]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#6C4CF1]">
                      {topic.trim()}
                    </span>
                  ))}
                </div>
              )}
              {missingFromUrl && (
                <p className="w-full text-[10px] text-amber-600">Missing: {missingFromUrl}</p>
              )}
            </div>
          )}
          <h1 className="text-[32px] font-bold tracking-tight text-[#111827]">Coding Progress</h1>
        </motion.div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          {/* Coding Score - Large */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative overflow-hidden rounded-[24px] border border-[rgba(108,76,241,0.08)] bg-white p-6 shadow-[0_12px_40px_rgba(108,76,241,0.06)]"
          >
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-[#6C4CF1]/10 to-transparent blur-2xl" />
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">Coding Score</p>
            <div className="mt-3 flex items-baseline gap-1">
              {codingScore == null ? (
                <span className="text-[32px] font-bold tracking-tight text-[#111827]">Syncing</span>
              ) : (
                <AnimatedCounter value={Math.round(codingScore)} suffix="%" className="text-[56px] font-bold tracking-tight text-[#111827]" />
              )}
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-[#F3F4F6]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${codingScore ?? 0}%` }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6]" />
            </div>
          </motion.div>

          <MetricCardSmall
            label="GitHub Score"
            value={links.githubUrl && !gh ? 65 : Math.min(100, Math.round(((gh?.public_repos ?? 0) * 5 + (gh?.recent_activity_count ?? 0) * 2)))}
            suffix="%"
            icon={GitBranch}
            color="#111827"
            delay={0.15}
          />
          <MetricCardSmall
            label="LeetCode Score"
            value={links.leetcodeUrl && !lc ? 65 : Math.min(100, Math.round(((lc?.total_solved ?? 0) / 500) * 100))}
            suffix="%"
            icon={Code2}
            color="#F59E0B"
            delay={0.2}
          />
          <MetricCardSmall
            label="Contest Rating"
            value={links.leetcodeUrl && !lc ? null : lc?.contest_rating ?? 0}
            icon={TrendingUp}
            color="#3B82F6"
            delay={0.25}
          />

          {/* Summary pill */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center"
          >
            <div className="rounded-2xl border border-[rgba(108,76,241,0.08)] bg-white px-5 py-4 shadow-sm">
              <p className="text-xs text-[#6B7280]">Interview Ready</p>
              <p className="mt-1 text-lg font-bold text-[#111827]">
                {readyPct >= 70 ? "Yes" : readyPct >= 40 ? "Almost" : "Not yet"}
              </p>
              <p className="text-[11px] text-[#6B7280]">{readyPct}% prepared</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* No links state */}
      {!hasLinks && !codingLoading && (
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#6C4CF1]/10 to-[#8B5CF6]/10 text-[#6C4CF1]">
            <Code2 size={30} />
          </div>
          <h3 className="text-xl font-bold text-[#111827]">Connect Your Coding Profiles</h3>
          <p className="mt-2 text-sm text-[#6B7280]">Link your GitHub, LeetCode, and LinkedIn to unlock your AI Coding Intelligence dashboard.</p>
          <button
            onClick={() => navigate("/app/student/profile")}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#6C4CF1]/25 transition hover:shadow-xl"
          >
            <Edit3 size={14} /> Go to Profile Settings
          </button>
        </Card>
      )}

      {syncMutation.isError && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#F59E0B]/30 bg-[#FEF3C7]/80 px-5 py-3 text-sm font-semibold text-[#D97706] backdrop-blur-sm">
          <AlertCircle size={17} /> Unable to sync now, showing last saved data.
        </div>
      )}

      {(hasLinks || syncMutation.data?.data) && (
        <>
          {/* ========== TOP GRID: Contribution + Metric Cards ========== */}
          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            {/* GitHub Heatmap */}
            <PremiumCard index={0} className="overflow-hidden p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6C4CF1]">CONTRIBUTION</p>
                  <h3 className="mt-1 text-lg font-bold text-[#111827]">GitHub Activity</h3>
                </div>
                <div className="flex items-center gap-2">
                  {links.githubUrl && (
                    <a href={links.githubUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-[#E8ECF1] px-3 py-1.5 text-[11px] font-semibold text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]">
                      <ExternalLink size={11} /> Open
                    </a>
                  )}
                  <button
                    onClick={handleSync}
                    disabled={syncMutation.isPending}
                    className="flex items-center gap-1.5 rounded-lg border border-[#E8ECF1] px-3 py-1.5 text-[11px] font-semibold text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1] disabled:opacity-50"
                  >
                    <RefreshCw size={11} className={syncMutation.isPending ? "animate-spin" : ""} />
                    {syncMutation.isPending ? "Syncing" : "Sync"}
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="flex flex-wrap gap-[3px]">
                  {contributionData.map((d, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.005 }}
                      className={cn(
                        "h-3 w-3 rounded-sm transition-colors",
                        d.level === 0 && "bg-[#F3F4F6]",
                        d.level === 1 && "bg-[#6C4CF1]/25",
                        d.level === 2 && "bg-[#6C4CF1]/55",
                        d.level === 3 && "bg-[#6C4CF1]",
                      )}
                      title={`${d.date}: ${d.count} contributions`}
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] text-[#6B7280]">
                  <span>{gh?.last_active_date ? `Last active ${formatRelativeTime(gh.last_active_date)}` : "No activity data"}</span>
                  <div className="flex items-center gap-1.5">
                    <span>Less</span>
                    <div className="h-2.5 w-2.5 rounded-sm bg-[#F3F4F6]" />
                    <div className="h-2.5 w-2.5 rounded-sm bg-[#6C4CF1]/25" />
                    <div className="h-2.5 w-2.5 rounded-sm bg-[#6C4CF1]/55" />
                    <div className="h-2.5 w-2.5 rounded-sm bg-[#6C4CF1]" />
                    <span>More</span>
                  </div>
                </div>
              </div>
            </PremiumCard>

            {/* 4 Premium Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                label="Problems Solved"
                value={lc?.total_solved ?? 0}
                icon={Code2}
                color={PURPLE}
                index={0}
              />
              <MetricCard
                label="Daily Streak"
                value={lc?.recent_submissions?.filter((s) => s.status === "Accepted")?.length ?? 0}
                suffix=" days"
                icon={Flame}
                color="#F59E0B"
                index={1}
              />
              <MetricCard
                label="Contest Rating"
                value={lc?.contest_rating ?? 0}
                icon={Trophy}
                color="#3B82F6"
                index={2}
              />
              <MetricCard
                label="Total Commits"
                value={gh?.recent_activity_count ?? 0}
                icon={GitCommitHorizontal}
                color="#22C55E"
                index={3}
              />
            </div>
          </div>

          {/* ========== SECOND GRID: Problems Chart + Language Distribution ========== */}
          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <PremiumCard className="p-6">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6C4CF1]">PROBLEMS</p>
                <h3 className="mt-1 text-lg font-bold text-[#111827]">Solved by Difficulty</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={problemsChart} barCategoryGap="25%">
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1", boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}
                      cursor={{ fill: "transparent" }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {problemsChart.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PremiumCard>

            <PremiumCard className="p-6">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6C4CF1]">LANGUAGES</p>
                <h3 className="mt-1 text-lg font-bold text-[#111827]">Distribution</h3>
              </div>
              {languagesData.length > 0 ? (
                <div className="flex h-64 flex-col justify-center">
                  <div className="space-y-3">
                    {languagesData.map((lang, i) => (
                      <motion.div
                        key={lang.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                      >
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: lang.color }} />
                            <span className="font-medium text-[#111827]">{lang.name}</span>
                          </div>
                          <span className="font-semibold text-[#6B7280]">{lang.value}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-[#F3F4F6]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (lang.value / Math.max(...languagesData.map((l) => l.value))) * 100)}%` }}
                            transition={{ duration: 0.6, delay: i * 0.08 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: lang.color }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-[#6B7280]">
                  {gh?.languages ? "No language data" : "Sync GitHub to see languages"}
                </div>
              )}
            </PremiumCard>
          </div>

          {/* ========== THIRD GRID: Topic Mastery + AI Weak Topics ========== */}
          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <PremiumCard className="p-6">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6C4CF1]">MASTERY</p>
                <h3 className="mt-1 text-lg font-bold text-[#111827]">Topic Mastery</h3>
              </div>
              {topicMastery.length > 0 ? (
                <div className="grid grid-cols-5 gap-4">
                  {topicMastery.map((topic, i) => (
                    <motion.div
                      key={topic.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: i * 0.04 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="relative flex items-center justify-center">
                        <svg width="56" height="56" viewBox="0 0 56 56" className="rotate-[-90deg]">
                          <circle cx="28" cy="28" r="23" fill="none" stroke="#F3F4F6" strokeWidth="4" />
                          <motion.circle
                            cx="28" cy="28" r="23" fill="none"
                            stroke={topic.color} strokeWidth="4" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 23}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 23 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 23 * (1 - topic.score / 100) }}
                            transition={{ duration: 1, delay: i * 0.08 + 0.3 }}
                          />
                        </svg>
                        <span className="absolute text-xs font-bold text-[#111827]">{topic.score}%</span>
                      </div>
                      <span className="text-[10px] font-medium text-[#6B7280] text-center leading-tight">{topic.name}</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-[#6B7280]">
                  Sync LeetCode to see topic mastery
                </div>
              )}
            </PremiumCard>

            <PremiumCard className="p-6">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6C4CF1]">AI ANALYSIS</p>
                <h3 className="mt-1 text-lg font-bold text-[#111827]">Weak Topics</h3>
              </div>
              {weakTopics.length > 0 ? (
                <div className="space-y-3">
                  {weakTopics.map((topic, i) => (
                    <motion.div
                      key={topic.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.06 }}
                      className="flex items-center justify-between rounded-xl border border-[#E8ECF1] px-4 py-3 transition hover:border-[#6C4CF1]/20"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-[#111827]">{topic.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[#6B7280]">{topic.score}%</span>
                        <span className={cn(
                          "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          topic.badge === "Critical" && "bg-[#FEE2E2] text-[#EF4444]",
                          topic.badge === "Medium" && "bg-[#FEF3C7] text-[#D97706]",
                          topic.badge === "Good" && "bg-[#DCFCE7] text-[#22C55E]",
                        )}>{topic.badge}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-[#6B7280]">
                  Sync to identify weak topics
                </div>
              )}
            </PremiumCard>
          </div>

          {/* ========== FOURTH GRID: Recent Activity + Achievements ========== */}
          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <PremiumCard className="p-6">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6C4CF1]">TIMELINE</p>
                <h3 className="mt-1 text-lg font-bold text-[#111827]">Recent Coding Activity</h3>
              </div>
              {recentActivity.length > 0 ? (
                <div className="relative pl-6">
                  <div className="absolute left-[11px] top-1.5 h-[calc(100%-16px)] w-[2px] bg-gradient-to-b from-[#6C4CF1]/30 to-transparent" />
                  {recentActivity.map((item, i) => {
                    const Icon = { Code2, GitCommitHorizontal, Trophy, GitBranch }[item.icon] || Activity;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.08 }}
                        className="relative mb-5 last:mb-0"
                      >
                        <div className="absolute -left-[17px] top-1 grid h-5 w-5 place-items-center rounded-full bg-white">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                        </div>
                        <div className="rounded-xl border border-[#E8ECF1] px-4 py-3 transition hover:border-[#6C4CF1]/20">
                          <div className="flex items-center gap-2">
                            <Icon size={14} style={{ color: item.color }} />
                            <span className="text-sm font-semibold text-[#111827]">{item.text}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-[#6B7280]">{item.time}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-[#6B7280]">
                  Sync your profiles to see activity
                </div>
              )}
            </PremiumCard>

            <PremiumCard className="p-6">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6C4CF1]">BADGES</p>
                <h3 className="mt-1 text-lg font-bold text-[#111827]">Recent Achievements</h3>
              </div>
              {achievements.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {achievements.map((ach, i) => {
                    const Icon = { Code2, GitBranch, Award, Trophy, Users, Star }[ach.icon] || Award;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.06 }}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition hover:shadow-sm",
                          "border-[#E8ECF1]"
                        )}
                      >
                        <div className={cn("grid h-10 w-10 place-items-center rounded-xl", ach.bg)}>
                          <Icon size={18} style={{ color: ach.color }} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#111827]">{ach.title}</p>
                          <p className="text-[10px] text-[#6B7280]">{ach.desc}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-[#6B7280]">
                  Achievements will appear as you progress
                </div>
              )}
            </PremiumCard>
          </div>

          {/* ========== FIFTH GRID: Top Projects + AI Coach ========== */}
          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <PremiumCard className="p-6">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6C4CF1]">PROJECTS</p>
                <h3 className="mt-1 text-lg font-bold text-[#111827]">Top GitHub Projects</h3>
              </div>
              {gh?.recent_repos && gh.recent_repos.length > 0 ? (
                <div className="space-y-3">
                  {gh.recent_repos.slice(0, 4).map((repo: GitHubRepo, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="rounded-xl border border-[#E8ECF1] p-4 transition hover:border-[#6C4CF1]/20 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <GitBranch size={14} className="shrink-0 text-[#6B7280]" />
                            <p className="text-sm font-bold text-[#111827] truncate">{repo.name}</p>
                          </div>
                          {repo.description && (
                            <p className="mt-1 text-xs text-[#6B7280] line-clamp-1">{repo.description}</p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[#6B7280]">
                            {repo.language && <span className="font-medium">{repo.language}</span>}
                            <span className="flex items-center gap-1"><Star size={11} /> {repo.stars}</span>
                            <span className="flex items-center gap-1"><GitCommitHorizontal size={11} /> {repo.forks} forks</span>
                          </div>
                        </div>
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-3 shrink-0 rounded-lg border border-[#E8ECF1] px-3 py-1.5 text-[10px] font-semibold text-[#6C4CF1] transition hover:bg-[#6C4CF1]/5"
                        >
                          Open
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-[#6B7280]">
                  Sync GitHub to see your projects
                </div>
              )}
            </PremiumCard>

            <PremiumCard className="p-6">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6C4CF1]">COACH</p>
                <h3 className="mt-1 text-lg font-bold text-[#111827]">AI Coding Coach</h3>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl bg-gradient-to-br from-[#6C4CF1]/5 to-[#8B5CF6]/5 border border-[#6C4CF1]/10 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#6C4CF1]">
                    <Target size={13} /> TODAY'S MISSION
                  </div>
                  <p className="mt-1 text-sm font-bold text-[#111827]">{weeklyGoal.mission}</p>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#E8ECF1] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={14} className="text-[#6B7280]" />
                    <span className="text-xs font-medium text-[#6B7280]">Weekly Goal</span>
                  </div>
                  <span className="text-xs font-bold text-[#111827]">{weeklyGoal.goal}</span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#E8ECF1] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Trophy size={14} className="text-[#F59E0B]" />
                    <span className="text-xs font-medium text-[#6B7280]">Next Contest</span>
                  </div>
                  <span className="text-xs font-bold text-[#111827]">Weekly Contest</span>
                </div>

                <div className="rounded-xl border border-[#E8ECF1] p-4">
                  <p className="text-xs font-semibold text-[#6C4CF1]">RECOMMENDED TOPIC</p>
                  <p className="mt-1 text-sm font-bold text-[#111827]">
                    {topicMastery.length > 0
                      ? [...topicMastery].sort((a, b) => a.score - b.score)[0].name
                      : "Sync to see recommendations"}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-[#6B7280]">
                    <BookOpen size={12} />
                    Focus on improving this topic
                  </div>
                </div>

                <div className="rounded-xl border border-[#E8ECF1] p-4">
                  <p className="text-xs font-semibold text-[#6C4CF1]">LEARNING PATH</p>
                  <div className="mt-2 space-y-2">
                    <PathStep label="DSA Foundations" done={(lc?.total_solved ?? 0) >= 50} />
                    <PathStep label="Intermediate Topics" done={(lc?.total_solved ?? 0) >= 150} />
                    <PathStep label="Advanced Algorithms" done={(lc?.total_solved ?? 0) >= 300} />
                    <PathStep label="System Design" done={(lc?.hard_solved ?? 0) >= 30} />
                  </div>
                </div>
              </div>
            </PremiumCard>
          </div>

          {/* ========== BOTTOM: Action Buttons ========== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
          >
            <ActionButton
              icon={Sparkles}
              label="Run AI Analysis"
              color={PURPLE}
              onClick={() => navigate("/app/skill-gap")}
            />
            <ActionButton
              icon={CalendarDays}
              label="Generate Weekly Plan"
              color="#3B82F6"
              onClick={() => navigate("/app/student/ai-tutor")}
            />
            <ActionButton
              icon={TrendingUp}
              label="Improve Weak Topics"
              color="#F59E0B"
              onClick={() => navigate("/app/skill-gap")}
            />
            <ActionButton
              icon={GitBranch}
              label="GitHub Suggestions"
              color="#111827"
              onClick={() => links.githubUrl && window.open(links.githubUrl, "_blank")}
            />
            <ActionButton
              icon={Download}
              label="Download Report"
              color="#22C55E"
              onClick={() => {
                const content = JSON.stringify({
                  coding_score: codingScore,
                  readiness_score: readiness,
                  leetcode: lc,
                  github: gh,
                  generated_at: new Date().toISOString(),
                }, null, 2);
                const blob = new Blob([content], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `coding-report-${new Date().toISOString().split("T")[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            />
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

// ============================================================
// Internal Sub-Components
// ============================================================

function MetricCardSmall({ label, value, suffix = "", icon: Icon, color, delay = 0 }: {
  label: string; value: number | null; suffix?: string; icon: React.ElementType; color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-[20px] border border-[rgba(108,76,241,0.06)] bg-white p-5 shadow-[0_8px_30px_rgba(108,76,241,0.04)]"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium text-[#6B7280]">{label}</p>
          <div className="mt-1 flex items-baseline gap-0.5">
            {value == null ? (
              <span className="text-xl font-bold tracking-tight text-[#111827]">Syncing</span>
            ) : (
              <AnimatedCounter value={value} suffix={suffix} className="text-2xl font-bold tracking-tight" />
            )}
          </div>
        </div>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: `${color}10` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
}

function MetricCard({ label, value, suffix = "", icon: Icon, color, index }: {
  label: string; value: number | null; suffix?: string; icon: React.ElementType; color: string; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="rounded-[16px] border border-[#E8ECF1] bg-white p-4 transition-all hover:border-[rgba(108,76,241,0.12)] hover:shadow-[0_8px_24px_rgba(108,76,241,0.06)]"
    >
      <div className="flex items-center justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ backgroundColor: `${color}10` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-[11px] font-medium text-[#6B7280]">{label}</p>
        <div className="flex items-baseline gap-0.5">
          {value == null ? (
            <span className="text-lg font-bold tracking-tight text-[#111827]">Syncing</span>
          ) : (
            <AnimatedCounter value={value} suffix={suffix} className="text-[26px] font-bold tracking-tight text-[#111827]" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ActionButton({ icon: Icon, label, color, onClick }: {
  icon: React.ElementType; label: string; color: string; onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-3 rounded-[16px] border border-[rgba(108,76,241,0.06)] bg-white px-5 py-4 text-sm font-semibold text-[#111827] shadow-[0_4px_16px_rgba(108,76,241,0.04)] transition-all hover:border-[rgba(108,76,241,0.12)] hover:shadow-[0_8px_24px_rgba(108,76,241,0.06)]"
    >
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `${color}10` }}>
        <Icon size={14} style={{ color }} />
      </div>
      {label}
      <ChevronRight size={14} className="ml-auto text-[#6B7280]" />
    </motion.button>
  );
}

function PathStep({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "h-2 w-2 rounded-full",
        done ? "bg-[#22C55E]" : "bg-[#E5E7EB]"
      )} />
      <span className={cn(
        "text-xs",
        done ? "font-semibold text-[#111827]" : "text-[#6B7280]"
      )}>{label}</span>
      {done && <CheckCircle2 size={10} className="text-[#22C55E]" />}
    </div>
  );
}

// =====================================================
// Company Eligibility — AI Placement Command Center
// =====================================================

const COMPANY_COLORS = [
  ["#4285F4", "#EA4335", "#FBBC05", "#34A853"],
  ["#00A4EF", "#0078D4", "#50E6FF"],
  ["#FF9900", "#232F3E", "#146EB4"],
  ["#0077B5", "#00A0DC", "#313335"],
  ["#0047AB", "#0066CC", "#0099FF"],
  ["#000000", "#FF6000", "#FFFFFF"],
  ["#A100FF", "#6C4CF1", "#8B5CF6"],
  ["#003087", "#0091CD", "#F5A623"],
  ["#635BFF", "#32325D", "#24B47E"],
  ["#FF0000", "#333333", "#FFFFFF"],
];

const COMPANY_CODING_FOCUS: Record<string, string[]> = {
  Google: ["DSA", "System Design"],
  Microsoft: ["DSA", "System Design", "C++"],
  Amazon: ["DSA", "OOP"],
  Stripe: ["DSA", "System Design", "API Design"],
  "Goldman Sachs": ["DSA", "OOP", "DBMS"],
  Adobe: ["DSA", "OOP", "C++"],
  TCS: ["Aptitude", "Java", "SQL"],
  Infosys: ["DBMS", "SQL", "Python"],
  Wipro: ["Aptitude", "Java", "SQL"],
  Accenture: ["Aptitude", "Python", "Communication"],
  Deloitte: ["SQL", "Excel", "Communication"],
  Capgemini: ["Java", "Python", "SQL"],
  Cognizant: ["Java", "Python", "SQL"],
};

const INTERVIEW_TYPE_MAP: Record<string, { type: string; difficulty: string }> = {
  Google: { type: "technical", difficulty: "hard" },
  Microsoft: { type: "technical", difficulty: "hard" },
  Amazon: { type: "technical", difficulty: "hard" },
  Stripe: { type: "technical", difficulty: "hard" },
  "Goldman Sachs": { type: "technical", difficulty: "hard" },
  Adobe: { type: "technical", difficulty: "hard" },
  TCS: { type: "technical", difficulty: "medium" },
  Infosys: { type: "technical", difficulty: "medium" },
  Wipro: { type: "technical", difficulty: "medium" },
  Accenture: { type: "technical", difficulty: "medium" },
  Deloitte: { type: "technical", difficulty: "medium" },
  Capgemini: { type: "technical", difficulty: "easy" },
  Cognizant: { type: "technical", difficulty: "easy" },
};

const companyLogos: Record<string, string[]> = {
  Google: ["#4285F4", "#EA4335", "#FBBC05", "#34A853"],
  Microsoft: ["#00A4EF", "#0078D4", "#50E6FF"],
  Amazon: ["#FF9900", "#232F3E", "#146EB4"],
  Infosys: ["#0077B5", "#00A0DC", "#313335"],
  TCS: ["#0047AB", "#0066CC", "#0099FF"],
  Flipkart: ["#000000", "#FF6000", "#FFFFFF"],
  Accenture: ["#A100FF", "#6C4CF1", "#8B5CF6"],
  "Goldman Sachs": ["#003087", "#0091CD", "#F5A623"],
  Stripe: ["#635BFF", "#32325D", "#24B47E"],
  Adobe: ["#FF0000", "#333333", "#FFFFFF"],
};

type TabType = "all" | "dream" | "product" | "service" | "startup" | "mnc" | "remote";

function companySearchParams(c: StudentEligibilityResult): string {
  const params = new URLSearchParams();
  params.set("company", c.companyName || "");
  params.set("role", c.role || "");
  params.set("package", c.package || "");
  params.set("eligible", String(c.eligible));
  params.set("matchScore", String(c.matchScore));
  const missing = (c.reasons || []).map(r => r.replace(/^.*?:\s*/, "")).join(", ");
  if (missing) params.set("missing", missing);
  const focus = COMPANY_CODING_FOCUS[c.companyName] || ["DSA", "Programming"];
  params.set("codingFocus", focus.join(","));
  const iType = INTERVIEW_TYPE_MAP[c.companyName] || { type: "technical", difficulty: "medium" };
  params.set("interviewType", iType.type);
  params.set("difficulty", iType.difficulty);
  return params.toString();
}

function classifyCompany(name: string | undefined | null, pkg: string | undefined | null): TabType {
  const lc = String(name || "").toLowerCase();
  const pkgNum = parseFloat(String(pkg || "")) || 0;
  if (["google", "microsoft", "amazon", "stripe", "goldman sachs"].some((c) => lc.includes(c))) return "dream";
  if (pkgNum >= 20) return "product";
  if (["infosys", "tcs", "accenture"].some((c) => lc.includes(c))) return "service";
  if (pkgNum < 10) return "startup";
  if (["flipkart", "adobe"].some((c) => lc.includes(c))) return "mnc";
  return "remote";
}

function getCompanyColors(name: string | undefined | null): string[] {
  const n = String(name || "");
  return companyLogos[n] || COMPANY_COLORS[(n.length || 0) % COMPANY_COLORS.length];
}

function safeInitial(name: string | undefined | null): string {
  return (String(name || "")[0] || "?").toUpperCase();
}

function formatPackage(pkg: string | undefined | null): string {
  const num = parseFloat(String(pkg || ""));
  if (isNaN(num)) return String(pkg || "—");
  return `₹${num} LPA`;
}

function getEligibilityVerdict(readinessScore: number | null | undefined): { label: string; color: string; icon: string } {
  if (readinessScore == null) return { label: "Incomplete Profile", color: "#6B7280", icon: "AlertCircle" };
  if (readinessScore >= 75) return { label: "Interview Ready", color: "#22C55E", icon: "Award" };
  if (readinessScore >= 45) return { label: "Needs Improvement", color: "#F59E0B", icon: "Target" };
  return { label: "High Risk", color: "#EF4444", icon: "AlertTriangle" };
}

function getRecommendationSections(eligibility: StudentEligibilityResult[]): {
  safe: StudentEligibilityResult[];
  bestMatch: StudentEligibilityResult[];
  dream: StudentEligibilityResult[];
  reach: StudentEligibilityResult[];
  trending: StudentEligibilityResult[];
} {
  const sorted = [...eligibility].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  return {
    safe: sorted.filter((c) => c.eligible && (c.matchScore || 0) >= 80).slice(0, 3),
    bestMatch: sorted.filter((c) => c.eligible && (c.matchScore || 0) >= 60 && (c.matchScore || 0) < 80).slice(0, 3),
    dream: sorted.filter((c) => (c.matchScore || 0) >= 90).slice(0, 3),
    reach: sorted.filter((c) => !c.eligible && (c.matchScore || 0) >= 50).slice(0, 3),
    trending: sorted.filter((c) => c.eligible).slice(0, 3),
  };
}

function getBiggestWeakness(c: StudentEligibilityResult): string {
  const criteria = c.criteriaMet || {};
  const failedCriteria = Object.entries(criteria).filter(([, met]) => !met);
  if (failedCriteria.length === 0) return "None";
  return String(failedCriteria[0][0]).replace(/_/g, " ");
}

function estimateDaysToEligible(c: StudentEligibilityResult): number {
  if (c.eligible) return 0;
  const criteria = c.criteriaMet || {};
  const failed = Object.entries(criteria).filter(([, met]) => !met).length;
  return failed * 14;
}

function generateActions(c: StudentEligibilityResult): string[] {
  const actions: string[] = [];
  const cm = c.criteriaMet || {};
  if (!cm.cgpa) actions.push("Improve CGPA");
  if (!cm.skills) actions.push("Learn required skills");
  if (!cm.resume) actions.push("Improve resume score");
  if (!cm.coding) actions.push("Practice coding");
  if (!cm.mock_interview) actions.push("Take mock interviews");
  if (actions.length === 0) actions.push("Prepare for interview");
  return actions.slice(0, 5);
}

function generateAISummary(profile: any, eligibility: StudentEligibilityResult[]): string {
  if (!profile) return "Complete your profile to get AI-powered insights.";
  const eligible = eligibility.filter((e) => e.eligible).length;
  const almost = eligibility.filter((e) => !e.eligible && e.matchScore >= 50).length;
  const risk = eligibility.filter((e) => !e.eligible && e.matchScore < 30).length;
  const avgMatch = eligibility.length ? Math.round(eligibility.reduce((a, r) => a + r.matchScore, 0) / eligibility.length) : 0;
  const best = eligibility.reduce((max, r) => Math.max(max, parseFloat(String(r.package || "")) || 0), 0);
  return `You're eligible for ${eligible} of ${eligibility.length} companies. ${almost} more within reach. Avg match ${avgMatch}%. Highest package ₹${best} LPA.${risk > 0 ? ` ${risk} companies need urgent attention.` : ""}`;
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ["#6C4CF1", "#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#EC4899", "#8B5CF6", "#14B8A6"];
  return colors[Math.abs(hash) % colors.length];
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function StudentCompanyEligibility() {
  const navigate = useNavigate();
  const { profile } = useStudentProfile();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<StudentEligibilityResult | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  const p = profile;
  const readiness = p ? calculateCompanyEligibilityScore(p) : 0;
  const cgpa = p?.cgpa ?? 0;
  const resumeScore = p ? calculateResumeScore(p) : 0;
  const codingScore = p ? calculateCodingScore(p) : 0;
  const skillScore = p ? calculateSkillScore(p) : 0;
  const mockScore = p ? calculateInterviewReadiness(p) : 0;

  const { data: companies, isLoading } = useQuery({
    queryKey: ["companies-for-student-eligibility"],
    queryFn: fetchCompanies,
    staleTime: 30_000,
  });

  const { data: codingData } = useQuery({
    queryKey: ["coding-progress", p?.github_url, p?.leetcode_url, p?.linkedin_url],
    queryFn: async () => (await api.get("/student/coding-progress")).data,
    staleTime: 30_000,
    enabled: !!(p?.github_url || p?.leetcode_url || p?.linkedin_url),
    retry: 1,
  });

  const eligibility = useMemo(() => p ? calculateCompanyEligibility(p, companies ?? []) : [], [p, companies]);

  const eligibleSet = eligibility?.filter((r) => r.eligible) ?? [];
  const notEligibleSet = eligibility?.filter((r) => !r.eligible) ?? [];
  const almostEligibleSet = notEligibleSet.filter((r) => (r.matchScore || 0) >= 50);
  const hardNotEligibleSet = notEligibleSet.filter((r) => (r.matchScore || 0) < 50);
  const highestPkg = eligibility?.reduce((max, r) => Math.max(max, parseFloat(String(r.package || "")) || 0), 0) ?? 0;
  const dreamMatch = eligibility?.filter((r) => r.eligible)
    .sort((a, b) => (parseFloat(String(b.package || "")) || 0) - (parseFloat(String(a.package || "")) || 0))
    .slice(0, 1)[0];

  const filtered = useMemo(() => {
    if (!eligibility) return [];
    let list = [...eligibility];
    if (activeTab !== "all") {
      list = list.filter((c) => classifyCompany(c.companyName, c.package) === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          String(c.companyName || "").toLowerCase().includes(q) ||
          String(c.role || "").toLowerCase().includes(q) ||
          String(c.package || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [eligibility, activeTab, searchQuery]);

  const verdict = getEligibilityVerdict(readiness);
  const sections = useMemo(() => (eligibility ? getRecommendationSections(eligibility) : null), [eligibility]);
  const aiSummary = useMemo(() => (eligibility ? generateAISummary(profile, eligibility) : ""), [profile, eligibility]);

  const openDrawer = (c: StudentEligibilityResult) => {
    setSelectedCompany(c);
    setShowDrawer(true);
  };

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} className="space-y-6 p-6">
        <div className="h-[280px] animate-pulse rounded-[32px] bg-white/50 backdrop-blur-sm" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-[24px] bg-white/50 backdrop-blur-sm" />
          ))}
        </div>
      </motion.div>
    );
  }

  if (!eligibility?.length) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="grid h-20 w-20 place-items-center rounded-[24px] bg-gradient-to-br from-[#6C4CF1]/10 to-[#8B5CF6]/10">
          <BriefcaseBusiness size={36} className="text-[#6C4CF1]" />
        </div>
        <h2 className="text-2xl font-bold text-[#111827]">No Companies Available</h2>
        <p className="text-sm text-[#6B7280]">Companies will appear here once placement drives are announced.</p>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8 pb-24"
      >
        {/* ======================================== */}
        {/* HERO */}
        {/* ======================================== */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0F0A2E] via-[#1A0F3E] to-[#2D1B69] p-6 md:p-8"
        >
          <div className="absolute -right-32 -top-32 h-[400px] w-[400px] rounded-full bg-[#6C4CF1]/20 blur-[100px]" />
          <div className="absolute -left-16 -bottom-16 h-[300px] w-[300px] rounded-full bg-[#3B82F6]/15 blur-[80px]" />
          <div className="absolute right-10 top-10 h-40 w-40 rounded-full border border-white/5" />

          <div className="relative">
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-sm">
                <Sparkles size={12} /> AI PLACEMENT COMMAND CENTER
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1 text-[11px] font-semibold text-white/60 backdrop-blur-sm">
                <Brain size={12} /> {verdict.label}
              </span>
            </div>

            <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl">
                  Company Eligibility
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
                  {aiSummary}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-8">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <svg width="100" height="100" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                      <motion.circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke={verdict.color} strokeWidth="6" strokeLinecap="round"
                        initial={{ strokeDasharray: `${2 * Math.PI * 42}` }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - readiness / 100) }}
                        transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                        style={{ transform: "rotate(-90deg)", transformOrigin: "50px 50px" }}
                      />
                    </svg>
                    <div className="absolute inset-0 grid place-items-center">
                      <AnimatedCounter value={readiness} suffix="%" className="text-2xl font-bold text-white" />
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">Readiness</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  {[
                    { label: "Eligible", value: eligibleSet.length, color: "#22C55E" },
                    { label: "Almost", value: almostEligibleSet.length, color: "#F59E0B" },
                    { label: "Not Eligible", value: hardNotEligibleSet.length, color: "#EF4444" },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center gap-3 rounded-xl bg-white/8 px-4 py-2 backdrop-blur-sm">
                      <span className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</span>
                      <div>
                        <p className="text-[10px] font-medium text-white/60">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="rounded-xl bg-white/8 px-4 py-2.5 backdrop-blur-sm">
                    <p className="text-[10px] font-medium text-white/50">Highest Package</p>
                    <p className="text-lg font-bold text-white">₹{highestPkg} LPA</p>
                  </div>
                  {dreamMatch && (
                    <div className="rounded-xl bg-white/8 px-4 py-2.5 backdrop-blur-sm">
                      <p className="text-[10px] font-medium text-white/50">Dream Match</p>
                      <p className="text-lg font-bold text-white">{dreamMatch.companyName} {dreamMatch.matchScore}%</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ======================================== */}
        {/* COMPANY EXPLORER */}
        {/* ======================================== */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "all" as TabType, label: "All Companies", count: eligibility.length },
                { id: "dream" as TabType, label: "Dream", count: eligibility.filter((c) => classifyCompany(c.companyName, c.package) === "dream").length },
                { id: "product" as TabType, label: "Product", count: eligibility.filter((c) => classifyCompany(c.companyName, c.package) === "product").length },
                { id: "service" as TabType, label: "Service", count: eligibility.filter((c) => classifyCompany(c.companyName, c.package) === "service").length },
                { id: "startup" as TabType, label: "Startup", count: eligibility.filter((c) => classifyCompany(c.companyName, c.package) === "startup").length },
                { id: "mnc" as TabType, label: "MNC", count: eligibility.filter((c) => classifyCompany(c.companyName, c.package) === "mnc").length },
                { id: "remote" as TabType, label: "Remote", count: eligibility.filter((c) => classifyCompany(c.companyName, c.package) === "remote").length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-[#6C4CF1] text-white shadow-lg shadow-[#6C4CF1]/25"
                      : "bg-white text-[#6B7280] border border-[#E8ECF1] hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]"
                  )}
                >
                  {tab.label}
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    activeTab === tab.id ? "bg-white/20 text-white" : "bg-[#F3F4F6] text-[#6B7280]"
                  )}>{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search companies, roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-56 rounded-full border border-[#E8ECF1] bg-white pl-9 pr-4 text-sm outline-none transition focus:border-[#6C4CF1]/40 focus:shadow-[0_0_0_3px_rgba(108,76,241,0.1)]"
              />
            </div>
          </div>

          {/* Company Cards Grid */}
          <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((c, i) => {
              const colors = getCompanyColors(c.companyName);
              const isEligible = c.eligible;
              const statusLabel = c.status || (isEligible ? "Eligible" : c.matchScore >= 50 ? "Almost Eligible" : "Not Eligible");
              const matchedSkills = ((c as any).matchedSkills || []) as string[];
              const missingSkills = ((c as any).missingSkills || []) as string[];
              return (
                <motion.div
                  key={c.companyId}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.03 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  onClick={() => openDrawer(c)}
                  className="group relative cursor-pointer overflow-hidden rounded-[24px] border border-[rgba(108,76,241,0.06)] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-[rgba(108,76,241,0.15)] hover:shadow-[0_16px_48px_rgba(108,76,241,0.10)]"
                >
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-5" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1] || colors[0]})` }} />
                  <div className="absolute -left-4 -bottom-4 h-16 w-16 rounded-full opacity-5" style={{ background: `linear-gradient(135deg, ${colors[1] || colors[0]}, ${colors[2] || colors[1] || colors[0]})` }} />

                  <div className="relative">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="grid h-12 w-12 place-items-center rounded-[16px] text-lg font-bold text-white shadow-sm"
                          style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1] || colors[0]})` }}
                        >
                          {safeInitial(c.companyName)}
                        </div>
                        <div>
                          <p className="text-base font-bold text-[#111827]">{c.companyName}</p>
                          <p className="text-xs text-[#6B7280]">{c.role}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                            statusLabel === "Eligible"
                              ? "bg-[#DCFCE7] text-[#16A34A]"
                              : statusLabel === "Almost Eligible"
                                ? "bg-[#FEF3C7] text-[#D97706]"
                                : "bg-[#FEE2E2] text-[#EF4444]"
                          )}
                        >
                          {statusLabel}
                        </span>
                        <span className="text-xs font-bold text-[#6B7280]">{formatPackage(c.package)}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-[#6B7280]">Match</span>
                            <span className={cn(
                              "font-bold",
                              c.matchScore >= 70 ? "text-[#22C55E]" : c.matchScore >= 40 ? "text-[#F59E0B]" : "text-[#EF4444]"
                            )}>{c.matchScore}%</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${c.matchScore}%` }}
                              transition={{ duration: 1, delay: i * 0.05 }}
                              className={cn(
                                "h-full rounded-full",
                                c.matchScore >= 70 ? "bg-[#22C55E]" : c.matchScore >= 40 ? "bg-[#F59E0B]" : "bg-[#EF4444]"
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {matchedSkills.slice(0, 3).map((skill) => (
                        <span key={skill} className="inline-flex items-center gap-1 rounded-lg bg-[#DCFCE7]/60 px-2 py-1 text-[9px] font-semibold text-[#16A34A]">
                          <CheckCircle2 size={9} /> {skill}
                        </span>
                      ))}
                      {missingSkills.slice(0, 3).map((skill) => (
                        <span key={skill} className="inline-flex items-center gap-1 rounded-lg bg-[#FEE2E2]/60 px-2 py-1 text-[9px] font-semibold text-[#EF4444]">
                          <X size={9} /> {skill}
                        </span>
                      ))}
                      {Object.entries(c.criteriaMet || {}).slice(0, 4).map(([key, met]) => (
                        <span
                          key={key}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-semibold",
                            met
                              ? "bg-[#DCFCE7]/60 text-[#16A34A]"
                              : "bg-[#FEE2E2]/60 text-[#EF4444]"
                          )}
                        >
                          {met ? <CheckCircle2 size={9} /> : <X size={9} />}
                          {key === "cgpa" ? "CGPA" : key === "mock_interview" ? "Interview" : key.charAt(0).toUpperCase() + key.slice(1)}
                        </span>
                      ))}
                    </div>

                    {!isEligible && c.reasons.length > 0 && (
                      <div className="mt-3 rounded-xl bg-[#FEF3C7]/50 px-3 py-2">
                        <p className="text-[10px] font-semibold text-[#D97706]">Reason: {c.reasons.slice(0, 2).map((r) => r.replace(/^.*?: /, "")).join(", ")}</p>
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      {isEligible ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/app/student/mock-interviews?${companySearchParams(c)}`); }}
                          className="flex-1 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] py-2.5 text-xs font-semibold text-white shadow-sm transition hover:shadow-md"
                        >
                          Practice Interview
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/app/resume-analyzer?${companySearchParams(c)}`); }}
                          className="flex-1 rounded-xl border border-[#E8ECF1] py-2.5 text-xs font-semibold text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]"
                        >
                          Improve Resume
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); openDrawer(c); }}
                        className="grid h-9 w-9 place-items-center rounded-xl border border-[#E8ECF1] text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16">
              <Search size={32} className="text-[#D1D5DB]" />
              <p className="text-sm font-medium text-[#6B7280]">No companies match your filters</p>
              <button onClick={() => { setActiveTab("all"); setSearchQuery(""); }} className="text-xs font-semibold text-[#6C4CF1] hover:underline">Clear filters</button>
            </div>
          )}
        </motion.section>

        {/* ======================================== */}
        {/* RECOMMENDED COMPANIES */}
        {/* ======================================== */}
        {sections && (sections.safe.length > 0 || sections.bestMatch.length > 0 || sections.dream.length > 0) && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="mb-4 flex items-center gap-2">
              <Brain size={16} className="text-[#6C4CF1]" />
              <h3 className="text-lg font-bold text-[#111827]">AI Recommended</h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {sections.safe.length > 0 && (
                <div className="rounded-[24px] border border-[rgba(34,197,94,0.15)] bg-gradient-to-br from-[#22C55E]/5 to-transparent p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#22C55E]" />
                    <p className="text-sm font-bold text-[#111827]">Safe Bets</p>
                  </div>
                  {sections.safe.map((c) => (
                    <button key={c.companyId} onClick={() => openDrawer(c)} className="w-full mb-2 flex items-center justify-between rounded-xl bg-white/80 px-4 py-3 text-left transition hover:bg-white hover:shadow-sm last:mb-0">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-lg text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${getCompanyColors(c.companyName)[0]}, ${getCompanyColors(c.companyName)[1] || getCompanyColors(c.companyName)[0]})` }}>{safeInitial(c.companyName)}</div>
                        <div><p className="text-sm font-semibold text-[#111827]">{c.companyName}</p><p className="text-[10px] text-[#6B7280]">{formatPackage(c.package)}</p></div>
                      </div>
                      <span className="text-xs font-bold text-[#22C55E]">{c.matchScore}%</span>
                    </button>
                  ))}
                </div>
              )}

              {sections.bestMatch.length > 0 && (
                <div className="rounded-[24px] border border-[rgba(108,76,241,0.15)] bg-gradient-to-br from-[#6C4CF1]/5 to-transparent p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Target size={16} className="text-[#6C4CF1]" />
                    <p className="text-sm font-bold text-[#111827]">Best Match</p>
                  </div>
                  {sections.bestMatch.map((c) => (
                    <button key={c.companyId} onClick={() => openDrawer(c)} className="w-full mb-2 flex items-center justify-between rounded-xl bg-white/80 px-4 py-3 text-left transition hover:bg-white hover:shadow-sm last:mb-0">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-lg text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${getCompanyColors(c.companyName)[0]}, ${getCompanyColors(c.companyName)[1] || getCompanyColors(c.companyName)[0]})` }}>{safeInitial(c.companyName)}</div>
                        <div><p className="text-sm font-semibold text-[#111827]">{c.companyName}</p><p className="text-[10px] text-[#6B7280]">{formatPackage(c.package)}</p></div>
                      </div>
                      <span className="text-xs font-bold text-[#6C4CF1]">{c.matchScore}%</span>
                    </button>
                  ))}
                </div>
              )}

              {sections.reach.length > 0 && (
                <div className="rounded-[24px] border border-[rgba(239,68,68,0.15)] bg-gradient-to-br from-[#EF4444]/5 to-transparent p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <TrendingUp size={16} className="text-[#EF4444]" />
                    <p className="text-sm font-bold text-[#111827]">Reach Goals</p>
                  </div>
                  {sections.reach.map((c) => (
                    <button key={c.companyId} onClick={() => openDrawer(c)} className="w-full mb-2 flex items-center justify-between rounded-xl bg-white/80 px-4 py-3 text-left transition hover:bg-white hover:shadow-sm last:mb-0">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-lg text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${getCompanyColors(c.companyName)[0]}, ${getCompanyColors(c.companyName)[1] || getCompanyColors(c.companyName)[0]})` }}>{safeInitial(c.companyName)}</div>
                        <div><p className="text-sm font-semibold text-[#111827]">{c.companyName}</p><p className="text-[10px] text-[#6B7280]">{formatPackage(c.package)}</p></div>
                      </div>
                      <span className="text-xs font-bold text-[#F59E0B]">{c.matchScore}%</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* ======================================== */}
        {/* ROADMAP */}
        {/* ======================================== */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="relative overflow-hidden rounded-[32px] bg-white border border-[rgba(108,76,241,0.06)] p-6 md:p-8"
        >
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#6C4CF1]/5 blur-[60px]" />
          <div className="mb-6 flex items-center gap-2">
            <Target size={16} className="text-[#6C4CF1]" />
            <h3 className="text-lg font-bold text-[#111827]">Your Placement Roadmap</h3>
          </div>

          <div className="relative">
            <div className="absolute left-[23px] top-0 h-full w-[2px] bg-gradient-to-b from-[#6C4CF1]/40 via-[#6C4CF1]/20 to-transparent" />

            {[
              { label: "Resume", icon: FileText, score: resumeScore, target: 80, action: "Improve Resume", color: "#3B82F6" },
              { label: "Coding", icon: Code2, score: codingScore, target: 75, action: "Start Coding", color: "#8B5CF6" },
              { label: "Projects", icon: GitBranch, score: codingData?.github_stats?.public_repos ? Math.min(100, codingData.github_stats.public_repos * 15) : 0, target: 60, action: "Build Projects", color: "#22C55E" },
              { label: "Mock Interview", icon: Video, score: mockScore, target: 70, action: "Practice Interviews", color: "#F59E0B" },
              { label: "Eligible", icon: Award, score: eligibility ? Math.round((eligibleSet.length / eligibility.length) * 100) : 0, target: 100, action: "Apply", color: "#6C4CF1" },
              { label: "Apply", icon: Send, score: 0, target: 100, action: "Start Applying", color: "#EC4899" },
            ].map((step, i) => {
              const progress = Math.min(100, (step.score / Math.max(step.target, 1)) * 100);
              const isComplete = progress >= 100;
              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * i }}
                  className="relative mb-6 last:mb-0 pl-14"
                >
                  <div
                    className={cn(
                      "absolute left-[14px] top-1 grid h-5 w-5 -translate-x-1/2 place-items-center rounded-full border-2 bg-white",
                      isComplete ? "border-[#22C55E]" : "border-[#6C4CF1]"
                    )}
                  >
                    <div className={cn("h-2 w-2 rounded-full", isComplete ? "bg-[#22C55E]" : "bg-[#6C4CF1]")} />
                  </div>

                  <div className="flex items-center justify-between rounded-[16px] border border-[rgba(108,76,241,0.06)] bg-gradient-to-r from-white to-[#F5F7FA] px-5 py-4 transition hover:border-[rgba(108,76,241,0.12)] hover:shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: `${step.color}12` }}>
                        <step.icon size={16} style={{ color: step.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#111827]">{step.label}</p>
                        <p className="text-xs text-[#6B7280]">Score: {Math.round(step.score)}% / Target: {step.target}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-[#F3F4F6]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, progress)}%` }}
                          transition={{ duration: 1, delay: 0.2 * i }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: step.color }}
                        />
                      </div>
                      {isComplete ? (
                        <CheckCircle2 size={18} className="text-[#22C55E]" />
                      ) : (
                        <button className="whitespace-nowrap rounded-lg bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-3 py-1.5 text-[10px] font-semibold text-white shadow-sm transition hover:shadow-md">
                          {step.action}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* ======================================== */}
        {/* BOTTOM CTA */}
        {/* ======================================== */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0F0A2E] via-[#1A0F3E] to-[#2D1B69] p-6 md:p-8">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#6C4CF1]/20 blur-[80px]" />
            <div className="relative flex flex-col items-center gap-6 md:flex-row md:justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">Ready to Start Your Placement Journey?</h3>
                <p className="mt-2 text-sm text-white/60">Take action now to improve your eligibility and land your dream job.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#111827] transition hover:shadow-lg">
                  <FileText size={14} /> Improve Resume
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#111827] transition hover:shadow-lg">
                  <Code2 size={14} /> Start Coding
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#111827] transition hover:shadow-lg">
                  <Video size={14} /> Mock Interview
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#6C4CF1]/25 transition hover:shadow-xl">
                  <Download size={14} /> Download Report
                </button>
              </div>
            </div>
          </div>
        </motion.section>
      </motion.div>

      {/* ======================================== */}
      {/* SIDE DRAWER */}
      {/* ======================================== */}
      {showDrawer && selectedCompany && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDrawer(false)}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto border-l border-[rgba(108,76,241,0.1)] bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#F3F4F6] bg-white/90 px-6 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div
                  className="grid h-10 w-10 place-items-center rounded-[14px] text-base font-bold text-white shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${getCompanyColors(selectedCompany.companyName)[0]}, ${getCompanyColors(selectedCompany.companyName)[1] || getCompanyColors(selectedCompany.companyName)[0]})` }}
                >
                  {safeInitial(selectedCompany.companyName)}
                </div>
                <div>
                  <p className="text-base font-bold text-[#111827]">{selectedCompany.companyName}</p>
                  <p className="text-xs text-[#6B7280]">{selectedCompany.role}</p>
                </div>
              </div>
              <button onClick={() => setShowDrawer(false)} className="grid h-8 w-8 place-items-center rounded-xl border border-[#E8ECF1] text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]">
                <X size={15} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Match Score */}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const statusLabel = selectedCompany.status || (selectedCompany.eligible ? "Eligible" : selectedCompany.matchScore >= 50 ? "Almost Eligible" : "Not Eligible");
                    return (
                  <span className={cn(
                    "rounded-full px-3 py-1 text-xs font-bold",
                    statusLabel === "Eligible" ? "bg-[#DCFCE7] text-[#16A34A]" : statusLabel === "Almost Eligible" ? "bg-[#FEF3C7] text-[#D97706]" : "bg-[#FEE2E2] text-[#EF4444]"
                  )}>{statusLabel}</span>
                    );
                  })()}
                  <span className="text-xs text-[#6B7280]">{formatPackage(selectedCompany.package)}</span>
                  {selectedCompany.driveDate && <span className="text-xs text-[#6B7280]">Drive: {selectedCompany.driveDate}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 overflow-hidden rounded-full bg-[#F3F4F6]">
                    <div
                      className={cn("h-full rounded-full", selectedCompany.matchScore >= 70 ? "bg-[#22C55E]" : selectedCompany.matchScore >= 40 ? "bg-[#F59E0B]" : "bg-[#EF4444]")}
                      style={{ width: `${selectedCompany.matchScore}%` }}
                    />
                  </div>
                  <span className={cn(
                    "text-sm font-bold",
                    selectedCompany.matchScore >= 70 ? "text-[#22C55E]" : selectedCompany.matchScore >= 40 ? "text-[#F59E0B]" : "text-[#EF4444]"
                  )}>{selectedCompany.matchScore}%</span>
                </div>
              </div>

              {/* Eligibility Checklist */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Eligibility Checklist</p>
                <div className="mb-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#DCFCE7] bg-[#F0FDF4] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#16A34A]">Matched Skills</p>
                    <p className="mt-1 text-xs font-semibold text-[#111827]">{(((selectedCompany as any).matchedSkills || []) as string[]).join(", ") || "Profile skills pending"}</p>
                  </div>
                  <div className="rounded-xl border border-[#FEE2E2] bg-[#FEF2F2] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#EF4444]">Missing Skills</p>
                    <p className="mt-1 text-xs font-semibold text-[#111827]">{(((selectedCompany as any).missingSkills || []) as string[]).join(", ") || "No critical skill gap"}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { key: "cgpa", label: "CGPA", value: cgpa, required: (selectedCompany.criteriaMet || {}).cgpa !== undefined },
                    { key: "skills", label: "Skills", value: "Requirements", required: true },
                    { key: "resume", label: "Resume", value: `${resumeScore}%`, required: true },
                    { key: "coding", label: "Coding", value: `${codingScore}%`, required: true },
                    { key: "projects", label: "Projects", value: codingData?.github_stats?.public_repos ? `${codingData.github_stats.public_repos} repos` : "—", required: false },
                    { key: "mock_interview", label: "Interview", value: `${mockScore}%`, required: true },
                  ].map((item) => {
                    const cm = (selectedCompany.criteriaMet || {});
                    const isMet = item.key === "projects" ? true : item.key === "cgpa" ? (cm.cgpa ?? true) : (cm[item.key] ?? true);
                    return (
                      <div key={item.key} className="flex items-center justify-between rounded-xl border border-[#F3F4F6] px-4 py-3">
                        <div className="flex items-center gap-3">
                          {isMet ? (
                            <CheckCircle2 size={16} className="text-[#22C55E]" />
                          ) : (
                            <X size={16} className="text-[#EF4444]" />
                          )}
                          <div>
                            <p className="text-sm font-semibold text-[#111827]">{item.label}</p>
                            <p className="text-xs text-[#6B7280]">{item.value}</p>
                          </div>
                        </div>
                        {isMet ? (
                          <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-semibold text-[#16A34A]">Met</span>
                        ) : (
                          <span className="rounded-full bg-[#FEE2E2] px-2 py-0.5 text-[10px] font-semibold text-[#EF4444]">Missing</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* What's Missing */}
              {!selectedCompany.eligible && selectedCompany.reasons.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#EF4444]">Reason</p>
                  <div className="rounded-xl border border-[#FEE2E2] bg-[#FEF2F2] p-4">
                    <ul className="space-y-1.5">
                      {selectedCompany.reasons.slice(0, 4).map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[#EF4444]">
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#EF4444]" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* AI Recommendation */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6C4CF1]">Next Actions</p>
                <div className="rounded-2xl bg-gradient-to-br from-[#6C4CF1]/5 to-[#8B5CF6]/5 border border-[#6C4CF1]/10 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain size={15} className="text-[#6C4CF1]" />
                    <p className="text-sm font-bold text-[#111827]">{(selectedCompany.eligible ? "You're eligible! Focus on interview prep." : `Estimated ${estimateDaysToEligible(selectedCompany)} days to become eligible`)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(((selectedCompany as any).nextActions || generateActions(selectedCompany)) as string[]).slice(0, 4).map((action) => (
                      <span key={action} className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-[#6C4CF1] shadow-sm border border-[rgba(108,76,241,0.1)]">{action}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => navigate(`/app/resume-analyzer?${companySearchParams(selectedCompany)}`)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] py-3 text-sm font-semibold text-white shadow-lg shadow-[#6C4CF1]/20 transition hover:shadow-xl"
                >
                  <FileText size={15} /> Improve Resume
                </button>
                <button
                  onClick={() => navigate(`/app/student/coding-progress?${companySearchParams(selectedCompany)}`)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] py-3 text-sm font-semibold text-white shadow-lg shadow-[#3B82F6]/20 transition hover:shadow-xl"
                >
                  <Code2 size={15} /> Start Coding
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => navigate(`/app/student/mock-interviews?${companySearchParams(selectedCompany)}`)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-[#E8ECF1] py-3 text-sm font-semibold text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]"
                  >
                    <Video size={15} /> Mock Interview
                  </button>
                  <button
                    onClick={() => navigate(`/app/student/ai-tutor?${companySearchParams(selectedCompany)}`)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-[#E8ECF1] py-3 text-sm font-semibold text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]"
                  >
                    <Target size={15} /> Learning Roadmap
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </>
  );
}

// =====================================================
// Applications
// =====================================================

const applicationsData = [
  { company: "Google", role: "SDE-1", applied: "Jul 1, 2025", stage: "Resume Screening", nextStep: "Online Assessment", priority: "High", logo: "G" },
  { company: "Stripe", role: "Backend Engineer", applied: "Jun 25, 2025", stage: "Technical Interview", nextStep: "Interview on Jul 10", priority: "High", logo: "S" },
  { company: "Microsoft", role: "SWE", applied: "Jun 20, 2025", stage: "Application Sent", nextStep: "Awaiting Response", priority: "Medium", logo: "M" },
  { company: "Amazon", role: "SDE-1", applied: "Jun 15, 2025", stage: "Online Assessment", nextStep: "Complete by Jul 5", priority: "High", logo: "A" },
  { company: "Adobe", role: "SDE-1", applied: "Jun 10, 2025", stage: "Application Sent", nextStep: "Awaiting Response", priority: "Medium", logo: "A" },
];

const appStats = [
  { label: "Active Applications", value: "5", color: "#6C4CF1" },
  { label: "In Progress", value: "3", color: "#3B82F6" },
  { label: "Interviews", value: "1", color: "#22C55E" },
  { label: "Offers", value: "0", color: "#F59E0B" },
];

export function StudentApplications() {
  return (
    <PageShell title="Applications" subtitle="Track all your job applications and interview stages.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {appStats.map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <p className="text-sm font-medium text-[#6B7280]">{kpi.label}</p>
            <p className="mt-2 text-[32px] font-bold tracking-tight text-[#111827]" style={{ color: kpi.color }}>{kpi.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#6C4CF1]">TRACKER</p>
            <h3 className="mt-1 text-xl font-bold text-[#111827]">Application Pipeline</h3>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-xl border border-[#E8ECF1] px-4 py-2 text-xs font-semibold text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]">
              <Search size={13} /> Filter
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-[#6C4CF1]/20 transition hover:shadow-xl">
              <ExternalLink size={13} /> Track New
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {applicationsData.map((a, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-[#E8ECF1] px-5 py-4 transition hover:border-[#6C4CF1]/20 hover:bg-[#F5F7FA]">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] text-sm font-bold text-white">
                {a.logo}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-[#111827]">{a.company}</p>
                  <span className="rounded bg-[#F3F4F6] px-1.5 py-0.5 text-[10px] font-medium text-[#6B7280]">{a.role}</span>
                </div>
                <p className="mt-0.5 text-xs text-[#6B7280]">Applied: {a.applied} • Next: {a.nextStep}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-semibold text-[#111827]">{a.stage}</p>
                  <p className="text-[10px] text-[#6B7280]">Current Stage</p>
                </div>
                <span className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                  a.priority === "High" ? "bg-[#FEE2E2] text-[#EF4444]" : "bg-[#FEF3C7] text-[#F59E0B]"
                )}>{a.priority}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}

// =====================================================
// Page Shell
// =====================================================

function PageShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6C4CF1]">PLACEMENTS / {title.replace(" ", " ").toUpperCase()}</p>
          <h2 className="mt-1 text-[28px] font-bold tracking-tight text-[#111827]">{title}</h2>
          <p className="mt-2 text-sm text-[#6B7280]">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-xl border border-[#E8ECF1] px-4 py-2 text-xs font-semibold text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]">
            <Search size={13} /> Filter
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-[#E8ECF1] px-4 py-2 text-xs font-semibold text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]">
            <Download size={13} /> Export
          </button>
        </div>
      </div>
      {children}
    </motion.div>
  );
}
