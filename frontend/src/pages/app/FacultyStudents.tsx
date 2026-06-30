import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, ArrowRight, Award, BookOpen, Brain, CalendarDays,
  ChevronRight, Clock, FileText, Filter, GraduationCap, Mail, Phone,
  Search, SlidersHorizontal, Sparkles, Target, TrendingUp, UserCheck, Users,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useAuth } from "../../context/AuthContext";
import { PremiumCard } from "../../components/ui/PremiumCard";
import { CardSkeleton } from "../../components/ui/LoadingSkeleton";
import { generateAllStudents } from "../../components/faculty/mockData";
import type { FacultyStudentListItem } from "../../types";

const departments = ["AIML", "CSE", "ECE", "IT"];
const sections = ["A", "B", "C"];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const itemAnim = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function FacultyStudents() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const { data: apiStudents, isLoading } = useQuery({
    queryKey: ["faculty-students"],
    queryFn: async () => (await api.get<FacultyStudentListItem[]>("/faculty/students")).data,
  });

  const allStudents = apiStudents || generateAllStudents();
  const yearParam = searchParams.get("year");
  const initialTab = yearParam ? parseInt(yearParam) : null;
  const [activeYear, setActiveYear] = useState<number | null>(initialTab);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const years = [1, 2, 3, 4];

  const yearCounts = years.reduce((acc, y) => {
    acc[y] = allStudents.filter((s) => s.year === y).length;
    return acc;
  }, {} as Record<number, number>);

  const filtered = allStudents.filter((s) => {
    if (activeYear !== null && s.year !== activeYear) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.roll_number.toLowerCase().includes(search.toLowerCase())) return false;
    if (deptFilter && s.department !== deptFilter) return false;
    if (sectionFilter && s.section !== sectionFilter) return false;
    return true;
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">
      {/* Header */}
      <motion.div variants={itemAnim} className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#6C4CF1]/10 px-3 py-1 text-[11px] font-semibold text-[#6C4CF1]">
            <Users size={13} /> My Students
          </div>
          <h2 className="text-2xl font-bold md:text-3xl">Student Intelligence Directory</h2>
          <p className="mt-1 text-sm text-muted">Complete profile view of all students under your guidance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal size={15} /> Filters
          </Button>
        </div>
      </motion.div>

      {/* Year Tabs */}
      <motion.div variants={itemAnim} className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveYear(null)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            activeYear === null
              ? "bg-gradient-to-r from-[#6C4CF1] to-[#3B82F6] text-white shadow-md shadow-[#6C4CF1]/20"
              : "border border-line bg-white text-muted hover:border-[#6C4CF1]/30 hover:text-ink"
          }`}
        >
          All Years
          <span className="ml-1.5 text-xs opacity-70">({allStudents.length})</span>
        </button>
        {years.map((year) => (
          <button
            key={year}
            onClick={() => setActiveYear(year)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              activeYear === year
                ? "bg-gradient-to-r from-[#6C4CF1] to-[#3B82F6] text-white shadow-md shadow-[#6C4CF1]/20"
                : "border border-line bg-white text-muted hover:border-[#6C4CF1]/30 hover:text-ink"
            }`}
          >
            {year === 1 ? "1st" : year === 2 ? "2nd" : year === 3 ? "3rd" : "4th"} Year
            <span className="ml-1.5 text-xs opacity-70">({yearCounts[year] || 0})</span>
          </button>
        ))}
      </motion.div>

      {/* Search + Filters */}
      <motion.div variants={itemAnim} className="flex flex-wrap gap-3">
        <div className="relative min-w-[280px] flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search by name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-line bg-white pl-9 pr-4 text-sm font-medium text-ink placeholder:text-muted focus:border-[#6C4CF1]/40 focus:outline-none focus:ring-2 focus:ring-[#6C4CF1]/10"
          />
        </div>
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex gap-2 overflow-hidden"
            >
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
                className="h-10 rounded-xl border border-line bg-white px-3 text-sm font-medium text-ink focus:border-[#6C4CF1]/40 focus:outline-none focus:ring-2 focus:ring-[#6C4CF1]/10">
                <option value="">All Depts</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}
                className="h-10 rounded-xl border border-line bg-white px-3 text-sm font-medium text-ink focus:border-[#6C4CF1]/40 focus:outline-none focus:ring-2 focus:ring-[#6C4CF1]/10">
                <option value="">All Sections</option>
                {sections.map((s) => <option key={s} value={s}>Sec {s}</option>)}
              </select>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Results count */}
      <motion.div variants={itemAnim}>
        <p className="text-sm text-muted">
          Showing <span className="font-semibold text-ink">{filtered.length}</span> student{filtered.length !== 1 ? "s" : ""}
        </p>
      </motion.div>

      {/* Student Cards Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <motion.div variants={container} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((student, i) => (
            <StudentCard key={student.id} student={student} index={i} onClick={() => navigate(`/app/faculty/students/${student.id}`)} />
          ))}
        </motion.div>
      )}

      {filtered.length === 0 && (
        <motion.div variants={itemAnim} className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-line py-16">
          <Users className="mb-3 text-muted/40" size={48} />
          <h3 className="text-lg font-semibold">No students found</h3>
          <p className="mt-1 text-sm text-muted">Try adjusting your filters or search query</p>
        </motion.div>
      )}
    </motion.div>
  );
}

function StudentCard({ student, index, onClick }: { student: FacultyStudentListItem; index: number; onClick: () => void }) {
  const riskLabel = student.risk_score < 30 ? "Low" : student.risk_score < 60 ? "Medium" : "High";
  const riskColor = riskLabel === "Low" ? "text-green-600 bg-green-50" : riskLabel === "Medium" ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";

  return (
    <motion.div
      variants={itemAnim}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative overflow-hidden rounded-[20px] border border-[rgba(108,76,241,0.06)] bg-white p-5 transition-all duration-300 hover:border-[rgba(108,76,241,0.15)] hover:shadow-[0_12px_40px_rgba(108,76,241,0.08)]">
        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] text-sm font-bold text-white shadow-sm">
              {student.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className={`absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white ${
              student.attendance_percentage >= 85 ? "bg-green-500" : student.attendance_percentage >= 75 ? "bg-amber-500" : "bg-red-500"
            }`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight">{student.name}</p>
            <p className="text-xs text-muted">{student.roll_number}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              <span className="rounded-md bg-soft px-1.5 py-0.5 text-[10px] font-medium text-muted">{student.department}</span>
              <span className="rounded-md bg-soft px-1.5 py-0.5 text-[10px] font-medium text-muted">Sec {student.section}</span>
              <span className="rounded-md bg-soft px-1.5 py-0.5 text-[10px] font-medium text-muted">Sem {student.semester}</span>
            </div>
          </div>
          <ChevronRight size={14} className="mt-1 shrink-0 text-muted/30 transition group-hover:text-[#6C4CF1] group-hover:translate-x-0.5" />
        </div>

        {/* Stats Grid */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          <div className="rounded-lg bg-soft p-2 text-center">
            <p className="text-[11px] text-muted">CGPA</p>
            <p className="text-sm font-bold">{student.cgpa}</p>
          </div>
          <div className="rounded-lg bg-soft p-2 text-center">
            <p className="text-[11px] text-muted">Attend</p>
            <p className={`text-sm font-bold ${student.attendance_percentage >= 85 ? "text-green-600" : student.attendance_percentage >= 75 ? "text-amber-600" : "text-red-600"}`}>
              {student.attendance_percentage}%
            </p>
          </div>
          <div className="rounded-lg bg-soft p-2 text-center">
            <p className="text-[11px] text-muted">AI Score</p>
            <p className="text-sm font-bold text-[#6C4CF1]">{student.ai_score || Math.round(50 + student.cgpa * 4 + student.attendance_percentage * 0.3)}</p>
          </div>
          <div className="rounded-lg bg-soft p-2 text-center">
            <p className="text-[11px] text-muted">Readiness</p>
            <p className="text-sm font-bold">{student.placement_readiness_score}%</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${riskColor}`}>
            {riskLabel} Risk
          </span>
          <button className="flex items-center gap-1 text-[11px] font-semibold text-[#6C4CF1] opacity-0 transition group-hover:opacity-100">
            Full Profile <ArrowRight size={12} />
          </button>
        </div>

        {/* Quick action buttons */}
        <div className="mt-3 flex gap-1.5 border-t border-line pt-3">
          {[
            { icon: Mail, label: "Email", color: "text-blue-600 hover:bg-blue-50" },
            { icon: Phone, label: "Call", color: "text-green-600 hover:bg-green-50" },
            { icon: FileText, label: "Report", color: "text-purple-600 hover:bg-purple-50" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={(e) => { e.stopPropagation(); }}
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-medium transition ${action.color}`}
            >
              <action.icon size={11} /> {action.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
