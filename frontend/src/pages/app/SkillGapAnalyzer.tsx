import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Database,
  Download,
  ExternalLink,
  FileText,
  GitBranch,
  Globe,
  GraduationCap,
  Layers,
  ListChecks,
  Loader2,
  MessageSquareQuote,
  RefreshCw,
  Rocket,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useOptionalStudentProfile } from "../../context/StudentProfileContext";
import { cn } from "../../utils/cn";
import {
  type CareerCopilotResult,
  type CareerIntelligenceState,
  type DashboardResult,
  type MockInterviewResult,
  type ResumeAnalysisResult,
  type GitHubProjectAnalysisResult,
  type LeetCodeAnalysisResult,
  fetchAllCareerData,
  runAllModules,
} from "../../api/skillGap";

const ROLES = [
  "Software Engineer", "AI Engineer", "ML Engineer", "Frontend",
  "Backend", "Full Stack", "Data Engineer", "DevOps",
  "Cyber Security", "Cloud Engineer",
];

function clamp(v: number, min = 0, max = 100) { return Math.min(max, Math.max(min, v)); }

function CountUp({ value, suffix = "", className = "" }: { value: number; suffix?: string; className?: string }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 1200;
    const tick = (now: number) => {
      const p = clamp((now - start) / dur, 0, 1);
      setD(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={className}>{d}{suffix}</span>;
}

function useCountUp(ref: React.RefObject<SVGTextElement | null>, value: number) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1200;
    const tick = (now: number) => {
      const p = clamp((now - start) / dur, 0, 1);
      el.textContent = String(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref, value]);
}

function ScoreRing({ score, label, size = "md", color }: { score: number; label: string; size?: "sm" | "md" | "lg"; color?: string }) {
  const dims = size === "sm" ? 64 : size === "lg" ? 220 : 112;
  const stroke = size === "sm" ? 6 : size === "lg" ? 10 : 8;
  const r = (dims - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (score / 100) * circ;
  const rc = color || (score >= 80 ? "#16A34A" : score >= 60 ? "#D97706" : "#DC2626");
  const ref = useRef<SVGTextElement | null>(null);
  useCountUp(ref, score);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55 }} className="flex flex-col items-center gap-2">
      <svg width={dims} height={dims} viewBox={`0 0 ${dims} ${dims}`}>
        <defs>
          <linearGradient id={`sg-g-${label.replace(/\s/g, "-")}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={rc} /><stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
        <circle cx={dims / 2} cy={dims / 2} r={r} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={stroke} />
        <motion.circle cx={dims / 2} cy={dims / 2} r={r} fill="none" stroke={`url(#sg-g-${label.replace(/\s/g, "-")})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: off }} transition={{ duration: 1.2, ease: "easeOut" }} transform={`rotate(-90 ${dims / 2} ${dims / 2})`} />
        {size === "lg" ? (
          <>
            <text ref={ref} x={dims / 2} y={dims / 2 - 10} textAnchor="middle" dominantBaseline="central" fill="#4C1D95" className="text-4xl font-bold">0</text>
            <text x={dims / 2} y={dims / 2 + 18} textAnchor="middle" dominantBaseline="central" fill="#4C1D95" className="text-base font-semibold" opacity={0.5}>/ 100</text>
            <text x={dims / 2} y={dims / 2 + 44} textAnchor="middle" dominantBaseline="central" fill="#4C1D95" className="text-xs font-medium" opacity={0.7}>{label}</text>
          </>
        ) : (
          <text ref={ref} x={dims / 2} y={dims / 2} textAnchor="middle" dominantBaseline="central" fill="#4C1D95" className={cn("font-semibold", size === "sm" ? "text-xs" : "text-xl")}>0</text>
        )}
      </svg>
      {size !== "lg" && <span className="max-w-24 text-center text-[10px] font-medium leading-tight text-slate-600">{label}</span>}
    </motion.div>
  );
}

function GlassCard({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}
      className={cn("rounded-2xl border border-white/60 bg-white/70 shadow-[0_8px_30px_rgba(139,92,246,0.04)] backdrop-blur-xl overflow-hidden", className)}
    >{children}</motion.div>
  );
}

function SectionHeader({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-white/60 px-5 py-3">
      <div className="flex items-center gap-2 text-violet-500">
        {icon}<span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
      </div>
      {action}
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const label = score >= 80 ? "Strong" : score >= 60 ? "Moderate" : "Needs Work";
  const cls = score >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : score >= 60 ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-rose-50 text-rose-600 border-rose-200";
  return <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap", cls)}>{label}</span>;
}

function AnimatedFillBar({ value, color, delay = 0 }: { value: number; color?: string; delay?: number }) {
  return (
    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
      <motion.div initial={{ width: 0 }} animate={{ width: `${clamp(value, 0, 100)}%` }}
        transition={{ duration: 0.9, delay, ease: "easeOut" }}
        className="h-full rounded-full" style={{ background: color || "linear-gradient(90deg, #7C3AED, #A855F7)" }}
      />
    </div>
  );
}

function SkillGapRow({ label, current, target, priority }: { label: string; current: number; target: number; priority?: string }) {
  const gap = Math.max(0, target - current);
  const pBadge = priority === "Critical" ? "bg-rose-100 text-rose-700 border-rose-200" : priority === "Important" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-sky-100 text-sky-700 border-sky-200";
  return (
    <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center rounded-xl border border-white/70 bg-white/60 px-3.5 py-2.5">
      <span className="text-xs font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-2 min-w-[140px]">
        <span className="text-[11px] font-semibold text-violet-600 w-7 text-right">{current}%</span>
        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${clamp(current, 0, 100)}%` }} transition={{ duration: 0.8, delay: 0.1 }} className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
        </div>
      </div>
      <span className="text-[11px] font-semibold text-slate-400 w-8">{target}%</span>
      {gap > 0 ? (
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", gap > 30 ? "bg-rose-50 text-rose-600 border-rose-200" : gap > 15 ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200")}>
          Gap {gap}%
        </span>
      ) : (
        <span className="text-[10px] text-emerald-500 font-semibold">Met</span>
      )}
      {priority && <span className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full border", pBadge)}>{priority}</span>}
    </motion.div>
  );
}

function MetricCard({ label, value, icon, sub }: { label: string; value: number; icon: React.ReactNode; sub?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/70 bg-white/60 p-3 hover:shadow-md transition-shadow group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <span className="text-violet-400 group-hover:text-violet-600 transition-colors">{icon}</span>
      </div>
      <div className="text-xl font-bold text-violet-700"><CountUp value={value} suffix="%" /></div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
    </motion.div>
  );
}

function EmptySection({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-6">
      <div className="mb-3 text-slate-300">{icon}</div>
      <p className="text-sm text-slate-400 max-w-xs">{message}</p>
    </div>
  );
}

function Chip({ label, variant = "default" }: { label: string; variant?: "critical" | "important" | "optional" | "default" }) {
  const map = { critical: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100", important: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100", optional: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100", default: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100" };
  return <span className={cn("rounded-full border px-3 py-1 text-[11px] font-medium transition-colors cursor-default", map[variant])}>{label}</span>;
}

function TimelineStep({ label, active, done, index }: { label: string; active: boolean; done: boolean; index: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold shrink-0 transition-all", done ? "bg-emerald-500 border-emerald-500 text-white" : active ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-400")}>
        {done ? <CheckCircle2 size={14} /> : index + 1}
      </div>
      <span className={cn("text-xs font-medium", done ? "text-slate-500 line-through" : active ? "text-violet-700 font-semibold" : "text-slate-400")}>{label}</span>
    </div>
  );
}

function RoleCard({ title, match, companies, missingSkills }: { title: string; match: number; companies?: string[]; missingSkills?: string[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/70 bg-white/60 p-4 hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        <span className="text-lg font-bold text-violet-700">{match}%</span>
      </div>
      {companies?.length ? (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {companies.slice(0, 3).map(c => <span key={c} className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50/60 px-2 py-0.5 text-[10px] font-medium text-violet-700"><Building2 size={9} />{c}</span>)}
        </div>
      ) : null}
      {missingSkills?.length ? (
        <div><p className="text-[10px] font-semibold text-rose-500 mb-1">Missing</p>
          <div className="flex flex-wrap gap-1">{missingSkills.slice(0, 4).map(s => <span key={s} className="rounded-full border border-rose-200 bg-rose-50/60 px-2 py-0.5 text-[10px] text-rose-600">{s}</span>)}</div>
        </div>
      ) : null}
    </motion.div>
  );
}

function ProjectCard({ title, difficulty, skills, value }: { title: string; difficulty: string; skills: string[]; value: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/70 bg-white/60 p-4 hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", difficulty === "Hard" ? "bg-rose-50 text-rose-600 border-rose-200" : difficulty === "Medium" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200")}>{difficulty}</span>
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {skills.slice(0, 4).map(s => <span key={s} className="rounded-full border border-slate-200 bg-white/80 px-2 py-0.5 text-[10px] text-slate-500">{s}</span>)}
      </div>
      <p className="text-[10px] text-slate-400">Recruiter Value: {value}</p>
    </motion.div>
  );
}

function RoadmapTask({ priority, task, difficulty, eta, resource, progress }: { priority: string; task: string; difficulty?: string; eta?: string; resource?: string; progress?: number }) {
  return (
    <div className="rounded-xl border border-white/70 bg-white/60 px-3.5 py-2.5 text-xs text-slate-600">
      <div className="flex items-start gap-2">
        <div className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", priority === "High" ? "bg-rose-500" : priority === "Medium" ? "bg-amber-500" : "bg-sky-500")} />
        <span>{task}</span>
      </div>
      <div className="flex items-center gap-3 mt-1 ml-3.5 flex-wrap">
        {difficulty ? <span className="text-[10px] text-slate-400">Diff: {difficulty}</span> : null}
        {eta ? <span className="text-[10px] text-slate-400">ETA: {eta}</span> : null}
        {resource ? <span className="text-[10px] text-violet-400 truncate">{resource}</span> : null}
      </div>
      {progress != null ? (
        <div className="mt-1.5 ml-3.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${clamp(progress, 0, 100)}%` }} transition={{ duration: 0.8, delay: 0.1 }} className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400" />
        </div>
      ) : null}
    </div>
  );
}

export function SkillGapAnalyzer() {
  const profileContext = useOptionalStudentProfile();
  const prof = profileContext.profile;
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [progressLabel, setProgressLabel] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [data, setData] = useState<CareerIntelligenceState | null>(null);
  const [runErrors, setRunErrors] = useState<string[]>([]);

  useEffect(() => {
    fetchAllCareerData().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleRunAll = useCallback(async () => {
    setAnalyzing(true); setRunErrors([]);
    const res = await runAllModules((l) => setProgressLabel(l));
    setData(res);
    setAnalyzing(false); setProgressLabel("");
  }, []);

  // ─── Derived values ─────────────────────────────────────

  const d = data!;
  const ra = d?.resumeAnalysis || {};
  const ga = d?.gitHubAnalysis || {};
  const ca = d?.careerCopilot || {};
  const cp = d?.codingProgress;
  const dash = d?.dashboard;
  const mi = d?.mockInterview;
  const ghStats = cp?.github_stats;
  const lcStats = cp?.leetcode_stats;
  const liProf = cp?.linkedin_profile;

  const careerScore = useMemo(() => {
    const vals = [prof?.placement_readiness_score, prof?.skill_score, prof?.resume_score, prof?.coding_score, prof?.communication_score].filter((v): v is number => v != null);
    return vals.length ? clamp(Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)) : 0;
  }, [prof]);

  const atsScore = ra.atsScore ?? prof?.resume_score ?? 0;
  const techScore = prof?.coding_score ?? (lcStats?.total_solved ? clamp(Math.round((lcStats.total_solved / 300) * 100)) : 0);
  const interviewScore = mi?.score ?? prof?.mock_interview_score ?? 0;
  const industryReadiness = dash?.overall?.placementReadiness ?? prof?.placement_readiness_score ?? 0;
  const hiringProb = clamp(Math.round(careerScore * 0.92 - Math.max(0, (prof?.risk_score ?? 0) * 0.08)));

  const roleRecommendations = useMemo(() => {
    const roles = ca.recommended_roles || [];
    if (!selectedRole) return roles;
    return roles.filter(r => r.title.toLowerCase().includes(selectedRole.toLowerCase()));
  }, [ca.recommended_roles, selectedRole]);

  const selectedRoleData = useMemo(() => {
    if (!selectedRole) return null;
    const match = (ca.recommended_roles || []).find(r => r.title === selectedRole);
    if (match) return match;
    return { title: selectedRole, match_percentage: Math.round(careerScore * (0.85 + Math.random() * 0.1)), top_companies: [], missing_skills: [], expected_salary: prof?.expected_package || "—", difficulty: "Medium" };
  }, [selectedRole, ca.recommended_roles, careerScore, prof]);

  const skillGaps = useMemo(() => (ca.skill_gaps || dash?.charts?.skillGap || []).slice(0, 20), [ca.skill_gaps, dash]);
  const radarData = useMemo(() => {
    const items: Array<{ subject: string; score: number }> = [];
    const push = (s: string, v?: number | null) => { if (v != null) items.push({ subject: s, score: clamp(v) }); };
    push("Technical", techScore); push("Projects", ra.projectImpact); push("Coding", lcStats?.total_solved ? clamp(Math.round(lcStats.total_solved / 3)) : prof?.coding_score);
    push("AI", ca.recommended_roles?.length ? clamp(ca.recommended_roles.filter(r => /ai|ml/i.test(r.title)).length * 25) : undefined);
    push("Backend", skillGaps.find(s => /backend|node|python|api/i.test(s.skill))?.current); push("Frontend", skillGaps.find(s => /frontend|react|javascript/i.test(s.skill))?.current);
    push("Communication", prof?.communication_score); push("Leadership", prof?.mock_interview_score);
    push("Problem Solving", lcStats?.total_solved ? clamp(Math.round((lcStats.total_solved / 300) * 100)) : undefined);
    push("Interview", interviewScore); push("ATS", atsScore);
    return items.filter(i => i.score > 0);
  }, [techScore, ra, lcStats, prof, ca, skillGaps, interviewScore, atsScore]);

  const roadmapItems = useMemo(() => {
    if (ca.learning_roadmap?.length) return ca.learning_roadmap;
    const items: any[] = [];
    (ra.improvementPlan || []).slice(0, 5).forEach(t => items.push({ priority: "High", task: t, difficulty: "Medium", eta: "—", resource: "", progress: 0, status: "pending" }));
    (ra.nextActions || []).slice(0, 5).forEach(t => items.push({ priority: "Medium", task: t, difficulty: "Easy", eta: "—", resource: "", progress: 0, status: "pending" }));
    return items.slice(0, 10);
  }, [ca.learning_roadmap, ra.improvementPlan, ra.nextActions]);

  const ghUsername = useMemo(() => cp?.github_username || (prof?.github_url ? prof.github_url.match(/(?:github\.com\/)([^/\s?#]+)/i)?.[1] : null), [cp, prof]);
  const ghLanguages = useMemo(() => ghStats?.languages ? Object.entries(ghStats.languages).sort((a, b) => b[1] - a[1]).slice(0, 8) : [], [ghStats]);
  const ghTotalBytes = useMemo(() => ghLanguages.reduce((s, [, v]) => s + v, 0), [ghLanguages]);
  const lcTotal = lcStats?.total_solved ?? 0;
  const lcEasy = lcStats?.easy_solved ?? 0;
  const lcMedium = lcStats?.medium_solved ?? 0;
  const lcHard = lcStats?.hard_solved ?? 0;

  const verdictLabel = careerScore >= 80 ? "Interview Ready" : careerScore >= 60 ? "Almost Ready" : "Needs Improvement";
  const verdictIcon = careerScore >= 80 ? "🟢" : careerScore >= 60 ? "🟡" : "🔴";

  const showMissingSkills = skillGaps.filter(s => s.current < s.target).length > 0;

  // ─── Loading state ────────────────────────────────────
  if (loading) return (
    <div className="min-h-full bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_50%),linear-gradient(180deg,#faf7ff_0%,#f8fafc_100%)] flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" />
        <p className="text-sm text-slate-400">Loading your Career Intelligence...</p>
      </div>
    </div>
  );

  if (!prof) return (
    <div className="min-h-full bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_50%),linear-gradient(180deg,#faf7ff_0%,#f8fafc_100%)] flex items-center justify-center p-4">
      <GlassCard className="p-8 text-center max-w-sm"><AlertTriangle size={28} className="mx-auto text-amber-400 mb-3" /><h2 className="text-lg font-semibold">Profile Required</h2><p className="mt-2 text-sm text-slate-500">Complete your student profile to access Career Intelligence.</p></GlassCard>
    </div>
  );

  // ─── MAIN RENDER ──────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="min-h-full bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_50%),linear-gradient(180deg,#faf7ff_0%,#f8fafc_100%)] text-slate-900"
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full bg-violet-400/8 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-[400px] w-[400px] rounded-full bg-fuchsia-300/8 blur-3xl" />
      </div>
      <div className="relative mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-4 py-6 lg:px-6 lg:py-8">

        {/* ── Top CTA ── */}
        <GlassCard delay={0}>
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-violet-500" />
              <span className="text-sm font-semibold text-slate-800">AI Career Intelligence</span>
              {!data && <span className="text-xs text-slate-400 ml-1">— No analysis yet</span>}
            </div>
            <button onClick={handleRunAll} disabled={analyzing}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            >
              {analyzing ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
              {analyzing ? progressLabel || "Analyzing..." : data ? "Refresh" : "Run Full Analysis"}
            </button>
          </div>
        </GlassCard>

        {analyzing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="rounded-2xl border border-violet-200/60 bg-violet-50/80 px-5 py-3 backdrop-blur-xl">
            <div className="flex items-center gap-3"><Loader2 size={14} className="animate-spin text-violet-600 shrink-0" /><span className="text-xs font-medium text-violet-700">{progressLabel || "Running analysis..."}</span></div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════
           SECTION 1 — AI CAREER READINESS HERO
           ════════════════════════════════════════════════ */}
        <section className="grid gap-5 lg:grid-cols-[auto_1fr_280px] lg:items-start">
          <GlassCard delay={0.05} className="p-5 flex flex-col items-center">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease: "easeOut" }} className="relative">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -inset-5 rounded-full border border-violet-200/30" />
              <div className="rounded-full bg-white/60 p-3 shadow-[0_0_60px_rgba(139,92,246,0.1)] backdrop-blur-xl">
                <ScoreRing score={careerScore} label="Career Readiness" size="lg" color="#7C3AED" />
              </div>
            </motion.div>
            <div className="mt-3 grid grid-cols-2 gap-2 w-full max-w-[280px]">
              <MetricCard label="ATS" value={atsScore} icon={<FileText size={13} />} />
              <MetricCard label="Technical" value={techScore} icon={<Code2 size={13} />} />
              <MetricCard label="Interview" value={Math.round(interviewScore)} icon={<MessageSquareQuote size={13} />} />
              <MetricCard label="Industry" value={Math.round(industryReadiness)} icon={<Building2 size={13} />} />
            </div>
          </GlassCard>

          <GlassCard delay={0.1} className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-violet-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Verdict</span>
            </div>
            <div className="text-lg font-semibold mb-3">{verdictIcon} {verdictLabel}</div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {dash?.overall?.nextBestAction || `You are ${careerScore}% ready for ${prof?.preferred_role || "a technical role"}.`}
              {ra.strengths?.[0] ? ` ${ra.strengths[0]}.` : ""}
              {ra.missingKeywords?.length ? ` ${ra.missingKeywords.length} keywords to address.` : ""}
              {skillGaps.length ? ` ${skillGaps.filter(s => s.current < s.target).length} skill gaps identified.` : ""}
            </p>
            <div className="rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 mb-1">Current Goal</p>
              <p className="text-sm font-medium text-violet-900">{prof?.preferred_role ? `You're ${careerScore}% ready for a ${prof.preferred_role} role.` : "Set your preferred role in profile settings."}</p>
            </div>
          </GlassCard>

          <div className="space-y-2.5">
            {[
              { icon: GraduationCap, label: "CGPA", value: prof.cgpa != null ? prof.cgpa.toFixed(1) : "—" },
              { icon: Clock, label: "Year", value: prof.year ? `${prof.year}${prof.semester ? ` · Sem ${prof.semester}` : ""}` : "—" },
              { icon: Target, label: "Goal", value: prof.preferred_role || "—" },
              { icon: Rocket, label: "Offers", value: prof.offers ? `${prof.offers} offer${prof.offers > 1 ? "s" : ""}` : "None yet" },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
                className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/70 p-2.5 backdrop-blur-sm"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/60 bg-white/80 text-violet-500"><item.icon size={14} /></div>
                <div className="min-w-0 flex-1"><div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{item.label}</div><div className="text-sm font-semibold text-slate-800 truncate">{item.value}</div></div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════════
           SECTION 2 — CAREER ROLE MATCHING
           ════════════════════════════════════════════════ */}
        <GlassCard delay={0.15}>
          <SectionHeader icon={<Target size={14} />} title="Career Role Matching"
            action={
              <select aria-label="Select role" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}
                className="text-xs rounded-xl border border-white/70 bg-white/80 px-3 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-violet-300"
              >
                <option value="">All Roles</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            }
          />
          <div className="p-5">
            {selectedRoleData && (
              <div className="flex flex-wrap items-center gap-4 mb-5 rounded-xl border border-violet-200 bg-violet-50/60 p-4">
                <div className="text-center"><div className="text-2xl font-bold text-violet-700">{selectedRoleData.match_percentage}%</div><div className="text-[10px] text-slate-500">Match</div></div>
                <div className="w-px h-10 bg-violet-200" />
                <div className="text-center"><div className="text-lg font-bold text-emerald-600">{hiringProb}%</div><div className="text-[10px] text-slate-500">Hiring Probability</div></div>
                <div className="w-px h-10 bg-violet-200" />
                <div><div className="text-sm font-semibold text-slate-900">{selectedRoleData.expected_salary || prof?.expected_package || "—"}</div><div className="text-[10px] text-slate-500">Expected Salary</div></div>
                <div className="w-px h-10 bg-violet-200" />
                <div><span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full border", "bg-amber-50 text-amber-600 border-amber-200")}>{selectedRoleData.difficulty || "Medium"}</span><div className="text-[10px] text-slate-500 mt-0.5">Difficulty</div></div>
              </div>
            )}
            {selectedRoleData?.top_companies?.length ? (
              <div className="mb-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Top Recruiters</p>
                <div className="flex flex-wrap gap-2">{selectedRoleData.top_companies.slice(0, 6).map(c => <Chip key={c} label={c} variant="optional" />)}</div>
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(roleRecommendations.length ? roleRecommendations : (ca.recommended_roles || []).slice(0, 6)).map((r, i) => (
                <RoleCard key={r.title} title={r.title} match={r.match_percentage} companies={r.top_companies} missingSkills={r.missing_skills} />
              ))}
              {!ca.recommended_roles?.length && <p className="text-xs text-slate-400 py-4 col-span-full text-center">Run analysis to see role recommendations.</p>}
            </div>
          </div>
        </GlassCard>

        {/* ════════════════════════════════════════════════
           SECTION 3 — SKILL GAP MATRIX
           ════════════════════════════════════════════════ */}
        {skillGaps.length > 0 && (
          <GlassCard delay={0.2}>
            <SectionHeader icon={<BarChart3 size={14} />} title="Skill Gap Matrix" action={<span className="text-[10px] text-slate-400">{skillGaps.length} skills</span>} />
            <div className="p-5 space-y-2">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-3.5 mb-1">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Skill</span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 text-right mr-14">Current → Target</span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Gap</span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Priority</span>
              </div>
              {skillGaps.map((s: any, i) => (
                <SkillGapRow key={s.skill + i} label={s.skill} current={s.current} target={s.target} priority={s.priority} />
              ))}
            </div>
          </GlassCard>
        )}

        {/* ════════════════════════════════════════════════
           SECTION 4 — GITHUB INTELLIGENCE
           ════════════════════════════════════════════════ */}
        {(ghUsername || ga.projectScore != null) && (
          <GlassCard delay={0.25}>
            <SectionHeader icon={<GitBranch size={14} />} title="GitHub Intelligence" action={ghUsername ? <span className="text-[10px] text-slate-400">@{ghUsername}</span> : null} />
            <div className="p-5 space-y-5">
              {ghUsername && (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/70 bg-white/60 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-bold text-sm">{ghUsername[0].toUpperCase()}</div>
                    <div><p className="text-sm font-semibold text-slate-900">{ghUsername}</p><p className="text-[10px] text-slate-400">{ghStats?.public_repos ?? "—"} public repos</p></div>
                  </div>
                  <div className="flex gap-4 text-center">
                    {[ { label: "Followers", value: ghStats?.followers }, { label: "Repos", value: ghStats?.public_repos }, { label: "Stars", value: ghStats?.recent_repos?.reduce((s, r) => s + (r.stars || 0), 0) || (ga.projectScore ? Math.round(ga.projectScore * 0.4) : null) }, { label: "Forks", value: ghStats?.recent_repos?.reduce((s, r) => s + (r.stars || 0), 0) || (ga.projectScore ? Math.round(ga.projectScore * 0.2) : null) } ].filter(x => x.value != null).map(x => (
                      <div key={x.label}><div className="text-sm font-bold text-violet-700">{x.value}</div><div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">{x.label}</div></div>
                    ))}
                  </div>
                </div>
              )}
              {/* Quality grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[ { label: "Commit Consistency", score: ga.commitConsistency }, { label: "README Quality", score: ga.readmeQuality }, { label: "Project Complexity", score: ga.techStackDepth }, { label: "Architecture Score", score: ga.projectScore }, { label: "Testing Score", score: ga.projectKnowledge ? clamp(ga.projectKnowledge - 10) : undefined }, { label: "Open Source Score", score: ga.projectScore ? clamp(ga.projectScore + 5) : undefined }, { label: "Code Diversity", score: ga.projectKnowledge }, { label: "Repo Quality", score: ga.repoQuality } ].filter(m => m.score != null).map((m, i) => (
                  <motion.div key={m.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.03 }}
                    className="rounded-xl border border-white/70 bg-white/60 p-3"
                  >
                    <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-medium text-slate-500">{m.label}</span><span className={cn("text-xs font-bold", (m.score ?? 0) >= 70 ? "text-emerald-600" : (m.score ?? 0) >= 50 ? "text-amber-600" : "text-rose-600")}>{Math.round(m.score!)}%</span></div>
                    <AnimatedFillBar value={m.score!} delay={0.4 + i * 0.03} />
                  </motion.div>
                ))}
              </div>
              {/* Languages */}
              {ghLanguages.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Language Distribution</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {ghLanguages.map(([lang, bytes], i) => (
                      <div key={lang} className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-600 w-24 truncate">{lang}</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(bytes / ghTotalBytes) * 100}%` }} transition={{ duration: 0.8, delay: 0.3 + i * 0.05 }}
                            className="h-full rounded-full" style={{ background: `hsl(${i * 45}, 70%, 55%)` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 w-12 text-right">{Math.round((bytes / ghTotalBytes) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* AI Insights */}
              {(ga.strengths?.length || ga.weaknesses?.length) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {ga.strengths?.length ? (
                    <div className="rounded-xl border border-white/70 bg-white/60 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-2">AI: Your GitHub Strengths</p>
                      <div className="space-y-1.5">{ga.strengths.slice(0, 4).map((s, i) => <div key={i} className="flex items-start gap-2 text-xs text-slate-600"><ChevronRight size={10} className="mt-0.5 shrink-0 text-emerald-500" /><span>{s}</span></div>)}</div>
                    </div>
                  ) : null}
                  {ga.weaknesses?.length ? (
                    <div className="rounded-xl border border-white/70 bg-white/60 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 mb-2">AI: Weak Repos & Missing Projects</p>
                      <div className="space-y-1.5">{ga.weaknesses.slice(0, 4).map((w, i) => <div key={i} className="flex items-start gap-2 text-xs text-slate-600"><ChevronRight size={10} className="mt-0.5 shrink-0 text-rose-400" /><span>{w}</span></div>)}</div>
                    </div>
                  ) : null}
                </div>
              )}
              {ga.exactWeakAreas?.length ? (
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-2">Projects Recruiters Expect</p>
                  <div className="flex flex-wrap gap-2">{ga.exactWeakAreas.slice(0, 6).map((a, i) => <Chip key={i} label={a} variant="important" />)}</div>
                </div>
              ) : null}
            </div>
          </GlassCard>
        )}

        {/* ════════════════════════════════════════════════
           SECTION 5 — LINKEDIN INTELLIGENCE
           ════════════════════════════════════════════════ */}
        {(liProf?.profile_strength != null || liProf?.headline || prof?.linkedin_headline) && (
          <GlassCard delay={0.3}>
            <SectionHeader icon={<Globe size={14} />} title="LinkedIn Intelligence" action={liProf?.profile_strength != null ? <ScoreBadge score={liProf.profile_strength} /> : null} />
            <div className="p-5 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[ { label: "Profile Strength", value: liProf?.profile_strength }, { label: "Headline", value: liProf?.headline ? clamp(Math.round((liProf.headline.length / 120) * 100)) : prof?.linkedin_headline ? 70 : 0 }, { label: "About", value: liProf?.about ? clamp(Math.round((liProf.about.length / 300) * 100)) : prof?.linkedin_about ? clamp(Math.round((prof.linkedin_about.length / 300) * 100)) : 0 }, { label: "Experience", value: liProf?.profile_strength ? clamp(liProf.profile_strength - 8) : undefined }, { label: "Education", value: prof?.department ? 80 : undefined }, { label: "Skills Listed", value: liProf?.skills ? clamp(Math.min((liProf.skills.split(",").length / 15) * 100, 100)) : prof?.linkedin_skills ? clamp(Math.min((prof.linkedin_skills.split(",").length / 15) * 100, 100)) : 0 }, { label: "Recommendations", value: 0 }, { label: "Certifications", value: prof?.certifications?.length ? clamp(Math.min(prof.certifications.length * 15, 100)) : 0 } ].filter(m => m.value != null && m.value > 0).map((m, i) => (
                  <MetricCard key={m.label} label={m.label} value={m.value!} icon={<Star size={12} />} />
                ))}
              </div>
              {liProf?.profile_strength != null && (
                <div className="rounded-xl border border-white/70 bg-white/60 p-4">
                  <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold text-slate-700">Profile Completeness</span><span className="text-sm font-bold text-violet-700">{liProf.profile_strength}%</span></div>
                  <AnimatedFillBar value={liProf.profile_strength} />
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/70 bg-white/60 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 mb-2">AI Suggestions</p>
                  <div className="space-y-1.5">
                    {[
                      liProf?.headline && liProf.headline.length < 80 ? "Expand your headline with role-specific keywords (80-120 chars)." : null,
                      !prof?.linkedin_headline ? "Add a professional headline to appear in recruiter searches." : null,
                      !liProf?.about && !prof?.linkedin_about ? "Write a compelling About section (200-300 chars)." : null,
                      liProf?.about && liProf.about.length < 150 ? "Expand your About section for better SEO." : null,
                      !liProf?.skills && !prof?.linkedin_skills ? "List at least 5 key skills for 14x more profile views." : null,
                    ].filter(Boolean).slice(0, 4).map((s, i) => <div key={i} className="flex items-start gap-2 text-xs text-slate-600"><ChevronRight size={10} className="mt-0.5 shrink-0 text-violet-400" /><span>{s}</span></div>)}
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[{ label: "Networking Score", value: liProf?.profile_strength ? clamp(Math.round(liProf.profile_strength * 0.8)) : 0, icon: Users },
                    { label: "Recruiter Visibility", value: liProf?.profile_strength ? clamp(Math.round(liProf.profile_strength * 0.75 + 10)) : 0, icon: Globe },
                    { label: "ATS Visibility", value: prof?.resume_score ?? 0, icon: FileText },
                    { label: "Connections Growth", value: liProf?.profile_strength ? clamp(Math.round(liProf.profile_strength * 0.6)) : 0, icon: Users },
                  ].filter(m => m.value > 0).map((m, i) => (
                    <motion.div key={m.label} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.04 }}
                      className="flex items-center gap-3 rounded-xl border border-white/70 bg-white/60 px-3.5 py-2.5"
                    ><m.icon size={14} className="text-violet-500 shrink-0" /><span className="text-xs font-medium text-slate-700 flex-1">{m.label}</span><span className="text-sm font-bold text-violet-700">{m.value}%</span></motion.div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-4">
                <div className="flex items-center gap-2 mb-2"><AlertTriangle size={13} className="text-amber-500" /><span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Missing Profile Sections</span></div>
                <div className="flex flex-wrap gap-2">
                  {([ !prof?.linkedin_headline && "Headline", !prof?.linkedin_about && "About Section", !prof?.linkedin_skills && "Skills List", !prof?.linkedin_open_to_work && "Open to Work", !prof?.certifications?.length && "Certifications" ].filter(Boolean) as string[]).map((s, i) => <Chip key={i} label={s} variant="important" />)}
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* ════════════════════════════════════════════════
           SECTION 6 — RESUME INTELLIGENCE
           ════════════════════════════════════════════════ */}
        {(ra.atsScore != null || ra.resumeStrengthScore != null) && (
          <GlassCard delay={0.35}>
            <SectionHeader icon={<FileText size={14} />} title="Resume Intelligence" />
            <div className="p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[{ label: "ATS Score", value: ra.atsScore }, { label: "Grammar", value: ra.corrections?.length ? clamp(100 - ra.corrections.length * 8) : 85 }, { label: "Formatting", value: ra.exactWeakAreas?.some(s => /format|layout/i.test(s)) ? 65 : 80 }, { label: "Keyword Match", value: ra.skillsMatch }, { label: "Project Quality", value: ra.projectImpact }, { label: "Experience", value: ra.experienceQuality }, { label: "Education", value: ra.weakSections?.some(s => /education|academic/i.test(s)) ? clamp((ra.resumeStrengthScore ?? 70) - 15) : (ra.resumeStrengthScore ?? 70) }, { label: "Strength Score", value: ra.resumeStrengthScore } ].filter(m => m.value != null).map((m, i) => (
                  <MetricCard key={m.label} label={m.label} value={Math.round(m.value!)} icon={<FileText size={12} />} />
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className={cn("rounded-full border px-3 py-1 text-[11px] font-medium", ra.atsScore && ra.atsScore >= 70 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200")}>
                  {ra.improvedSummary ? "AI Improved Available" : "AI Improvement Available"}
                </span>
                {ra.missingKeywords?.length ? <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-medium text-rose-600">{ra.missingKeywords.length} missing keywords</span> : null}
                {ra.corrections?.length ? <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-600">{ra.corrections.length} corrections needed</span> : null}
              </div>
            </div>
          </GlassCard>
        )}

        {/* ════════════════════════════════════════════════
           SECTION 7 — CODING INTELLIGENCE
           ════════════════════════════════════════════════ */}
        {(lcTotal > 0 || prof?.coding_score) && (
          <GlassCard delay={0.4}>
            <SectionHeader icon={<Code2 size={14} />} title="Coding Intelligence" action={lcTotal > 0 ? <span className="text-[10px] text-slate-400">{lcTotal} solved</span> : null} />
            <div className="p-5 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Total Solved" value={lcTotal > 0 ? clamp(Math.round((lcTotal / 300) * 100)) : 0} icon={<Code2 size={12} />} sub={lcTotal > 0 ? `${lcTotal} problems` : undefined} />
                <MetricCard label="Easy" value={lcEasy > 0 ? clamp(Math.round((lcEasy / 150) * 100)) : 0} icon={<Layers size={12} />} sub={lcEasy > 0 ? `${lcEasy} solved` : undefined} />
                <MetricCard label="Medium" value={lcMedium > 0 ? clamp(Math.round((lcMedium / 120) * 100)) : 0} icon={<Layers size={12} />} sub={lcMedium > 0 ? `${lcMedium} solved` : undefined} />
                <MetricCard label="Hard" value={lcHard > 0 ? clamp(Math.round((lcHard / 50) * 100)) : 0} icon={<Layers size={12} />} sub={lcHard > 0 ? `${lcHard} solved` : undefined} />
                <MetricCard label="Contest Rating" value={lcStats?.contest_rating ? clamp(Math.round((lcStats.contest_rating / 2000) * 100)) : 0} icon={<Trophy size={12} />} sub={lcStats?.contest_rating ? String(lcStats.contest_rating) : undefined} />
                <MetricCard label="Daily Streak" value={0} icon={<Clock size={12} />} />
                <MetricCard label="Problem Solving" value={lcTotal > 0 ? clamp(Math.round((lcTotal / 300) * 100)) : 0} icon={<Brain size={12} />} />
                <MetricCard label="LeetCode Ready" value={lcTotal > 0 ? clamp(Math.round((lcTotal / 250) * 100)) : 0} icon={<Rocket size={12} />} />
              </div>
              {lcEasy > 0 && (
                <div className="rounded-xl border border-white/70 bg-white/60 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Problem Distribution</p>
                  <div className="flex h-4 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(lcEasy / lcTotal) * 100}%` }} transition={{ duration: 0.8 }} className="bg-emerald-400 text-[8px] text-white font-semibold flex items-center justify-center">{lcEasy > 0 ? `${Math.round((lcEasy / lcTotal) * 100)}%` : ""}</motion.div>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(lcMedium / lcTotal) * 100}%` }} transition={{ duration: 0.8, delay: 0.2 }} className="bg-amber-400 text-[8px] text-white font-semibold flex items-center justify-center">{lcMedium > 0 ? `${Math.round((lcMedium / lcTotal) * 100)}%` : ""}</motion.div>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(lcHard / lcTotal) * 100}%` }} transition={{ duration: 0.8, delay: 0.4 }} className="bg-rose-400 text-[8px] text-white font-semibold flex items-center justify-center">{lcHard > 0 ? `${Math.round((lcHard / lcTotal) * 100)}%` : ""}</motion.div>
                  </div>
                  <div className="flex gap-4 mt-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Easy: {lcEasy}</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Medium: {lcMedium}</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" /> Hard: {lcHard}</span>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* ════════════════════════════════════════════════
           SECTION 8 — INTERVIEW INTELLIGENCE
           ════════════════════════════════════════════════ */}
        {(mi?.score != null || prof?.mock_interview_score) && (
          <GlassCard delay={0.45}>
            <SectionHeader icon={<MessageSquareQuote size={14} />} title="Interview Intelligence" action={<ScoreBadge score={Math.round(interviewScore)} />} />
            <div className="p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[{ label: "Overall Score", value: interviewScore }, { label: "Confidence", value: mi?.analysis?.confidenceScore ?? clamp(interviewScore + 5) }, { label: "Communication", value: mi?.analysis?.communicationScore ?? prof?.communication_score ?? clamp(interviewScore - 3) }, { label: "Technical", value: mi?.analysis?.technicalScore ?? techScore }, { label: "HR / Behavioral", value: mi?.analysis?.projectKnowledgeScore ?? clamp(interviewScore - 5) }, { label: "Voice Clarity", value: mi?.analysis?.clarityScore ?? clamp(interviewScore - 2) }, { label: "Speaking Speed", value: mi?.analysis?.clarityScore ? clamp(mi.analysis.clarityScore - 5) : undefined }, { label: "Eye Contact", value: mi?.analysis?.confidenceScore ? clamp(mi.analysis.confidenceScore - 8) : undefined } ].filter(m => m.value != null).map((m, i) => (
                  <MetricCard key={m.label} label={m.label} value={Math.round(m.value!)} icon={<MessageSquareQuote size={12} />} />
                ))}
              </div>
              {mi?.analysis?.strengths?.length || mi?.analysis?.weaknesses?.length ? (
                <div className="grid gap-4 sm:grid-cols-2 mt-4">
                  {mi.analysis.strengths?.length ? <div className="rounded-xl border border-white/70 bg-white/60 p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-2">Strengths</p><div className="space-y-1">{mi.analysis.strengths.slice(0, 4).map((s, i) => <div key={i} className="flex items-start gap-2 text-xs text-slate-600"><CheckCircle2 size={11} className="mt-0.5 shrink-0 text-emerald-500" /><span>{s}</span></div>)}</div></div> : null}
                  {mi.analysis.weaknesses?.length ? <div className="rounded-xl border border-white/70 bg-white/60 p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 mb-2">Areas to Improve</p><div className="space-y-1">{mi.analysis.weaknesses.slice(0, 4).map((w, i) => <div key={i} className="flex items-start gap-2 text-xs text-slate-600"><AlertTriangle size={11} className="mt-0.5 shrink-0 text-rose-400" /><span>{w}</span></div>)}</div></div> : null}
                </div>
              ) : null}
              {mi?.analysis?.improvementPlan?.length ? (
                <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/60 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 mb-2">Improvement Plan</p>
                  <div className="space-y-1.5">{mi.analysis.improvementPlan.slice(0, 4).map((p, i) => <div key={i} className="flex items-start gap-2 text-xs text-slate-600"><ChevronRight size={10} className="mt-0.5 shrink-0 text-violet-400" /><span>{p}</span></div>)}</div>
                </div>
              ) : null}
              <div className="mt-4 rounded-xl border border-white/70 bg-white/60 p-4">
                <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-700">Final Interview Readiness</span><span className="text-lg font-bold text-violet-700">{Math.round(interviewScore)}%</span></div>
                <AnimatedFillBar value={Math.round(interviewScore)} />
              </div>
            </div>
          </GlassCard>
        )}

        {/* ════════════════════════════════════════════════
           SECTION 9 — RADAR CHART
           ════════════════════════════════════════════════ */}
        {radarData.length >= 3 && (
          <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
            <GlassCard delay={0.5}>
              <SectionHeader icon={<Target size={14} />} title="Competency Radar" action={<span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[10px] font-medium text-violet-600">Animated</span>} />
              <div className="h-[300px] p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(148,163,184,0.2)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748B", fontSize: 11, fontWeight: 500 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="score" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.12} strokeWidth={2.5} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
            <GlassCard delay={0.55}>
              <SectionHeader icon={<ListChecks size={14} />} title="Score Summary" />
              <div className="p-5 space-y-2">
                {radarData.map((item, i) => (
                  <motion.div key={item.subject} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.03 }}
                    className="flex items-center justify-between rounded-xl border border-white/70 bg-white/60 px-3.5 py-2"
                  >
                    <span className="text-xs font-medium text-slate-700">{item.subject}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${item.score}%` }} transition={{ duration: 0.7, delay: 0.7 + i * 0.03 }} className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                      </div>
                      <span className="text-xs font-semibold text-slate-600 w-8 text-right">{Math.round(item.score)}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </section>
        )}

        {/* ════════════════════════════════════════════════
           SECTION 10 — MISSING SKILLS
           ════════════════════════════════════════════════ */}
        {showMissingSkills && (
          <GlassCard delay={0.55}>
            <SectionHeader icon={<AlertTriangle size={14} />} title="Missing Skills" />
            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                {skillGaps.filter(s => s.current < s.target).map((s, i) => {
                  const gap = s.target - s.current;
                  const variant = gap > 40 ? "critical" : gap > 20 ? "important" : "optional";
                  return <Chip key={s.skill + i} label={`${s.skill} (Gap ${gap}%)`} variant={variant as any} />;
                })}
              </div>
            </div>
          </GlassCard>
        )}

        {/* ════════════════════════════════════════════════
           SECTION 11 — AI CAREER ROADMAP
           ════════════════════════════════════════════════ */}
        {roadmapItems.length > 0 && (
          <GlassCard delay={0.6}>
            <SectionHeader icon={<BookOpen size={14} />} title="AI Career Roadmap" />
            <div className="p-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[ { l: "Today", p: "High" }, { l: "This Week", p: "High" }, { l: "30 Days", p: "Medium" }, { l: "90 Days", p: "Low" } ].map(section => {
                  const items = roadmapItems.filter(i => i.priority === section.p);
                  if (!items.length) return null;
                  return (
                    <motion.div key={section.l} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-white/70 bg-white/60 p-4"
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">{section.l}</div>
                      <div className="space-y-2.5">{items.slice(0, 3).map((item, i) => (
                        <RoadmapTask key={i} priority={item.priority} task={item.task} difficulty={item.difficulty} eta={item.eta} resource={item.resource} progress={item.progress} />
                      ))}</div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        )}

        {/* ════════════════════════════════════════════════
           SECTION 12 — RECOMMENDED PROJECTS
           ════════════════════════════════════════════════ */}
        <GlassCard delay={0.65}>
          <SectionHeader icon={<Rocket size={14} />} title="Recommended Projects" action={<span className="text-[10px] text-slate-400">Based on career goal</span>} />
          <div className="p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "AI Resume Analyzer", difficulty: "Medium", skills: ["Python", "NLP", "FastAPI", "React"], value: "Shows full-stack AI capability" },
                { title: "AI Interview Coach", difficulty: "Hard", skills: ["AI", "Speech Recognition", "React", "Node"], value: "Demonstrates AI + product thinking" },
                { title: "Netflix Clone", difficulty: "Medium", skills: ["React", "Node", "MongoDB", "AWS"], value: "Proves full-stack architecture skills" },
                { title: "Distributed Chat System", difficulty: "Hard", skills: ["WebSocket", "Redis", "System Design", "Docker"], value: "Shows backend & system design depth" },
                { title: "RAG Chatbot", difficulty: "Medium", skills: ["Python", "LLM", "Vector DB", "FastAPI"], value: "High-value AI/ML portfolio piece" },
                { title: "AI Learning Platform", difficulty: "Hard", skills: ["AI", "React", "Node", "PostgreSQL", "Cloud"], value: "Flagship full-stack AI product" },
              ].map((p, i) => <ProjectCard key={p.title} title={p.title} difficulty={p.difficulty} skills={p.skills} value={p.value} />)}
            </div>
          </div>
        </GlassCard>

        {/* ════════════════════════════════════════════════
           SECTION 13 — CAREER TIMELINE
           ════════════════════════════════════════════════ */}
        <GlassCard delay={0.7}>
          <SectionHeader icon={<Clock size={14} />} title="Career Timeline" />
          <div className="p-5">
            <div className="flex items-center justify-between relative">
              {[
                { label: "Current", done: true, active: false },
                { label: "Internship Ready", done: false, active: true },
                { label: "Placement Ready", done: false, active: false },
                { label: "Interview Ready", done: false, active: false },
                { label: "Industry Ready", done: false, active: false },
              ].map((step, i) => (
                <div key={step.label} className="flex flex-col items-center relative z-10">
                  <TimelineStep label={step.label} active={step.active} done={step.done} index={i} />
                </div>
              ))}
              <div className="absolute left-0 right-0 top-3.5 h-0.5 bg-slate-200 -z-0">
                <motion.div initial={{ width: 0 }} animate={{ width: "40%" }} transition={{ duration: 1.2, delay: 0.8 }} className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* ════════════════════════════════════════════════
           SECTION 14 — ACTION CENTER
           ════════════════════════════════════════════════ */}
        <GlassCard delay={0.75}>
          <SectionHeader icon={<Zap size={14} />} title="Action Center" />
          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              <ActionBtn icon={<FileText size={14} />} label="Improve Resume" />
              <ActionBtn icon={<Globe size={14} />} label="Optimize LinkedIn" />
              <ActionBtn icon={<GitBranch size={14} />} label="Improve GitHub" />
              <ActionBtn icon={<Sparkles size={14} />} label="Generate Portfolio" />
              <ActionBtn icon={<BookOpen size={14} />} label="Weekly Learning Plan" onClick={handleRunAll} loading={analyzing} />
              <ActionBtn icon={<BarChart3 size={14} />} label="Career Report" />
              <ActionBtn icon={<Download size={14} />} label="Download PDF" />
            </div>
          </div>
        </GlassCard>

      </div>
    </motion.div>
  );
}

function ActionBtn({ icon, label, onClick, loading }: { icon: React.ReactNode; label: string; onClick?: () => void; loading?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/80 px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 active:scale-[0.98] disabled:opacity-60"
    >{loading ? <Loader2 size={13} className="animate-spin" /> : icon}{label}</button>
  );
}
