import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Mic, MicOff, Video, VideoOff, Send,
  Loader2, CheckCircle2, XCircle, AlertTriangle, Sparkles,
  Brain, BarChart3, Award, Clock, Volume2,
  Square, RefreshCw, MessageSquare, FileText, Play,
  ArrowRight, RotateCcw, Monitor,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { cn } from "../../utils/cn";
import {
  startInterview as apiStartInterview,
  submitAnswer as apiSubmitAnswer,
  analyzeInterview as apiAnalyze,
  uploadRecording as apiUploadRecording,
  listSessions as apiListSessions,
  resumeSession as apiResumeSession,
  synthesizeSpeech as apiSynthesizeSpeech,
  transcribeAudio as apiTranscribeAudio,
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

function PageShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6C4CF1]">
            PLACEMENTS / AI MOCK INTERVIEW
          </p>
          <h2 className="mt-1 text-[28px] font-bold tracking-tight text-[#111827]">{title}</h2>
          <p className="mt-2 text-sm text-[#6B7280]">{subtitle}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function AiAvatar({ isSpeaking, isListening }: { isSpeaking: boolean; isListening: boolean }) {
  const active = isSpeaking || isListening;
  return (
    <div className="relative flex items-center justify-center">
      <div className={cn(
        "relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] shadow-lg",
        active && "shadow-[#6C4CF1]/40",
      )}>
        <Brain size={28} className="text-white" />
        {active && (
          <span className="absolute inset-0 animate-ping rounded-full bg-[#6C4CF1]/30" />
        )}
      </div>
      {isSpeaking && (
        <div className="absolute -bottom-1 flex gap-0.5">
          <span className="h-2 w-1 animate-bounce rounded-full bg-[#6C4CF1]" style={{ animationDelay: "0ms" }} />
          <span className="h-3 w-1 animate-bounce rounded-full bg-[#6C4CF1]" style={{ animationDelay: "150ms" }} />
          <span className="h-2 w-1 animate-bounce rounded-full bg-[#6C4CF1]" style={{ animationDelay: "300ms" }} />
        </div>
      )}
    </div>
  );
}

function ScoreGauge({ label, score, color }: { label: string; score: number; color: string }) {
  const r = 28; const c = 2 * Math.PI * r; const o = c - (score / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#E8ECF1" strokeWidth="5" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={o} transform="rotate(-90 36 36)" className="transition-all duration-1000" />
        <text x="36" y="36" textAnchor="middle" dominantBaseline="central" className="text-base font-bold" fill={color}>{score}</text>
      </svg>
      <span className="text-[10px] font-medium text-[#6B7280] text-center leading-tight max-w-16">{label}</span>
    </div>
  );
}

function AnalysisCard({ analysis }: { analysis: InterviewAnalysis }) {
  const sc = (s: number) => s >= 80 ? "#22C55E" : s >= 60 ? "#F59E0B" : "#EF4444";
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        <ScoreGauge label="Communication" score={analysis.communicationScore} color={sc(analysis.communicationScore)} />
        <ScoreGauge label="Confidence" score={analysis.confidenceScore} color={sc(analysis.confidenceScore)} />
        <ScoreGauge label="Clarity" score={analysis.clarityScore} color={sc(analysis.clarityScore)} />
        <ScoreGauge label="Technical" score={analysis.technicalScore} color={sc(analysis.technicalScore)} />
        <ScoreGauge label="Project" score={analysis.projectKnowledgeScore} color={sc(analysis.projectKnowledgeScore)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#22C55E] uppercase tracking-wider">
            <Award size={14} /> Strengths
          </h4>
          <ul className="space-y-1">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm text-[#374151]">
                <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-[#22C55E]" /> {s}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#EF4444] uppercase tracking-wider">
            <XCircle size={14} /> Weaknesses
          </h4>
          <ul className="space-y-1">
            {analysis.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm text-[#374151]">
                <AlertTriangle size={12} className="mt-0.5 shrink-0 text-[#EF4444]" /> {w}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {analysis.exactWeakAreas.length > 0 && (
        <Card className="p-4">
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#F59E0B] uppercase tracking-wider">
            <BarChart3 size={14} /> Areas to Improve
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {analysis.exactWeakAreas.map((a, i) => (
              <span key={i} className="rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-medium text-[#92400E]">{a}</span>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <h4 className="mb-2 text-xs font-bold text-[#6C4CF1] uppercase tracking-wider">Grammar & Language</h4>
        <p className="text-sm leading-relaxed text-[#374151]">{analysis.grammarFeedback}</p>
      </Card>

      <Card className="border border-[#6C4CF1]/20 bg-gradient-to-br from-[#6C4CF1]/5 to-[#8B5CF6]/5 p-4">
        <h4 className="mb-2 text-xs font-bold text-[#6C4CF1] uppercase tracking-wider">Ideal Answer</h4>
        <p className="text-sm leading-relaxed text-[#374151]">{analysis.idealAnswer}</p>
      </Card>

      <Card className="p-4">
        <h4 className="mb-2 text-xs font-bold text-[#3B82F6] uppercase tracking-wider">Follow-up to Prepare</h4>
        <p className="text-sm leading-relaxed text-[#374151]">{analysis.followUpQuestion}</p>
      </Card>

      <Card className="p-4">
        <h4 className="mb-2 text-xs font-bold text-[#6C4CF1] uppercase tracking-wider">Improvement Plan</h4>
        <ol className="space-y-1.5">
          {analysis.improvementPlan.map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[#374151]">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6C4CF1] text-[10px] font-bold text-white">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </Card>

      <Card className="border-2 border-[#6C4CF1]/30 bg-gradient-to-br from-[#6C4CF1]/10 to-[#8B5CF6]/10 p-5 text-center">
        <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-[#6C4CF1]">Final Verdict</h4>
        <p className="text-sm leading-relaxed text-[#1F2937]">{analysis.finalVerdict}</p>
      </Card>
    </div>
  );
}

const LOADING_TIPS = [
  { icon: Brain, text: "AI is analyzing your profile..." },
  { icon: Sparkles, text: "Crafting personalized questions..." },
  { icon: BarChart3, text: "Calibrating evaluation criteria..." },
];

export function AiMockInterview() {
  const [stage, setStage] = useState<InterviewStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [mediaMode, setMediaMode] = useState<"audio-video" | "audio-only" | "text-only">("text-only");
  const [role, setRole] = useState("Software Engineer");
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
  const isBrowserSpeechSupported = typeof window !== "undefined" && ("speechSynthesis" in window);

  useEffect(() => {
    apiListSessions().then(setSessions).catch(() => {});
  }, []);

  useEffect(() => {
    if (!navigator.mediaDevices) { setMediaMode("text-only"); setPermissionsResolved(true); return; }
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        streamRef.current = s; if (videoRef.current) videoRef.current.srcObject = s;
        setMediaMode("audio-video"); setPermissionsResolved(true);
      } catch {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = s; setMediaMode("audio-only");
          setPermissionWarning("Camera unavailable, continuing in audio mode."); setPermissionsResolved(true);
        } catch {
          setMediaMode("text-only"); setPermissionWarning("Microphone unavailable, continuing in text mode.");
          setPermissionsResolved(true);
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
          const status = await (await import("../../api/interview")).getSessionStatus(resumeSid);
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
        const status = await (await import("../../api/interview")).getSessionStatus(resumeSid);
        setQaHistory((status.answers || []).filter(Boolean).map((a: any, i: number) => ({
          question: (status.questions || [])[i] || { id: i + 1, type: "general", question: "", category: "" },
          answer: a.text || "",
          score: a.analysis?.questionScore,
          feedback: a.analysis?.feedback,
        })));
      } else {
        const res: StartInterviewResponse = await apiStartInterview({
          role, interview_type: mediaMode === "text-only" ? "text" : "audio",
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
  }, [role, mediaMode, speakQuestion]);

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
    stopMediaTracks();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    stopSpeaking();
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (interviewTimerRef.current) clearInterval(interviewTimerRef.current);
    setStage("idle"); setSessionId(null); setCurrentQuestion(null); setQuestionNumber(0);
    setQaHistory([]); setTranscript(""); setAnalysis(null); setOverallScore(0);
    setFeedback(null); setError(null); setLastScore(null); setLastFeedback(""); setInterviewTimer(0);
  }, [stopMediaTracks, stopSpeaking]);

  if (stage === "idle") {
    return (
      <PageShell title="AI Mock Interview" subtitle="Practice interviews with AI-powered voice & camera feedback.">
        <div className="space-y-6">
          {!permissionsResolved && navigator.mediaDevices && (
            <Card className="p-4 text-center">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#6C4CF1]" />
              <p className="mt-1.5 text-xs text-[#6B7280]">Checking camera and microphone...</p>
            </Card>
          )}

          {permissionWarning && (
            <Card className="border-2 border-[#F59E0B]/30 bg-[#FEF3C7]/20 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#F59E0B]" />
                <p className="text-xs font-semibold text-[#92400E]">{permissionWarning}</p>
              </div>
            </Card>
          )}

          {error && (
            <Card className="border-2 border-[#EF4444]/30 bg-[#FEE2E2]/20 p-3">
              <div className="flex items-start gap-2">
                <XCircle size={16} className="mt-0.5 shrink-0 text-[#EF4444]" />
                <div className="flex-1">
                  <p className="text-xs text-[#991B1B]">{error}</p>
                  <button onClick={() => setError(null)} className="mt-1 text-xs font-semibold text-[#EF4444] underline">Dismiss</button>
                </div>
              </div>
            </Card>
          )}

          {mediaMode === "audio-video" && (
            <div className="overflow-hidden rounded-xl bg-black">
              <video ref={videoRef} autoPlay muted playsInline className="mx-auto max-h-56 w-full object-cover" />
            </div>
          )}

          <Card className="p-5">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#374151]">Target Role</label>
                <input type="text" value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="mt-1 w-full rounded-lg border border-[#E8ECF1] px-3 py-2 text-sm outline-none focus:border-[#6C4CF1] focus:ring-1 focus:ring-[#6C4CF1]"
                />
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-[#6B7280]">
                {mediaMode === "audio-video" && <span className="flex items-center gap-1"><Camera size={12} className="text-[#22C55E]" /> Camera + Mic</span>}
                {mediaMode === "audio-only" && <span className="flex items-center gap-1"><Mic size={12} className="text-[#22C55E]" /> Mic only</span>}
                {mediaMode === "text-only" && <span className="flex items-center gap-1"><MessageSquare size={12} className="text-[#F59E0B]" /> Text only</span>}
              </div>

              <button onClick={() => handleStartInterview()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6C4CF1]/20 transition hover:shadow-xl"
              ><Sparkles size={15} /> Start AI Mock Interview</button>
            </div>
          </Card>

          {sessions.filter(s => s.status === "in_progress").length > 0 && (
            <Card className="border-2 border-[#3B82F6]/20 bg-[#DBEAFE]/10 p-4">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#3B82F6] uppercase tracking-wider">
                <RotateCcw size={13} /> Resume Incomplete Session
              </h4>
              <div className="space-y-1.5">
                {sessions.filter(s => s.status === "in_progress").slice(0, 3).map(s => (
                  <button key={s.session_id} onClick={() => handleStartInterview(s.session_id)}
                    className="flex w-full items-center justify-between rounded-lg border border-[#DBEAFE] bg-white px-3 py-2 text-left text-xs transition hover:border-[#3B82F6]"
                  >
                    <span className="font-medium text-[#111827]">{s.role || "Interview"}</span>
                    <span className="text-[#6B7280]">{s.answer_count}/{s.question_count} answered</span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {sessions.length > 0 && (
            <div>
              <button onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1 text-xs font-semibold text-[#6C4CF1]"
              ><Clock size={13} /> History ({sessions.length})</button>
              <AnimatePresence>{showHistory && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 space-y-1.5 overflow-hidden">
                  {sessions.map(s => (
                    <Card key={s.session_id} className="flex items-center justify-between p-3">
                      <div>
                        <p className="text-sm font-semibold text-[#111827]">{s.role || "General"}</p>
                        <p className="text-xs text-[#6B7280]">{s.answer_count}/{s.question_count} answered &bull; {s.started_at ? new Date(s.started_at).toLocaleDateString() : ""}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.status === "in_progress" && (
                          <button onClick={() => handleStartInterview(s.session_id)}
                            className="rounded-lg bg-[#DBEAFE] px-2.5 py-1 text-xs font-semibold text-[#3B82F6] transition hover:bg-[#BFDBFE]"
                          >Resume</button>
                        )}
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          s.status === "completed" ? "bg-[#DCFCE7] text-[#22C55E]" : "bg-[#DBEAFE] text-[#3B82F6]"
                        )}>{s.status}</span>
                        {s.score !== null && <span className="text-sm font-bold text-[#6C4CF1]">{s.score}</span>}
                      </div>
                    </Card>
                  ))}
                </motion.div>
              )}</AnimatePresence>
            </div>
          )}
        </div>
      </PageShell>
    );
  }

  if (stage === "starting") {
    const tip = LOADING_TIPS[loadingMsgIdx % LOADING_TIPS.length] || LOADING_TIPS[0];
    return (
      <PageShell title="AI Mock Interview" subtitle="Preparing your personalized interview...">
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <AiAvatar isSpeaking={false} isListening={false} />
            <div className="flex items-center justify-center gap-2">
              <tip.icon size={16} className="text-[#6C4CF1]" />
              <p className="text-base font-semibold text-[#111827]">{tip.text}</p>
            </div>
            <div className="flex gap-1 justify-center">
              {[0, 1, 2].map(i => (
                <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#6C4CF1]"
                  style={{ animationDelay: `${i * 200}ms`, animationDuration: "0.8s" }} />
              ))}
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  const progressPct = totalQuestions > 0 ? Math.round((qaHistory.length / totalQuestions) * 100) : 0;

  return (
    <PageShell title="AI Mock Interview" subtitle={
      stage === "results" ? "Your interview analysis is ready" :
      stage === "completed" ? "All questions answered &mdash; ready for analysis" :
      `Question ${questionNumber} of ${totalQuestions}`
    }>
      {error && (
        <Card className="border-2 border-[#EF4444]/30 bg-[#FEE2E2]/20 p-3">
          <div className="flex items-start gap-2">
            <XCircle size={16} className="mt-0.5 shrink-0 text-[#EF4444]" />
            <div className="flex-1">
              <p className="text-xs text-[#991B1B]">{error}</p>
              <div className="mt-1.5 flex gap-2">
                <button onClick={() => setError(null)} className="text-xs font-semibold text-[#EF4444] underline">Dismiss</button>
                {(stage === "question" || stage === "completed") && (
                  <button onClick={handleNewInterview} className="text-xs font-semibold text-[#6C4CF1] underline">Start Over</button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-3">

        <div className="lg:col-span-2 space-y-5">

          {(stage === "question" || stage === "recording" || stage === "processing") && currentQuestion && (
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AiAvatar isSpeaking={aiSpeaking} isListening={stage === "recording"} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#111827]">AI Interviewer</span>
                      {aiSpeaking && (
                        <span className="flex items-center gap-1 text-[10px] text-[#6C4CF1]">
                          <Volume2 size={11} className="animate-pulse" /> Speaking
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5 mt-0.5">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        currentQuestion.difficulty === "easy" ? "bg-[#DCFCE7] text-[#22C55E]" :
                        currentQuestion.difficulty === "hard" ? "bg-[#FEE2E2] text-[#EF4444]" :
                        "bg-[#FEF3C7] text-[#F59E0B]"
                      )}>{currentQuestion.difficulty?.toUpperCase() || "MEDIUM"}</span>
                      <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-medium text-[#6B7280]">
                        {currentQuestion.category || currentQuestion.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-base font-semibold leading-relaxed text-[#111827]">{currentQuestion.question}</p>

              <div className="mt-3 flex items-center gap-2">
                {!aiSpeaking && stage === "question" && (
                  <button onClick={() => speakQuestion(currentQuestion.question)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-[#6C4CF1] transition hover:bg-[#F5F7FA]"
                  ><Volume2 size={13} /> Replay</button>
                )}
              </div>

              {mediaMode === "audio-video" && (
                <div className="mt-3 overflow-hidden rounded-lg bg-black">
                  <video ref={videoRef} autoPlay muted playsInline className="mx-auto max-h-36 w-full object-cover" />
                </div>
              )}

              <div className="mt-4 space-y-3">
                  {stage === "recording" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg bg-[#FEE2E2]/50 px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#EF4444]" />
                          <span className="text-xs font-semibold text-[#EF4444]">Recording</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#6B7280]">Max {formatTime(MAX_RECORDING_SECONDS)}</span>
                          <span className="text-xs font-mono text-[#6B7280]">{formatTime(recordingSeconds)}</span>
                        </div>
                      </div>
                    {transcript && (
                      <div className="rounded-lg bg-[#F5F7FA] p-3">
                        <p className="text-sm text-[#374151]">{transcript}</p>
                      </div>
                    )}
                    <button onClick={handleStopRecording}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#EF4444] px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-[#DC2626]"
                    ><Square size={14} /> Stop Recording</button>
                  </div>
                )}

                {stage === "processing" && (
                  <div className="rounded-lg bg-[#F5F7FA] py-5 text-center">
                    <Loader2 size={18} className="mx-auto animate-spin text-[#6C4CF1]" />
                    <p className="mt-1.5 text-xs font-medium text-[#6B7280]">{LOADING_MESSAGES[loadingMsgIdx % LOADING_MESSAGES.length]}</p>
                  </div>
                )}

                {stage === "question" && (
                  <button onClick={handleStartRecording}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6C4CF1]/20 transition hover:shadow-xl"
                  >{mediaMode === "text-only" ? <><MessageSquare size={15} /> Type Answer</> : <><Mic size={15} /> Record Answer</>}</button>
                )}
              </div>
            </Card>
          )}

          {stage === "question" && mediaMode === "text-only" && (
            <Card className="p-5">
              <textarea value={transcript} onChange={e => setTranscript(e.target.value)}
                placeholder="Type your answer here..."
                className="min-h-[100px] w-full rounded-lg border border-[#E8ECF1] p-3 text-sm outline-none focus:border-[#6C4CF1] focus:ring-1 focus:ring-[#6C4CF1]"
              />
              <button onClick={handleStopRecording} disabled={!transcript.trim()}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6C4CF1]/20 transition hover:shadow-xl disabled:opacity-50"
              ><Send size={15} /> Submit Answer</button>
            </Card>
          )}

          {lastScore !== null && lastFeedback && stage === "question" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-l-4 border-l-[#6C4CF1] p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Award size={14} className="text-[#6C4CF1]" />
                  <span className="text-xs font-bold text-[#6C4CF1]">Previous Answer: <span className="text-sm">{lastScore}/100</span></span>
                </div>
                <p className="text-xs text-[#6B7280]">{lastFeedback}</p>
              </Card>
            </motion.div>
          )}

          {stage === "completed" && (
            <Card className="p-6 text-center">
              <CheckCircle2 size={40} className="mx-auto text-[#22C55E]" />
              <h3 className="mt-3 text-lg font-bold text-[#111827]">All Questions Answered!</h3>
              <p className="mt-1 text-sm text-[#6B7280]">You completed all {totalQuestions} questions in {formatTime(interviewTimer)}.</p>
              <button onClick={handleAnalyze}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6C4CF1]/20 transition hover:shadow-xl"
              ><BarChart3 size={15} /> Analyze My Performance</button>
            </Card>
          )}

          {stage === "analyzing" && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <Brain className="mx-auto h-10 w-10 animate-pulse text-[#6C4CF1]" />
                <p className="text-base font-semibold text-[#111827]">{LOADING_MESSAGES[loadingMsgIdx % LOADING_MESSAGES.length]}</p>
                <div className="flex gap-1 justify-center">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#6C4CF1]"
                      style={{ animationDelay: `${i * 200}ms`, animationDuration: "0.8s" }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {stage === "results" && analysis && (
            <div className="space-y-5">
              <Card className="bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] p-5 text-center text-white">
                <p className="text-xs font-medium uppercase tracking-wider opacity-80">Overall Score</p>
                <p className="mt-1 text-4xl font-bold">{overallScore}</p>
                <p className="text-xs opacity-80">/ 100</p>
                {feedback && <p className="mt-3 text-sm leading-relaxed opacity-90">{feedback}</p>}
              </Card>

              <AnalysisCard analysis={analysis} />

              <button onClick={handleNewInterview}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6C4CF1]/20 transition hover:shadow-xl"
              ><RefreshCw size={15} /> New Interview</button>
            </div>
          )}

          {qaHistory.length > 0 && stage !== "results" && (
            <Card className="p-4">
              <h4 className="mb-2 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Q&A History</h4>
              <div className="space-y-2">
                {qaHistory.map((qa, i) => (
                  <div key={i} className="rounded-lg border border-[#E8ECF1] p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-[#6C4CF1] uppercase">Q{i + 1} ({qa.question.category || qa.question.type})</p>
                      {qa.score !== undefined && <span className="text-xs font-bold text-[#6C4CF1]">{qa.score}/100</span>}
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-[#111827]">{qa.question.question}</p>
                    <p className="mt-1 text-xs text-[#374151] line-clamp-2">{qa.answer}</p>
                    {qa.feedback && <p className="mt-1 text-[10px] text-[#6B7280] italic">{qa.feedback}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="mb-2 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Progress</h4>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-[#6B7280]">{qaHistory.length}/{totalQuestions}</span>
              <span className="text-xs font-semibold text-[#6C4CF1]">{progressPct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#E8ECF1]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] transition-all duration-500"
                style={{ width: `${progressPct}%` }} />
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#6B7280]">
              <Clock size={12} /> {formatTime(interviewTimer)}
            </div>
          </Card>

          {(mediaMode === "audio-video" || mediaMode === "audio-only") && (
            <Card className="p-4">
              <h4 className="mb-2 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Devices</h4>
              <div className="space-y-1.5 text-[11px] text-[#6B7280]">
                <div className="flex items-center gap-1.5">
                  <Mic size={12} className="text-[#22C55E]" /> Mic
                </div>
                <div className="flex items-center gap-1.5">
                  <Video size={12} className={mediaMode === "audio-video" ? "text-[#22C55E]" : "text-[#EF4444]"} />
                  Camera {mediaMode === "audio-video" ? "Active" : "Off"}
                </div>
                <div className="flex items-center gap-1.5">
                  <Volume2 size={12} className="text-[#22C55E]" /> NVIDIA TTS
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageSquare size={12} className="text-[#22C55E]" /> NVIDIA ASR
                </div>
              </div>
            </Card>
          )}

          {stage !== "results" && (
            <button onClick={handleNewInterview}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#EF4444]/30 px-3 py-2 text-xs font-semibold text-[#EF4444] transition hover:bg-[#FEE2E2]/50"
            ><XCircle size={13} /> Cancel & Exit</button>
          )}
        </div>
      </div>
    </PageShell>
  );
}
