import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eye,
  FileText,
  GraduationCap,
  LayoutGrid,
  Lightbulb,
  Loader2,
  MessageSquareQuote,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Target,
  Upload,
  Wand2,
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
  getLatestResumeAnalysis,
  runResumeAnalyzer,
  type ResumeAnalysisResult,
  type UploadResponse,
  uploadResume,
} from "../../api/resume";
import { apiBaseUrl } from "../../api/client";

type PageStage = "idle" | "uploading" | "analyzing" | "results" | "error";
type DraftMode = { kind: "resume" } | { kind: "cover" } | { kind: "company"; company: string } | null;

interface UploadFileInfo {
  name: string;
  size: number;
  type: string;
}

interface MetricCardData {
  label: string;
  score: number;
  icon: typeof Brain;
  comment: string;
  trend: string;
  accent: string;
}

interface ActionItem {
  priority: "High" | "Medium" | "Low";
  task: string;
  eta: string;
  status: string;
}

const ACCEPTED_TYPES = ".pdf,.docx,.txt";
const MAX_SIZE = 10 * 1024 * 1024;
const COMPANY_TARGETS = ["Google", "Microsoft", "Amazon", "TCS", "Deloitte"];

const STATUS_LINES = [
  "Uploading",
  "Reading PDF",
  "Extracting Text",
  "ATS Analysis",
  "AI Evaluation",
  "Generating Report",
];

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function formatDelta(value: number): string {
  return `${value > 0 ? "+" : ""}${value}`;
}

function tone(score: number): string {
  if (score >= 80) return "#16A34A";
  if (score >= 60) return "#D97706";
  return "#DC2626";
}

function CountUp({ value, suffix = "", className = "" }: { value: number; suffix?: string; className?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 1200;
    const tick = (now: number) => {
      const progress = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={className}>{display}{suffix}</span>;
}

function useCountUp(ref: React.RefObject<SVGTextElement | null>, value: number) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const start = performance.now();
    const duration = 1200;
    let raf = 0;
    const tick = (now: number) => {
      const progress = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(value * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref, value]);
}

function ScoreRing({ score, label, size = "md", color, showLabel = true }: { score: number; label: string; size?: "sm" | "md" | "lg"; color?: string; showLabel?: boolean }) {
  const dims = size === "sm" ? 64 : size === "lg" ? 250 : 112;
  const stroke = size === "sm" ? 6 : size === "lg" ? 12 : 8;
  const r = (dims - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const ringColor = color || tone(score);
  const textColor = size === "lg" ? "#4C1D95" : ringColor;
  const scoreRef = useRef<SVGTextElement | null>(null);
  useCountUp(scoreRef, score);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55 }} className="flex flex-col items-center gap-2">
      <svg width={dims} height={dims} viewBox={`0 0 ${dims} ${dims}`}>
        <defs>
          <linearGradient id={`grad-${label.replace(/\s+/g, "-")}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={ringColor} />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
        <circle cx={dims / 2} cy={dims / 2} r={r} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={stroke} />
        <motion.circle
          cx={dims / 2}
          cy={dims / 2}
          r={r}
          fill="none"
          stroke={`url(#grad-${label.replace(/\s+/g, "-")})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          transform={`rotate(-90 ${dims / 2} ${dims / 2})`}
        />
        {size === "lg" ? (
          <>
            <text ref={scoreRef} x={dims / 2} y={dims / 2 - 12} textAnchor="middle" dominantBaseline="central" fill={textColor} className="text-5xl font-bold">
              0
            </text>
            <text x={dims / 2} y={dims / 2 + 22} textAnchor="middle" dominantBaseline="central" fill={textColor} className="text-lg font-semibold" opacity={0.5}>
              / 100
            </text>
            {showLabel && label && (
              <text x={dims / 2} y={dims / 2 + 50} textAnchor="middle" dominantBaseline="central" fill={textColor} className="text-sm font-medium" opacity={0.7}>
                {label}
              </text>
            )}
          </>
        ) : (
          <text ref={scoreRef} x={dims / 2} y={dims / 2} textAnchor="middle" dominantBaseline="central" fill={textColor} className={cn("font-semibold", size === "sm" ? "text-xs" : "text-xl")}>
            0
          </text>
        )}
      </svg>
      {size !== "lg" && <span className="max-w-24 text-center text-[10px] font-medium leading-tight text-slate-600">{label}</span>}
    </motion.div>
  );
}

function buildPrintableHtml({ analysis, fileName, resumeUrl }: { analysis: ResumeAnalysisResult; fileName: string; resumeUrl: string | null }) {
  const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const rows = [
    ["ATS Score", `${analysis.atsScore}/100`],
    ["Resume Strength", `${analysis.resumeStrengthScore}/100`],
    ["Skills Match", `${analysis.skillsMatch}/100`],
    ["Project Impact", `${analysis.projectImpact}/100`],
    ["Experience Quality", `${analysis.experienceQuality}/100`],
  ].map(([label, value]) => `<div class="row"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join("");
  const list = (title: string, items: string[]) => `<section class="panel"><h3>${esc(title)}</h3><div class="stack">${items.length ? items.map(item => `<div class="bullet">${esc(item)}</div>`).join("") : `<div class="bullet muted">No items reported.</div>`}</div></section>`;
  return `<!doctype html><html><head><meta charset="utf-8"/><title>Resume Analysis Report</title><style>@page{margin:18mm}body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,sans-serif;margin:0;color:#0f172a;background:#f8fafc}.page{padding:24px}.hero{background:linear-gradient(135deg,rgba(109,40,217,.14),rgba(168,85,247,.08));border:1px solid rgba(148,163,184,.25);border-radius:28px;padding:28px}.eyebrow{text-transform:uppercase;letter-spacing:.22em;font-size:11px;font-weight:700;color:#7c3aed}.title{margin:10px 0 6px;font-size:32px;line-height:1.05}.sub{color:#475569;max-width:720px;line-height:1.6}.grid{display:grid;gap:14px;grid-template-columns:repeat(5,minmax(0,1fr));margin-top:18px}.metric{background:rgba(255,255,255,.82);border:1px solid rgba(226,232,240,.9);border-radius:20px;padding:16px}.metric span{display:block;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#64748b}.metric strong{display:block;margin-top:10px;font-size:22px}.panel{margin-top:18px;background:white;border:1px solid #e2e8f0;border-radius:24px;padding:20px}.panel h3{margin:0 0 12px;font-size:14px;letter-spacing:.18em;text-transform:uppercase;color:#7c3aed}.stack{display:grid;gap:10px}.row{display:flex;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0}.bullet{padding:12px 14px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;line-height:1.5}.muted{color:#64748b}.footer{margin-top:18px;color:#64748b;font-size:12px}</style></head><body><div class="page"><section class="hero"><div class="eyebrow">Resume Analyzer</div><h1 class="title">${esc(fileName || "Resume")}</h1><p class="sub">Generated from real analysis data. Resume source: ${esc(resumeUrl || "No file URL available")}</p><div class="grid">${rows}</div></section>${list("Strengths", analysis.strengths)}${list("Weaknesses", analysis.weaknesses)}${list("Missing Keywords", analysis.missingKeywords)}<section class="panel"><h3>Improvement Plan</h3><div class="stack">${analysis.improvementPlan.length ? analysis.improvementPlan.map(item => `<div class="bullet">${esc(item)}</div>`).join("") : '<div class="bullet muted">No plan returned.</div>'}</div></section><div class="footer">Generated by Resume Analyzer AI</div></div></body></html>`;
}

function ResumePreviewContent({ resumeUrl, previewIsPdf, fileName, analysis }: { resumeUrl: string | null; previewIsPdf: boolean; fileName: string; analysis: ResumeAnalysisResult | null }) {
  const [previewError, setPreviewError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const textSnippet = useMemo(() => {
    if (!analysis) return "";
    const parts = [
      analysis.strengths[0],
      analysis.weakSections[0],
      analysis.missingKeywords[0],
      analysis.corrections[0],
      analysis.improvedSummary?.slice(0, 200),
    ].filter(Boolean);
    return parts.join(" | ");
  }, [analysis]);

  if (previewError || !resumeUrl) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl border border-slate-200/70 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-md text-center px-6">
          <FileText size={28} className="mx-auto text-violet-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">{fileName || "Resume"}</p>
          {textSnippet ? (
            <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-3">{textSnippet}</p>
          ) : (
            <p className="mt-2 text-xs text-slate-400">Preview unavailable for this file format.</p>
          )}
        </div>
      </div>
    );
  }

  if (previewIsPdf) {
    return (
      <div className="relative rounded-xl border border-slate-200/70 bg-white overflow-hidden">
        {!loaded && !previewError && (
          <div className="flex h-[360px] items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" />
              <p className="text-xs text-slate-400">Loading preview...</p>
            </div>
          </div>
        )}
        <object
          data={resumeUrl}
          type="application/pdf"
          className={cn("w-full transition-opacity", loaded ? "opacity-100" : "opacity-0 absolute")}
          style={{ height: loaded ? "540px" : "0" }}
          onLoad={() => { setLoaded(true); }}
          onError={() => { setPreviewError(true); setLoaded(true); }}
        >
          <embed src={resumeUrl} type="application/pdf" className="h-[540px] w-full" onError={() => setPreviewError(true)} />
        </object>
      </div>
    );
  }

  return (
    <div className="flex h-[280px] items-center justify-center rounded-xl border border-slate-200/70 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-md text-center px-6">
        <FileText size={28} className="mx-auto text-violet-300 mb-2" />
        <p className="text-sm font-semibold text-slate-700">{fileName}</p>
        {textSnippet ? (
          <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-3">{textSnippet}</p>
        ) : (
          <p className="mt-2 text-xs text-slate-400">Extracted text preview not available.</p>
        )}
      </div>
    </div>
  );
}

function AiOrb({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? 40 : size === "lg" ? 100 : 64;
  return (
    <div className="relative" style={{ width: dim, height: dim }}>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, #7C3AED, #A855F7, #EC4899, #7C3AED)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 60%)" }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-1 rounded-full bg-gradient-to-br from-violet-800 to-fuchsia-900 flex items-center justify-center"
        animate={{ scale: [1, 0.92, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Brain size={dim * 0.35} className="text-white/80" />
      </motion.div>
      <motion.div
        className="absolute -inset-3 rounded-full border border-violet-400/20"
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function LaserLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent"
      animate={{ top: ["0%", "100%", "0%"] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
      style={{ filter: "blur(1px)" }}
    />
  );
}

function CircularProgress({ progress }: { progress: number }) {
  const size = 100;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <defs>
        <linearGradient id="progress-grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="url(#progress-grad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" className="fill-white text-sm font-bold">
        {Math.round(progress)}%
      </text>
    </svg>
  );
}

function SkeletonPreview() {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full shimmer-bg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded-lg shimmer-bg" />
          <div className="h-3 w-1/2 rounded-lg shimmer-bg" />
        </div>
      </div>
      <div className="space-y-2 pl-[3.25rem]">
        <div className="h-3 w-full rounded-lg shimmer-bg" />
        <div className="h-3 w-5/6 rounded-lg shimmer-bg" />
        <div className="h-3 w-2/3 rounded-lg shimmer-bg" />
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2">
        {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl shimmer-bg" />)}
      </div>
    </div>
  );
}

function LoadingScreen({ progress, statusIndex, elapsed }: { progress: number; statusIndex: number; elapsed: number }) {
  const statusText = STATUS_LINES[statusIndex] || "Analyzing";
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-full bg-[radial-gradient(circle_at_center,rgba(109,40,217,0.12),transparent_50%),linear-gradient(180deg,#0f0724_0%,#1a0a35_50%,#0f0724_100%)] flex items-center justify-center p-4"
    >
      <div className="w-full max-w-4xl">
        <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <AiOrb size="lg" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-violet-500/20 rounded-full blur-xl" />
            </div>
            <CircularProgress progress={progress} />
            <motion.p
              key={statusIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-medium text-violet-200/80 text-center"
            >
              {statusText}
            </motion.p>
            <div className="flex items-center gap-1.5 text-[11px] text-violet-300/60">
              <Clock size={11} />
              <span>{minutes}:{seconds.toString().padStart(2, "0")}</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-violet-500/20 bg-violet-950/40 p-5 backdrop-blur-xl">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
            <div className="relative">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1">
                  <Sparkles size={11} className="text-violet-300" />
                  <span className="text-[11px] font-medium text-violet-200">AI Scanning</span>
                </div>
              </div>
              <SkeletonPreview />
            </div>
            <LaserLine />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ onFile, company, role, missing }: { onFile: (f: File) => void; company?: string; role?: string; missing?: string }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && ACCEPTED_TYPES.includes(f.name.split(".").pop()?.toLowerCase() || "")) onFile(f);
  }, [onFile]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-full bg-[radial-gradient(circle_at_center,rgba(109,40,217,0.08),transparent_50%),linear-gradient(180deg,#f7f2ff_0%,#f8fafc_100%)] flex items-center justify-center p-4"
    >
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center"
        >
          <div className="mb-4">
            <AiOrb />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-700 mb-4">
            <Brain size={12} /> Resume Analyzer
          </div>
          {company ? (
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">
              Optimizing resume for {company}{role ? ` ${role}` : ""}
            </h1>
          ) : (
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">
              Upload your resume to get ATS insights.
            </h1>
          )}
          {missing && (
            <p className="text-sm text-amber-600 mb-2">
              Missing keywords to address: {missing}
            </p>
          )}

          <div className="w-full mt-6">
            <div
              onDragOver={e => { e.preventDefault(); if (!dragging) setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "relative cursor-pointer rounded-[24px] border-2 border-dashed p-6 text-center backdrop-blur-xl transition-all duration-300",
                dragging
                  ? "border-violet-400 bg-violet-500/10 shadow-[0_0_50px_rgba(109,40,217,0.18)]"
                  : "border-white/60 bg-white/70 hover:border-violet-300/30 hover:bg-white/85"
              )}
            >
              <input ref={inputRef} type="file" accept={ACCEPTED_TYPES} onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} className="hidden" />
              <motion.div animate={dragging ? { scale: 1.05, y: -3 } : { scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 200 }}>
                <div className={cn("mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl transition-colors", dragging ? "bg-violet-600 text-white" : "bg-white text-violet-600 shadow-sm")}>
                  <Upload size={20} />
                </div>
              </motion.div>
              <p className="text-sm font-semibold text-slate-800">{dragging ? "Drop your resume here" : "Drag & drop your resume"}</p>
              <p className="mt-0.5 text-xs text-slate-400">PDF, DOCX, TXT - max 10MB</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function ErrorScreen({ error, fileInfo, backendReason, onRetry, onReset }: { error: string | null; fileInfo: UploadFileInfo | null; backendReason?: string; onRetry: () => void; onReset: () => void }) {
  const [countdown, setCountdown] = useState(5);
  const [autoRetried, setAutoRetried] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (autoRetried) return;
    if (countdown <= 0) {
      setAutoRetried(true);
      setRetrying(true);
      onRetry();
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, autoRetried, onRetry]);

  const friendlyMessage = backendReason && !backendReason.includes("Temporary") && !backendReason.includes("try again")
    ? backendReason
    : "Temporary AI service issue. Please retry.";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-full bg-[radial-gradient(circle_at_center,rgba(109,40,217,0.06),transparent_50%),linear-gradient(180deg,#f7f2ff_0%,#f8fafc_100%)] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="rounded-[28px] border border-white/50 bg-white/75 p-6 shadow-[0_24px_100px_rgba(109,40,217,0.12)] backdrop-blur-2xl text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200">
            <AlertTriangle size={20} className="text-rose-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Analysis couldn't be completed.</h2>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">{friendlyMessage}</p>

          <div className="mt-5 flex flex-col gap-2">
            <button
              onClick={() => { setRetrying(true); onRetry(); }}
              disabled={retrying}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:shadow-xl disabled:opacity-60"
            >
              {retrying ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              {retrying ? "Retrying..." : `Retry${!autoRetried && countdown > 0 ? ` (${countdown}s)` : ""}`}
            </button>
            <button
              onClick={onReset}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <RotateCcw size={15} /> Change Resume
            </button>
          </div>

          {fileInfo && (
            <p className="mt-4 text-[11px] text-slate-400">{fileInfo.name}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function StudentResumeAnalyzer() {
  const [searchParams] = useSearchParams();
  const targetCompany = searchParams.get("company") || "";
  const targetRole = searchParams.get("role") || "";
  const targetMissing = searchParams.get("missing") || "";
  const [stage, setStage] = useState<PageStage>("idle");
  const [fileInfo, setFileInfo] = useState<UploadFileInfo | null>(null);
  const [uploadRes, setUploadRes] = useState<UploadResponse | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanStep, setScanStep] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [draftMode, setDraftMode] = useState<DraftMode>(null);
  const [elapsed, setElapsed] = useState(0);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const progressRef = useRef<number>(0);
  const profileContext = useOptionalStudentProfile();

  const backendOrigin = useMemo(() => {
    try { return new URL(apiBaseUrl).origin; } catch { return ""; }
  }, []);

  const rawResumeUrl = uploadRes?.resume_url || profileContext.profile?.resume_url || null;
  const resumeUrl = useMemo(() => {
    if (rawResumeUrl && rawResumeUrl.startsWith("/")) {
      return `${backendOrigin}${rawResumeUrl}`;
    }
    return rawResumeUrl;
  }, [rawResumeUrl, backendOrigin]);
  const fileName = fileInfo?.name || (resumeUrl ? resumeUrl.split("/").pop() || "resume" : "resume");
  const previewIsPdf = Boolean(resumeUrl && /\.pdf($|\?)/i.test(resumeUrl));

  useEffect(() => {
    getLatestResumeAnalysis().then(res => {
      if (res && !res.missingData?.length && !res.error) {
        setAnalysis(res);
        setStage("results");
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (stage !== "analyzing") return;
    progressRef.current = 0;
    setScanStep(0);
    setScanProgress(0);
    setElapsed(0);

    const elapsedInterval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    const stepDuration = 2500;
    const totalSteps = STATUS_LINES.length;
    const totalDuration = stepDuration * totalSteps;
    const interval = setInterval(() => {
      progressRef.current += 100 / (totalDuration / 50);
      if (progressRef.current >= 100) {
        progressRef.current = 0;
        setScanStep(prev => Math.min(prev + 1, totalSteps - 1));
      }
      setScanProgress(Math.min(progressRef.current, 100));
    }, 50);

    return () => { clearInterval(interval); clearInterval(elapsedInterval); };
  }, [stage]);

  const handleFileSelected = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["pdf", "docx", "txt"].includes(ext)) {
      setError("Unsupported file format. Please upload PDF, DOCX, or TXT.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("File too large. Maximum size is 10MB.");
      return;
    }
    setError(null);
    setFileInfo({ name: file.name, size: file.size, type: file.type });
    setStage("uploading");
    try {
      const uploadResult = await uploadResume(file);
      setUploadRes(uploadResult);
      setStage("analyzing");
      const analysisResult = await runResumeAnalyzer();
      setAnalysis(analysisResult);
      if (analysisResult.error) {
        setError(analysisResult.error);
        setStage("error");
      } else if (analysisResult.missingData?.length) {
        setError(`Missing data: ${analysisResult.missingData.join(", ")}`);
        setStage("error");
      } else {
        setStage("results");
      }
    } catch (err: any) {
      setError("Temporary AI service issue. Please retry.");
      setStage("error");
    }
  }, []);

  const handleRetry = useCallback(() => {
    setStage("analyzing");
    setError(null);
    runResumeAnalyzer().then(res => {
      setAnalysis(res);
      if (res.error) {
        setError(res.error);
        setStage("error");
      } else if (res.missingData?.length) {
        setError(`Missing data: ${res.missingData.join(", ")}`);
        setStage("error");
      } else {
        setStage("results");
      }
    }).catch(() => {
      setError("Temporary AI service issue. Please retry.");
      setStage("error");
    });
  }, []);

  const handleReset = useCallback(() => {
    setStage("idle");
    setFileInfo(null);
    setUploadRes(null);
    setAnalysis(null);
    setError(null);
    setScanStep(0);
    setScanProgress(0);
    setDraftMode(null);
    setElapsed(0);
  }, []);

  const mainScore = useMemo(() => analysis ? Math.round((analysis.atsScore + analysis.resumeStrengthScore + analysis.skillsMatch + analysis.projectImpact + analysis.experienceQuality) / 5) : 0, [analysis]);
  const hiringProbability = useMemo(() => analysis ? clamp(Math.round((mainScore * 0.88) + (analysis.skillsMatch * 0.08) - (analysis.missingKeywords.length * 2)), 0, 99) : 0, [analysis, mainScore]);
  const marketReadiness = useMemo(() => analysis ? clamp(Math.round((analysis.resumeStrengthScore + analysis.projectImpact + analysis.experienceQuality + analysis.skillsMatch) / 4), 0, 100) : 0, [analysis]);

  const metricCards = useMemo<MetricCardData[]>(() => {
    if (!analysis) return [];
    const educationScore = analysis.weakSections.some(section => /education|academic/i.test(section)) ? clamp(analysis.resumeStrengthScore - 14) : clamp(Math.round((analysis.resumeStrengthScore + marketReadiness) / 2));
    const grammarScore = clamp(100 - (analysis.corrections.length * 7) - (analysis.weakSections.some(section => /grammar|writing|clarity/i.test(section)) ? 10 : 0));
    const formattingScore = clamp(100 - (analysis.exactWeakAreas.some(section => /format|layout|structure/i.test(section)) ? 18 : 0) - (analysis.weakSections.some(section => /format|layout|structure/i.test(section)) ? 12 : 0));
    const buildTrend = (score: number) => `${formatDelta(score - mainScore)} vs overall`;
    return [
      { label: "ATS", score: analysis.atsScore, icon: Shield, comment: analysis.missingKeywords[0] ? `Prioritize ${analysis.missingKeywords[0]} and tighten section headings.` : "The ATS profile is already aligned with the current scan.", trend: buildTrend(analysis.atsScore), accent: "#7C3AED" },
      { label: "Skills", score: analysis.skillsMatch, icon: Target, comment: analysis.strengths[0] ? `Lean into ${analysis.strengths[0]}.` : "Skills data is coming through from the latest analysis.", trend: buildTrend(analysis.skillsMatch), accent: "#0EA5E9" },
      { label: "Projects", score: analysis.projectImpact, icon: BriefcaseBusiness, comment: analysis.projectImpact >= 70 ? "Projects are carrying solid evidence." : (analysis.exactWeakAreas[0] ? `Rewrite ${analysis.exactWeakAreas[0]} with impact metrics.` : "Project framing needs stronger measurable outcomes."), trend: buildTrend(analysis.projectImpact), accent: "#10B981" },
      { label: "Experience", score: analysis.experienceQuality, icon: Clock, comment: analysis.experienceQuality >= 70 ? "Experience reads as competitive." : (analysis.weakSections[0] ? `Work on ${analysis.weakSections[0]} for stronger recruiter signal.` : "Experience signal can be tightened further."), trend: buildTrend(analysis.experienceQuality), accent: "#F59E0B" },
      { label: "Education", score: educationScore, icon: GraduationCap, comment: analysis.weakSections.some(section => /education|academic/i.test(section)) ? "Education content needs clearer signals and formatting." : "Education section is not a current blocker.", trend: buildTrend(educationScore), accent: "#6366F1" },
      { label: "Grammar", score: grammarScore, icon: MessageSquareQuote, comment: analysis.corrections.length > 0 ? `There are ${analysis.corrections.length} correction points to resolve.` : "No strong grammar issues were surfaced in the payload.", trend: buildTrend(grammarScore), accent: "#EC4899" },
      { label: "Formatting", score: formattingScore, icon: LayoutGrid, comment: analysis.weakSections.some(section => /format|layout|structure/i.test(section)) ? "Formatting should be simplified for ATS parsing." : "Layout looks stable in the current report.", trend: buildTrend(formattingScore), accent: "#14B8A6" },
    ];
  }, [analysis, marketReadiness, mainScore]);

  const timelineItems = useMemo(() => analysis ? [
    { title: "ATS", icon: Shield, score: analysis.atsScore, description: analysis.missingKeywords.length ? `Keyword coverage gap: ${analysis.missingKeywords.slice(0, 3).join(", ")}` : "ATS structure is readable and searchable.", accentClass: "text-violet-600" },
    { title: "Skills", icon: Target, score: analysis.skillsMatch, description: analysis.strengths[0] ? `Strongest signal: ${analysis.strengths[0]}` : "Skill mapping is available from the current analysis.", accentClass: "text-sky-600" },
    { title: "Projects", icon: BriefcaseBusiness, score: analysis.projectImpact, description: analysis.exactWeakAreas[0] ? `High-friction area: ${analysis.exactWeakAreas[0]}` : "Project impact is being reflected from the current payload.", accentClass: "text-emerald-600" },
    { title: "Experience", icon: Clock, score: analysis.experienceQuality, description: analysis.weakSections.length ? `Needs attention in: ${analysis.weakSections.slice(0, 2).join(" · ")}` : "Experience alignment looks stable from the latest scan.", accentClass: "text-amber-600" },
    { title: "Keywords", icon: Search, score: clamp(analysis.atsScore - analysis.missingKeywords.length * 4), description: analysis.missingKeywords.length ? `Prioritize these terms: ${analysis.missingKeywords.slice(0, 3).join(", ")}` : "No missing keyword list was returned.", accentClass: "text-pink-600" },
    { title: "Recommendations", icon: Lightbulb, score: mainScore, description: analysis.nextActions[0] || analysis.improvementPlan[0] || "The current analysis has no action entries.", accentClass: "text-indigo-600" },
  ] : [], [analysis, mainScore]);

  const actionPlan = useMemo<ActionItem[]>(() => {
    if (!analysis) return [];
    return [
      { priority: "High", task: analysis.missingKeywords.slice(0, 3).length ? `Weave in: ${analysis.missingKeywords.slice(0, 3).join(", ")}` : "Validate keyword coverage against the target role.", eta: "15 min", status: "Open" },
      { priority: "High", task: analysis.weakSections.slice(0, 2).length ? `Fix weak sections: ${analysis.weakSections.slice(0, 2).join(" · ")}` : "Verify the order of sections and headings.", eta: "20 min", status: "Open" },
      { priority: "Medium", task: analysis.corrections[0] || "Apply the first batch of AI corrections.", eta: "25 min", status: "Open" },
      { priority: "Medium", task: analysis.corrections[1] || "Refine the strongest bullet with a measurable result.", eta: "30 min", status: "Open" },
      { priority: "Low", task: analysis.nextActions[0] || "Review the final AI summary before exporting.", eta: "10 min", status: "Open" },
      { priority: "Low", task: analysis.nextActions[1] || "Share the updated draft with a mentor or recruiter.", eta: "10 min", status: "Open" },
    ];
  }, [analysis]);

  const verdictLines = useMemo(() => analysis ? [
    `Overall score is ${mainScore}/100 with ATS at ${analysis.atsScore}/100 and market readiness at ${marketReadiness}/100.`,
    analysis.strengths[0] ? `Strongest signal: ${analysis.strengths[0]}.` : "The current payload did not return a dedicated strengths list.",
    analysis.missingKeywords.length > 0 ? `Missing keywords to fix first: ${analysis.missingKeywords.slice(0, 4).join(", ")}.` : "No missing keyword list was returned in this run.",
    analysis.weakSections.length > 0 ? `Weak sections surfaced: ${analysis.weakSections.slice(0, 3).join(" · ")}.` : "Weak section markers were not reported.",
    analysis.nextActions[0] || analysis.improvementPlan[0] || "Use the action plan below to continue the rewrite.",
  ] : [], [analysis, mainScore, marketReadiness]);

  const draftText = useMemo(() => {
    if (!analysis || !draftMode) return "";
    if (draftMode.kind === "resume") {
      return [
        "Improved Resume Draft",
        "",
        "Headline",
        analysis.strengths[0] || analysis.improvedSummary,
        "",
        "Summary",
        analysis.improvedSummary,
        "",
        "Key Strengths",
        ...analysis.strengths.map(item => `- ${item}`),
        "",
        "Missing Keywords to Add",
        ...analysis.missingKeywords.map(item => `- ${item}`),
        "",
        "Corrections",
        ...analysis.corrections.map(item => `- ${item}`),
      ].join("\n");
    }
    if (draftMode.kind === "cover") {
      return [
        "Cover Letter Draft",
        "",
        "Dear Hiring Manager,",
        "",
        `I am applying with a resume that currently scores ${mainScore}/100 overall, with strengths in ${analysis.strengths.slice(0, 2).join(", ") || "key technical areas"}.`,
        "",
        `My current focus is to address ${analysis.missingKeywords.slice(0, 3).join(", ") || "the remaining resume gaps"} and sharpen the presentation of ${analysis.weakSections.slice(0, 2).join(", ") || "my strongest experience"}.`,
        "",
        "The attached analysis highlights clear next steps, and I am using those recommendations to tighten both impact and clarity.",
        "",
        "Sincerely,",
        "Your Name",
      ].join("\n");
    }
    return [
      `Optimization Plan for ${draftMode.company}`,
      "",
      "Use these real signals from the latest analysis:",
      `- Highlight: ${analysis.strengths.slice(0, 2).join(", ") || "strongest measurable wins"}`,
      `- Add keywords: ${analysis.missingKeywords.slice(0, 4).join(", ") || "no missing keyword list returned"}`,
      `- Repair: ${analysis.weakSections.slice(0, 3).join(", ") || "section clarity and structure"}`,
      `- Keep: ${analysis.nextActions.slice(0, 2).join(" | ") || "the current action plan"}`,
    ].join("\n");
  }, [analysis, draftMode, mainScore]);

  const handleCopy = useCallback(() => {
    if (!analysis) return;
    const text = [
      `Overall score: ${mainScore}/100`,
      `ATS Score: ${analysis.atsScore}/100`,
      `Resume Strength: ${analysis.resumeStrengthScore}/100`,
      `Skills Match: ${analysis.skillsMatch}/100`,
      `Project Impact: ${analysis.projectImpact}/100`,
      `Experience Quality: ${analysis.experienceQuality}/100`,
      "",
      "Strengths:",
      ...analysis.strengths.map(item => `  ✓ ${item}`),
      "",
      "Missing Keywords:",
      ...analysis.missingKeywords.map(item => `  • ${item}`),
      "",
      "Corrections:",
      ...analysis.corrections.map(item => `  • ${item}`),
      "",
      "Next Actions:",
      ...analysis.nextActions.map(item => `  • ${item}`),
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [analysis, mainScore]);

  const handleDownloadPdf = useCallback(() => {
    if (!analysis) return;
    const previewWindow = window.open("", "_blank", "noopener,noreferrer,width=1200,height=900");
    if (!previewWindow) return;
    const html = buildPrintableHtml({ analysis, fileName, resumeUrl });
    previewWindow.document.open();
    previewWindow.document.write(html);
    previewWindow.document.close();
    previewWindow.focus();
    setTimeout(() => previewWindow.print(), 250);
  }, [analysis, fileName, resumeUrl]);

  if (stage === "idle") {
    return <EmptyState onFile={handleFileSelected} company={targetCompany} role={targetRole} missing={targetMissing} />;
  }

  if (stage === "uploading") {
    return <LoadingScreen progress={80} statusIndex={0} elapsed={elapsed} />;
  }

  if (stage === "analyzing") {
    const rawProgress = (scanStep * 100 + scanProgress) / STATUS_LINES.length;
    return <LoadingScreen progress={Math.min(rawProgress, 100)} statusIndex={Math.min(scanStep, STATUS_LINES.length - 1)} elapsed={elapsed} />;
  }

  if (stage === "error") {
    return (
      <ErrorScreen
        error={error}
        fileInfo={fileInfo}
        backendReason={analysis?.error || undefined}
        onRetry={handleRetry}
        onReset={handleReset}
      />
    );
  }

  if (stage === "results" && analysis) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-full bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_50%),linear-gradient(180deg,#faf7ff_0%,#f8fafc_100%)] text-slate-900"
      >
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full bg-violet-400/8 blur-3xl" />
          <div className="absolute -bottom-40 left-1/3 h-[400px] w-[400px] rounded-full bg-fuchsia-300/8 blur-3xl" />
        </div>
        <div className="relative mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-4 py-6 lg:px-6 lg:py-8">

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 lg:grid-cols-[auto_1fr_300px] lg:items-start"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-6 rounded-full border border-violet-200/30"
                />
                <div className="rounded-full bg-white/60 p-4 shadow-[0_0_60px_rgba(139,92,246,0.1)] backdrop-blur-xl">
                  <ScoreRing score={mainScore} label="Overall Score" size="lg" color="#7C3AED" showLabel />
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 w-full max-w-[240px]">
                {[
                  { label: "Overall", value: mainScore },
                  { label: "ATS", value: analysis.atsScore },
                  { label: "Hiring", value: hiringProbability },
                  { label: "Market", value: marketReadiness },
                ].map(item => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + ["Overall", "ATS", "Hiring", "Market"].indexOf(item.label) * 0.08 }}
                    className="rounded-xl border border-white/60 bg-white/70 p-2.5 text-center backdrop-blur-sm"
                  >
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">{item.label}</div>
                    <div className="text-lg font-bold text-violet-700"><CountUp value={item.value} suffix="%" /></div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <div className="space-y-3 pt-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-700">
                <Sparkles size={12} /> Resume Analysis Complete
              </div>
              {targetCompany && (
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-100/70 px-4 py-1.5 text-xs font-semibold text-violet-800">
                  <BriefcaseBusiness size={13} /> Optimizing resume for {targetCompany}{targetRole ? ` ${targetRole}` : ""}
                </div>
              )}
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">AI Resume Analysis Complete</h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
                {analysis.strengths[0] ? `Strongest area: ${analysis.strengths[0]}.` : ""}
                {analysis.missingKeywords.length > 0 ? ` Missing ${analysis.missingKeywords.length} key terms found.` : ""}
                {analysis.weakSections.length > 0 ? ` Focus on ${analysis.weakSections.slice(0, 2).join(" and ")}.` : ""}
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-[0_8px_30px_rgba(139,92,246,0.06)] backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">AI Verdict</span>
                <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-semibold", mainScore >= 75 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : mainScore >= 55 ? "border-amber-200 bg-amber-50 text-amber-700" : "border-rose-200 bg-rose-50 text-rose-700")}>{mainScore >= 75 ? "Strong" : mainScore >= 55 ? "Moderate" : "Needs work"}</span>
              </div>
              <div className="space-y-2">
                {verdictLines.slice(0, 5).map((line, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[8px] font-bold text-violet-600">{i + 1}</span>
                    {line}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
            {metricCards.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.06 }}
                whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(139,92,246,0.12)" }}
                className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-4 shadow-[0_4px_16px_rgba(139,92,246,0.04)] backdrop-blur-xl transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-50/30 via-white/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/70 bg-white/80 text-violet-600 shadow-sm">
                      <metric.icon size={16} />
                    </div>
                    <ScoreRing score={metric.score} label="" size="sm" color={metric.accent} />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{metric.label}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500 line-clamp-2">{metric.comment}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className={cn("inline-block h-1.5 w-1.5 rounded-full", metric.score >= 80 ? "bg-emerald-500" : metric.score >= 60 ? "bg-amber-500" : "bg-rose-500")} />
                    <span className={cn("text-[10px] font-medium", metric.score >= 80 ? "text-emerald-600" : metric.score >= 60 ? "text-amber-600" : "text-rose-600")}>
                      {metric.score >= 80 ? "Strong" : metric.score >= 60 ? "Needs work" : "Critical"}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </section>

          <section className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="rounded-2xl border border-white/60 bg-white/70 shadow-[0_8px_30px_rgba(139,92,246,0.04)] backdrop-blur-xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/60 px-5 py-3">
                <div className="flex items-center gap-2">
                  <Eye size={14} className="text-violet-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Resume Preview</span>
                </div>
                <div className="flex gap-1.5">
                  {["Skills", "Projects", "Experience"].map(s => (
                    <button
                      key={s}
                      onClick={() => setActiveSection(activeSection === s ? null : s)}
                      className={cn("rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-all", activeSection === s ? "border-violet-300 bg-violet-50 text-violet-700" : "border-white/70 bg-white/60 text-slate-500 hover:bg-white/90")}
                    >{s}</button>
                  ))}
                </div>
              </div>
              <div className="p-5">
                <ResumePreviewContent resumeUrl={resumeUrl} previewIsPdf={previewIsPdf} fileName={fileName} analysis={analysis} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-[0_8px_30px_rgba(139,92,246,0.04)] backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <Zap size={14} className="text-violet-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Analysis Timeline</span>
              </div>
              <div className="space-y-0">
                {timelineItems.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.08 }}
                    className="relative flex items-start gap-3 pb-4 last:pb-0"
                  >
                    {index < timelineItems.length - 1 && (
                      <div className="absolute left-[11px] top-6 h-full w-px bg-gradient-to-b from-violet-200/60 to-transparent" />
                    )}
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-violet-200 bg-violet-50 shrink-0">
                      <CheckCircle2 size={12} className="text-violet-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500">{item.score}%</span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 truncate">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-[0_8px_30px_rgba(139,92,246,0.04)] backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 size={14} className="text-violet-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Score Radar</span>
                </div>
                <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[10px] font-medium text-violet-600">Animated</span>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={metricCards.map(card => ({ subject: card.label, score: card.score }))}>
                    <PolarGrid stroke="rgba(148,163,184,0.2)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748B", fontSize: 11, fontWeight: 500 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="score" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.12} strokeWidth={2.5} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-[0_8px_30px_rgba(139,92,246,0.04)] backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={14} className="text-violet-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recommendations</span>
              </div>
              <div className="space-y-2">
                {[
                  { priority: "High" as const, task: analysis.missingKeywords.slice(0, 2).length > 0 ? `Add missing keywords: ${analysis.missingKeywords.slice(0, 2).join(", ")}` : "Validate keyword coverage" },
                  { priority: "High" as const, task: analysis.weakSections.slice(0, 2).length > 0 ? `Improve weak areas: ${analysis.weakSections.slice(0, 2).join(", ")}` : "Verify section structure" },
                  { priority: "Medium" as const, task: analysis.corrections[0] || "Apply AI-suggested corrections" },
                  { priority: "Medium" as const, task: analysis.nextActions[0] || "Review improved summary" },
                  { priority: "Low" as const, task: analysis.improvementPlan[0] || "Export and share with mentor" },
                ].filter(Boolean).map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.06 }}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/70 bg-white/60 px-3.5 py-2.5"
                  >
                    <p className="text-xs font-medium text-slate-700 truncate">{item.task}</p>
                    <span className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold",
                      item.priority === "High" ? "bg-rose-50 text-rose-600" :
                      item.priority === "Medium" ? "bg-amber-50 text-amber-600" : "bg-sky-50 text-sky-600"
                    )}>{item.priority}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-[0_8px_30px_rgba(139,92,246,0.04)] backdrop-blur-xl"
          >
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setDraftMode({ kind: "resume" })} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(109,40,217,0.2)] transition hover:scale-[1.02] active:scale-[0.98]"><Wand2 size={14} /> Generate Improved Resume</button>
              <button onClick={() => setDraftMode({ kind: "cover" })} className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100/90"><FileText size={14} /> Generate Cover Letter</button>
              {["Google", "Amazon", "Microsoft"].map(company => (
                <button key={company} onClick={() => setDraftMode({ kind: "company", company })} className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/80 px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"><BriefcaseBusiness size={13} /> Optimize for {company}</button>
              ))}
              <div className="ml-auto flex gap-2">
                <button onClick={handleDownloadPdf} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"><Download size={13} /> Download PDF</button>
                <button onClick={handleCopy} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"><Copy size={13} /> {copied ? "Copied" : "Copy"}</button>
              </div>
            </div>
          </motion.section>
        </div>

        <AnimatePresence>
          {draftMode && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
              <motion.div initial={{ y: 20, scale: 0.97, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 20, scale: 0.97, opacity: 0 }} transition={{ duration: 0.2 }} className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-white/60 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.2)]">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Draft Studio</p>
                    <h3 className="mt-0.5 text-lg font-semibold text-slate-900">{draftMode.kind === "company" ? `Optimize for ${draftMode.company}` : draftMode.kind === "cover" ? "Cover Letter" : "Improved Resume"}</h3>
                  </div>
                  <button onClick={() => setDraftMode(null)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">Close</button>
                </div>
                <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
                  <div className="max-h-[calc(85vh-60px)] overflow-y-auto p-5"><pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{draftText}</pre></div>
                  <div className="border-t border-slate-200 bg-slate-50 p-5 lg:border-l lg:border-t-0">
                    <div className="space-y-2.5">
                      <button onClick={() => navigator.clipboard.writeText(draftText)} className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800">Copy Draft</button>
                      <button onClick={handleDownloadPdf} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">Print as PDF</button>
                      <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-xs leading-relaxed text-violet-700">Based on real analysis data.</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return null;
}
