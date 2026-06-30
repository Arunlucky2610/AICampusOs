import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Award, Brain, ChevronRight, Code2,
  Download, FileText, Filter, GraduationCap, MessageSquare, Search,
  Sparkles, Star, Target, UserCheck, Users, ChevronDown,
} from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { PremiumCard } from "../../components/ui/PremiumCard";
import { AnimatedCounter } from "../../components/ui/AnimatedCounter";
import { CardSkeleton } from "../../components/ui/LoadingSkeleton";
import { generatePlacementStudents } from "../../components/placement/mockData";
import type { PlacementStudentSummary } from "../../types/placement";
import { cn } from "../../utils/cn";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const itemAnim = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const departments = ["All", "CSE", "AIML", "AIDS", "ECE", "EEE", "CIVIL", "MECH"];
const years = ["All", "1", "2", "3", "4"];
const sections = ["All", "A", "B"];
const cgpaRanges = [
  { label: "All CGPA", min: 0, max: 10 },
  { label: "8.0 - 10.0", min: 8, max: 10 },
  { label: "7.0 - 7.99", min: 7, max: 7.99 },
  { label: "6.0 - 6.99", min: 6, max: 6.99 },
  { label: "Below 6.0", min: 0, max: 5.99 },
];
const readinessRanges = [
  { label: "All Readiness", min: 0, max: 100 },
  { label: "80%+", min: 80, max: 100 },
  { label: "60-79%", min: 60, max: 79 },
  { label: "Below 60%", min: 0, max: 59 },
];

const deptColors: Record<string, string> = {
  CSE: "#6C4CF1", AIML: "#3B82F6", AIDS: "#22C55E",
  ECE: "#F59E0B", EEE: "#EF4444", CIVIL: "#EC4899", MECH: "#14B8A6",
};

const rankingTabs = [
  { key: "cgpa", label: "CGPA", icon: Award },
  { key: "coding", label: "Coding", icon: Code2 },
  { key: "communication", label: "Communication", icon: MessageSquare },
  { key: "resume", label: "Resume", icon: FileText },
  { key: "mockInterview", label: "Mock Interview", icon: UserCheck },
  { key: "readiness", label: "Readiness", icon: Target },
] as const;

const allSkills = [
  "Python", "Java", "React", "FastAPI", "SQL", "AI/ML", "DSA", "Cloud",
  "Docker", "JavaScript", "TypeScript", "Node.js", "C++", "Go", "Rust",
  "AWS", "TensorFlow", "PyTorch", "NLP", "Communication",
];

function getKeyStrength(s: PlacementStudentSummary, tabKey: string): string {
  switch (tabKey) {
    case "cgpa": return s.cgpa >= 9 ? "Excellent" : s.cgpa >= 8 ? "Very Good" : s.cgpa >= 7 ? "Good" : "Average";
    case "coding": return s.codingScore >= 80 ? "Strong Coder" : s.codingScore >= 60 ? "Moderate" : "Beginner";
    case "communication": return s.communicationScore >= 80 ? "Excellent" : s.communicationScore >= 65 ? "Good" : "Needs Practice";
    case "resume": return s.resumeScore >= 80 ? "Top Tier" : s.resumeScore >= 65 ? "Good" : "Needs Work";
    case "mockInterview": return s.mockInterviewScore >= 75 ? "Interview Ready" : s.mockInterviewScore >= 55 ? "Needs Prep" : "Practice Needed";
    case "readiness": return s.placementReadiness >= 80 ? "Placement Ready" : s.placementReadiness >= 60 ? "Almost Ready" : "Not Ready";
    default: return "";
  }
}

function getScore(s: PlacementStudentSummary, tabKey: string): number {
  switch (tabKey) {
    case "cgpa": return s.cgpa;
    case "coding": return s.codingScore;
    case "communication": return s.communicationScore;
    case "resume": return s.resumeScore;
    case "mockInterview": return s.mockInterviewScore;
    case "readiness": return s.placementReadiness;
    default: return 0;
  }
}

export function PlacementStudents() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [year, setYear] = useState("All");
  const [section, setSection] = useState("All");
  const [skillFilter, setSkillFilter] = useState("All");
  const [cgpaRangeIdx, setCgpaRangeIdx] = useState(0);
  const [readinessRangeIdx, setReadinessRangeIdx] = useState(0);
  const [rankTab, setRankTab] = useState<string>("cgpa");
  const [showFilters, setShowFilters] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["placement-students"],
    queryFn: async () => (await api.get("/placement/students")).data,
    retry: 1,
  });

  const allStudents: PlacementStudentSummary[] = data || generatePlacementStudents();

  const topCGPA = useMemo(() => [...allStudents].sort((a, b) => b.cgpa - a.cgpa)[0], [allStudents]);
  const topCoder = useMemo(() => [...allStudents].sort((a, b) => b.codingScore - a.codingScore)[0], [allStudents]);
  const topCommunicator = useMemo(() => [...allStudents].sort((a, b) => b.communicationScore - a.communicationScore)[0], [allStudents]);
  const topReadiness = useMemo(() => [...allStudents].sort((a, b) => b.placementReadiness - a.placementReadiness)[0], [allStudents]);

  const top10ByTab = useMemo(() => {
    const sorted = [...allStudents].sort((a, b) => getScore(b, rankTab) - getScore(a, rankTab));
    return sorted.slice(0, 10);
  }, [allStudents, rankTab]);

  const cgpaRange = cgpaRanges[cgpaRangeIdx];
  const readinessRange = readinessRanges[readinessRangeIdx];

  const filtered = useMemo(() => allStudents.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.roll_number.toLowerCase().includes(search.toLowerCase())) return false;
    if (dept !== "All" && s.department !== dept) return false;
    if (year !== "All" && String(s.year) !== year) return false;
    if (section !== "All" && s.section !== section) return false;
    if (skillFilter !== "All" && !s.topSkills.includes(skillFilter)) return false;
    if (s.cgpa < cgpaRange.min || s.cgpa > cgpaRange.max) return false;
    if (s.placementReadiness < readinessRange.min || s.placementReadiness > readinessRange.max) return false;
    return true;
  }), [allStudents, search, dept, year, section, skillFilter, cgpaRange, readinessRange]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 shimmer-bg rounded-[20px]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="h-64 shimmer-bg rounded-[20px]" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">
      {/* HEADER */}
      <motion.div variants={itemAnim} className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6C4CF1]/10 to-[#3B82F6]/10 px-3 py-1 text-[11px] font-semibold text-[#6C4CF1]">
            <GraduationCap size={13} /> Student Talent Pool
          </div>
          <h2 className="text-2xl font-bold md:text-3xl">Top Students Overview</h2>
          <p className="mt-1 text-sm text-muted">{allStudents.length} total students &middot; {filtered.length} match filters</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary"><Download size={15} /> Export</Button>
          <Button><Sparkles size={15} /> AI Shortlist</Button>
        </div>
      </motion.div>

      {/* SUMMARY HIGHLIGHT CARDS */}
      <motion.div variants={itemAnim} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Best CGPA", student: topCGPA, value: topCGPA?.cgpa ?? 0, suffix: " CGPA", color: "from-purple-500 to-purple-600", icon: Award },
          { label: "Best Coder", student: topCoder, value: topCoder?.codingScore ?? 0, suffix: "%", color: "from-blue-500 to-blue-600", icon: Code2 },
          { label: "Best Communicator", student: topCommunicator, value: topCommunicator?.communicationScore ?? 0, suffix: "%", color: "from-cyan-500 to-cyan-600", icon: MessageSquare },
          { label: "Most Placement Ready", student: topReadiness, value: topReadiness?.placementReadiness ?? 0, suffix: "%", color: "from-emerald-500 to-emerald-600", icon: Target },
        ].map((card, i) => (
          <PremiumCard key={card.label} index={i}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.color}`}>
                  <card.icon size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{card.label}</p>
                  <p className="mt-0.5 text-sm font-bold truncate max-w-[140px]">{card.student?.name ?? "-"}</p>
                  <p className="text-[10px] text-muted">{card.student?.department ?? ""}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  <AnimatedCounter value={typeof card.value === "number" ? card.value : 0} suffix={card.suffix} />
                </p>
                <button onClick={() => card.student && navigate(`/app/placement/students/${card.student.id}`)}
                  className="mt-0.5 flex items-center gap-0.5 text-[10px] font-medium text-[#6C4CF1] hover:underline ml-auto">
                  View Profile <ChevronRight size={10} />
                </button>
              </div>
            </div>
          </PremiumCard>
        ))}
      </motion.div>

      {/* TOP STUDENTS OVERVIEW - RANKING TABS */}
      <motion.div variants={itemAnim}>
        <PremiumCard className="p-0" hover={false}>
          {/* Sticky tab bar */}
          <div ref={tabsRef} className="sticky top-0 z-20 rounded-t-[20px] border-b border-line bg-white/95 backdrop-blur-sm">
            <div className="flex flex-wrap gap-1 p-3">
              {rankingTabs.map(t => (
                <button key={t.key} onClick={() => setRankTab(t.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all",
                    rankTab === t.key
                      ? "bg-gradient-to-r from-[#6C4CF1] to-[#3B82F6] text-white shadow-md shadow-[#6C4CF1]/20"
                      : "text-muted hover:bg-soft hover:text-ink border border-transparent hover:border-line"
                  )}>
                  <t.icon size={13} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Top 10 Table */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Top 10 by <span className="text-[#6C4CF1]">{rankingTabs.find(t => t.key === rankTab)?.label}</span></p>
              <span className="text-[11px] text-muted">Showing {top10ByTab.length} students</span>
            </div>
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] font-medium text-muted">
                    <th className="pb-2.5 pr-2 text-left w-10">Rank</th>
                    <th className="pb-2.5 pr-2 text-left">Student</th>
                    <th className="pb-2.5 pr-2 text-left hidden sm:table-cell">Dept</th>
                    <th className="pb-2.5 pr-2 text-left hidden md:table-cell">Year</th>
                    <th className="pb-2.5 pr-2 text-left hidden lg:table-cell">Section</th>
                    <th className="pb-2.5 pr-2 text-right">Score</th>
                    <th className="pb-2.5 pr-2 text-left hidden xl:table-cell">Key Strength</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {top10ByTab.map((s, i) => (
                    <tr key={s.id} className="border-b border-line/40 transition hover:bg-soft/60 cursor-pointer group"
                      onClick={() => navigate(`/app/placement/students/${s.id}`)}>
                      <td className="py-2.5 pr-2 align-middle">
                        <div className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold transition-all group-hover:scale-110",
                          i === 0 ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm shadow-amber-200" :
                          i <= 2 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white" :
                          "bg-soft text-muted"
                        )}>{i + 1}</div>
                      </td>
                      <td className="py-2.5 pr-2 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] text-[10px] font-bold text-white">
                            {s.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{s.name}</p>
                            <p className="text-[10px] text-muted leading-tight">{s.roll_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-2 align-middle hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1 rounded-md bg-soft px-2 py-0.5 text-[11px] font-medium text-muted">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: deptColors[s.department] || "#6C4CF1" }} />
                          {s.department}
                        </span>
                      </td>
                      <td className="py-2.5 pr-2 align-middle hidden md:table-cell">
                        <span className="text-xs text-muted">Y{s.year}</span>
                      </td>
                      <td className="py-2.5 pr-2 align-middle hidden lg:table-cell">
                        <span className="text-xs text-muted">Sec {s.section}</span>
                      </td>
                      <td className="py-2.5 pr-2 align-middle text-right">
                        <p className="text-sm font-bold" style={{ color: deptColors[s.department] || "#6C4CF1" }}>
                          {rankTab === "cgpa" ? getScore(s, rankTab).toFixed(2) : getScore(s, rankTab)}
                        </p>
                      </td>
                      <td className="py-2.5 pr-2 align-middle hidden xl:table-cell">
                        <span className="text-[11px] text-muted">{getKeyStrength(s, rankTab)}</span>
                      </td>
                      <td className="py-2.5 align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" className="!h-7 !px-2 !text-[11px]"
                            onClick={(e) => { e.stopPropagation(); navigate(`/app/placement/students/${s.id}`); }}>
                            Profile <ChevronRight size={11} />
                          </Button>
                          <button onClick={(e) => e.stopPropagation()}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition hover:bg-soft hover:text-amber-500">
                            <Star size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </PremiumCard>
      </motion.div>

      {/* FILTER BAR */}
      <motion.div variants={itemAnim}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-[#6C4CF1]" />
            <p className="text-sm font-semibold">Student Directory</p>
            <span className="rounded-md bg-[#6C4CF1]/10 px-2 py-0.5 text-[11px] font-medium text-[#6C4CF1]">{filtered.length} students</span>
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 text-xs text-muted hover:text-ink transition">
            <Filter size={13} /> {showFilters ? "Hide Filters" : "Show Filters"}
            <ChevronDown size={12} className={cn("transition", showFilters && "rotate-180")} />
          </button>
        </div>

        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden mb-4">
            <div className="flex flex-wrap gap-2.5 rounded-xl border border-line bg-white p-3.5">
              <div className="relative flex-1 min-w-[180px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or roll number..."
                  className="h-9 w-full rounded-lg border border-line bg-white pl-8 pr-3 text-xs focus:border-[#6C4CF1]/40 focus:outline-none focus:ring-2 focus:ring-[#6C4CF1]/10" />
              </div>
              <select value={dept} onChange={e => setDept(e.target.value)}
                className="h-9 rounded-lg border border-line bg-white px-2.5 text-xs focus:border-[#6C4CF1]/40 focus:outline-none focus:ring-2 focus:ring-[#6C4CF1]/10">
                {departments.map(d => <option key={d} value={d}>{d === "All" ? "All Departments" : d}</option>)}
              </select>
              <select value={year} onChange={e => setYear(e.target.value)}
                className="h-9 rounded-lg border border-line bg-white px-2.5 text-xs focus:border-[#6C4CF1]/40 focus:outline-none focus:ring-2 focus:ring-[#6C4CF1]/10">
                {years.map(y => <option key={y} value={y}>{y === "All" ? "All Years" : `Year ${y}`}</option>)}
              </select>
              <select value={section} onChange={e => setSection(e.target.value)}
                className="h-9 rounded-lg border border-line bg-white px-2.5 text-xs focus:border-[#6C4CF1]/40 focus:outline-none focus:ring-2 focus:ring-[#6C4CF1]/10">
                {sections.map(s => <option key={s} value={s}>{s === "All" ? "All Sections" : `Sec ${s}`}</option>)}
              </select>
              <select value={skillFilter} onChange={e => setSkillFilter(e.target.value)}
                className="h-9 rounded-lg border border-line bg-white px-2.5 text-xs focus:border-[#6C4CF1]/40 focus:outline-none focus:ring-2 focus:ring-[#6C4CF1]/10">
                <option value="All">All Skills</option>
                {allSkills.map(sk => <option key={sk} value={sk}>{sk}</option>)}
              </select>
              <select value={cgpaRangeIdx} onChange={e => setCgpaRangeIdx(Number(e.target.value))}
                className="h-9 rounded-lg border border-line bg-white px-2.5 text-xs focus:border-[#6C4CF1]/40 focus:outline-none focus:ring-2 focus:ring-[#6C4CF1]/10">
                {cgpaRanges.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
              </select>
              <select value={readinessRangeIdx} onChange={e => setReadinessRangeIdx(Number(e.target.value))}
                className="h-9 rounded-lg border border-line bg-white px-2.5 text-xs focus:border-[#6C4CF1]/40 focus:outline-none focus:ring-2 focus:ring-[#6C4CF1]/10">
                {readinessRanges.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
              </select>
              <Button variant="ghost" className="!h-9 !text-xs" onClick={() => { setSearch(""); setDept("All"); setYear("All"); setSection("All"); setSkillFilter("All"); setCgpaRangeIdx(0); setReadinessRangeIdx(0); }}>
                Clear
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* STUDENT DIRECTORY */}
      <motion.div variants={itemAnim} className="space-y-2.5">
        {filtered.map((s, i) => (
          <PremiumCard key={s.id} index={i} hover className="cursor-pointer" onClick={() => navigate(`/app/placement/students/${s.id}`)}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] text-xs font-bold text-white">
                  {s.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{s.name}</p>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      s.applicationStatus === "Applied" ? "bg-blue-50 text-blue-700" :
                      s.applicationStatus === "Shortlisted" ? "bg-green-50 text-green-700" :
                      s.applicationStatus === "Not Eligible" ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-700"
                    )}>{s.applicationStatus}</span>
                  </div>
                  <p className="text-xs text-muted">{s.roll_number} &middot; {s.department} &middot; Year {s.year} &middot; Sec {s.section}</p>
                  {s.topSkills.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {s.topSkills.slice(0, 4).map(skill => (
                        <span key={skill} className="rounded-md bg-soft px-2 py-0.5 text-[10px] font-medium text-muted">{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-4 md:gap-5">
                {[
                  ["CGPA", s.cgpa, deptColors[s.department] || "#6C4CF1"],
                  ["Resume", `${s.resumeScore}%`, "#3B82F6"],
                  ["Coding", `${s.codingScore}%`, "#22C55E"],
                  ["Comm.", `${s.communicationScore}%`, "#F59E0B"],
                  ["Mock", `${s.mockInterviewScore}%`, "#EF4444"],
                  ["Ready", `${s.placementReadiness}%`, "#8B5CF6"],
                ].map(([label, val, color]) => (
                  <div key={String(label)} className="text-center">
                    <p className="text-[9px] text-muted">{label}</p>
                    <p className="text-xs font-bold" style={{ color: color as string }}>{val}</p>
                  </div>
                ))}
                <div className="flex gap-1">
                  <Button variant="secondary" className="!h-8 !px-2.5 !text-[11px]"
                    onClick={(e) => { e.stopPropagation(); navigate(`/app/placement/students/${s.id}`); }}>
                    Profile <ChevronRight size={11} />
                  </Button>
                  <Button variant="ghost" className="!h-8 !w-8 !p-0"
                    onClick={(e) => e.stopPropagation()}>
                    <Star size={12} />
                  </Button>
                </div>
              </div>
            </div>
          </PremiumCard>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-line p-12 text-center">
            <Users size={36} className="mx-auto mb-2 text-muted/30" />
            <p className="text-sm font-semibold text-muted">No students match your filters</p>
            <p className="text-xs text-muted mt-1">Try adjusting your search criteria</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
