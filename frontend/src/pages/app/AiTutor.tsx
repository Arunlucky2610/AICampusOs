import { useRef, useState, useEffect, useCallback, memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import {
  Bot, Send, Loader2, Brain, Volume2, Mic, MicOff,
  BookOpen, Lightbulb, ClipboardList, CalendarDays,
  BarChart3, Award, Target, Clock, CheckCircle2, XCircle,
  ChevronRight, ChevronLeft, History, Star, Bookmark,
  AlertTriangle, Sparkles, GraduationCap, RefreshCw,
  ChevronDown, FileUp, MessageSquare, Download, Trash2,
  Search, Copy, Check, ListChecks, TrendingUp, BookMarked,
  Square, Plus,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { cn } from "../../utils/cn";
import {
  askDoubt as apiAskDoubt,
  explainTopic as apiExplainTopic,
  generateQuiz as apiGenerateQuiz,
  evaluateQuiz as apiEvaluateQuiz,
  createStudyPlan as apiCreateStudyPlan,
  getTutorHistory as apiGetTutorHistory,
} from "../../api/tutor";
import type {
  TutorAskResponse,
  TutorExplainResponse,
  TutorQuizResponse,
  TutorEvaluateQuizResponse,
  TutorStudyPlanResponse,
  TutorHistoryItem,
  QuizQuestion,
} from "../../api/tutor";

type Mode = "ask" | "explain" | "quiz" | "study-plan";
type TutorData = TutorAskResponse | TutorExplainResponse | TutorQuizResponse | TutorEvaluateQuizResponse | TutorStudyPlanResponse;
type ChatMessage = {
  id: string; role: "user" | "assistant"; text: string; subject?: string; topic?: string;
  data?: TutorData | Record<string, any>;
  loading?: boolean; progress?: { pct: number; label: string };
};

const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Computer Science",
  "Data Structures", "Algorithms", "Machine Learning", "Database Systems",
  "Operating Systems", "Computer Networks", "Software Engineering",
  "Artificial Intelligence", "Web Development", "Cloud Computing",
  "Cybersecurity", "Blockchain", "IoT", "DevOps",
];

const PROGRESS_LABELS = [
  "Analyzing your question...", "Searching knowledge base...",
  "Generating response...", "Formatting answer...", "Finalizing...",
];

function getDefaultExamDate(): string {
  const d = new Date(); d.setMonth(d.getMonth() + 2);
  return d.toISOString().split("T")[0];
}

function loadJSON<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function saveJSON(key: string, val: any) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

// ─── Markdown Components ──────────────────────────────────────────────────────
const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const isInline = !match && !className;
    const code = String(children).replace(/\n$/, "");
    if (isInline) return <code className="rounded bg-[#F3F4F6] px-1.5 py-0.5 text-sm font-mono text-[#6C4CF1]" {...props}>{children}</code>;
    return <CodeBlock language={match?.[1] || ""} code={code} />;
  },
  pre({ children }) { return <>{children}</>; },
  strong({ children }) { return <strong className="font-bold text-[#111827]">{children}</strong>; },
  a({ href, children }) { return <a href={href} className="text-[#6C4CF1] underline" target="_blank" rel="noreferrer">{children}</a>; },
  ul({ children }) { return <ul className="list-disc space-y-1 pl-5">{children}</ul>; },
  ol({ children }) { return <ol className="list-decimal space-y-1 pl-5">{children}</ol>; },
  li({ children }) { return <li className="text-sm leading-relaxed text-[#374151]">{children}</li>; },
  h1({ children }) { return <h1 className="mb-2 mt-4 text-lg font-bold text-[#111827]">{children}</h1>; },
  h2({ children }) { return <h2 className="mb-1.5 mt-3 text-base font-bold text-[#111827]">{children}</h2>; },
  h3({ children }) { return <h3 className="mb-1 mt-2 text-sm font-bold text-[#111827]">{children}</h3>; },
  p({ children }) { return <p className="mb-2 text-sm leading-relaxed text-[#374151] last:mb-0">{children}</p>; },
  table({ children }) { return <div className="my-2 overflow-x-auto rounded-lg border border-[#E8ECF1]"><table className="w-full text-xs">{children}</table></div>; },
  thead({ children }) { return <thead className="bg-[#F5F7FA]">{children}</thead>; },
  th({ children }) { return <th className="border-b border-[#E8ECF1] px-3 py-2 text-left font-semibold text-[#374151]">{children}</th>; },
  td({ children }) { return <td className="border-b border-[#E8ECF1] px-3 py-2 text-[#374151]">{children}</td>; },
  blockquote({ children }) { return <blockquote className="border-l-4 border-[#6C4CF1] bg-[#F5F7FA] py-1.5 pl-3 italic text-[#6B7280]">{children}</blockquote>; },
};

// ─── CodeBlock with Copy ──────────────────────────────────────────────────────
const CodeBlock = memo(function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }, [code]);
  return (
    <div className="my-2 overflow-hidden rounded-lg border border-[#374151] bg-[#1F2937]">
      <div className="flex items-center justify-between bg-[#374151] px-3 py-1.5">
        <span className="text-[10px] font-medium text-[#9CA3AF]">{language || "code"}</span>
        <button onClick={handleCopy} className="flex items-center gap-1 text-[10px] text-[#9CA3AF] transition hover:text-white">
          {copied ? <Check size={10} /> : <Copy size={10} />}{copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-sm leading-relaxed text-[#E5E7EB] font-mono"><code>{code}</code></pre>
    </div>
  );
});

// ─── Formula renderer (simple $$...$$ / $...$ support) ────────────────────────
function renderFormulas(text: string): { text: string; hasFormula: boolean } {
  let hasFormula = false;
  let result = text.replace(/\$\$(.+?)\$\$/gs, (_, m) => { hasFormula = true; return `<span class="formula-block">${m}</span>`; });
  result = result.replace(/\$(.+?)\$/g, (_, m) => { hasFormula = true; return `<span class="formula-inline">${m}</span>`; });
  return { text: result, hasFormula };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const LoadingDots = memo(function LoadingDots() {
  return <span className="inline-flex gap-1">{[0,1,2].map(i => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#6C4CF1]" style={{animationDelay:`${i*150}ms`}} />)}</span>;
});

const ProgressBar = memo(function ProgressBar({ pct, label }: { pct: number; label: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] text-[#6B7280]"><span>{label}</span><span>{pct}%</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#E8ECF1]">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
          className="h-full rounded-full bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6]" />
      </div>
    </div>
  );
});

const SkeletonBlock = memo(function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return <div className="space-y-2">{Array.from({length:lines}).map((_,i) => <div key={i} className="h-3 animate-pulse rounded bg-[#E8ECF1]" style={{width:`${70+Math.random()*30}%`}} />)}</div>;
});

const ChatMessage = memo(function ChatMessage({ msg, onRetry, onSwitchModel, onSpeak }: {
  msg: ChatMessage; onRetry?: () => void; onSwitchModel?: () => void; onSpeak?: (t: string) => void;
}) {
  const isUser = msg.role === "user"; const isLoading = msg.loading;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] shadow">
          <Bot size={14} className="text-white" />
        </div>
      )}
      <div className={cn("max-w-[85%] space-y-2", isUser && "order-first")}>
        <div className={cn("rounded-2xl px-4 py-2.5", isUser ? "rounded-tr-md bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] text-white" : "rounded-tl-md border border-[#E8ECF1] bg-white")}>
          {isLoading ? (
            <div className="space-y-2 py-1">
              {msg.progress ? <ProgressBar pct={msg.progress.pct} label={msg.progress.label} /> : (
                <div className="flex items-center gap-2"><Brain size={14} className="animate-pulse text-[#6C4CF1]" /><span className="text-xs text-[#6B7280]">Thinking</span><LoadingDots /></div>
              )}
              <SkeletonBlock lines={2} />
            </div>
          ) : isUser ? (
            <p className="text-sm leading-relaxed">{msg.text}</p>
          ) : (
            <>
              {msg.subject && <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#6C4CF1]"><BookMarked size={10} />{msg.subject}{msg.topic ? ` / ${msg.topic}` : ""}</div>}
              {(() => {
                const hasData = !!msg.data;
                const d = msg.data as any;
                const displayFromData = hasData && (extractDisplayText(d) || d?.questions || d?.plan || d?.explanation || d?.per_question_feedback);
                return displayFromData ? <StructuredContent data={msg.data!} /> : (
                  <div className="prose prose-sm max-w-none"><ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                    {msg.text || (msg.data as any)?.error || "No response available."}
                  </ReactMarkdown></div>
                );
              })()}
            </>
          )}
        </div>
        <div className="flex items-center gap-2 px-1">
          {!isUser && !isLoading && msg.text && !msg.data && onSpeak && (
            <button onClick={() => onSpeak(msg.text)} className="text-[10px] text-[#9CA3AF] hover:text-[#6C4CF1]"><Volume2 size={11} /></button>
          )}
          {!isUser && !isLoading && (msg.text?.includes("Error") || msg.text?.includes("error") || msg.data?.error) && (
            <>
              <button onClick={onRetry} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-[#EF4444] hover:bg-[#FEE2E2]/50"><RefreshCw size={10} /> Retry</button>
              {onSwitchModel && (
                <button onClick={onSwitchModel} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-[#6C4CF1] hover:bg-[#6C4CF1]/10"><RefreshCw size={10} /> Switch Model</button>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
});

function extractDisplayText(data: any): string | null {
  if (!data || typeof data !== "object") return data ? String(data) : null;
  for (const key of ["answer", "explanation", "summary", "content", "response", "raw_response", "markdown"]) {
    const val = data[key];
    if (val && typeof val === "string" && val.trim()) return val.trim();
  }
  if (data.error && typeof data.error === "string") return null;
  for (const key of ["examples", "key_points", "next_steps", "related_topics", "suggested_resources", "recommendations", "tips"]) {
    const arr = data[key];
    if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "string") {
      return arr.map((s: string) => `- ${s}`).join("\n");
    }
  }
  if (data.questions && Array.isArray(data.questions)) {
    return data.questions.map((q: any) => `**Q${q.id}:** ${q.question}`).join("\n\n");
  }
  if (data.plan && Array.isArray(data.plan)) {
    return data.plan.map((d: any) => `**Day ${d.day}:** ${d.topics?.join(", ") || ""}`).join("\n\n");
  }
  return null;
}

function StructuredContent({ data }: { data: any }) {
  const displayText = useMemo(() => extractDisplayText(data), [data]);
  const errorText = data?.error || null;

  if (data?.questions) return <><QuizView questions={data.questions} />{errorText && <p className="mt-2 text-[10px] text-[#EF4444]">{errorText}</p>}</>;
  if (data?.per_question_feedback) return <><QuizResultView result={data as TutorEvaluateQuizResponse} />{errorText && <p className="mt-2 text-[10px] text-[#EF4444]">{errorText}</p>}</>;
  if (data?.plan) return <><StudyPlanView plan={data as TutorStudyPlanResponse} />{errorText && <p className="mt-2 text-[10px] text-[#EF4444]">{errorText}</p>}</>;
  if (data?.explanation) {
    const d = data as TutorExplainResponse;
    return (
      <div className="space-y-3">
        <div className="prose prose-sm max-w-none"><ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>{d.explanation}</ReactMarkdown></div>
        {d.examples.length > 0 && <Section title="Examples" color="#6C4CF1" items={d.examples} />}
        {d.analogies.length > 0 && <Section title="Analogies" color="#F59E0B" items={d.analogies} />}
        {d.formulas.length > 0 && <Section title="Formulas" color="#3B82F6" items={d.formulas} />}
        {d.code_examples.length > 0 && <Section title="Code Examples" color="#22C55E" items={d.code_examples} code />}
        {d.key_takeaways.length > 0 && <Section title="Key Takeaways" color="#111827" items={d.key_takeaways} />}
        {errorText && <p className="text-[10px] text-[#EF4444]">{errorText}</p>}
      </div>
    );
  }
  if (displayText) {
    return <div className="prose prose-sm max-w-none"><ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>{displayText}</ReactMarkdown></div>;
  }
  return null;
}

function Section({ title, color, items, code }: { title: string; color: string; items: string[]; code?: boolean }) {
  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-wider" style={{color}}>{title}</p>
      {code ? items.map((c,i) => <div key={i} className="mb-1 overflow-hidden rounded-lg border border-[#E8ECF1] bg-[#1F2937] p-3 font-mono text-xs text-[#E5E7EB] whitespace-pre-wrap">{c}</div>)
        : <ul className="list-disc space-y-0.5 pl-4">{items.map((e,i) => <li key={i} className="text-sm text-[#374151]">{e}</li>)}</ul>}
    </div>
  );
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────
function QuizView({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<TutorEvaluateQuizResponse | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const handleSubmit = useCallback(async () => {
    if (!questions.length) return; setEvaluating(true);
    try {
      const res = await apiEvaluateQuiz({ subject: "", topic: "", answers: questions.map(q => ({ question_id: q.id, question: q.question, selected_answer: answers[q.id] || "", correct_answer: q.correct_answer })) });
      setResult(res); setSubmitted(true);
    } catch { setSubmitted(true); }
    setEvaluating(false);
  }, [questions, answers]);
  if (submitted && result) return <QuizResultView result={result} />;
  return (
    <div className="space-y-4">
      {questions.map((q, idx) => (
        <div key={q.id} className="rounded-lg border border-[#E8ECF1] bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-full bg-[#6C4CF1]/10 px-2 py-0.5 text-[10px] font-semibold text-[#6C4CF1]">Q{idx+1}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", q.difficulty==="easy"?"bg-[#DCFCE7] text-[#22C55E]":q.difficulty==="hard"?"bg-[#FEE2E2] text-[#EF4444]":"bg-[#FEF3C7] text-[#F59E0B]")}>{q.difficulty}</span>
          </div>
          <p className="mb-2 text-sm font-medium text-[#111827]">{q.question}</p>
          <div className="grid gap-1.5">
            {Object.entries(q.options).map(([key, val]) => {
              const sel = answers[q.id] === key;
              return <button key={key} onClick={() => !submitted && setAnswers(a => ({...a, [q.id]: key}))}
                className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition", sel?"border-[#6C4CF1] bg-[#6C4CF1]/10 text-[#6C4CF1] font-semibold":"border-[#E8ECF1] text-[#374151] hover:border-[#6C4CF1]/30")}>
                <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold", sel?"border-[#6C4CF1] text-[#6C4CF1]":"border-[#D1D5DB] text-[#6B7280]")}>{key}</span>
                {val}
              </button>;
            })}
          </div>
        </div>
      ))}
      <button onClick={handleSubmit} disabled={Object.keys(answers).length!==questions.length||evaluating}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-4 py-2.5 text-sm font-bold text-white shadow disabled:opacity-50">
        {evaluating ? <><Loader2 size={14} className="animate-spin" /> Evaluating...</> : <>Submit All Answers</>}
      </button>
    </div>
  );
}

function QuizResultView({ result }: { result: TutorEvaluateQuizResponse }) {
  const color = result.percentage>=70?"#22C55E":result.percentage>=40?"#F59E0B":"#EF4444";
  const [savedNotes, setSavedNotes] = useState<string[]>(() => loadJSON<string[]>("tutor_notes", []));
  const addNote = useCallback(() => {
    const note = `Quiz ${result.score}/${result.total} (${result.percentage}%) - ${new Date().toLocaleDateString()}`;
    setSavedNotes(p => { const n = [...p, note]; saveJSON("tutor_notes", n); return n; });
  }, [result]);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-[#6C4CF1]/10 to-[#8B5CF6]/10 p-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow" style={{borderColor:color,borderWidth:2}}>
          <span className="text-lg font-bold" style={{color}}>{result.score}/{result.total}</span>
        </div>
        <div><p className="text-sm font-bold text-[#111827]">Score: {result.percentage}%</p><p className="text-xs text-[#6B7280]">{result.score} correct out of {result.total}</p></div>
        <button onClick={addNote} className="ml-auto flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-medium text-[#6C4CF1] shadow-sm border border-[#E8ECF1] hover:border-[#6C4CF1]/30"><Bookmark size={11} /> Save</button>
      </div>
      {result.per_question_feedback.map((f,i) => (
        <div key={i} className={cn("flex items-start gap-2 rounded-lg p-2", f.correct?"bg-[#DCFCE7]/50":"bg-[#FEE2E2]/50")}>
          {f.correct ? <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#22C55E]" /> : <XCircle size={14} className="mt-0.5 shrink-0 text-[#EF4444]" />}
          <div><p className="text-xs font-medium text-[#111827]">Q{f.question_id}</p><p className="text-[10px] text-[#6B7280]">{f.feedback}</p></div>
        </div>
      ))}
      {result.weak_topics.length>0 && <TagSection title="Weak Areas" color="#EF4444" bg="#FEE2E2" textColor="#991B1B" items={result.weak_topics} />}
      {result.strong_topics.length>0 && <TagSection title="Strong Areas" color="#22C55E" bg="#DCFCE7" textColor="#166534" items={result.strong_topics} />}
      {result.recommendations.length>0 && <ListSection title="Recommendations" color="#6C4CF1" items={result.recommendations} />}
    </div>
  );
}

function TagSection({ title, color, bg, textColor, items }: { title:string; color:string; bg:string; textColor:string; items:string[] }) {
  return <div><p className="mb-1 text-xs font-bold uppercase" style={{color}}>{title}</p><div className="flex flex-wrap gap-1">{items.map((t,i) => <span key={i} className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{background:bg,color:textColor}}>{t}</span>)}</div></div>;
}
function ListSection({ title, color, items }: { title:string; color:string; items:string[] }) {
  return <div><p className="mb-1 text-xs font-bold uppercase" style={{color}}>{title}</p><ul className="list-disc space-y-0.5 pl-4">{items.map((r,i) => <li key={i} className="text-xs text-[#374151]">{r}</li>)}</ul></div>;
}

// ─── Study Plan ───────────────────────────────────────────────────────────────
function StudyPlanView({ plan }: { plan: TutorStudyPlanResponse }) {
  const [expandedDay, setExpandedDay] = useState<number|null>(1);
  const [doneDays, setDoneDays] = useState<number[]>(() => loadJSON<number[]>("tutor_plan_done", []));
  const toggleDay = useCallback((day: number) => {
    setDoneDays(p => { const n = p.includes(day) ? p.filter(d => d !== day) : [...p, day]; saveJSON("tutor_plan_done", n); return n; });
  }, []);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-[#6C4CF1]/10 to-[#8B5CF6]/10 p-3">
        <div><p className="text-sm font-bold text-[#111827]">{plan.plan.length}-Day Study Plan</p><p className="text-xs text-[#6B7280]">{plan.total_hours}h total &bull; {doneDays.length}/{plan.plan.length} days done</p></div>
        <GraduationCap size={20} className="text-[#6C4CF1]" />
      </div>
      <div className="flex gap-1">
        {plan.plan.map(d => <button key={d.day} onClick={() => toggleDay(d.day)}
          className={cn("h-2 flex-1 rounded-full transition", doneDays.includes(d.day) ? "bg-[#22C55E]" : "bg-[#E8ECF1]")} title={`Day ${d.day}`} />)}
      </div>
      <div className="relative ml-2 space-y-0">
        {plan.plan.map(day => (
          <div key={day.day} className="relative pb-1.5">
            <button onClick={() => setExpandedDay(expandedDay===day.day?null:day.day)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition hover:bg-[#F5F7FA]">
              <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm", doneDays.includes(day.day)?"bg-[#22C55E]":"bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6]")}>
                {doneDays.includes(day.day) ? <CheckCircle2 size={12} /> : day.day}
              </div>
              <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-[#111827] truncate">Day {day.day}: {day.topics.slice(0,2).join(", ")}{day.topics.length>2?` +${day.topics.length-2}`:""}</p><p className="text-[10px] text-[#6B7280]">{day.duration_hours}h &bull; {day.activities.length} activities</p></div>
              <ChevronDown size={14} className={cn("shrink-0 text-[#6B7280] transition", expandedDay===day.day&&"rotate-180")} />
            </button>
            <AnimatePresence>{expandedDay===day.day&&(
              <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                <div className="ml-8 space-y-1.5 pb-2">
                  <div><p className="text-[10px] font-semibold text-[#6C4CF1] uppercase">Topics</p><div className="flex flex-wrap gap-1 mt-0.5">{day.topics.map((t,i) => <span key={i} className="rounded-full bg-[#F5F7FA] px-2 py-0.5 text-[10px] text-[#6B7280]">{t}</span>)}</div></div>
                  <div><p className="text-[10px] font-semibold text-[#F59E0B] uppercase">Activities</p><ul className="list-disc pl-4 mt-0.5">{day.activities.map((a,i) => <li key={i} className="text-xs text-[#374151]">{a}</li>)}</ul></div>
                  {day.resources.length>0 && <div><p className="text-[10px] font-semibold text-[#3B82F6] uppercase">Resources</p><ul className="list-disc pl-4 mt-0.5">{day.resources.map((r,i) => <li key={i} className="text-xs text-[#374151]">{r}</li>)}</ul></div>}
                </div>
              </motion.div>
            )}</AnimatePresence>
          </div>
        ))}
      </div>
      {plan.exam_strategy && (
        <Card className="border border-[#6C4CF1]/20 bg-gradient-to-br from-[#6C4CF1]/5 to-[#8B5CF6]/5 p-3"><p className="mb-1 text-xs font-bold text-[#6C4CF1] uppercase">Exam Strategy</p><p className="text-xs leading-relaxed text-[#374151]">{plan.exam_strategy}</p></Card>
      )}
      {plan.tips.length>0 && <TagSection title="Tips" color="#22C55E" bg="#DCFCE7" textColor="#166534" items={plan.tips} />}
    </div>
  );
}

// ─── History Panel ────────────────────────────────────────────────────────────
function HistoryPanel({ history, search, onSearchChange, onResume, onClose }: {
  history: TutorHistoryItem[]; search: string; onSearchChange: (s: string) => void; onResume: (item: TutorHistoryItem) => void; onClose: () => void;
}) {
  const filtered = useMemo(() => !search ? history : history.filter(h =>
    (h.subject?.toLowerCase().includes(search.toLowerCase()) || h.topic?.toLowerCase().includes(search.toLowerCase()) || h.question?.toLowerCase().includes(search.toLowerCase()))
  ), [history, search]);
  const sessionIcons: Record<string, React.ElementType> = { ask: MessageSquare, explain_simple: Lightbulb, explain_advanced: Brain, evaluate_quiz: ClipboardList, study_plan: CalendarDays };
  const labels: Record<string, string> = { ask: "Doubt", explain_simple: "Simple", explain_advanced: "Advanced", evaluate_quiz: "Quiz", study_plan: "Plan" };
  return (
    <motion.div initial={{width:0,opacity:0}} animate={{width:300,opacity:1}} exit={{width:0,opacity:0}} className="shrink-0 border-r border-[#E8ECF1] bg-white flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#E8ECF1] px-3 py-2.5">
        <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">History</h3>
        <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#6B7280]"><ChevronLeft size={14} /></button>
      </div>
      <div className="border-b border-[#E8ECF1] px-3 py-2">
        <div className="flex items-center gap-1.5 rounded-lg bg-[#F5F7FA] px-2.5 py-1.5">
          <Search size={12} className="text-[#9CA3AF]" />
          <input value={search} onChange={e => onSearchChange(e.target.value)} placeholder="Search history..." className="flex-1 bg-transparent text-xs outline-none placeholder:text-[#9CA3AF]" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-xs text-[#9CA3AF]">{search ? "No matches." : "No tutor history yet."}</p>
        ) : (
          <div className="space-y-1.5">
            {filtered.map(item => {
              const Icon = sessionIcons[item.session_type] || MessageSquare;
              return (
                <button key={item.id} onClick={() => onResume(item)}
                  className="flex w-full items-start gap-2 rounded-lg border border-[#E8ECF1] bg-white p-2.5 text-left transition hover:border-[#6C4CF1]/30 hover:shadow-sm">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6C4CF1]/10"><Icon size={12} className="text-[#6C4CF1]" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-[#F5F7FA] px-1.5 py-0.5 text-[9px] font-semibold text-[#6C4CF1]">{labels[item.session_type]||item.session_type}</span>
                      {item.subject && <span className="truncate text-[10px] text-[#6B7280]">{item.subject}</span>}
                    </div>
                    {item.question && <p className="mt-0.5 truncate text-[11px] text-[#374151]">{item.question}</p>}
                    <p className="mt-0.5 text-[9px] text-[#9CA3AF]">{new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Compact Stats ───────────────────────────────────────────────────────────
function CompactStats({ items }: {
  items: { icon: React.ElementType; label: string; value: string; color: string; onClick?: () => void }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {items.map(({ icon: Icon, label, value, color, onClick }) => (
        <button
          key={label}
          onClick={onClick}
          className="flex items-center gap-1 rounded-full border border-[#E8ECF1] bg-white px-2 py-0.5 text-[10px] font-medium text-[#6B7280] hover:shadow-sm transition"
        >
          <Icon size={10} style={{ color }} />
          <span style={{ color }} className="font-semibold tabular-nums">{value}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Daily Checklist ──────────────────────────────────────────────────────────
const CHECKLIST_STORAGE_KEY = "tutor_checklist";
const DEFAULT_CHECKLIST = ["Review today's notes", "Solve 3 practice problems", "Read one topic", "Revise formulas", "Take a short quiz"];

function DailyChecklist({ items, onToggle, onAdd }: { items: {id:string;text:string;done:boolean}[]; onToggle: (id:string) => void; onAdd: (text:string) => void }) {
  const [newItem, setNewItem] = useState("");
  return (
    <div className="space-y-1.5">
      {items.length === 0 ? <p className="text-xs text-[#9CA3AF] text-center py-2">No tasks for today.</p> : items.map(item => (
        <button key={item.id} onClick={() => onToggle(item.id)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition hover:bg-[#F5F7FA]">
          <div className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border transition", item.done ? "border-[#22C55E] bg-[#22C55E] text-white" : "border-[#D1D5DB]")}>
            {item.done && <CheckCircle2 size={10} />}
          </div>
          <span className={cn("text-xs", item.done ? "text-[#9CA3AF] line-through" : "text-[#374151]")}>{item.text}</span>
        </button>
      ))}
      <form onSubmit={e => { e.preventDefault(); if (newItem.trim()) { onAdd(newItem.trim()); setNewItem(""); } }} className="flex gap-1.5">
        <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Add task..." className="flex-1 rounded-lg border border-[#E8ECF1] px-2.5 py-1.5 text-xs outline-none focus:border-[#6C4CF1]" />
        <button type="submit" disabled={!newItem.trim()} className="rounded-lg bg-[#6C4CF1] px-2.5 py-1.5 text-[10px] font-semibold text-white disabled:opacity-50">Add</button>
      </form>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ quickActions }: { quickActions: { mode: Mode; label: string; icon: React.ElementType; desc: string }[] }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6C4CF1]/20 to-[#8B5CF6]/20 shadow-inner">
          <Brain size={28} className="text-[#6C4CF1]" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-[#111827]">AI Tutor</h3>
        <p className="mt-1 text-sm text-[#6B7280]">Ask doubts, generate quizzes, create study plans — your personal AI teacher.</p>
        <div className="mt-6 grid gap-2">
          {quickActions.map(({mode,label,icon:Icon,desc}) => (
            <div key={mode} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E8ECF1] bg-white px-4 py-3 text-left transition hover:border-[#6C4CF1]/30 hover:shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6C4CF1]/10"><Icon size={16} className="text-[#6C4CF1]" /></div>
              <div><p className="text-sm font-semibold text-[#111827]">{label}</p><p className="text-xs text-[#6B7280]">{desc}</p></div>
              <ChevronRight size={16} className="ml-auto shrink-0 text-[#9CA3AF]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AiTutor() {
  const [activeMode, setActiveMode] = useState<Mode>("ask");
  const [explainMode, setExplainMode] = useState<"simple"|"advanced">("simple");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [topic, setTopic] = useState("");
  const [question, setQuestion] = useState("");
  const [quizCount, setQuizCount] = useState(5);
  const [quizDifficulty, setQuizDifficulty] = useState("medium");
  const [examDate, setExamDate] = useState(getDefaultExamDate());
  const [durationDays, setDurationDays] = useState<7|30>(7);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string|null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<TutorHistoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [weakTopics, setWeakTopics] = useState<string[]>(() => loadJSON<string[]>("tutor_weak_topics", []));
  const [savedNotes, setSavedNotes] = useState<string[]>(() => loadJSON<string[]>("tutor_notes", []));
  const [showDrawer, setShowDrawer] = useState(false);
  const [checklist, setChecklist] = useState<{id:string;text:string;done:boolean}[]>(() => loadJSON("tutor_checklist", DEFAULT_CHECKLIST.map((t,i) => ({id:`c${i}`,text:t,done:false}))));
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const speechSynth = typeof window !== "undefined" ? window.speechSynthesis : null;
  const progressTimerRef = useRef<number|null>(null);
  const lastActionRef = useRef<{ type: string; params: any }>({ type: "", params: {} });
  const cancelledRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [useFallbackModel, setUseFallbackModel] = useState(false);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => { const next = [...prev]; const idx = next.findIndex(m => m.id === msg.id); if (idx >= 0) next[idx] = msg; else next.push(msg); return next; });
  }, []);
  const scrollToBottom = useCallback(() => setTimeout(() => chatEndRef.current?.scrollIntoView({behavior:"smooth"}), 100), []);

  useEffect(() => { if (!historyLoaded) { apiGetTutorHistory(50).then(r => { setHistory(r.history); setHistoryLoaded(true); }).catch(() => setHistoryLoaded(true)); } }, [historyLoaded]);
  useEffect(() => { scrollToBottom(); }, [messages]);

  const loadHistory = useCallback(async () => {
    try { const r = await apiGetTutorHistory(50); setHistory(r.history); } catch {}
  }, []);

  const speakText = useCallback((text: string) => {
    if (!speechSynth) return;
    speechSynth.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[*#`\[\]()]/g,"").slice(0,500));
    u.rate=0.9; u.volume=1;
    const v = speechSynth.getVoices().find(x => x.lang.startsWith("en"));
    if (v) u.voice = v;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    speechSynth.speak(u);
  }, [speechSynth]);

  const stopSpeech = useCallback(() => { if (speechSynth) { speechSynth.cancel(); setIsSpeaking(false); } }, [speechSynth]);

  const toggleMic = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) return;
    if (isListening) { recognitionRef.current?.stop(); recognitionRef.current = null; setIsListening(false); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR(); r.lang="en-US"; r.interimResults=true; r.continuous=true;
    r.onresult = (e: any) => { setQuestion(Array.from(e.results).map((r:any)=>r[0].transcript).join("")); };
    r.onerror = () => setIsListening(false); r.onend = () => setIsListening(false);
    r.start(); recognitionRef.current = r; setIsListening(true);
  }, [isListening]);

  const startProgressTimer = useCallback((msgId: string) => {
    let pct = 0;
    progressTimerRef.current = window.setInterval(() => {
      pct = Math.min(pct + Math.random() * 15 + 3, 92);
      const idx = Math.min(Math.floor(pct / 25), PROGRESS_LABELS.length - 1);
      addMessage({ id: msgId, role: "assistant", text: "", loading: true, progress: { pct: Math.round(pct), label: PROGRESS_LABELS[idx] } });
    }, 1200);
  }, [addMessage]);

  const stopProgressTimer = useCallback(() => {
    if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null; }
  }, []);

  const finalizeMessage = useCallback((msgId: string, updates: Partial<ChatMessage>) => {
    stopProgressTimer();
    addMessage({ id: msgId, role: "assistant", text: "", loading: false, ...updates } as ChatMessage);
  }, [addMessage, stopProgressTimer]);

  const runWithProgress = useCallback(async (msgId: string, apiCall: () => Promise<any>, onSuccess: (data: any) => Partial<ChatMessage>, onError?: (err: any) => Partial<ChatMessage>) => {
    cancelledRef.current = false;
    startProgressTimer(msgId); setIsLoading(true); setError(null);
    try {
      const data = await apiCall();
      if (cancelledRef.current) { cancelledRef.current = false; stopProgressTimer(); setIsLoading(false); return; }
      stopProgressTimer();
      addMessage({ id: msgId, role: "assistant", text: "", loading: false, ...onSuccess(data) } as ChatMessage);
    } catch (err: any) {
      if (cancelledRef.current) { cancelledRef.current = false; stopProgressTimer(); setIsLoading(false); return; }
      stopProgressTimer();
      const fallback = onError ? onError(err) : { text: `Error: ${err?.response?.data?.detail || "Request failed. Please retry."}` };
      addMessage({ id: msgId, role: "assistant", text: "", loading: false, ...fallback } as ChatMessage);
      setError(err?.response?.data?.detail || "Request failed.");
    }
    setIsLoading(false); loadHistory();
  }, [startProgressTimer, stopProgressTimer, addMessage, loadHistory]);

  const handleAskDoubt = useCallback(() => {
    if (!question.trim() || !topic.trim()) return;
    lastActionRef.current = { type: "ask", params: { subject, topic, question } };
    const msgId = `msg-${Date.now()}`;
    addMessage({ id: msgId, role: "user", text: question, subject, topic });
    const resId = `${msgId}-res`;
    addMessage({ id: resId, role: "assistant", text: "", loading: true });
    runWithProgress(resId,
      () => apiAskDoubt({ subject, topic, question }, useFallbackModel),
      (res: TutorAskResponse) => ({ data: res as any }),
    );
    setQuestion("");
  }, [question, topic, subject, addMessage, runWithProgress, useFallbackModel]);

  const handleExplain = useCallback(() => {
    if (!topic.trim()) return;
    lastActionRef.current = { type: "explain", params: { subject, topic, mode: explainMode } };
    const msgId = `msg-${Date.now()}`;
    addMessage({ id: msgId, role: "user", text: `Explain "${topic}" (${explainMode} mode)`, subject, topic });
    runWithProgress(`${msgId}-res`,
      () => apiExplainTopic({ subject, topic, mode: explainMode }, useFallbackModel),
      (res: TutorExplainResponse) => ({ data: res }),
    );
  }, [topic, subject, explainMode, addMessage, runWithProgress, useFallbackModel]);

  const handleGenerateQuiz = useCallback(() => {
    if (!topic.trim()) return;
    lastActionRef.current = { type: "quiz", params: { subject, topic, quizCount, quizDifficulty } };
    const msgId = `msg-${Date.now()}`;
    addMessage({ id: msgId, role: "user", text: `Quiz on "${topic}" (${quizCount} questions, ${quizDifficulty})`, subject, topic });
    runWithProgress(`${msgId}-res`,
      () => apiGenerateQuiz({ subject, topic, question_count: quizCount, difficulty: quizDifficulty }, useFallbackModel),
      (res: TutorQuizResponse) => ({ data: res }),
    );
  }, [topic, subject, quizCount, quizDifficulty, addMessage, runWithProgress, useFallbackModel]);

  const handleStudyPlan = useCallback(() => {
    lastActionRef.current = { type: "study-plan", params: { subject, examDate, durationDays } };
    const msgId = `msg-${Date.now()}`;
    addMessage({ id: msgId, role: "user", text: `Study plan for "${subject}" (${durationDays} days, exam: ${examDate})`, subject });
    runWithProgress(`${msgId}-res`,
      () => apiCreateStudyPlan({ subject, exam_date: examDate, duration_days: durationDays }, useFallbackModel),
      (res: TutorStudyPlanResponse) => ({ data: res }),
    );
  }, [subject, examDate, durationDays, addMessage, runWithProgress, useFallbackModel]);

  const handleClearChat = useCallback(() => {
    setMessages([]); setError(null);
  }, []);

  const handleResumeFromHistory = useCallback((item: TutorHistoryItem) => {
    const text = item.question || `${item.session_type} on ${item.topic || item.subject}`;
    addMessage({ id: `hist-${item.id}`, role: "user", text, subject: item.subject || undefined, topic: item.topic || undefined });
    if (item.answer) {
      const data = item.answer as any;
      addMessage({ id: `hist-${item.id}-res`, role: "assistant", text: "", subject: item.subject || undefined, topic: item.topic || undefined, data: data.questions || data.plan || (data.explanation ? data : undefined) });
    }
    setShowHistory(false);
  }, [addMessage]);

  const handleRetry = useCallback((forceFallback?: boolean) => {
    const fallback = forceFallback !== undefined ? forceFallback : useFallbackModel;
    const action = lastActionRef.current;
    if (!action.type) return;
    setError(null);
    setIsLoading(false);
    switch (action.type) {
      case "ask": {
        const p = action.params;
        const mid = `msg-${Date.now()}`;
        addMessage({ id: mid, role: "user", text: p.question, subject: p.subject, topic: p.topic });
        addMessage({ id: `${mid}-res`, role: "assistant", text: "", loading: true });
        runWithProgress(`${mid}-res`,
          () => apiAskDoubt({ subject: p.subject, topic: p.topic, question: p.question }, fallback),
          (res: TutorAskResponse) => ({ data: res as any }),
        );
        break;
      }
      case "explain": {
        const p = action.params;
        const mid = `msg-${Date.now()}`;
        addMessage({ id: mid, role: "user", text: `Explain "${p.topic}" (${p.mode} mode)`, subject: p.subject, topic: p.topic });
        runWithProgress(`${mid}-res`,
          () => apiExplainTopic({ subject: p.subject, topic: p.topic, mode: p.mode }, fallback),
          (res: TutorExplainResponse) => ({ data: res }),
        );
        break;
      }
      case "quiz": {
        const p = action.params;
        const mid = `msg-${Date.now()}`;
        addMessage({ id: mid, role: "user", text: `Quiz on "${p.topic}" (${p.quizCount} questions, ${p.quizDifficulty})`, subject: p.subject, topic: p.topic });
        runWithProgress(`${mid}-res`,
          () => apiGenerateQuiz({ subject: p.subject, topic: p.topic, question_count: p.quizCount, difficulty: p.quizDifficulty }, fallback),
          (res: TutorQuizResponse) => ({ data: res }),
        );
        break;
      }
      case "study-plan": {
        const p = action.params;
        const mid = `msg-${Date.now()}`;
        addMessage({ id: mid, role: "user", text: `Study plan for "${p.subject}" (${p.durationDays} days, exam: ${p.examDate})`, subject: p.subject });
        runWithProgress(`${mid}-res`,
          () => apiCreateStudyPlan({ subject: p.subject, exam_date: p.examDate, duration_days: p.durationDays }, fallback),
          (res: TutorStudyPlanResponse) => ({ data: res }),
        );
        break;
      }
    }
  }, [addMessage, runWithProgress, useFallbackModel]);

  const handleSwitchModel = useCallback(() => {
    setUseFallbackModel(true);
    handleRetry(true);
  }, [handleRetry]);

  const handleStopGeneration = useCallback(() => {
    cancelledRef.current = true;
    stopProgressTimer();
    setIsLoading(false);
  }, [stopProgressTimer]);

  const autoResizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 150)}px`; }
  }, []);

  const handleToggleChecklist = useCallback((id: string) => {
    setChecklist(p => { const n = p.map(c => c.id===id?{...c,done:!c.done}:c); saveJSON("tutor_checklist", n); return n; });
  }, []);

  const handleAddChecklist = useCallback((text: string) => {
    setChecklist(p => { const n = [...p, {id:`c${Date.now()}`,text,done:false}]; saveJSON("tutor_checklist", n); return n; });
  }, []);

  const handleDownloadNotes = useCallback(() => {
    const noteText = savedNotes.map((n,i) => `${i+1}. ${n}`).join("\n");
    const blob = new Blob([noteText || "No notes saved."], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `tutor-notes-${new Date().toISOString().split("T")[0]}.txt`;
    a.click(); URL.revokeObjectURL(url);
  }, [savedNotes]);

  const stats = useMemo(() => {
    const planDone = loadJSON<number[]>("tutor_plan_done", []);
    const planMsg = [...messages].reverse().find(m => m.data && "plan" in m.data);
    const quizMsgs = messages.filter(m => m.data && "percentage" in m.data);
    return {
      checklistDone: checklist.filter(c => c.done).length,
      checklistTotal: checklist.length,
      quizAvg: Math.round(quizMsgs.reduce((acc, m) => acc + ((m.data as any).percentage || 0), 0) / Math.max(quizMsgs.length, 1)),
      planDaysDone: planDone.length,
      planTotalDays: planMsg ? (planMsg.data as any).plan.length : 1,
      streakNum: Math.min(checklist.filter(c => c.done).length, 7),
    };
  }, [checklist, messages]);

  const quickActions = [
    { mode: "ask" as Mode, label: "Ask a Doubt", icon: MessageSquare, desc: "Get clear explanations" },
    { mode: "explain" as Mode, label: "Explain Topic", icon: Lightbulb, desc: "Simple or advanced mode" },
    { mode: "quiz" as Mode, label: "Generate Quiz", icon: ClipboardList, desc: "MCQs with evaluation" },
    { mode: "study-plan" as Mode, label: "Study Plan", icon: CalendarDays, desc: "7 or 30 day plan" },
  ];

  const modeConfig: Record<Mode, { label: string; icon: React.ElementType }> = {
    ask: { label: "Ask Doubt", icon: MessageSquare },
    explain: { label: "Explain", icon: Lightbulb },
    quiz: { label: "Quiz", icon: ClipboardList },
    "study-plan": { label: "Study Plan", icon: CalendarDays },
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex h-[calc(100vh-4rem)] flex-col bg-[#F9FAFB]">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#E8ECF1] bg-white px-4 py-2.5">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowHistory(!showHistory)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#F5F7FA]">
            <History size={16} />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] shadow"><Brain size={16} className="text-white" /></div>
          <div><h2 className="text-sm font-bold text-[#111827]">AI Tutor</h2><p className="text-[10px] text-[#6B7280]">Personal learning assistant</p></div>
        </div>
        <div className="flex items-center gap-1.5">
          {isSpeaking && <button onClick={stopSpeech} className="flex items-center gap-1 rounded-full bg-[#FEE2E2] px-2.5 py-1 text-[10px] font-medium text-[#EF4444]"><Volume2 size={11} /> Stop</button>}
          {messages.length > 0 && (
            <button onClick={handleClearChat} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] text-[#EF4444] hover:bg-[#FEE2E2]/50"><Trash2 size={11} /> Clear</button>
          )}
          <div className="flex items-center gap-1 rounded-lg bg-[#F5F7FA] px-2 py-1 text-[10px] text-[#6B7280]">
            <Star size={10} className="text-[#F59E0B]" />{stats.checklistDone}/{stats.checklistTotal}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <AnimatePresence>{showHistory && (
          <HistoryPanel history={history} search={historySearch} onSearchChange={setHistorySearch} onResume={handleResumeFromHistory} onClose={() => setShowHistory(false)} />
        )}</AnimatePresence>

        <div className="flex flex-1 flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? <EmptyState quickActions={quickActions} /> : (
              <div className="mx-auto max-w-3xl space-y-4">
                {messages.map(msg => <ChatMessage key={msg.id} msg={msg} onRetry={handleRetry} onSwitchModel={handleSwitchModel} onSpeak={speakText} />)}
              </div>
            )}
            <div ref={chatEndRef} />
            {error && !isLoading && (
              <div className="mx-auto mt-3 max-w-3xl">
                <Card className="border-2 border-[#EF4444]/30 bg-[#FEE2E2]/20 p-3">
                  <div className="flex items-start gap-2"><AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#EF4444]" /><p className="text-xs text-[#991B1B]">{error}</p></div>
                </Card>
              </div>
            )}
          </div>

          {/* Compact Stats + Collapsible Drawer */}
          {(messages.length > 0 || isLoading) && (
            <div className="shrink-0 border-t border-[#E8ECF1] bg-white/80 px-4 py-1.5">
              <div className="mx-auto max-w-3xl space-y-1">
                <CompactStats items={[
                  { icon: ListChecks, label: "Checklist", value: `${stats.checklistDone}/${stats.checklistTotal}`, color: "#6C4CF1", onClick: () => setShowDrawer(!showDrawer) },
                  { icon: Award, label: "Quiz Avg", value: `${stats.quizAvg}%`, color: stats.quizAvg >= 70 ? "#22C55E" : "#F59E0B" },
                  { icon: CalendarDays, label: "Study Plan", value: `${stats.planDaysDone}/${stats.planTotalDays}`, color: "#3B82F6" },
                  { icon: Star, label: "Streak", value: `${stats.streakNum} day`, color: "#F59E0B" },
                  { icon: Bookmark, label: "Notes", value: "Save", color: "#EC4899", onClick: () => setShowDrawer(!showDrawer) },
                  { icon: CheckCircle2, label: "Tasks", value: "Today", color: "#22C55E", onClick: () => setShowDrawer(!showDrawer) },
                ]} />
                <AnimatePresence>
                  {showDrawer && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                        <div className="rounded-lg border border-[#E8ECF1] bg-white p-2.5">
                          <h4 className="mb-1 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Daily Checklist</h4>
                          <DailyChecklist items={checklist} onToggle={handleToggleChecklist} onAdd={handleAddChecklist} />
                        </div>
                        <div className="rounded-lg border border-[#E8ECF1] bg-white p-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Saved Notes</h4>
                            <button onClick={handleDownloadNotes} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] text-[#6C4CF1] hover:bg-[#F5F7FA]"><Download size={10} /> Export</button>
                          </div>
                          {savedNotes.length === 0 ? (
                            <p className="text-xs text-[#9CA3AF] text-center py-2">Save quiz results or notes here.</p>
                          ) : (
                            <div className="max-h-32 space-y-1 overflow-y-auto">{savedNotes.map((n,i) => <p key={i} className="truncate text-[11px] text-[#374151]">{n}</p>)}</div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Premium AI Composer */}
          <div className="sticky bottom-0 shrink-0 px-4 pt-2 pb-3 bg-gradient-to-t from-white via-white/95 to-transparent">
            <div className="mx-auto max-w-3xl">
              {/* Subject pill + segmented tabs row */}
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-full bg-[#6C4CF1]/10 px-2.5 py-1">
                    <BookMarked size={10} className="text-[#6C4CF1]" />
                    <select value={subject} onChange={e => setSubject(e.target.value)}
                      className="bg-transparent text-[10px] font-medium text-[#6C4CF1] outline-none cursor-pointer appearance-none pr-1">
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={8} className="text-[#6C4CF1]" />
                  </div>
                  {activeMode === "explain" && (
                    <div className="flex rounded-md border border-[#E8ECF1] overflow-hidden">
                      <button onClick={() => setExplainMode("simple")}
                        className={cn("px-2 py-0.5 text-[10px] font-medium transition", explainMode==="simple"?"bg-[#6C4CF1] text-white":"bg-white text-[#6B7280] hover:bg-[#F5F7FA]")}>Simple</button>
                      <button onClick={() => setExplainMode("advanced")}
                        className={cn("px-2 py-0.5 text-[10px] font-medium transition", explainMode==="advanced"?"bg-[#6C4CF1] text-white":"bg-white text-[#6B7280] hover:bg-[#F5F7FA]")}>Advanced</button>
                    </div>
                  )}
                  {activeMode === "quiz" && (
                    <div className="flex items-center gap-1">
                      <select value={quizCount} onChange={e => setQuizCount(Number(e.target.value))}
                        className="rounded-md border border-[#E8ECF1] px-1.5 py-0.5 text-[10px] outline-none bg-white text-[#6B7280]">{[3,5,10,15,20].map(n => <option key={n} value={n}>{n}</option>)}</select>
                      <select value={quizDifficulty} onChange={e => setQuizDifficulty(e.target.value)}
                        className="rounded-md border border-[#E8ECF1] px-1.5 py-0.5 text-[10px] outline-none bg-white text-[#6B7280]">{["easy","medium","hard"].map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}</select>
                    </div>
                  )}
                  {activeMode === "study-plan" && (
                    <div className="flex items-center gap-1">
                      <div className="relative">
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] text-[#6B7280]">Exam:</span>
                        <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)}
                          className="w-28 rounded-md border border-[#E8ECF1] pl-8 pr-1.5 py-0.5 text-[10px] outline-none bg-white text-[#6B7280]" />
                      </div>
                      <div className="flex rounded-md border border-[#E8ECF1] overflow-hidden">
                        <button onClick={() => setDurationDays(7)}
                          className={cn("px-2 py-0.5 text-[10px] font-medium transition", durationDays===7?"bg-[#6C4CF1] text-white":"bg-white text-[#6B7280] hover:bg-[#F5F7FA]")}>7d</button>
                        <button onClick={() => setDurationDays(30)}
                          className={cn("px-2 py-0.5 text-[10px] font-medium transition", durationDays===30?"bg-[#6C4CF1] text-white":"bg-white text-[#6B7280] hover:bg-[#F5F7FA]")}>30d</button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <button onClick={handleClearChat}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-[#6B7280] hover:bg-[#F5F7FA] hover:text-[#EF4444] transition">
                      <Plus size={12} /> New Chat
                    </button>
                  )}
                </div>
              </div>

              {/* Segmented mode tabs */}
              <div className="mb-2">
                <div className="inline-flex rounded-xl bg-[#F5F7FA] p-0.5 border border-[#E8ECF1]">
                  {(Object.entries(modeConfig) as [Mode, {label:string;icon:React.ElementType}][]).map(([mode, {label,icon:Icon}]) => (
                    <button key={mode} onClick={() => setActiveMode(mode)}
                      className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all",
                        activeMode===mode ? "bg-white text-[#111827] shadow-sm" : "text-[#6B7280] hover:text-[#374151]")}>
                      <Icon size={13} />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Suggested prompt chips (only when no messages) */}
              {messages.length === 0 && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-2 flex flex-wrap gap-1">
                  {["Explain Simply","Give Real-Life Example","Interview Questions","MCQ Quiz","Coding Example","Practice Problems","Revision Notes"].map(p => {
                    const iconMap: Record<string, React.ElementType> = {
                      "Explain Simply": Lightbulb, "Give Real-Life Example": Target,
                      "Interview Questions": MessageSquare, "MCQ Quiz": ClipboardList,
                      "Coding Example": BookOpen, "Practice Problems": BarChart3, "Revision Notes": BookMarked,
                    };
                    const Icon = iconMap[p] || Sparkles;
                    const isActiveMode = activeMode === "ask" ? p : activeMode === "explain" ? p === "Explain Simply" : activeMode === "quiz" ? p === "MCQ Quiz" : false;
                    if (activeMode === "study-plan") return null;
                    return (
                      <button key={p} onClick={() => {
                        if (activeMode === "ask") setQuestion(p);
                        else setTopic(p);
                        textareaRef.current?.focus();
                      }}
                        className="flex items-center gap-1 rounded-full border border-[#E8ECF1] bg-white px-2.5 py-1 text-[10px] font-medium text-[#6B7280] hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1] hover:shadow-sm transition-all">
                        <Icon size={10} className="shrink-0" /> {p}
                      </button>
                    );
                  })}
                </motion.div>
              )}

              {/* Loading indicator */}
              {isLoading && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mb-2 flex items-center gap-2 rounded-lg bg-[#6C4CF1]/5 px-3 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <Brain size={12} className="animate-pulse text-[#6C4CF1]" />
                    <span className="text-[11px] font-medium text-[#6C4CF1]">AI is thinking</span>
                    <span className="inline-flex gap-0.5">
                      {[0,1,2].map(i => <span key={i} className="h-1 w-1 animate-bounce rounded-full bg-[#6C4CF1]" style={{animationDelay:`${i*200}ms`}} />)}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Glass composer */}
              <div className={cn(
                "relative flex items-end gap-1.5 rounded-2xl border bg-white p-2 shadow-lg shadow-[#6C4CF1]/5",
                "focus-within:border-[#6C4CF1]/40 focus-within:shadow-xl transition-all duration-200",
                isLoading ? "border-[#6C4CF1]/20 bg-[#F9FAFB]" : "border-[#E8ECF1]"
              )}>
                {/* Attachment */}
                <button disabled={isLoading}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-[#F5F7FA] hover:text-[#6C4CF1] transition disabled:opacity-30">
                  <FileUp size={16} />
                </button>

                {/* Auto-growing textarea */}
                <textarea
                  ref={textareaRef}
                  value={activeMode === "ask" ? question : topic}
                  onChange={e => {
                    const val = e.target.value;
                    if (activeMode === "ask") setQuestion(val);
                    else setTopic(val);
                    autoResizeTextarea();
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (isLoading) return;
                      if (activeMode === "ask") handleAskDoubt();
                      else if (activeMode === "explain") handleExplain();
                      else if (activeMode === "quiz") handleGenerateQuiz();
                      else if (activeMode === "study-plan") handleStudyPlan();
                    }
                  }}
                  placeholder="Ask anything about your subject..."
                  rows={1}
                  disabled={isLoading}
                  className="flex-1 resize-none bg-transparent py-2.5 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] disabled:opacity-40 leading-relaxed scrollbar-hide"
                />

                {/* Right actions */}
                <div className="flex items-center gap-0.5">
                  {/* Mic */}
                  <button onClick={toggleMic} disabled={isLoading}
                    className={cn("flex h-9 w-9 items-center justify-center rounded-lg transition disabled:opacity-30",
                      isListening ? "bg-[#FEE2E2] text-[#EF4444]" : "text-[#9CA3AF] hover:bg-[#F5F7FA] hover:text-[#6C4CF1]")}>
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>

                  {/* Send / Stop */}
                  {isLoading ? (
                    <motion.button
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      onClick={handleStopGeneration}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EF4444] text-white shadow-md hover:bg-[#DC2626] transition-colors"
                      title="Stop generating">
                      <Square size={14} />
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        if (activeMode === "ask") handleAskDoubt();
                        else if (activeMode === "explain") handleExplain();
                        else if (activeMode === "quiz") handleGenerateQuiz();
                        else if (activeMode === "study-plan") handleStudyPlan();
                      }}
                      disabled={(activeMode === "ask" && (!question.trim() || !topic.trim())) ||
                        ((activeMode === "explain" || activeMode === "quiz") && !topic.trim()) ||
                        isLoading}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] text-white shadow-md disabled:opacity-30 transition-shadow hover:shadow-lg"
                      title={activeMode === "study-plan" ? "Create Study Plan" : "Send message"}>
                      <Send size={14} />
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Footer text */}
              <div className="mt-1.5 flex items-center justify-between px-1">
                <span className="text-[9px] text-[#9CA3AF]">Enter to send &middot; Shift+Enter for new line</span>
                <span className="flex items-center gap-1 text-[9px] text-[#9CA3AF]">
                  <Sparkles size={9} className="text-[#6C4CF1]" /> AI Tutor
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
