import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity, AlertCircle, Award, BookOpen, Brain, CalendarDays, CheckCircle2,
  ChevronRight, ChevronsDown, ChevronsUp, Clock, Code2, Download, Edit3,
  ExternalLink, FileText, GitBranch, Globe, GraduationCap, Loader2,
  RefreshCw, Search, Sparkles, Star, Target, Timer, TrendingUp, Trophy,
  Users, Video, X,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { Card } from "../../components/ui/Card";
import { cn } from "../../utils/cn";
import type {
  CodingProgressData, GitHubRepo, GitHubStats, LeetCodeStats,
  LeetCodeSubmission,
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
  if (!lc && !gh) return [{
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

export function StudentCodingProgress() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: codingData, isLoading: codingLoading } = useQuery<CodingProgressData>({
    queryKey: ["coding-progress"],
    queryFn: async () => (await api.get("/student/coding-progress")).data,
    staleTime: 30_000,
    retry: 1,
  });

  const { data: profile } = useQuery({
    queryKey: ["student-profile"],
    queryFn: async () => (await api.get("/student/profile")).data,
    staleTime: 30_000,
    retry: 1,
  });

  const syncMutation = useMutation({
    mutationFn: async () => (await api.post("/student/coding-progress/sync")).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coding-progress"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "student"] });
    },
  });

  const handleSync = useCallback(() => {
    syncMutation.mutate();
  }, [syncMutation]);

  const data = codingData;

  const links = {
    githubUrl: data?.github_url || profile?.github_url || null,
    leetcodeUrl: data?.leetcode_url || profile?.leetcode_url || null,
    linkedinUrl: data?.linkedin_url || profile?.linkedin_url || null,
  };

  console.log("Profile links from API:", {
    githubUrl: links.githubUrl,
    leetcodeUrl: links.leetcodeUrl,
    linkedinUrl: links.linkedinUrl,
  });

  const hasLinks = links.githubUrl || links.leetcodeUrl || links.linkedinUrl;

  if (codingLoading) return <LoadingSkeleton />;

  const lc = data?.leetcode_stats;
  const gh = data?.github_stats;
  const li = data?.linkedin_status;
  const insights = generateInsights(data || {} as CodingProgressData);

  const weeklyData = lc?.recent_submissions?.length
    ? lc.recent_submissions.slice(0, 7).map((s, i) => ({
        day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i % 7],
        submissions: 1,
      }))
    : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#6C4CF1]/15 bg-[#6C4CF1]/5 px-3.5 py-1.5 text-xs font-semibold text-[#6C4CF1]">
            <Code2 size={13} /> CODING PROGRESS
          </div>
          <h2 className="text-[28px] font-bold tracking-tight text-[#111827]">Coding Progress</h2>
          <p className="mt-1 text-sm text-[#6B7280]">Real-time LeetCode + GitHub activity from your profile links</p>
        </div>
        <div className="flex items-center gap-3">
          {data?.last_synced_at && (
            <span className="flex items-center gap-1.5 text-xs text-[#6B7280]">
              <Clock size={12} />
              Synced {formatRelativeTime(data.last_synced_at)}
            </span>
          )}
          <button
            onClick={handleSync}
            disabled={syncMutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#6C4CF1]/25 transition hover:shadow-xl disabled:opacity-60"
          >
            {syncMutation.isPending ? (
              <><Loader2 size={15} className="animate-spin" /> Syncing...</>
            ) : (
              <><RefreshCw size={15} /> Sync Now</>
            )}
          </button>
        </div>
      </div>

      {/* Error / empty state */}
      {!hasLinks && !codingLoading && (
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#FEF3C7] text-[#F59E0B]">
            <AlertCircle size={28} />
          </div>
          <h3 className="text-lg font-bold text-[#111827]">No Profile Links Found</h3>
          <p className="mt-2 text-sm text-[#6B7280]">Connect your GitHub, LeetCode, and LinkedIn in your profile to track coding progress.</p>
          <button
            onClick={() => navigate("/app/student/profile")}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#6C4CF1] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5B3FE0]"
          >
            <Edit3 size={14} /> Go to Profile
          </button>
        </Card>
      )}

      {syncMutation.isError && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#F59E0B]/30 bg-[#FEF3C7] px-5 py-3 text-sm font-semibold text-[#F59E0B]">
          <AlertCircle size={17} /> Unable to sync now, showing last saved data.
        </div>
      )}

      {(lc || gh || syncMutation.data?.data) && (
        <>
          {/* LeetCode Overview */}
          {lc && (
            <Card className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#F59E0B]">LEETCODE</p>
                  <h3 className="mt-1 text-xl font-bold text-[#111827]">Solved Problems</h3>
                </div>
                {links.leetcodeUrl && (
                  <a href={links.leetcodeUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-[#E8ECF1] px-4 py-2 text-xs font-semibold text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]">
                    <ExternalLink size={13} /> Open Profile
                  </a>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-5">
                {[
                  { label: "Total Solved", value: lc.total_solved, color: "#6C4CF1" },
                  { label: "Easy", value: lc.easy_solved, color: "#22C55E" },
                  { label: "Medium", value: lc.medium_solved, color: "#3B82F6" },
                  { label: "Hard", value: lc.hard_solved, color: "#EF4444" },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-xl bg-[#F5F7FA] p-4">
                    <p className="text-xs font-medium text-[#6B7280]">{kpi.label}</p>
                    <p className="mt-1 text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
                    <div className="mt-2">
                      <ProgressBar value={kpi.value} max={lc.total_solved || 1} color={kpi.color} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-6 text-sm">
                {lc.ranking != null && lc.ranking > 0 && (
                  <div className="flex items-center gap-2">
                    <Trophy size={15} className="text-[#F59E0B]" />
                    <span className="text-[#6B7280]">Ranking: <strong className="text-[#111827]">#{lc.ranking.toLocaleString()}</strong></span>
                  </div>
                )}
                {lc.reputation != null && (
                  <div className="flex items-center gap-2">
                    <Star size={15} className="text-[#F59E0B]" />
                    <span className="text-[#6B7280]">Reputation: <strong className="text-[#111827]">{lc.reputation}</strong></span>
                  </div>
                )}
                {lc.contest_rating != null && (
                  <div className="flex items-center gap-2">
                    <TrendingUp size={15} className="text-[#F59E0B]" />
                    <span className="text-[#6B7280]">Contest Rating: <strong className="text-[#111827]">{lc.contest_rating}</strong></span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* GitHub Activity */}
          {gh && (
            <Card className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#111827]">GITHUB</p>
                  <h3 className="mt-1 text-xl font-bold text-[#111827]">Activity Overview</h3>
                </div>
                {links.githubUrl && (
                  <a href={links.githubUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-[#E8ECF1] px-4 py-2 text-xs font-semibold text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]">
                    <ExternalLink size={13} /> Open Profile
                  </a>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-3 mb-5">
                {[
                  { label: "Public Repos", value: gh.public_repos, color: "#6C4CF1" },
                  { label: "Followers", value: gh.followers, color: "#3B82F6" },
                  { label: "Following", value: gh.following, color: "#22C55E" },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-xl bg-[#F5F7FA] p-4">
                    <p className="text-xs font-medium text-[#6B7280]">{kpi.label}</p>
                    <p className="mt-1 text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
                  </div>
                ))}
              </div>

              {gh.languages && Object.keys(gh.languages).length > 0 && (
                <div className="mb-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Top Languages</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(gh.languages)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 6)
                      .map(([lang, count]) => (
                        <span key={lang} className="rounded-lg bg-[#6C4CF1]/10 px-3 py-1.5 text-xs font-medium text-[#6C4CF1]">
                          {lang} ({count})
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {gh.recent_repos && gh.recent_repos.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Recently Updated Repos</p>
                  <div className="space-y-2">
                    {gh.recent_repos.slice(0, 5).map((repo: GitHubRepo, i: number) => (
                      <a key={i} href={repo.html_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-xl border border-[#E8ECF1] px-4 py-3 transition hover:border-[#6C4CF1]/20 hover:bg-[#F5F7FA]">
                        <div className="flex items-center gap-3 min-w-0">
                          <GitBranch size={14} className="shrink-0 text-[#6B7280]" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#111827] truncate">{repo.name}</p>
                            {repo.description && <p className="text-xs text-[#6B7280] truncate">{repo.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {repo.language && (
                            <span className="text-xs font-medium text-[#6B7280]">{repo.language}</span>
                          )}
                          <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                            <Star size={12} /> {repo.stars}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Coding Consistency */}
          <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
            <Card className="p-6">
              <div className="mb-4">
                <p className="text-sm font-semibold text-[#6C4CF1]">ACTIVITY</p>
                <h3 className="mt-1 text-lg font-bold text-[#111827]">Recent GitHub Events ({gh?.recent_activity_count || 0})</h3>
              </div>
              {gh?.last_active_date && (
                <p className="mb-4 text-xs text-[#6B7280]">Last active: {formatRelativeTime(gh.last_active_date)}</p>
              )}
              {gh && gh.recent_activity_count > 0 ? (
                <div className="flex items-end gap-2" style={{ height: 120 }}>
                  {Array.from({ length: Math.min(gh.recent_activity_count, 10) }).map((_, i) => {
                    const h = Math.max(10, 100 - i * 8);
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-[#6C4CF1] to-[#8B5CF6] transition-all hover:opacity-80"
                          style={{ height: `${h}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-24 text-sm text-[#6B7280]">
                  No recent activity data available
                </div>
              )}
            </Card>

            <Card className="p-6">
              <div className="mb-4">
                <p className="text-sm font-semibold text-[#6C4CF1]">SUBMISSIONS</p>
                <h3 className="mt-1 text-lg font-bold text-[#111827]">Recent LeetCode</h3>
              </div>
              {lc?.recent_submissions && lc.recent_submissions.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {lc.recent_submissions.map((sub: LeetCodeSubmission, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-[#F5F7FA] px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {sub.status === "Accepted" ? (
                          <CheckCircle2 size={13} className="shrink-0 text-[#22C55E]" />
                        ) : (
                          <X size={13} className="shrink-0 text-[#EF4444]" />
                        )}
                        <span className="text-xs font-medium text-[#111827] truncate">{sub.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-medium text-[#6B7280]">{sub.lang}</span>
                        <span className={cn(
                          "text-[10px] font-semibold",
                          sub.status === "Accepted" ? "text-[#22C55E]" : "text-[#EF4444]",
                        )}>{sub.status === "Accepted" ? "AC" : "WA"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-24 text-sm text-[#6B7280]">
                  No recent submissions
                </div>
              )}
            </Card>
          </div>

          {/* Profile Links Status */}
          <Card className="p-6">
            <div className="mb-4">
              <p className="text-sm font-semibold text-[#6C4CF1]">PROFILES</p>
              <h3 className="mt-1 text-lg font-bold text-[#111827]">Connected Platforms</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: "GitHub",
                  connected: !!links.githubUrl,
                  url: links.githubUrl,
                  username: data?.github_username,
                  icon: GitBranch,
                  color: "#111827",
                },
                {
                  label: "LeetCode",
                  connected: !!links.leetcodeUrl,
                  url: links.leetcodeUrl,
                  username: data?.leetcode_username,
                  icon: Code2,
                  color: "#F59E0B",
                },
                {
                  label: "LinkedIn",
                  connected: !!links.linkedinUrl,
                  url: links.linkedinUrl,
                  username: null,
                  icon: Globe,
                  color: "#0A66C2",
                },
              ].map((p) => (
                <div key={p.label} className={cn(
                  "rounded-xl border p-4 transition",
                  p.connected ? "border-[#22C55E]/30 bg-[#F0FDF4]" : "border-[#E8ECF1] bg-white",
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <p.icon size={18} style={{ color: p.color }} />
                      <span className="text-sm font-bold text-[#111827]">{p.label}</span>
                    </div>
                    {p.connected ? (
                      <CheckCircle2 size={16} className="text-[#22C55E]" />
                    ) : (
                      <div className="h-3 w-3 rounded-full bg-[#E5E7EB]" />
                    )}
                  </div>
                  {p.connected ? (
                    <div className="space-y-2">
                      {p.username && <p className="text-xs text-[#6B7280]">@{p.username}</p>}
                      {p.url && (
                        <a href={p.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-[#E8ECF1] px-3 py-1.5 text-xs font-semibold text-[#6C4CF1] transition hover:bg-[#F5F7FA]">
                          <ExternalLink size={12} /> Open Profile
                        </a>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => navigate("/app/student/profile")}
                      className="text-xs font-semibold text-[#6C4CF1] hover:underline"
                    >
                      + Add in Profile
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* AI Insights */}
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Brain size={18} className="text-[#6C4CF1]" />
              <p className="text-sm font-semibold text-[#6C4CF1]">AI INSIGHTS</p>
            </div>
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm",
                    insight.type === "positive" && "border-[#22C55E]/30 bg-[#F0FDF4] text-[#16A34A]",
                    insight.type === "warning" && "border-[#F59E0B]/30 bg-[#FEF3C7] text-[#D97706]",
                    insight.type === "info" && "border-[#3B82F6]/30 bg-[#EFF6FF] text-[#2563EB]",
                  )}
                >
                  {insight.message}
                </div>
              ))}
            </div>
          </Card>

          {/* Scores Summary */}
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Coding Score", value: data?.coding_score || 0 },
              { label: "Placement Readiness", value: data?.placement_readiness_score || 0 },
            ].map((score) => (
              <Card key={score.label} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-[#6B7280]">{score.label}</p>
                  <span className="text-xl font-bold" style={{ color: getScoreColor(score.value) }}>
                    {score.value}%
                  </span>
                </div>
                <ProgressBar value={score.value} />
              </Card>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}

// =====================================================
// Company Eligibility
// =====================================================

const companyEligibilityData = [
  { name: "Google", eligible: true, criteria: "CGPA ≥ 8.0", cgpaReq: 8.0, role: "SDE-1", deadline: "Jul 15, 2025", package: "₹42 LPA", status: "Applied" },
  { name: "Microsoft", eligible: true, criteria: "CGPA ≥ 7.5", cgpaReq: 7.5, role: "SWE", deadline: "Jul 20, 2025", package: "₹38 LPA", status: "Eligible" },
  { name: "Amazon", eligible: true, criteria: "CGPA ≥ 7.0", cgpaReq: 7.0, role: "SDE-1", deadline: "Jul 25, 2025", package: "₹35 LPA", status: "Eligible" },
  { name: "Stripe", eligible: true, criteria: "CGPA ≥ 8.5", cgpaReq: 8.5, role: "Backend Eng", deadline: "Aug 1, 2025", package: "₹45 LPA", status: "Shortlisted" },
  { name: "Atlassian", eligible: false, criteria: "CGPA ≥ 9.0", cgpaReq: 9.0, role: "SDE", deadline: "Aug 5, 2025", package: "₹30 LPA", status: "Not Eligible" },
  { name: "Adobe", eligible: true, criteria: "CGPA ≥ 7.5", cgpaReq: 7.5, role: "SDE-1", deadline: "Aug 10, 2025", package: "₹28 LPA", status: "Eligible" },
  { name: "Uber", eligible: false, criteria: "CGPA ≥ 8.5 + Backlog=0", cgpaReq: 8.5, role: "SDE", deadline: "Aug 15, 2025", package: "₹40 LPA", status: "Not Eligible" },
  { name: "Flipkart", eligible: true, criteria: "CGPA ≥ 7.0", cgpaReq: 7.0, role: "SDE-1", deadline: "Aug 20, 2025", package: "₹25 LPA", status: "Eligible" },
];

export function StudentCompanyEligibility() {
  return (
    <PageShell title="Company Eligibility" subtitle="Check your eligibility for top companies based on academic criteria.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {[
          { label: "Eligible Companies", value: "24", color: "#22C55E" },
          { label: "Applied", value: "1", color: "#3B82F6" },
          { label: "Shortlisted", value: "1", color: "#6C4CF1" },
          { label: "Not Eligible", value: "2", color: "#EF4444" },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <p className="text-sm font-medium text-[#6B7280]">{kpi.label}</p>
            <p className="mt-2 text-[32px] font-bold tracking-tight text-[#111827]" style={{ color: kpi.color }}>{kpi.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#6C4CF1]">COMPANIES</p>
            <h3 className="mt-1 text-xl font-bold text-[#111827]">Company Eligibility Check</h3>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-[#F5F7FA] px-3 py-1.5 text-xs text-[#6B7280]">
            <span className="font-semibold text-[#111827]">Your CGPA: 8.45</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E8ECF1] text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                <th className="py-3 pr-4">Company</th>
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 pr-4">Criteria</th>
                <th className="py-3 pr-4">Package</th>
                <th className="py-3 pr-4">Deadline</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {companyEligibilityData.map((c) => (
                <tr key={c.name} className="border-b border-[#F3F4F6] transition hover:bg-[#F5F7FA]">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <div className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold text-white ${
                        c.eligible ? "bg-[#22C55E]" : "bg-[#EF4444]"
                      }`}>{c.name[0]}</div>
                      <span className="font-semibold text-[#111827]">{c.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-[#6B7280]">{c.role}</td>
                  <td className="py-3.5 pr-4">
                    <span className={cn(
                      "text-xs font-semibold",
                      c.cgpaReq <= 8.45 ? "text-[#22C55E]" : "text-[#EF4444]"
                    )}>{c.criteria}</span>
                  </td>
                  <td className="py-3.5 pr-4 font-semibold text-[#111827]">{c.package}</td>
                  <td className="py-3.5 pr-4 text-xs text-[#6B7280]">{c.deadline}</td>
                  <td className="py-3.5">
                    <span className={cn(
                      "rounded-full px-3 py-0.5 text-xs font-semibold",
                      c.status === "Eligible" ? "bg-[#DCFCE7] text-[#22C55E]" :
                      c.status === "Applied" ? "bg-[#DBEAFE] text-[#3B82F6]" :
                      c.status === "Shortlisted" ? "bg-[#FEF3C7] text-[#F59E0B]" :
                      "bg-[#FEE2E2] text-[#EF4444]"
                    )}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
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
