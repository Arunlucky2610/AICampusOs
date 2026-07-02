import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, CheckCircle2, XCircle, AlertTriangle,
  Sparkles, Brain, Target, ArrowRight, Download, Copy,
  RefreshCw, Loader2, Search, Award, Clock, Lightbulb,
  ChevronRight, Zap, BarChart3, ListChecks, Eye,
  RotateCcw, Trash2, Shield,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { cn } from "../../utils/cn";
import {
  uploadResume, runResumeAnalyzer, getLatestResumeAnalysis,
  type ResumeAnalysisResult, type UploadResponse,
} from "../../api/resume";

// ─── Types ────────────────────────────────────────────────────────────────

type PageStage = "idle" | "uploading" | "analyzing" | "results" | "error";

interface UploadFileInfo {
  name: string;
  size: number;
  type: string;
}

interface StepDef {
  id: string;
  label: string;
  icon: typeof Brain;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ".pdf,.docx,.txt";
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const SCAN_STEPS: StepDef[] = [
  { id: "upload", label: "Uploading resume", icon: Upload },
  { id: "extract", label: "Extracting text", icon: FileText },
  { id: "ats", label: "Checking ATS score", icon: Shield },
  { id: "weak", label: "Finding weak sections", icon: Search },
  { id: "improve", label: "Generating improvements", icon: Sparkles },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Score Ring ─────────────────────────────────────────────────────────────

function ScoreRing({ score, label, size = "md", color }: { score: number; label: string; size?: "sm" | "md" | "lg"; color?: string }) {
  const dims = size === "sm" ? 56 : size === "lg" ? 120 : 88;
  const stroke = size === "sm" ? 4 : size === "lg" ? 8 : 6;
  const r = (dims - stroke) / 2;
  const c = 2 * Math.PI * r;
  const o = c - (score / 100) * c;
  const hue = score >= 80 ? "#22C55E" : score >= 60 ? "#F59E0B" : "#EF4444";
  const finalColor = color || hue;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-1.5">
      <svg width={dims} height={dims} viewBox={`0 0 ${dims} ${dims}`}>
        <circle cx={dims / 2} cy={dims / 2} r={r} fill="none" stroke="#E8ECF1" strokeWidth={stroke} />
        <motion.circle
          cx={dims / 2} cy={dims / 2} r={r} fill="none" stroke={finalColor}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: o }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          transform={`rotate(-90 ${dims / 2} ${dims / 2})`}
        />
        <text x={dims / 2} y={dims / 2} textAnchor="middle" dominantBaseline="central"
          className={cn("font-bold", size === "sm" ? "text-xs" : size === "lg" ? "text-2xl" : "text-base")}
          fill={finalColor}
        >{score}</text>
      </svg>
      <span className={cn("font-medium text-center leading-tight", size === "sm" ? "text-[9px] max-w-12" : size === "lg" ? "text-xs max-w-24" : "text-[10px] max-w-16")}>
        {label}
      </span>
    </motion.div>
  );
}

// ─── Score Bar ──────────────────────────────────────────────────────────────

function ScoreBar({ label, score }: { label: string; score: number }) {
  const hue = score >= 80 ? "#22C55E" : score >= 60 ? "#F59E0B" : "#EF4444";
  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#374151]">{label}</span>
        <span className="text-xs font-bold" style={{ color: hue }}>{score}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#E8ECF1]">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${score}%` }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="h-full rounded-full transition-all"
          style={{ backgroundColor: hue }}
        />
      </div>
    </motion.div>
  );
}

// ─── Chip ───────────────────────────────────────────────────────────────────

function Chip({ children, color = "#6C4CF1" }: { children: string; color?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F7FA] px-2.5 py-1 text-[10px] font-medium text-[#374151] border border-[#E8ECF1]">
      {children}
    </span>
  );
}

// ─── Drag & Drop Zone ───────────────────────────────────────────────────────

function DropZone({ onFile, disabled }: { onFile: (f: File) => void; disabled: boolean }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && ACCEPTED_TYPES.includes(f.name.split(".").pop()?.toLowerCase() || "")) onFile(f);
  }, [onFile]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={cn(
        "relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300",
        disabled && "opacity-50 cursor-not-allowed",
        dragging
          ? "border-[#6C4CF1] bg-[#6C4CF1]/5 shadow-[0_0_30px_rgba(108,76,241,0.15)]"
          : "border-[#E8ECF1] bg-white hover:border-[#6C4CF1]/40 hover:bg-[#6C4CF1]/[0.02]",
      )}
    >
      <input ref={inputRef} type="file" accept={ACCEPTED_TYPES} disabled={disabled}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        className="hidden"
      />
      <motion.div animate={dragging ? { scale: 1.08, y: -4 } : { scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 200 }}>
        <div className={cn(
          "mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors",
          dragging ? "bg-[#6C4CF1] text-white" : "bg-[#F5F7FA] text-[#6C4CF1]",
        )}>
          <Upload size={22} />
        </div>
      </motion.div>
      <p className="text-sm font-semibold text-[#111827]">
        {dragging ? "Drop your resume here" : "Drag & drop your resume"}
      </p>
      <p className="mt-1 text-xs text-[#6B7280]">or click to browse — PDF, DOCX, TXT (max 10MB)</p>

      {/* Glow ring animation */}
      {dragging && (
        <motion.span
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: [0, 0.3, 0], scale: [0.95, 1.02, 0.95] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 rounded-2xl border-2 border-[#6C4CF1]/40 pointer-events-none"
        />
      )}
    </div>
  );
}

// ─── Scanning Pipeline ──────────────────────────────────────────────────────

function ScanningPipeline({ currentStep, progress }: { currentStep: number; progress: number }) {
  return (
    <div className="space-y-3">
      {SCAN_STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-3 transition-all",
              done && "border-[#22C55E]/30 bg-[#22C55E]/5",
              active && "border-[#6C4CF1]/30 bg-[#6C4CF1]/5 shadow-sm",
              !done && !active && "border-[#E8ECF1] bg-white opacity-40",
            )}
          >
            <div className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
              done && "bg-[#22C55E] text-white",
              active && "bg-[#6C4CF1] text-white",
              !done && !active && "bg-[#F5F7FA] text-[#9CA3AF]",
            )}>
              {done ? <CheckCircle2 size={16} /> : active ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
            </div>
            <div className="flex-1">
              <p className={cn(
                "text-sm font-semibold",
                done && "text-[#22C55E]",
                active && "text-[#6C4CF1]",
                !done && !active && "text-[#6B7280]",
              )}>{step.label}</p>
              {active && (
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E8ECF1]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6]"
                  />
                </div>
              )}
            </div>
            {done && <CheckCircle2 size={16} className="text-[#22C55E]" />}
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function StudentResumeAnalyzer() {
  const [stage, setStage] = useState<PageStage>("idle");
  const [fileInfo, setFileInfo] = useState<UploadFileInfo | null>(null);
  const [uploadRes, setUploadRes] = useState<UploadResponse | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanStep, setScanStep] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const progressRef = useRef<number>(0);
  const stepRef = useRef<number>(0);

  // Check for existing analysis on mount
  useEffect(() => {
    getLatestResumeAnalysis().then(res => {
      if (res && !res.missingData?.length) {
        setAnalysis(res);
        setStage("results");
      }
    }).catch(() => {});
  }, []);

  // Scan animation
  useEffect(() => {
    if (stage !== "analyzing") return;
    progressRef.current = 0;
    stepRef.current = 0;
    setScanStep(0);
    setScanProgress(0);

    const stepDuration = 1800; // ms per step
    const totalSteps = SCAN_STEPS.length;
    const totalDuration = stepDuration * totalSteps;

    const interval = setInterval(() => {
      progressRef.current += 100 / (totalDuration / 50);
      if (progressRef.current >= 100) {
        progressRef.current = 0;
        stepRef.current += 1;
        setScanStep(prev => Math.min(prev + 1, totalSteps - 1));
      }
      setScanProgress(Math.min(progressRef.current, 100));
    }, 50);

    return () => clearInterval(interval);
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
      setScanStep(0);
      setScanProgress(0);

      const analysisResult = await runResumeAnalyzer();
      setAnalysis(analysisResult);

      if (analysisResult.missingData?.length) {
        setError(`Missing data: ${analysisResult.missingData.join(", ")}`);
        setStage("error");
      } else {
        setStage("results");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Analysis failed. Please try again.";
      setError(msg);
      setStage("error");
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (uploadRes) {
      setStage("analyzing");
      setError(null);
      runResumeAnalyzer()
        .then(res => {
          setAnalysis(res);
          if (res.missingData?.length) {
            setError(`Missing data: ${res.missingData.join(", ")}`);
            setStage("error");
          } else {
            setStage("results");
          }
        })
        .catch(err => {
          setError(err?.response?.data?.detail || err?.message || "Analysis failed.");
          setStage("error");
        });
    } else {
      setStage("idle");
    }
  }, [uploadRes]);

  const handleReset = useCallback(() => {
    setStage("idle");
    setFileInfo(null);
    setUploadRes(null);
    setAnalysis(null);
    setError(null);
    setScanStep(0);
    setScanProgress(0);
    setShowPreview(false);
  }, []);

  const handleCopy = useCallback(() => {
    if (!analysis) return;
    const text = [
      `ATS Score: ${analysis.atsScore}/100`,
      `Resume Strength: ${analysis.resumeStrengthScore}/100`,
      `Skills Match: ${analysis.skillsMatch}/100`,
      `Project Impact: ${analysis.projectImpact}/100`,
      `Experience Quality: ${analysis.experienceQuality}/100`,
      "",
      "Strengths:",
      ...analysis.strengths.map(s => `  ✓ ${s}`),
      "",
      "Improvements:",
      ...analysis.corrections.map(c => `  • ${c}`),
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [analysis]);

  const handleDownload = useCallback(() => {
    if (!analysis) return;
    const report = {
      fileName: fileInfo?.name || "resume",
      analyzedAt: new Date().toISOString(),
      scores: {
        ats: analysis.atsScore,
        strength: analysis.resumeStrengthScore,
        skillsMatch: analysis.skillsMatch,
        projectImpact: analysis.projectImpact,
        experienceQuality: analysis.experienceQuality,
      },
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      missingKeywords: analysis.missingKeywords,
      weakSections: analysis.weakSections,
      corrections: analysis.corrections,
      improvedSummary: analysis.improvedSummary,
      exactWeakAreas: analysis.exactWeakAreas,
      improvementPlan: analysis.improvementPlan,
      nextActions: analysis.nextActions,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resume-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analysis, fileInfo]);

  // ─── IDLE STATE ──────────────────────────────────────────────────────────
  if (stage === "idle") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-full">
        <div className="mx-auto max-w-3xl space-y-6 py-6">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6C4CF1]/20 to-[#8B5CF6]/20 shadow-inner">
              <Brain size={26} className="text-[#6C4CF1]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Resume Analyzer</h1>
            <p className="mt-1 text-sm text-[#6B7280]">AI-powered ATS scan & optimization report</p>
          </div>

          <DropZone onFile={handleFileSelected} disabled={false} />

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Shield, label: "ATS Score", desc: "Parse against job standards" },
              { icon: Target, label: "Weak Areas", desc: "Pinpoint missing keywords" },
              { icon: Sparkles, label: "Improvements", desc: "AI rewrite suggestions" },
            ].map(({ icon: Icon, label, desc }) => (
              <Card key={label} className="p-4 text-center">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F7FA]">
                  <Icon size={16} className="text-[#6C4CF1]" />
                </div>
                <p className="text-xs font-bold text-[#111827]">{label}</p>
                <p className="mt-0.5 text-[10px] text-[#6B7280]">{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── UPLOADING STATE ─────────────────────────────────────────────────────
  if (stage === "uploading") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-full">
        <div className="mx-auto max-w-md space-y-6 py-20 text-center">
          <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6C4CF1] text-white shadow-lg shadow-[#6C4CF1]/30">
              <Upload size={26} />
            </div>
          </motion.div>
          <div>
            <p className="text-lg font-bold text-[#111827]">Uploading resume...</p>
            {fileInfo && (
              <p className="mt-1 text-sm text-[#6B7280]">{fileInfo.name} ({formatSize(fileInfo.size)})</p>
            )}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#E8ECF1]">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="h-full rounded-full bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6]"
            />
          </div>
          <p className="text-xs text-[#9CA3AF]">Extracting and saving resume text...</p>
        </div>
      </motion.div>
    );
  }

  // ─── ANALYZING STATE ─────────────────────────────────────────────────────
  if (stage === "analyzing") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-full">
        <div className="mx-auto max-w-xl space-y-6 py-10">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6C4CF1]/20 to-[#8B5CF6]/20">
              <Sparkles size={24} className="text-[#6C4CF1]" />
            </div>
            <h2 className="text-lg font-bold text-[#111827]">AI is scanning your resume</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Analyzing against ATS standards and job market requirements
            </p>
          </div>

          <ScanningPipeline currentStep={scanStep} progress={scanProgress} />

          {/* Overall progress */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-[#6B7280]">Overall progress</span>
              <span className="text-xs font-bold text-[#6C4CF1]">
                {Math.min(Math.round(((scanStep * 100 + scanProgress) / SCAN_STEPS.length)), 100)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#E8ECF1]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(((scanStep * 100 + scanProgress) / SCAN_STEPS.length), 100)}%` }}
                className="h-full rounded-full bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6]"
              />
            </div>
          </Card>
        </div>
      </motion.div>
    );
  }

  // ─── ERROR STATE ─────────────────────────────────────────────────────────
  if (stage === "error") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-full">
        <div className="mx-auto max-w-lg space-y-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FEE2E2]">
            <AlertTriangle size={26} className="text-[#EF4444]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#111827]">Analysis Failed</h2>
            <p className="mt-2 text-sm text-[#6B7280]">{error}</p>
          </div>
          <div className="flex justify-center gap-3">
            <button onClick={handleRetry}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6C4CF1]/20 transition hover:shadow-xl"
            ><RefreshCw size={15} /> Retry Analysis</button>
            <button onClick={handleReset}
              className="flex items-center gap-1.5 rounded-xl border border-[#E8ECF1] px-5 py-2.5 text-sm font-semibold text-[#6B7280] transition hover:bg-[#F5F7FA]"
            ><RotateCcw size={15} /> Upload New Resume</button>
          </div>
          {fileInfo && (
            <p className="text-xs text-[#9CA3AF]">File: {fileInfo.name}</p>
          )}
        </div>
      </motion.div>
    );
  }

  // ─── RESULTS STATE ───────────────────────────────────────────────────────
  if (stage === "results" && analysis) {
    const mainScore = Math.round((analysis.atsScore + analysis.resumeStrengthScore + analysis.skillsMatch + analysis.projectImpact + analysis.experienceQuality) / 5);

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-full">
        <div className="mx-auto max-w-5xl space-y-5 py-4">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#22C55E]/20 to-[#22C55E]/10">
                <CheckCircle2 size={24} className="text-[#22C55E]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#111827]">Analysis Complete</h1>
                <p className="text-xs text-[#6B7280]">
                  {fileInfo?.name} &middot; {formatSize(fileInfo?.size || 0)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleRetry}
                className="flex items-center gap-1 rounded-lg border border-[#E8ECF1] px-3 py-1.5 text-xs font-semibold text-[#6B7280] transition hover:bg-[#F5F7FA]"
              ><RefreshCw size={12} /> Retry</button>
              <button onClick={handleReset}
                className="flex items-center gap-1 rounded-lg border border-[#E8ECF1] px-3 py-1.5 text-xs font-semibold text-[#6B7280] transition hover:bg-[#F5F7FA]"
              ><Upload size={12} /> New</button>
              <button onClick={handleCopy}
                className="flex items-center gap-1 rounded-lg border border-[#E8ECF1] px-3 py-1.5 text-xs font-semibold text-[#6B7280] transition hover:bg-[#F5F7FA]"
              >{copied ? <CheckCircle2 size={12} className="text-[#22C55E]" /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}</button>
              <button onClick={handleDownload}
                className="flex items-center gap-1 rounded-lg border border-[#E8ECF1] px-3 py-1.5 text-xs font-semibold text-[#6B7280] transition hover:bg-[#F5F7FA]"
              ><Download size={12} /> Report</button>
            </div>
          </div>

          {/* Overall Score Banner */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={cn(
              "overflow-hidden border-2",
              mainScore >= 70 ? "border-[#22C55E]/30" : mainScore >= 50 ? "border-[#F59E0B]/30" : "border-[#EF4444]/30",
            )}>
              <div className={cn(
                "px-6 py-5",
                mainScore >= 70 ? "bg-gradient-to-r from-[#22C55E]/10 to-[#22C55E]/5" :
                mainScore >= 50 ? "bg-gradient-to-r from-[#F59E0B]/10 to-[#F59E0B]/5" :
                "bg-gradient-to-r from-[#EF4444]/10 to-[#EF4444]/5",
              )}>
                <div className="flex items-center gap-5">
                  <ScoreRing score={mainScore} label="Overall Score" size="lg" />
                  <div>
                    <p className="text-lg font-bold text-[#111827]">
                      {mainScore >= 80 ? "Excellent Resume" : mainScore >= 60 ? "Good Resume" : mainScore >= 40 ? "Needs Improvement" : "Requires Major Overhaul"}
                    </p>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {mainScore >= 80 ? "Your resume is well-optimized for ATS systems. Minor tweaks can make it exceptional." :
                       mainScore >= 60 ? "Your resume has good elements but needs optimization for better ATS performance." :
                       mainScore >= 40 ? "Several areas need attention to make your resume competitive." :
                       "Major improvements needed to pass ATS screening."}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Score Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <ScoreRing score={analysis.atsScore} label="ATS Score" size="sm" />
            <ScoreRing score={analysis.resumeStrengthScore} label="Resume Strength" size="sm" />
            <ScoreRing score={analysis.skillsMatch} label="Skills Match" size="sm" />
            <ScoreRing score={analysis.projectImpact} label="Project Impact" size="sm" />
            <ScoreRing score={analysis.experienceQuality} label="Experience Quality" size="sm" />
          </div>

          {/* Detailed Scores */}
          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-[#6B7280] uppercase tracking-wider">
              <BarChart3 size={13} /> Score Breakdown
            </h3>
            <div className="space-y-2.5">
              <ScoreBar label="ATS Compatibility" score={analysis.atsScore} />
              <ScoreBar label="Resume Structure & Content" score={analysis.resumeStrengthScore} />
              <ScoreBar label="Skills & Keyword Alignment" score={analysis.skillsMatch} />
              <ScoreBar label="Project Descriptions & Impact" score={analysis.projectImpact} />
              <ScoreBar label="Experience & Achievements" score={analysis.experienceQuality} />
            </div>
          </Card>

          {/* Strengths & Weaknesses */}
          <div className="grid gap-4 md:grid-cols-2">
            <motion.div initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              <Card className="h-full border-l-4 border-l-[#22C55E] p-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#22C55E] uppercase tracking-wider">
                  <Award size={13} /> Strengths
                </h4>
                <ul className="space-y-1">
                  {analysis.strengths.map((s, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.04 }}
                      className="flex items-start gap-1.5 text-sm text-[#374151]"
                    ><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-[#22C55E]" /> {s}</motion.li>
                  ))}
                </ul>
              </Card>
            </motion.div>
            <motion.div initial={{ x: 16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
              <Card className="h-full border-l-4 border-l-[#EF4444] p-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#EF4444] uppercase tracking-wider">
                  <XCircle size={13} /> Weaknesses
                </h4>
                <ul className="space-y-1">
                  {analysis.weaknesses.map((w, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.04 }}
                      className="flex items-start gap-1.5 text-sm text-[#374151]"
                    ><AlertTriangle size={13} className="mt-0.5 shrink-0 text-[#EF4444]" /> {w}</motion.li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          </div>

          {/* Missing Keywords */}
          {analysis.missingKeywords.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#F59E0B] uppercase tracking-wider">
                  <Target size={13} /> Missing Keywords
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.missingKeywords.map((kw, i) => (
                    <span key={i} className="rounded-full bg-[#FEF3C7] px-2.5 py-1 text-xs font-medium text-[#92400E]">{kw}</span>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Weak Sections */}
          {analysis.weakSections.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="p-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#EF4444] uppercase tracking-wider">
                  <AlertTriangle size={13} /> Weak Sections
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.weakSections.map((ws, i) => (
                    <span key={i} className="rounded-full bg-[#FEE2E2] px-2.5 py-1 text-xs font-medium text-[#991B1B]">{ws}</span>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Exact Weak Areas */}
          {analysis.exactWeakAreas.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="p-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#6C4CF1] uppercase tracking-wider">
                  <Search size={13} /> Exact Weak Areas
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.exactWeakAreas.map((wa, i) => (
                    <span key={i} className="rounded-full bg-[#6C4CF1]/10 px-2.5 py-1 text-xs font-medium text-[#6C4CF1]">{wa}</span>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Before vs After */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="overflow-hidden border border-[#6C4CF1]/20">
              <div className="bg-gradient-to-r from-[#6C4CF1]/10 to-[#8B5CF6]/10 px-5 py-3">
                <h3 className="flex items-center gap-1.5 text-xs font-bold text-[#6C4CF1] uppercase tracking-wider">
                  <Sparkles size={13} /> AI-Improved Summary
                </h3>
              </div>
              <div className="p-5">
                <p className="text-sm leading-relaxed text-[#374151]">{analysis.improvedSummary}</p>
              </div>
            </Card>
          </motion.div>

          {/* Corrections */}
          {analysis.corrections.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Card className="p-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#3B82F6] uppercase tracking-wider">
                  <ListChecks size={13} /> Corrections & Fixes
                </h4>
                <ul className="space-y-1.5">
                  {analysis.corrections.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#374151]">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#3B82F6]/10 text-[9px] font-bold text-[#3B82F6]">{i + 1}</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          )}

          {/* Improvement Plan */}
          {analysis.improvementPlan.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="p-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#6C4CF1] uppercase tracking-wider">
                  <Lightbulb size={13} /> Improvement Plan
                </h4>
                <ol className="space-y-1.5">
                  {analysis.improvementPlan.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#374151]">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6C4CF1] text-[9px] font-bold text-white">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </Card>
            </motion.div>
          )}

          {/* Next Actions */}
          {analysis.nextActions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <Card className="border-2 border-[#22C55E]/20 bg-gradient-to-br from-[#22C55E]/5 to-[#22C55E]/[0.02] p-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#22C55E] uppercase tracking-wider">
                  <CheckCircle2 size={13} /> Next Actions
                </h4>
                <ul className="space-y-1.5">
                  {analysis.nextActions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#374151]">
                      <ChevronRight size={13} className="mt-0.5 shrink-0 text-[#22C55E]" />
                      {a}
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          )}

          {/* Bottom Actions */}
          <div className="flex flex-wrap justify-center gap-3 pt-2 pb-6">
            <button onClick={handleRetry}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6C4CF1]/20 transition hover:shadow-xl"
            ><RefreshCw size={15} /> Retry Analysis</button>
            <button onClick={handleReset}
              className="flex items-center gap-1.5 rounded-xl border border-[#E8ECF1] px-5 py-2.5 text-sm font-semibold text-[#6B7280] transition hover:bg-[#F5F7FA]"
            ><Upload size={15} /> Upload New Resume</button>
            <button onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-xl border border-[#E8ECF1] px-5 py-2.5 text-sm font-semibold text-[#6B7280] transition hover:bg-[#F5F7FA]"
            >{copied ? <CheckCircle2 size={15} className="text-[#22C55E]" /> : <Copy size={15} />} {copied ? "Copied!" : "Copy Suggestions"}</button>
            <button onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-xl border border-[#E8ECF1] px-5 py-2.5 text-sm font-semibold text-[#6B7280] transition hover:bg-[#F5F7FA]"
            ><Download size={15} /> Download Report</button>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
}
