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
type ChatMessage = {
  id: string; role: "user" | "assistant"; text: string; subject?: string; topic?: string;
  data?: TutorExplainResponse | TutorQuizResponse | TutorEvaluateQuizResponse | TutorStudyPlanResponse;
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

const ChatMessage = memo(function ChatMessage({ msg, onRetry, onSpeak }: {
  msg: ChatMessage; onRetry?: () => void; onSpeak?: (t: string) => void;
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
              {msg.data ? <StructuredContent data={msg.data} /> : (
                <div className="prose prose-sm max-w-none"><ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown></div>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2 px-1">
          {!isUser && !isLoading && msg.text && !msg.data && onSpeak && (
            <button onClick={() => onSpeak(msg.text)} className="text-[10px] text-[#9CA3AF] hover:text-[#6C4CF1]"><Volume2 size={11} /></button>
          )}
          {!isUser && !isLoading && onRetry && msg.text.includes("Error") && (
            <button onClick={onRetry} className="flex items-center gap-1 text-[10px] text-[#EF4444] hover:text-[#DC2626]"><RefreshCw size={10} /> Retry</button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

function StructuredContent({ data }: { data: any }) {
  if (data?.questions) return <QuizView questions={data.questions} />;
  if (data?.per_question_feedback) return <QuizResultView result={data as TutorEvaluateQuizResponse} />;
  if (data?.plan) return <StudyPlanView plan={data as TutorStudyPlanResponse} />;
  if (data?.explanation) {
    const d = data as TutorExplainResponse;
    return (
      <div className="space-y-3">
        <div className="prose prose-sm max-w-none"><ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>{d.explanation}</ReactMarkdown></div>
        {d.examples.length > 0 && <Section title="Examples" color="#6C4CF1" items={d.examples} />}
        {d.analogies.length > 0 && <Section title="Analogies" color="#F59E0B" items={d.analogies} />}
        {d.formulas.length > 0 && <Section title="Formulas" color="#3B82F6" items={d.formulas} code />}
        {d.code_examples.length > 0 && <Section title="Code Examples" color="#22C55E" items={d.code_examples} code />}
        {d.key_takeaways.length > 0 && <Section title="Key Takeaways" color="#111827" items={d.key_takeaways} />}
      </div>
    );
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

// ─── Progress Cards ───────────────────────────────────────────────────────────
function ProgressCards({ checklistDone, checklistTotal, quizAvg, daysDone, planDays }: {
  checklistDone: number; checklistTotal: number; quizAvg: number; daysDone: number; planDays: number;
}) {
  const cards = [
    { icon: ListChecks, label: "Checklist", value: `${checklistDone}/${checklistTotal}`, sub: `${checklistTotal>0?Math.round(checklistDone/checklistTotal*100):0}%`, color: "#6C4CF1" },
    { icon: Award, label: "Quiz Avg", value: `${quizAvg}%`, sub: quizAvg>=70?"Good":"Needs practice", color: quizAvg>=70?"#22C55E":"#F59E0B" },
    { icon: CalendarDays, label: "Study Plan", value: `${daysDone}/${planDays}`, sub: `${planDays>0?Math.round(daysDone/planDays*100):0}%`, color: "#3B82F6" },
    { icon: Star, label: "Streak", value: `${Math.min(checklistDone,7)}`, sub: "day streak", color: "#F59E0B" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map(({ icon:Icon, label, value, sub, color }) => (
        <Card key={label} className="p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F7FA]"><Icon size={14} style={{color}} /></div>
            <div className="min-w-0"><p className="text-[10px] font-medium text-[#6B7280]">{label}</p><p className="text-sm font-bold" style={{color}}>{value} <span className="text-[9px] font-normal text-[#9CA3AF]">{sub}</span></p></div>
          </div>
        </Card>
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
  const [checklist, setChecklist] = useState<{id:string;text:string;done:boolean}[]>(() => loadJSON("tutor_checklist", DEFAULT_CHECKLIST.map((t,i) => ({id:`c${i}`,text:t,done:false}))));
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const speechSynth = typeof window !== "undefined" ? window.speechSynthesis : null;
  const progressTimerRef = useRef<number|null>(null);

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
    startProgressTimer(msgId); setIsLoading(true); setError(null);
    try {
      const data = await apiCall();
      stopProgressTimer();
      addMessage({ id: msgId, role: "assistant", text: "", loading: false, ...onSuccess(data) } as ChatMessage);
    } catch (err: any) {
      stopProgressTimer();
      const fallback = onError ? onError(err) : { text: `Error: ${err?.response?.data?.detail || "Request failed. Please retry."}` };
      addMessage({ id: msgId, role: "assistant", text: "", loading: false, ...fallback } as ChatMessage);
      setError(err?.response?.data?.detail || "Request failed.");
    }
    setIsLoading(false); loadHistory();
  }, [startProgressTimer, stopProgressTimer, addMessage, loadHistory]);

  const handleAskDoubt = useCallback(() => {
    if (!question.trim() || !topic.trim()) return;
    const msgId = `msg-${Date.now()}`;
    addMessage({ id: msgId, role: "user", text: question, subject, topic });
    const resId = `${msgId}-res`;
    addMessage({ id: resId, role: "assistant", text: "", loading: true });
    runWithProgress(resId,
      () => apiAskDoubt({ subject, topic, question }),
      (res: TutorAskResponse) => ({ text: `**Answer:** ${res.answer}\n\n**Related Topics:** ${res.related_topics.join(", ")}\n\n**Difficulty Assessment:** ${res.difficulty_assessment}\n\n**Resources:** ${res.suggested_resources.join(", ")}` }),
    );
    setQuestion(""); if (inputRef.current) inputRef.current.value = "";
  }, [question, topic, subject, addMessage, runWithProgress]);

  const handleExplain = useCallback(() => {
    if (!topic.trim()) return;
    const msgId = `msg-${Date.now()}`;
    addMessage({ id: msgId, role: "user", text: `Explain "${topic}" (${explainMode} mode)`, subject, topic });
    runWithProgress(`${msgId}-res`,
      () => apiExplainTopic({ subject, topic, mode: explainMode }),
      (res: TutorExplainResponse) => ({ data: res }),
    );
  }, [topic, subject, explainMode, addMessage, runWithProgress]);

  const handleGenerateQuiz = useCallback(() => {
    if (!topic.trim()) return;
    const msgId = `msg-${Date.now()}`;
    addMessage({ id: msgId, role: "user", text: `Quiz on "${topic}" (${quizCount} questions, ${quizDifficulty})`, subject, topic });
    runWithProgress(`${msgId}-res`,
      () => apiGenerateQuiz({ subject, topic, question_count: quizCount, difficulty: quizDifficulty }),
      (res: TutorQuizResponse) => ({ data: res }),
    );
  }, [topic, subject, quizCount, quizDifficulty, addMessage, runWithProgress]);

  const handleStudyPlan = useCallback(() => {
    const msgId = `msg-${Date.now()}`;
    addMessage({ id: msgId, role: "user", text: `Study plan for "${subject}" (${durationDays} days, exam: ${examDate})`, subject });
    runWithProgress(`${msgId}-res`,
      () => apiCreateStudyPlan({ subject, exam_date: examDate, duration_days: durationDays }),
      (res: TutorStudyPlanResponse) => ({ data: res }),
    );
  }, [subject, examDate, durationDays, addMessage, runWithProgress]);

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

  const stats = useMemo(() => ({
    checklistDone: checklist.filter(c => c.done).length,
    checklistTotal: checklist.length,
    quizAvg: messages.filter(m => m.data && "percentage" in m.data).reduce((acc, m) => acc + ((m.data as any).percentage || 0), 0) / Math.max(messages.filter(m => m.data && "percentage" in m.data).length, 1),
    daysDone: savedNotes.filter(n => n.startsWith("Day")).length,
    planDays: savedNotes.filter(n => n.startsWith("Day")).length || 1,
  }), [checklist, messages, savedNotes]);

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
                {messages.map(msg => <ChatMessage key={msg.id} msg={msg} onRetry={() => {}} onSpeak={speakText} />)}
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

          {/* Progress Cards + Side Panels (Desktop: 3-column footer) */}
          {(messages.length > 0 || isLoading) && (
            <div className="shrink-0 border-t border-[#E8ECF1] bg-white/80 px-4 py-2">
              <div className="mx-auto max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-2">
                <ProgressCards checklistDone={stats.checklistDone} checklistTotal={stats.checklistTotal} quizAvg={Math.round(stats.quizAvg)} daysDone={stats.daysDone} planDays={Math.max(stats.planDays, 1)} />
                <Card className="p-3"><h4 className="mb-1.5 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Daily Checklist</h4><DailyChecklist items={checklist} onToggle={handleToggleChecklist} onAdd={handleAddChecklist} /></Card>
                <Card className="p-3">
                  <div className="flex items-center justify-between mb-1.5"><h4 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Saved Notes</h4><button onClick={handleDownloadNotes} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] text-[#6C4CF1] hover:bg-[#F5F7FA]"><Download size={10} /> Export</button></div>
                  {savedNotes.length === 0 ? <p className="text-xs text-[#9CA3AF] text-center py-2">Save quiz results or notes here.</p> : (
                    <div className="max-h-24 space-y-1 overflow-y-auto">{savedNotes.map((n,i) => <p key={i} className="truncate text-[11px] text-[#374151]">{n}</p>)}</div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="shrink-0 border-t border-[#E8ECF1] bg-white px-4 py-3">
            <div className="mx-auto max-w-3xl space-y-2">
              {/* Mode Selector */}
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(modeConfig) as [Mode, {label:string;icon:React.ElementType}][]).map(([mode, {label,icon:Icon}]) => (
                  <button key={mode} onClick={() => setActiveMode(mode)}
                    className={cn("flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition", activeMode===mode ? "bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] text-white shadow" : "bg-[#F5F7FA] text-[#6B7280] hover:bg-[#E8ECF1]")}>
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>

              {/* Ask Doubt */}
              {activeMode === "ask" && (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <select value={subject} onChange={e => setSubject(e.target.value)} className="w-1/3 rounded-lg border border-[#E8ECF1] px-2.5 py-2 text-xs outline-none focus:border-[#6C4CF1] bg-white">{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select>
                    <input ref={inputRef} value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic (e.g. Sorting Algorithms)" className="flex-1 rounded-lg border border-[#E8ECF1] px-3 py-2 text-xs outline-none focus:border-[#6C4CF1]" />
                  </div>
                  <div className="flex gap-2">
                    <input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => {if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleAskDoubt();}}} placeholder="Type your doubt here..." className="flex-1 rounded-lg border border-[#E8ECF1] px-3 py-2 text-xs outline-none focus:border-[#6C4CF1]" />
                    <button onClick={toggleMic} className={cn("flex h-9 w-9 items-center justify-center rounded-lg border transition", isListening ? "border-[#EF4444] bg-[#FEE2E2] text-[#EF4444]" : "border-[#E8ECF1] text-[#6B7280] hover:border-[#6C4CF1]/30")}>
                      {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                    </button>
                    <button onClick={handleAskDoubt} disabled={!question.trim()||!topic.trim()||isLoading}
                      className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-4 py-2 text-xs font-bold text-white shadow disabled:opacity-50">
                      {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Ask
                    </button>
                  </div>
                </div>
              )}

              {/* Explain */}
              {activeMode === "explain" && (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <select value={subject} onChange={e => setSubject(e.target.value)} className="w-1/3 rounded-lg border border-[#E8ECF1] px-2.5 py-2 text-xs outline-none focus:border-[#6C4CF1] bg-white">{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select>
                    <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic to explain" className="flex-1 rounded-lg border border-[#E8ECF1] px-3 py-2 text-xs outline-none focus:border-[#6C4CF1]" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex rounded-lg border border-[#E8ECF1] overflow-hidden">
                      <button onClick={() => setExplainMode("simple")} className={cn("px-3 py-1.5 text-xs font-medium transition", explainMode==="simple"?"bg-[#6C4CF1] text-white":"bg-white text-[#6B7280]")}>Simple</button>
                      <button onClick={() => setExplainMode("advanced")} className={cn("px-3 py-1.5 text-xs font-medium transition", explainMode==="advanced"?"bg-[#6C4CF1] text-white":"bg-white text-[#6B7280]")}>Advanced</button>
                    </div>
                    <button onClick={handleExplain} disabled={!topic.trim()||isLoading} className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-4 py-2 text-xs font-bold text-white shadow disabled:opacity-50">
                      {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Lightbulb size={13} />} Explain
                    </button>
                  </div>
                </div>
              )}

              {/* Quiz */}
              {activeMode === "quiz" && (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <select value={subject} onChange={e => setSubject(e.target.value)} className="w-1/5 rounded-lg border border-[#E8ECF1] px-2.5 py-2 text-xs outline-none focus:border-[#6C4CF1] bg-white">{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select>
                    <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic for quiz" className="flex-1 rounded-lg border border-[#E8ECF1] px-3 py-2 text-xs outline-none focus:border-[#6C4CF1]" />
                    <select value={quizCount} onChange={e => setQuizCount(Number(e.target.value))} className="w-16 rounded-lg border border-[#E8ECF1] px-2 py-2 text-xs outline-none focus:border-[#6C4CF1] bg-white">{[3,5,10,15,20].map(n => <option key={n} value={n}>{n}</option>)}</select>
                    <select value={quizDifficulty} onChange={e => setQuizDifficulty(e.target.value)} className="w-20 rounded-lg border border-[#E8ECF1] px-2 py-2 text-xs outline-none focus:border-[#6C4CF1] bg-white">{["easy","medium","hard"].map(d => <option key={d} value={d}>{d}</option>)}</select>
                    <button onClick={handleGenerateQuiz} disabled={!topic.trim()||isLoading} className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-4 py-2 text-xs font-bold text-white shadow disabled:opacity-50">
                      {isLoading ? <Loader2 size={13} className="animate-spin" /> : <ClipboardList size={13} />} Generate
                    </button>
                  </div>
                </div>
              )}

              {/* Study Plan */}
              {activeMode === "study-plan" && (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <select value={subject} onChange={e => setSubject(e.target.value)} className="w-1/5 rounded-lg border border-[#E8ECF1] px-2.5 py-2 text-xs outline-none focus:border-[#6C4CF1] bg-white">{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select>
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#6B7280]">Exam:</span>
                      <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} className="w-full rounded-lg border border-[#E8ECF1] pl-12 pr-3 py-2 text-xs outline-none focus:border-[#6C4CF1]" />
                    </div>
                    <div className="flex rounded-lg border border-[#E8ECF1] overflow-hidden">
                      <button onClick={() => setDurationDays(7)} className={cn("px-3 py-2 text-xs font-medium transition", durationDays===7?"bg-[#6C4CF1] text-white":"bg-white text-[#6B7280]")}>7 Days</button>
                      <button onClick={() => setDurationDays(30)} className={cn("px-3 py-2 text-xs font-medium transition", durationDays===30?"bg-[#6C4CF1] text-white":"bg-white text-[#6B7280]")}>30 Days</button>
                    </div>
                    <button onClick={handleStudyPlan} disabled={isLoading} className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-4 py-2 text-xs font-bold text-white shadow disabled:opacity-50">
                      {isLoading ? <Loader2 size={13} className="animate-spin" /> : <CalendarDays size={13} />} Plan
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-[#9CA3AF]">
                  <FileUp size={11} /><span>Upload PDF/Image <span className="italic">(coming soon)</span></span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#9CA3AF]">
                  <Sparkles size={11} className="text-[#6C4CF1]" /><span>Powered by AI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
