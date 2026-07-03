import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Mic, MicOff, Video, VideoOff, Send,
  Loader2, CheckCircle2, XCircle, AlertTriangle, Sparkles,
  Brain, BarChart3, Award, Clock, Volume2,
  Square, RefreshCw, MessageSquare, FileText, Play,
  ArrowRight, RotateCcw, Monitor, GraduationCap,
  UserCheck, Code2, FolderOpen, ListChecks, Lightbulb,
  Target, ChevronRight, BriefcaseBusiness,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { RoleCombobox } from "../../components/ui/RoleCombobox";
import { useSearchParams } from "react-router-dom";
import { cn } from "../../utils/cn";
import { useOptionalStudentProfile } from "../../context/StudentProfileContext";
import {
  startInterview as apiStartInterview,
  submitAnswer as apiSubmitAnswer,
  analyzeInterview as apiAnalyze,
  uploadRecording as apiUploadRecording,
  listSessions as apiListSessions,
  resumeSession as apiResumeSession,
  synthesizeSpeech as apiSynthesizeSpeech,
  transcribeAudio as apiTranscribeAudio,
  getSessionStatus,
} from "../../api/interview";
import type {
  InterviewQuestion,
  InterviewAnalysis,
  StartInterviewResponse,
  SessionListItem,
  AnswerResponse,
} from "../../api/interview";

type InterviewStage =
  | "idle" | "starting" | "question" | "recording"
  | "processing" | "completed" | "analyzing" | "results";

interface QAPair {
  question: InterviewQuestion;
  answer: string;
  score?: number;
  feedback?: string;
  recordingUrl?: string;
}

const MAX_RECORDING_SECONDS = 300;
const LOADING_MESSAGES = [
  "Analyzing your answer...",
  "Evaluating technical depth...",
  "Checking communication clarity...",
  "Reviewing project knowledge...",
  "Generating personalized feedback...",
  "Almost there...",
];

const INTERVIEW_TYPES = [
  { id: "hr", label: "HR", icon: UserCheck },
  { id: "technical", label: "Technical", icon: Code2 },
  { id: "coding", label: "Coding", icon: Monitor },
  { id: "project", label: "Project", icon: FolderOpen },
  { id: "mixed", label: "Mixed", icon: ListChecks },
] as const;

const MEDIA_MODES = [
  { id: "audio-video" as const, label: "Camera + Mic", icon: Camera, desc: "Full experience" },
  { id: "audio-only" as const, label: "Mic Only", icon: Mic, desc: "Voice only" },
  { id: "text-only" as const, label: "Text Only", icon: MessageSquare, desc: "Type answers" },
];

const DIFFICULTIES = [
  { id: "easy", label: "Easy", color: "#22C55E" },
  { id: "medium", label: "Medium", color: "#F59E0B" },
  { id: "hard", label: "Hard", color: "#EF4444" },
];

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-full">
      {children}
    </motion.div>
  );
}

function AiAvatar({ isSpeaking, isListening, size = "md" }: { isSpeaking: boolean; isListening: boolean; size?: "sm" | "md" | "lg" }) {
  const active = isSpeaking || isListening;
  const dims = size === "lg" ? "h-24 w-24" : size === "sm" ? "h-10 w-10" : "h-16 w-16";
  const iconSize = size === "lg" ? 36 : size === "sm" ? 18 : 28;
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        animate={active ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={{ duration: 2, repeat: Infinity }}
        className={cn(
          "relative flex items-center justify-center rounded-full bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] shadow-lg",
          dims,
          active && "shadow-[#6C4CF1]/40",
        )}
      >
        {isListening ? (
          <Mic size={iconSize} className="text-white" />
        ) : (
          <Brain size={iconSize} className="text-white" />
        )}
        {active && (
          <motion.span
            animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-[#6C4CF1]/20"
          />
        )}
      </motion.div>
      {isSpeaking && (
        <div className="absolute -bottom-1 flex gap-0.5">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              animate={{ height: [4, 12, 4] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              className="w-1 rounded-full bg-[#6C4CF1]"
            />
          ))}
        </div>
      )}
      {isListening && (
        <div className="absolute -bottom-1 flex gap-0.5">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              animate={{ height: [4, 14, 4] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
              className="w-1 rounded-full bg-[#EF4444]"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreGauge({ label, score, color }: { label: string; score: number; color: string }) {
  const r = 28; const c = 2 * Math.PI * r; const o = c - (score / 100) * c;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#E8ECF1" strokeWidth="5" />
        <motion.circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: o }}
          transition={{ duration: 1.2, ease: "easeOut" }} transform="rotate(-90 36 36)" />
        <text x="36" y="36" textAnchor="middle" dominantBaseline="central" className="text-base font-bold" fill={color}>{score}</text>
      </svg>
      <span className="text-[10px] font-medium text-[#6B7280] text-center leading-tight max-w-20">{label}</span>
    </motion.div>
  );
}

function MediaModeCard({ mode, selected, onSelect }: { mode: typeof MEDIA_MODES[number]; selected: boolean; onSelect: () => void }) {
  const Icon = mode.icon;
  return (
    <button onClick={onSelect}
      className={cn(
        "relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all duration-200",
        selected
          ? "border-[#6C4CF1] bg-[#6C4CF1]/5 shadow-sm"
          : "border-[#E8ECF1] bg-white hover:border-[#6C4CF1]/30 hover:shadow-sm"
      )}
    >
      <div className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
        selected ? "bg-[#6C4CF1] text-white" : "bg-[#F5F7FA] text-[#6B7280]"
      )}>
        <Icon size={15} />
      </div>
      <span className={cn("text-[10px] font-semibold", selected ? "text-[#6C4CF1]" : "text-[#6B7280]")}>{mode.label}</span>
      <span className="text-[8px] text-[#9CA3AF]">{mode.desc}</span>
      {selected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#6C4CF1]">
          <CheckCircle2 size={10} className="text-white" />
        </motion.div>
      )}
    </button>
  );
}

function AnalysisCard({ analysis }: { analysis: InterviewAnalysis }) {
  const sc = (s: number) => s >= 80 ? "#22C55E" : s >= 60 ? "#F59E0B" : "#EF4444";
  const scores = [
    { label: "Communication", score: analysis.communicationScore },
    { label: "Technical", score: analysis.technicalScore },
    { label: "Confidence", score: analysis.confidenceScore },
    { label: "Project Knowledge", score: analysis.projectKnowledgeScore },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Score rings */}
      <Card className="p-5">
        <h3 className="mb-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Performance Scores</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {scores.map(s => (
            <ScoreGauge key={s.label} label={s.label} score={s.score} color={sc(s.score)} />
          ))}
        </div>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="grid gap-3 md:grid-cols-2">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <Card className="h-full border-l-4 border-l-[#22C55E] p-4">
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#22C55E] uppercase tracking-wider">
              <Award size={14} /> Strengths
            </h4>
            <ul className="space-y-1">
              {analysis.strengths.map((s, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
                  className="flex items-start gap-1.5 text-xs text-[#374151]">
                  <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-[#22C55E]" /> {s}
                </motion.li>
              ))}
            </ul>
          </Card>
        </motion.div>
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
          <Card className="h-full border-l-4 border-l-[#EF4444] p-4">
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#EF4444] uppercase tracking-wider">
              <XCircle size={14} /> Weaknesses
            </h4>
            <ul className="space-y-1">
              {analysis.weaknesses.map((w, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
                  className="flex items-start gap-1.5 text-xs text-[#374151]">
                  <AlertTriangle size={11} className="mt-0.5 shrink-0 text-[#EF4444]" /> {w}
                </motion.li>
              ))}
            </ul>
          </Card>
        </motion.div>
      </div>

      {/* Exact Weak Areas */}
      {analysis.exactWeakAreas.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-4">
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#F59E0B] uppercase tracking-wider">
              <Target size={14} /> Areas to Improve
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {analysis.exactWeakAreas.map((a, i) => (
                <span key={i} className="rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-medium text-[#92400E]">{a}</span>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Grammar & Ideal Answer */}
      <div className="grid gap-3 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="p-4">
            <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#6C4CF1] uppercase tracking-wider">
              <FileText size={14} /> Grammar & Language
            </h4>
            <p className="text-xs leading-relaxed text-[#374151]">{analysis.grammarFeedback}</p>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border border-[#6C4CF1]/20 bg-gradient-to-br from-[#6C4CF1]/5 to-[#8B5CF6]/5 p-4">
            <h4 className="mb-1.5 text-xs font-bold text-[#6C4CF1] uppercase tracking-wider">Ideal Answer</h4>
            <p className="text-xs leading-relaxed text-[#374151]">{analysis.idealAnswer}</p>
          </Card>
        </motion.div>
      </div>

      {/* Follow-up & Improvement Plan */}
      <div className="grid gap-3 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="p-4">
            <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#3B82F6] uppercase tracking-wider">
              <ArrowRight size={14} /> Follow-up to Prepare
            </h4>
            <p className="text-xs leading-relaxed text-[#374151]">{analysis.followUpQuestion}</p>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="p-4">
            <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#6C4CF1] uppercase tracking-wider">
              <Lightbulb size={14} /> Improvement Plan
            </h4>
            <ol className="space-y-1">
              {analysis.improvementPlan.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#374151]">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#6C4CF1] text-[8px] font-bold text-white">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </Card>
        </motion.div>
      </div>

      {/* Final Verdict */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <Card className="border-2 border-[#6C4CF1]/20 bg-gradient-to-br from-[#6C4CF1]/10 to-[#8B5CF6]/10 p-5 text-center">
          <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-[#6C4CF1]">Final Verdict</h4>
          <p className="text-sm leading-relaxed text-[#1F2937]">{analysis.finalVerdict}</p>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export function AiMockInterview() {
  const [searchParams] = useSearchParams();
  const companyFromUrl = searchParams.get("company") || "";
  const roleFromUrl = searchParams.get("role") || "";
  const typeFromUrl = searchParams.get("interviewType") || "";
  const diffFromUrl = searchParams.get("difficulty") || "";

  const [stage, setStage] = useState<InterviewStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [mediaMode, setMediaMode] = useState<"audio-video" | "audio-only" | "text-only">("text-only");
  const [interviewType, setInterviewType] = useState("technical");
  const [difficulty, setDifficulty] = useState("medium");
  const profileContext = useOptionalStudentProfile();
  const prefRole = profileContext.profile?.preferred_role || "Software Engineer";
  const [role, setRole] = useState(prefRole);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [qaHistory, setQaHistory] = useState<QAPair[]>([]);
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null);
  const [overallScore, setOverallScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const sessionsFetchedRef = useRef(false);
  const [showHistory, setShowHistory] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [permissionWarning, setPermissionWarning] = useState<string | null>(null);
  const [permissionsResolved, setPermissionsResolved] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [lastFeedback, setLastFeedback] = useState<string>("");
  const [interviewTimer, setInterviewTimer] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const interviewTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const loadingIntervalRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isBrowserSpeechSupported = typeof window !== "undefined" && ("speechSynthesis" in window);

  const startedRef = useRef(false);

  useEffect(() => {
    if (companyFromUrl) {
      if (!roleFromUrl && companyFromUrl) setRole(companyFromUrl);
      if (roleFromUrl) setRole(roleFromUrl);
      if (typeFromUrl && ["technical", "behavioral", "system-design", "coding"].includes(typeFromUrl)) setInterviewType(typeFromUrl);
      if (diffFromUrl && ["easy", "medium", "hard"].includes(diffFromUrl)) setDifficulty(diffFromUrl);
    }
    if (!sessionsFetchedRef.current) {
      sessionsFetchedRef.current = true;
      apiListSessions().then(s => { setSessions(s); setSessionsLoaded(true); }).catch(() => setSessionsLoaded(true));
    }
  }, [companyFromUrl, roleFromUrl, typeFromUrl, diffFromUrl]);

  useEffect(() => {
    setPermissionsResolved(true);
    if (!navigator.mediaDevices) { setMediaMode("text-only"); return; }
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        streamRef.current = s; if (videoRef.current) videoRef.current.srcObject = s;
        setMediaMode("audio-video");
      } catch {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = s; setMediaMode("audio-only");
          setPermissionWarning("Camera unavailable, continuing in audio mode.");
        } catch {
          setMediaMode("text-only"); setPermissionWarning("Microphone unavailable, continuing in text mode.");
        }
      }
    })();
    return () => {
      if (ttsAbortRef.current) { ttsAbortRef.current.abort(); ttsAbortRef.current = null; }
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    };
  }, []);

  useEffect(() => {
    if (stage === "starting" || stage === "processing" || stage === "analyzing") {
      loadingIntervalRef.current = window.setInterval(() => {
        setLoadingMsgIdx(i => (i + 1) % LOADING_MESSAGES.length);
      }, 2500);
    } else {
      if (loadingIntervalRef.current) { clearInterval(loadingIntervalRef.current); loadingIntervalRef.current = null; }
    }
    return () => { if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current); };
  }, [stage]);

  useEffect(() => {
    if (stage === "question" || stage === "recording") {
      if (!interviewTimerRef.current) {
        interviewTimerRef.current = window.setInterval(() => setInterviewTimer(t => t + 1), 1000);
      }
    } else {
      if (interviewTimerRef.current) { clearInterval(interviewTimerRef.current); interviewTimerRef.current = null; }
    }
    return () => { if (interviewTimerRef.current) clearInterval(interviewTimerRef.current); };
  }, [stage]);

  const stopMediaTracks = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const speakWithBrowser = useCallback((text: string) => {
    if (!isBrowserSpeechSupported) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95; u.pitch = 1.0; u.volume = 1.0;
    const v = window.speechSynthesis.getVoices();
    const p = v.find(x => x.lang.startsWith("en") && x.name.includes("Google")) || v.find(x => x.lang.startsWith("en"));
    if (p) u.voice = p;
    setAiSpeaking(true);
    u.onend = () => setAiSpeaking(false); u.onerror = () => setAiSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [isBrowserSpeechSupported]);

  const speakQuestion = useCallback(async (text: string) => {
    if (!text) return;
    if (ttsAbortRef.current) ttsAbortRef.current.abort();
    const controller = new AbortController();
    ttsAbortRef.current = controller;
    try {
      setAiSpeaking(true);
      const blob = await apiSynthesizeSpeech(text, controller.signal);
      if (controller.signal.aborted) return;
      if (blob) {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        const url = URL.createObjectURL(blob);
        const a = new Audio(url); audioRef.current = a;
        a.onended = () => { setAiSpeaking(false); URL.revokeObjectURL(url); audioRef.current = null; };
        a.onerror = () => { setAiSpeaking(false); URL.revokeObjectURL(url); audioRef.current = null; speakWithBrowser(text); };
        await a.play();
      } else { speakWithBrowser(text); }
    } catch {
      if (controller.signal.aborted) return;
      setAiSpeaking(false); speakWithBrowser(text);
    }
  }, [speakWithBrowser]);

  const stopSpeaking = useCallback(() => {
    if (ttsAbortRef.current) { ttsAbortRef.current.abort(); ttsAbortRef.current = null; }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (isBrowserSpeechSupported) window.speechSynthesis.cancel();
    setAiSpeaking(false);
  }, [isBrowserSpeechSupported]);

  const startRecording = useCallback(async () => {
    if (mediaMode === "text-only") return;
    try {
      const constraints: MediaStreamConstraints = { audio: true, video: mediaMode === "audio-video" };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current && mediaMode === "audio-video") videoRef.current.srcObject = stream;
      recordingChunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus" : "video/webm";
      const r = new MediaRecorder(stream, { mimeType: mime });
      r.ondataavailable = (e) => { if (e.data.size > 0) recordingChunksRef.current.push(e.data); };
      r.start(1000); mediaRecorderRef.current = r;
      setRecordingSeconds(0);
      recordingTimerRef.current = window.setInterval(() => setRecordingSeconds(s => s + 1), 1000);
      setStage("recording");
    } catch { setMediaMode("text-only"); }
  }, [mediaMode]);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(recordingChunksRef.current, { type: "video/webm" });
          stopMediaTracks(); resolve(blob);
        };
        mediaRecorderRef.current.stop();
      } else { stopMediaTracks(); resolve(null); }
    });
  }, [stopMediaTracks]);

  const transcribeWithNvidia = useCallback(async (blob: Blob): Promise<string | null> => {
    try { return await apiTranscribeAudio(blob); } catch { return null; }
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleStartInterview = useCallback(async (resumeSid?: number) => {
    if (startedRef.current) return;
    startedRef.current = true;
    setTimeout(() => { startedRef.current = false; }, 2000);
    setError(null); setStage("starting"); setQaHistory([]); setAnalysis(null);
    setOverallScore(0); setFeedback(null); setLastScore(null); setLastFeedback("");
    setInterviewTimer(0);
    try {
      if (resumeSid) {
        setSessionId(resumeSid);
        const resume = await apiResumeSession(resumeSid);
        if (resume.is_complete || resume.status === "completed") {
          setStage("completed"); setTotalQuestions(resume.total_questions);
          setQuestionNumber(resume.total_questions);
          const status = await getSessionStatus(resumeSid);
          setQaHistory((status.answers || []).filter(Boolean).map((a: any, i: number) => ({
            question: (status.questions || [])[i] || { id: i + 1, type: "general", question: "", category: "" },
            answer: a.text || "",
            score: a.analysis?.questionScore,
            feedback: a.analysis?.feedback,
          })));
          return;
        }
        setCurrentQuestion(resume.next_question); setQuestionNumber(resume.question_number);
        setTotalQuestions(resume.total_questions); setStage("question");
        if (mediaMode !== "text-only" && resume.next_question) speakQuestion(resume.next_question.question);
        const status = await getSessionStatus(resumeSid);
        setQaHistory((status.answers || []).filter(Boolean).map((a: any, i: number) => ({
          question: (status.questions || [])[i] || { id: i + 1, type: "general", question: "", category: "" },
          answer: a.text || "",
          score: a.analysis?.questionScore,
          feedback: a.analysis?.feedback,
        })));
      } else {
        const profSkills = profileContext.profile?.skills_data || {};
        const allSkills = [
          ...(profSkills.programming_languages || []),
          ...(profSkills.frameworks || []),
          ...(profSkills.ai_skills || []),
          ...(profSkills.soft_skills || []),
        ].filter(Boolean);
        const res: StartInterviewResponse = await apiStartInterview({
          role: `${role} (${interviewType})`,
          skills: allSkills.length > 0 ? allSkills : undefined,
          interview_type: mediaMode === "text-only" ? "text" : "audio",
        });
        setSessionId(res.session_id); setCurrentQuestion(res.question);
        setQuestionNumber(res.question_number); setTotalQuestions(res.total_questions);
        setStage("question");
        if (mediaMode !== "text-only") speakQuestion(res.question.question);
      }
    } catch (err: any) {
      if (err?.code === "ECONNABORTED" || err?.message?.includes("timeout")) {
        setError("Interview start timed out. The AI service may be busy — please try again.");
      } else {
        setError(err?.response?.data?.detail || "Failed to start interview.");
      }
      setStage("idle");
    }
  }, [role, interviewType, mediaMode, speakQuestion]);

  const handleStartRecording = useCallback(async () => {
    setTranscript("");
    if (mediaMode !== "text-only") { stopSpeaking(); await startRecording(); }
    else setStage("recording");
  }, [mediaMode, startRecording, stopSpeaking]);

  const handleStopRecording = useCallback(async () => {
    setStage("processing"); stopSpeaking();
    let answerText = transcript.trim() || "[No audio captured]";
    let recordingUrl: string | undefined; let blob: Blob | null = null;

    if (mediaMode !== "text-only") blob = await stopRecording();

    if (blob) {
      const nv = await transcribeWithNvidia(blob);
      if (nv?.trim()) answerText = nv.trim();
      if (sessionId) { try { const u = await apiUploadRecording(sessionId, questionNumber, blob); recordingUrl = u.url; } catch {} }
    }

    setTranscript(answerText);

    if (currentQuestion) {
      setQaHistory(prev => [...prev, { question: currentQuestion, answer: answerText, recordingUrl }]);
    }

    if (sessionId && answerText) {
      try {
        const answerRes: AnswerResponse = await apiSubmitAnswer({
          session_id: sessionId, answer_text: answerText, question_number: questionNumber,
        });
        setLastScore(answerRes.question_score);
        setLastFeedback(answerRes.question_feedback);

        if (answerRes.is_complete) {
          setStage("completed"); setCurrentQuestion(null);
        } else if (answerRes.next_question) {
          setCurrentQuestion(answerRes.next_question);
          setQuestionNumber(answerRes.question_number);
          setStage("question");
          if (mediaMode !== "text-only") setTimeout(() => speakQuestion(answerRes.next_question!.question), 400);
        }
      } catch (err: any) {
        setError(err?.response?.data?.detail || "Failed to submit answer.");
        setStage("question");
      }
    } else { setStage("question"); }
  }, [transcript, mediaMode, stopSpeaking, sessionId, questionNumber, currentQuestion, speakQuestion, stopRecording, transcribeWithNvidia]);

  useEffect(() => {
    if (stage === "recording" && recordingSeconds >= MAX_RECORDING_SECONDS) {
      handleStopRecording();
    }
  }, [recordingSeconds, stage, handleStopRecording]);

  const handleAnalyze = useCallback(async () => {
    if (!sessionId) return; setStage("analyzing");
    try {
      const res = await apiAnalyze(sessionId);
      setAnalysis(res.analysis); setOverallScore(res.score); setFeedback(res.feedback);
      setStage("results");
      apiListSessions().then(setSessions).catch(() => {});
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Analysis failed.");
      setStage("completed");
    }
  }, [sessionId]);

  const handleNewInterview = useCallback(() => {
    startedRef.current = false;
    stopMediaTracks();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    stopSpeaking();
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (interviewTimerRef.current) clearInterval(interviewTimerRef.current);
    setStage("idle"); setSessionId(null); setCurrentQuestion(null); setQuestionNumber(0);
    setQaHistory([]); setTranscript(""); setAnalysis(null); setOverallScore(0);
    setFeedback(null); setError(null); setLastScore(null); setLastFeedback(""); setInterviewTimer(0);
  }, [stopMediaTracks, stopSpeaking]);

  const progressPct = totalQuestions > 0 ? Math.round((qaHistory.length / totalQuestions) * 100) : 0;
  const inProgressSessions = sessions.filter(s => s.status === "in_progress");

  // ─── IDLE SCREEN ──────────────────────────────────────────────────────────
  if (stage === "idle") {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl space-y-5 py-4">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto flex w-14 h-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6C4CF1]/20 to-[#8B5CF6]/20 shadow-inner mb-3">
              <Brain size={26} className="text-[#6C4CF1]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111827]">AI Mock Interview</h1>
            <p className="mt-1 text-sm text-[#6B7280]">Practice interviews with AI-powered voice & camera feedback</p>
          </div>

          {permissionWarning && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#F59E0B]">
              <AlertTriangle size={11} />
              <span>{permissionWarning}</span>
            </div>
          )}
          {error && (
            <Card className="border-2 border-[#EF4444]/30 bg-[#FEE2E2]/20 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#991B1B]">{error}</p>
                <button onClick={() => setError(null)} className="text-xs font-semibold text-[#EF4444] underline">Dismiss</button>
              </div>
            </Card>
          )}

          {companyFromUrl && (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#6C4CF1]/20 bg-[#6C4CF1]/5 px-4 py-1.5 text-xs font-semibold text-[#6C4CF1]">
              <BriefcaseBusiness size={13} /> Interview for {companyFromUrl}{roleFromUrl ? ` - ${roleFromUrl}` : ""}
            </div>
          )}

          {/* Hero setup card */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-5 py-4">
              <div className="flex items-center gap-4">
                <AiAvatar isSpeaking={false} isListening={false} size="lg" />
                <div className="text-white">
                  <p className="text-lg font-bold">Ready to practice?</p>
                  <p className="text-sm opacity-80">Configure your interview below</p>
                </div>
              </div>
            </div>
            <div className="space-y-5 p-5">
              {/* Target Role */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#374151]">Target Role</label>
                <RoleCombobox value={role} onChange={setRole} />
              </div>

              {/* Interview Type Chips */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#374151]">Interview Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {INTERVIEW_TYPES.map(t => {
                    const Icon = t.icon;
                    return (
                      <button key={t.id} onClick={() => setInterviewType(t.id)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                          interviewType === t.id
                            ? "border-[#6C4CF1] bg-[#6C4CF1]/10 text-[#6C4CF1] shadow-sm"
                            : "border-[#E8ECF1] bg-white text-[#6B7280] hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]"
                        )}
                      >
                        <Icon size={13} /> {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#374151]">Difficulty</label>
                <div className="flex gap-1.5">
                  {DIFFICULTIES.map(d => (
                    <button key={d.id} onClick={() => setDifficulty(d.id)}
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                        difficulty === d.id
                          ? "border-current bg-current/10 shadow-sm"
                          : "border-[#E8ECF1] bg-white text-[#6B7280] hover:border-current/30"
                      )}
                      style={difficulty === d.id ? { borderColor: d.color, color: d.color } : {}}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Media Mode Cards */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#374151]">Interaction Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {MEDIA_MODES.map(m => (
                    <MediaModeCard key={m.id} mode={m} selected={mediaMode === m.id} onSelect={() => setMediaMode(m.id)} />
                  ))}
                </div>
              </div>

              {/* Camera preview */}
              {mediaMode === "audio-video" && streamRef.current && (
                <div className="overflow-hidden rounded-xl bg-black">
                  <video ref={videoRef} autoPlay muted playsInline className="mx-auto max-h-44 w-full object-cover" />
                </div>
              )}

              {/* Start button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleStartInterview()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#6C4CF1]/20 transition hover:shadow-xl"
              >
                <Play size={16} /> Start AI Mock Interview
              </motion.button>
            </div>
          </Card>

          {/* Resume incomplete session */}
          {inProgressSessions.length > 0 && (
            <Card className="border border-[#3B82F6]/20 bg-[#DBEAFE]/10 p-4">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#3B82F6] uppercase tracking-wider">
                <RotateCcw size={13} /> Resume Session
              </h4>
              <div className="space-y-1.5">
                {inProgressSessions.slice(0, 3).map(s => (
                  <button key={s.session_id} onClick={() => handleStartInterview(s.session_id)}
                    className="flex w-full items-center justify-between rounded-lg border border-[#DBEAFE] bg-white px-3 py-2 text-xs transition hover:border-[#3B82F6] hover:shadow-sm"
                  >
                    <span className="font-medium text-[#111827]">{s.role || "Interview"}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#6B7280]">{s.answer_count}/{s.question_count}</span>
                      <ChevronRight size={12} className="text-[#3B82F6]" />
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Session History */}
          {sessions.length > 0 && (
            <div>
              <button onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1 text-xs font-semibold text-[#6C4CF1] transition hover:text-[#8B5CF6]"
              ><Clock size={13} /> History ({sessions.length})</button>
              <AnimatePresence>{showHistory && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 space-y-1 overflow-hidden">
                  {sessions.map(s => (
                    <div key={s.session_id} className="flex items-center justify-between rounded-lg border border-[#E8ECF1] bg-white px-3 py-2 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[#111827] truncate">{s.role || "General"}</p>
                        <p className="text-[#9CA3AF]">{s.answer_count}/{s.question_count} &bull; {s.started_at ? new Date(s.started_at).toLocaleDateString() : ""}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {s.status === "in_progress" && (
                          <button onClick={() => handleStartInterview(s.session_id)}
                            className="rounded-lg bg-[#DBEAFE] px-2 py-1 text-[10px] font-semibold text-[#3B82F6] transition hover:bg-[#BFDBFE]"
                          >Resume</button>
                        )}
                        <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-semibold",
                          s.status === "completed" ? "bg-[#DCFCE7] text-[#22C55E]" : "bg-[#DBEAFE] text-[#3B82F6]"
                        )}>{s.status === "completed" ? "Done" : "In Progress"}</span>
                        {s.score !== null && <span className="text-xs font-bold text-[#6C4CF1]">{s.score}</span>}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}</AnimatePresence>
            </div>
          )}
        </div>
      </PageShell>
    );
  }

  // ─── STARTING SCREEN ──────────────────────────────────────────────────────
  if (stage === "starting") {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <AiAvatar isSpeaking={false} isListening={false} size="lg" />
            <Loader2 size={20} className="mx-auto animate-spin text-[#6C4CF1]" />
            <p className="text-sm font-medium text-[#6B7280]">Preparing your interview...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  // ─── INTERVIEW / RECORDING / PROCESSING / COMPLETED ───────────────────────
  return (
    <PageShell>
      {error && (
        <div className="mx-auto max-w-5xl mb-4">
          <Card className="border-2 border-[#EF4444]/30 bg-[#FEE2E2]/20 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#991B1B]">{error}</p>
              <div className="flex gap-2">
                <button onClick={() => setError(null)} className="text-xs font-semibold text-[#EF4444] underline">Dismiss</button>
                {(stage === "question" || stage === "completed") && (
                  <button onClick={handleNewInterview} className="text-xs font-semibold text-[#6C4CF1] underline">Start Over</button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Three-column layout */}
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Left: AI Interviewer Panel */}
        <div className="lg:col-span-3">
          <Card className="p-4 text-center h-full">
            <div className="flex flex-col items-center gap-2 pt-2">
              <AiAvatar isSpeaking={aiSpeaking} isListening={stage === "recording"} size="md" />
              <div>
                <p className="text-sm font-bold text-[#111827]">AI Interviewer</p>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  {aiSpeaking && (
                    <span className="flex items-center gap-1 text-[10px] text-[#6C4CF1]">
                      <Volume2 size={10} className="animate-pulse" /> Speaking
                    </span>
                  )}
                  {stage === "recording" && (
                    <span className="flex items-center gap-1 text-[10px] text-[#EF4444]">
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#EF4444]" /> Listening
                    </span>
                  )}
                  {stage === "processing" && (
                    <span className="flex items-center gap-1 text-[10px] text-[#F59E0B]">
                      <Loader2 size={10} className="animate-spin" /> Evaluating
                    </span>
                  )}
                  {stage === "completed" && (
                    <span className="flex items-center gap-1 text-[10px] text-[#22C55E]">
                      <CheckCircle2 size={10} /> Complete
                    </span>
                  )}
                </div>
              </div>
              {currentQuestion && (
                <div className="flex gap-1 mt-1">
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                    currentQuestion.difficulty === "easy" ? "bg-[#DCFCE7] text-[#22C55E]" :
                    currentQuestion.difficulty === "hard" ? "bg-[#FEE2E2] text-[#EF4444]" :
                    "bg-[#FEF3C7] text-[#F59E0B]"
                  )}>{currentQuestion.difficulty?.toUpperCase() || "MEDIUM"}</span>
                  <span className="rounded-full bg-[#F3F4F6] px-1.5 py-0.5 text-[9px] font-medium text-[#6B7280]">
                    {currentQuestion.category || currentQuestion.type}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Center: Main content area */}
        <div className="lg:col-span-6 space-y-4">

          {/* Question card */}
          {(stage === "question" || stage === "recording" || stage === "processing") && currentQuestion && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={questionNumber}>
              <Card className="p-5">
                <div className="mb-1 flex items-center gap-2 text-[10px] text-[#6B7280]">
                  <span className="font-semibold text-[#6C4CF1]">Question {questionNumber}/{totalQuestions}</span>
                </div>
                <p className="text-base font-semibold leading-relaxed text-[#111827]">{currentQuestion.question}</p>

                {/* Replay button */}
                {!aiSpeaking && stage === "question" && (
                  <button onClick={() => speakQuestion(currentQuestion.question)}
                    className="mt-3 flex items-center gap-1 text-[10px] font-medium text-[#6C4CF1] hover:text-[#8B5CF6] transition"
                  ><Volume2 size={11} /> Replay question</button>
                )}
              </Card>
            </motion.div>
          )}

          {/* Recording / Processing state */}
          {stage === "recording" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-4">
                <div className="flex items-center justify-between rounded-lg bg-[#FEE2E2]/50 px-3 py-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#EF4444]" />
                    <span className="text-xs font-semibold text-[#EF4444]">Recording</span>
                    <span className="text-[10px] text-[#6B7280]">Max {formatTime(MAX_RECORDING_SECONDS)}</span>
                  </div>
                  <span className="text-xs font-mono text-[#6B7280]">{formatTime(recordingSeconds)}</span>
                </div>

                {/* Live transcript */}
                {transcript && (
                  <div className="rounded-lg bg-[#F5F7FA] p-3 mb-3">
                    <p className="text-xs text-[#374151] leading-relaxed">{transcript}</p>
                  </div>
                )}

                {mediaMode === "audio-video" && streamRef.current && (
                  <div className="overflow-hidden rounded-lg bg-black mb-3">
                    <video ref={videoRef} autoPlay muted playsInline className="mx-auto max-h-32 w-full object-cover" />
                  </div>
                )}

                <button onClick={handleStopRecording}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#EF4444] px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-[#DC2626]"
                ><Square size={14} /> Stop Recording</button>
              </Card>
            </motion.div>
          )}

          {/* Processing state */}
          {stage === "processing" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="p-5 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin text-[#6C4CF1]" />
                  <p className="text-sm font-medium text-[#6B7280]">{LOADING_MESSAGES[loadingMsgIdx % LOADING_MESSAGES.length]}</p>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Text-only input */}
          {stage === "question" && mediaMode === "text-only" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-4">
                <textarea ref={textareaRef} value={transcript} onChange={e => setTranscript(e.target.value)}
                  placeholder="Type your answer here..."
                  className="min-h-[100px] w-full rounded-lg border border-[#E8ECF1] p-3 text-sm outline-none focus:border-[#6C4CF1] focus:ring-1 focus:ring-[#6C4CF1] resize-none"
                />
                <button onClick={handleStopRecording} disabled={!transcript.trim()}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6C4CF1]/20 transition hover:shadow-xl disabled:opacity-50"
                ><Send size={15} /> Submit Answer</button>
              </Card>
            </motion.div>
          )}

          {/* Audio/video answer button */}
          {stage === "question" && mediaMode !== "text-only" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-4">
                <button onClick={handleStartRecording}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#6C4CF1]/20 transition hover:shadow-xl"
                ><Mic size={16} /> Record Answer</button>
              </Card>
            </motion.div>
          )}

          {/* Previous answer feedback */}
          {lastScore !== null && lastFeedback && stage === "question" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-l-4 border-l-[#6C4CF1] p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Award size={13} className="text-[#6C4CF1]" />
                  <span className="text-xs font-bold text-[#6C4CF1]">Previous Answer: <span className="text-sm">{lastScore}/100</span></span>
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed">{lastFeedback}</p>
              </Card>
            </motion.div>
          )}

          {/* Completed state */}
          {stage === "completed" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="p-6 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                  <CheckCircle2 size={48} className="mx-auto text-[#22C55E]" />
                </motion.div>
                <h3 className="mt-3 text-lg font-bold text-[#111827]">All Questions Answered!</h3>
                <p className="mt-1 text-sm text-[#6B7280]">Completed {totalQuestions} questions in {formatTime(interviewTimer)}</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAnalyze}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6C4CF1]/20 transition hover:shadow-xl"
                ><BarChart3 size={15} /> Analyze My Performance</motion.button>
              </Card>
            </motion.div>
          )}

          {/* Analyzing state */}
          {stage === "analyzing" && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <Brain className="mx-auto h-10 w-10 animate-pulse text-[#6C4CF1]" />
                <p className="text-base font-semibold text-[#111827]">{LOADING_MESSAGES[loadingMsgIdx % LOADING_MESSAGES.length]}</p>
                <div className="flex gap-1 justify-center">
                  {[0, 1, 2].map(i => (
                    <motion.span key={i} animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                      className="h-2 w-2 rounded-full bg-[#6C4CF1]" />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {stage === "results" && analysis && (
            <div className="space-y-4">
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] p-5 text-center text-white">
                  <p className="text-xs font-medium uppercase tracking-wider opacity-80">Overall Score</p>
                  <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 150, delay: 0.2 }}
                    className="mt-1 text-4xl font-bold">{overallScore}</motion.p>
                  <p className="text-xs opacity-80">/ 100</p>
                  {feedback && <p className="mt-3 text-sm leading-relaxed opacity-90">{feedback}</p>}
                </Card>
              </motion.div>

              <AnalysisCard analysis={analysis} />

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleNewInterview}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6C4CF1]/20 transition hover:shadow-xl"
              ><RefreshCw size={15} /> New Interview</motion.button>
            </div>
          )}
        </div>

        {/* Right: Progress + Timer + Media Status */}
        <div className="lg:col-span-3 space-y-3">
          {/* Q&A count */}
          <Card className="p-4">
            <h4 className="mb-2 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Progress</h4>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-[#6B7280]">{qaHistory.length}/{totalQuestions} answered</span>
              <span className="text-xs font-semibold text-[#6C4CF1]">{progressPct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#E8ECF1]">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
                className="h-full rounded-full bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] transition-all duration-500" />
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#6B7280]">
              <Clock size={12} /> {formatTime(interviewTimer)}
            </div>
          </Card>

          {/* Media status */}
          {(mediaMode === "audio-video" || mediaMode === "audio-only") && (
            <Card className="p-4">
              <h4 className="mb-2 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Devices</h4>
              <div className="space-y-1.5 text-[11px] text-[#6B7280]">
                <div className="flex items-center gap-1.5">
                  <Mic size={12} className="text-[#22C55E]" /> Microphone
                </div>
                <div className="flex items-center gap-1.5">
                  <Video size={12} className={mediaMode === "audio-video" ? "text-[#22C55E]" : "text-[#EF4444]"} /> Camera
                </div>
                <div className="flex items-center gap-1.5">
                  <Volume2 size={12} className="text-[#22C55E]" /> AI Voice
                </div>
              </div>
            </Card>
          )}

          {/* Exit button */}
          {stage !== "results" && (
            <button onClick={handleNewInterview}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#EF4444]/30 px-3 py-2 text-xs font-semibold text-[#EF4444] transition hover:bg-[#FEE2E2]/50"
            ><XCircle size={13} /> Cancel & Exit</button>
          )}
        </div>
      </div>

      {/* Q&A History (below the 3-column grid) */}
      {qaHistory.length > 0 && stage !== "results" && (
        <div className="mx-auto max-w-6xl mt-4">
          <Card className="p-4">
            <h4 className="mb-2 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Q&A History</h4>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {qaHistory.map((qa, i) => (
                <div key={i} className="rounded-lg border border-[#E8ECF1] p-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] font-semibold text-[#6C4CF1] uppercase">Q{i + 1}</span>
                    {qa.score !== undefined && <span className="text-xs font-bold text-[#6C4CF1]">{qa.score}/100</span>}
                  </div>
                  <p className="text-[11px] font-medium text-[#111827] line-clamp-2">{qa.question.question}</p>
                  <p className="mt-0.5 text-[10px] text-[#374151] line-clamp-2">{qa.answer}</p>
                  {qa.feedback && <p className="mt-1 text-[9px] text-[#6B7280] italic line-clamp-2">{qa.feedback}</p>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
