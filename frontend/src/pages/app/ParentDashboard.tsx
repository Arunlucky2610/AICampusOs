import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle, Award, BarChart3, Bell, BookOpen, BookOpenCheck, Brain,
  CalendarDays, CheckCircle2, ChevronRight, Clock, CreditCard, Download,
  Eye, FileBarChart, FileText, GraduationCap, Mail, MessageSquare, Phone,
  Sparkles, Star, Target, TrendingUp, UserCheck, Users, Zap,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { PremiumCard } from "../../components/ui/PremiumCard";
import { AnimatedCounter } from "../../components/ui/AnimatedCounter";
import { CardSkeleton } from "../../components/ui/LoadingSkeleton";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const itemAnim = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const childData = {
  name: "Arun Sudhaveni",
  rollNumber: "AIML4A01",
  department: "AIML",
  year: "4th Year",
  semester: "Sem 8",
  section: "A",
  facultyAdvisor: "Dr. Nandini Reddy",
  status: "Good Standing",
  photo: null,
};

const semesterCgpaData = [
  { sem: "Sem 1", cgpa: 7.2 },
  { sem: "Sem 2", cgpa: 7.6 },
  { sem: "Sem 3", cgpa: 7.9 },
  { sem: "Sem 4", cgpa: 8.2 },
  { sem: "Sem 5", cgpa: 8.3 },
  { sem: "Sem 6", cgpa: 8.4 },
  { sem: "Sem 7", cgpa: 8.5 },
  { sem: "Sem 8", cgpa: 8.4 },
];

const subjectMarks = [
  { subject: "Machine Learning", internal: 42, external: 43, total: 85, grade: "O" },
  { subject: "Deep Learning", internal: 40, external: 42, total: 82, grade: "O" },
  { subject: "Database Systems", internal: 35, external: 36, total: 71, grade: "A" },
  { subject: "Computer Networks", internal: 38, external: 40, total: 78, grade: "A" },
  { subject: "Software Engineering", internal: 44, external: 45, total: 89, grade: "O" },
  { subject: "Web Technologies", internal: 36, external: 38, total: 74, grade: "A" },
];

const attendanceData = {
  overall: 91,
  monthWise: [
    { month: "Jan", percent: 88 }, { month: "Feb", percent: 92 },
    { month: "Mar", percent: 95 }, { month: "Apr", percent: 90 },
    { month: "May", percent: 87 }, { month: "Jun", percent: 91 },
    { month: "Jul", percent: 93 }, { month: "Aug", percent: 89 },
  ],
  subjectWise: [
    { subject: "Machine Learning", attended: 42, total: 45, percent: 93 },
    { subject: "Deep Learning", attended: 40, total: 44, percent: 91 },
    { subject: "Database Systems", attended: 38, total: 43, percent: 88 },
    { subject: "Computer Networks", attended: 41, total: 44, percent: 93 },
    { subject: "Software Engineering", attended: 44, total: 46, percent: 96 },
    { subject: "Web Technologies", attended: 36, total: 42, percent: 86 },
  ],
  classesAttended: 241,
  classesMissed: 23,
};

const assignmentsData = {
  pending: 2,
  submitted: 8,
  lateSubmissions: 1,
  list: [
    { title: "ML Project Report", due: "2026-07-15", status: "Pending" },
    { title: "Network Topology Design", due: "2026-07-18", status: "Pending" },
    { title: "DBMS Normalization Exercise", due: "2026-07-05", status: "Submitted" },
    { title: "Software Requirements Doc", due: "2026-07-08", status: "Submitted" },
    { title: "Web App Prototype", due: "2026-07-02", status: "Late" },
  ],
};

const upcomingExams = [
  { subject: "Machine Learning", date: "2026-07-20", type: "Semester" },
  { subject: "Computer Networks", date: "2026-07-24", type: "Semester" },
  { subject: "Database Systems", date: "2026-07-28", type: "Semester" },
];

const behaviorData = {
  status: "Excellent",
  engagement: 88,
  participation: 82,
  disciplineNotes: [],
  feedback: [
    { from: "Dr. Nandini Reddy", note: "Consistently performs well in class. Good team player.", date: "2 weeks ago" },
    { from: "Prof. Mehta", note: "Active participant in coding sessions.", date: "1 month ago" },
  ],
  improvementAreas: ["Public speaking", "Group discussions"],
};

const messagesData = [
  { from: "Dr. Nandini Reddy", message: "Arun is doing well this semester. Let me know if you'd like to discuss further.", date: "3 days ago", type: "faculty" },
  { from: "Academic Office", message: "Parent-Teacher Meeting scheduled for July 25th. Please confirm attendance.", date: "1 week ago", type: "meeting" },
  { from: "Dr. Nandini Reddy", message: "Regarding the DBMS performance - let's schedule a brief discussion.", date: "2 weeks ago", type: "faculty" },
];

const feeData = {
  status: "Paid",
  pendingAmount: 0,
  lastPaymentDate: "2026-06-15",
  dueDate: "2026-08-10",
  nextDue: "₹45,000 - Tuition Fee (Sem 9)",
  transactions: [
    { label: "Tuition Fee Sem 8", amount: "₹45,000", date: "2026-06-15", status: "Paid" },
    { label: "Lab Fee Sem 8", amount: "₹5,000", date: "2026-06-15", status: "Paid" },
    { label: "Library Fee", amount: "₹2,000", date: "2026-06-15", status: "Paid" },
  ],
};

const aiInsights = [
  { priority: "High", reason: "DBMS marks need improvement", suggestion: "Encourage revision of normalization and SQL this week.", category: "academic" },
  { priority: "Good", reason: "Attendance is consistent this month", suggestion: "Continue monitoring consistency. Current rate is 91%.", category: "attendance" },
  { priority: "Positive", reason: "Assignment submission rate improved by 12%", suggestion: "Encourage maintaining this momentum for pending assignments.", category: "academic" },
  { priority: "Info", reason: "Next parent-teacher meeting on July 25", suggestion: "Schedule a discussion if attendance drops below 75%.", category: "meeting" },
  { priority: "Strong", reason: "Performing strongly in programming subjects", suggestion: "Consider encouraging advanced coding challenges or hackathons.", category: "academic" },
  { priority: "Medium", reason: "Web Technologies score is lower than other subjects", suggestion: "Review web development fundamentals and practice projects.", category: "academic" },
];

const alertsData = [
  { type: "warning", title: "Low Attendance Warning", message: "Attendance for Web Technologies is 86%. Monitor closely.", date: "Today" },
  { type: "info", title: "Assignment Due Soon", message: "ML Project Report due July 15. 2 pending assignments remaining.", date: "Tomorrow" },
  { type: "info", title: "Exam Schedule Published", message: "Semester exams starting July 20. Check schedule.", date: "In 3 days" },
  { type: "success", title: "Fee Payment Completed", message: "Semester 8 fees paid successfully on June 15.", date: "2 weeks ago" },
  { type: "warning", title: "Parent-Teacher Meeting", message: "Meeting scheduled for July 25. Please confirm attendance.", date: "In 2 weeks" },
];

const eventsData = [
  { title: "Parent-Teacher Meeting", date: "July 25, 2026", time: "10:00 AM", type: "mandatory" },
  { title: "Tech Symposium 2026", date: "August 5, 2026", time: "9:00 AM", type: "optional" },
];

const kpiData = {
  attendance: 91,
  cgpa: 8.4,
  assignmentCompletion: 86,
  examPerformance: 78,
  behaviorStatus: "Excellent",
  feeStatus: "Paid",
  openAlerts: 3,
  upcomingEvents: 2,
  creditsEarned: 148,
  totalCredits: 160,
};

export function ParentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const parentName = user?.full_name || "Parent";
  const [activeTab, setActiveTab] = useState("overview");
  const [feeStatus, setFeeStatus] = useState("Paid");
  const [hoveredInsight, setHoveredInsight] = useState<number | null>(null);
  const [readMore, setReadMore] = useState<Record<string, boolean>>({});

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["parent-dashboard"],
    queryFn: async () => (await api.get("/parent/dashboard")).data,
    retry: 1,
    staleTime: 30_000,
  });

  const { data: academicsData, isLoading: academicsLoading } = useQuery({
    queryKey: ["parent-academics"],
    queryFn: async () => (await api.get("/parent/academics")).data,
    retry: 1,
    staleTime: 30_000,
  });

  const { data: attendanceApi, isLoading: attendanceLoading } = useQuery({
    queryKey: ["parent-attendance"],
    queryFn: async () => (await api.get("/parent/attendance")).data,
    retry: 1,
    staleTime: 30_000,
  });

  const tabs = [
    { key: "overview", label: "Overview", icon: Eye },
    { key: "academics", label: "Academics", icon: BookOpen },
    { key: "attendance", label: "Attendance", icon: CalendarDays },
    { key: "assignments", label: "Assignments & Exams", icon: FileText },
    { key: "behavior", label: "Behavior", icon: Star },
    { key: "messages", label: "Messages", icon: MessageSquare },
    { key: "fees", label: "Fees", icon: CreditCard },
    { key: "insights", label: "AI Insights", icon: Brain },
    { key: "alerts", label: "Alerts", icon: Bell },
  ];

  const allData = apiData || {};
  const acad = academicsData || {};
  const att = attendanceApi || {};

  const navToProfile = () => navigate("/app/parent");
  const handleDownload = (reportType: string) => {
  };

  if (isLoading || academicsLoading || attendanceLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 shimmer-bg rounded-[20px]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-12">
      {/* HEADER */}
      <motion.div variants={itemAnim}>
        <div className="relative overflow-hidden rounded-[24px] border border-[rgba(108,76,241,0.08)] bg-white p-6 md:p-8 shadow-premium">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#6C4CF1]/5 blur-[80px]" />
          <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-[#3B82F6]/5 blur-[60px]" />
          <div className="relative">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6C4CF1]/10 px-3 py-1 text-[11px] font-semibold text-[#6C4CF1]">
                <GraduationCap size={12} /> PARENT PORTAL
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-[11px] font-semibold text-green-700">
                <CheckCircle2 size={12} /> Connected
              </span>
            </div>
            <h1 className="text-3xl font-bold leading-tight text-[#111827] md:text-4xl">
              Welcome back, {parentName.split(" ")[0]}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#6B7280]">
              Track your child&apos;s academic progress, attendance, behavior, and important updates in one place.
            </p>

            {/* Child Summary Card */}
            <div className="mt-5 flex flex-wrap gap-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] p-4 md:flex-nowrap md:items-center">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] text-lg font-bold text-white">
                {childData.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-[#111827]">{childData.name}</p>
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">{childData.status}</span>
                </div>
                <p className="text-sm text-[#6B7280]">{childData.department} &middot; {childData.year} &middot; {childData.semester} &middot; Sec {childData.section}</p>
                <p className="text-xs text-[#9CA3AF]">Roll: {childData.rollNumber} &middot; Faculty Advisor: {childData.facultyAdvisor}</p>
              </div>
              <Button variant="secondary" className="!h-9 !rounded-xl shrink-0"
                onClick={navToProfile}>
                <Eye size={13} /> View Full Profile
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* SECTION TABS */}
      <motion.div variants={itemAnim} className="sticky top-[72px] z-20 -mx-4 px-4 py-2 bg-[#F5F7FA] backdrop-blur-sm">
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                activeTab === t.key
                  ? "bg-[#6C4CF1] text-white shadow-sm"
                  : "text-[#6B7280] hover:bg-[#6C4CF1]/5 hover:text-[#111827]"
              )}>
              {t.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          {/* KPI CARDS */}
          <motion.div variants={itemAnim} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Attendance", value: kpiData.attendance, suffix: "%", icon: CalendarDays, color: "from-purple-500 to-purple-600", trend: "Consistent" },
              { label: "Current CGPA", value: kpiData.cgpa, suffix: "", icon: GraduationCap, color: "from-blue-500 to-blue-600", trend: "+0.3 vs last sem" },
              { label: "Assignment Completion", value: kpiData.assignmentCompletion, suffix: "%", icon: BookOpenCheck, color: "from-cyan-500 to-cyan-600", trend: "+12% improvement" },
              { label: "Exam Performance", value: kpiData.examPerformance, suffix: "%", icon: Award, color: "from-green-500 to-green-600", trend: "Above average" },
              { label: "Behavior Status", value: feeStatus === "Excellent" ? 100 : 75, suffix: "", displayValue: kpiData.behaviorStatus, icon: Star, color: "from-amber-500 to-amber-600", trend: "Excellent" },
              { label: "Fee Status", value: kpiData.feeStatus === "Paid" ? 100 : 50, suffix: "", displayValue: kpiData.feeStatus, icon: CreditCard, color: "from-emerald-500 to-emerald-600", trend: "All clear" },
              { label: "Open Alerts", value: kpiData.openAlerts, suffix: "", icon: Bell, color: "from-rose-500 to-rose-600", trend: "2 require attention" },
              { label: "Upcoming Events", value: kpiData.upcomingEvents, suffix: "", icon: CalendarDays, color: "from-indigo-500 to-indigo-600", trend: "PTM on July 25" },
            ].map((card, i) => (
              <PremiumCard key={card.label} index={i}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.color}`}>
                      <card.icon size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{card.label}</p>
                      <p className="mt-0.5 text-lg font-bold">
                        {card.displayValue ? card.displayValue : <AnimatedCounter value={card.value} suffix={card.suffix} />}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-green-600">{card.trend}</p>
              </PremiumCard>
            ))}
          </motion.div>

          {/* AI INSIGHTS SNIPPET */}
          <motion.div variants={itemAnim}>
            <PremiumCard className="p-5" hover={false}>
              <div className="mb-4 flex items-center gap-2">
                <Brain size={16} className="text-[#6C4CF1]" />
                <p className="text-sm font-semibold">AI Parent Insights</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {aiInsights.slice(0, 3).map((insight, i) => (
                  <div key={i} className="rounded-xl border border-line bg-white p-3.5 transition hover:border-[#6C4CF1]/20 hover:shadow-sm"
                    onMouseEnter={() => setHoveredInsight(i)} onMouseLeave={() => setHoveredInsight(null)}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        insight.priority === "High" ? "bg-red-50 text-red-600" :
                        insight.priority === "Medium" ? "bg-amber-50 text-amber-600" :
                        insight.priority === "Positive" ? "bg-green-50 text-green-600" :
                        "bg-blue-50 text-blue-600"
                      )}>{insight.priority}</span>
                      <span className="text-[10px] text-muted capitalize">{insight.category}</span>
                    </div>
                    <p className="text-xs font-semibold">{insight.reason}</p>
                    <p className="mt-1 text-[11px] text-muted">{insight.suggestion}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-center">
                <button onClick={() => setActiveTab("insights")}
                  className="text-xs font-semibold text-[#6C4CF1] hover:underline">
                  View all {aiInsights.length} insights <ChevronRight size={12} className="inline" />
                </button>
              </div>
            </PremiumCard>
          </motion.div>

          {/* ALERTS + EVENTS */}
          <motion.div variants={itemAnim} className="grid gap-6 xl:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Bell size={15} className="text-[#6C4CF1]" />
                <p className="text-sm font-semibold">Recent Alerts</p>
              </div>
              <div className="space-y-2">
                {alertsData.slice(0, 3).map((alert, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-line bg-white p-3.5">
                    <div className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      alert.type === "warning" ? "bg-amber-50 text-amber-600" :
                      alert.type === "success" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                    )}>
                      {alert.type === "warning" ? <AlertTriangle size={13} /> :
                       alert.type === "success" ? <CheckCircle2 size={13} /> : <Bell size={13} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{alert.title}</p>
                      <p className="text-xs text-muted mt-0.5">{alert.message}</p>
                      <p className="text-[10px] text-muted/60 mt-0.5">{alert.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3 flex items-center gap-2">
                <CalendarDays size={15} className="text-[#6C4CF1]" />
                <p className="text-sm font-semibold">Upcoming Events</p>
              </div>
              <div className="space-y-2">
                {eventsData.map((event, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-line bg-white p-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C4CF1]/10 to-[#3B82F6]/10">
                      <CalendarDays size={16} className="text-[#6C4CF1]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{event.title}</p>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[9px] font-semibold",
                          event.type === "mandatory" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                        )}>{event.type}</span>
                      </div>
                      <p className="text-xs text-muted mt-0.5">{event.date} &middot; {event.time}</p>
                    </div>
                    <Button variant="ghost" className="!h-8 !text-xs shrink-0">RSVP</Button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* TEACHER MESSAGES SNIPPET */}
          <motion.div variants={itemAnim}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare size={15} className="text-[#6C4CF1]" />
                <p className="text-sm font-semibold">Recent Messages</p>
              </div>
              <button onClick={() => setActiveTab("messages")}
                className="text-xs font-semibold text-[#6C4CF1] hover:underline">
                View All <ChevronRight size={12} className="inline" />
              </button>
            </div>
            <div className="space-y-2">
              {messagesData.slice(0, 2).map((msg, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-line bg-white p-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] text-[10px] font-bold text-white">
                    {msg.from.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{msg.from}</p>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-semibold",
                        msg.type === "meeting" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                      )}>{msg.type === "meeting" ? "Meeting" : "Faculty"}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">{msg.message}</p>
                    <p className="text-[10px] text-muted/60 mt-0.5">{msg.date}</p>
                  </div>
                  <Button variant="ghost" className="!h-8 !text-xs shrink-0">
                    <Mail size={12} /> Reply
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ACADEMICS TAB */}
      {activeTab === "academics" && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={itemAnim} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <PremiumCard>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Current CGPA</p>
              <p className="mt-1 text-2xl font-bold text-[#6C4CF1]"><AnimatedCounter value={kpiData.cgpa} decimals={1} /></p>
              <p className="text-[11px] text-green-600 mt-1">+0.3 vs last semester</p>
            </PremiumCard>
            <PremiumCard>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Credits Earned</p>
              <p className="mt-1 text-2xl font-bold text-[#3B82F6]">{kpiData.creditsEarned}/{kpiData.totalCredits}</p>
              <p className="text-[11px] text-muted mt-1">{Math.round(kpiData.creditsEarned / kpiData.totalCredits * 100)}% complete</p>
            </PremiumCard>
            <PremiumCard>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Strong Subjects</p>
              <p className="mt-1 text-sm font-bold text-green-600">Software Eng., ML, Deep Learning</p>
              <p className="text-[11px] text-muted mt-1">Grade O in 3 subjects</p>
            </PremiumCard>
            <PremiumCard>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Weak Subjects</p>
              <p className="mt-1 text-sm font-bold text-amber-600">Database Systems, Web Tech</p>
              <p className="text-[11px] text-muted mt-1">Needs improvement</p>
            </PremiumCard>
          </motion.div>

          {/* Semester CGPA Trend */}
          <motion.div variants={itemAnim}>
            <PremiumCard className="p-5" hover={false}>
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp size={15} className="text-[#6C4CF1]" />
                <p className="text-sm font-semibold">Semester-wise CGPA Trend</p>
              </div>
              <div className="flex items-end gap-3 h-40">
                {semesterCgpaData.map((s, i) => {
                  const h = ((s.cgpa - 6) / 3.5) * 100;
                  return (
                    <div key={s.sem} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-[#6C4CF1]">{s.cgpa}</span>
                      <div className="w-full rounded-t-lg transition-all hover:opacity-80"
                        style={{ height: `${Math.max(h, 10)}%`, backgroundColor: i === semesterCgpaData.length - 1 ? "#6C4CF1" : "#C4B5FD" }} />
                      <span className="text-[9px] text-muted">{s.sem}</span>
                    </div>
                  );
                })}
              </div>
            </PremiumCard>
          </motion.div>

          {/* Subject-wise Marks */}
          <motion.div variants={itemAnim}>
            <div className="mb-3 flex items-center gap-2">
              <FileText size={15} className="text-[#6C4CF1]" />
              <p className="text-sm font-semibold">Subject Performance</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] font-medium text-muted">
                    <th className="pb-2.5 pr-3 text-left">Subject</th>
                    <th className="pb-2.5 pr-3 text-center">Internal</th>
                    <th className="pb-2.5 pr-3 text-center">External</th>
                    <th className="pb-2.5 pr-3 text-center">Total</th>
                    <th className="pb-2.5 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectMarks.map((s, i) => (
                    <tr key={s.subject} className="border-b border-line/40 transition hover:bg-soft/50">
                      <td className="py-2.5 pr-3 font-medium">{s.subject}</td>
                      <td className="py-2.5 pr-3 text-center">{s.internal}/50</td>
                      <td className="py-2.5 pr-3 text-center">{s.external}/50</td>
                      <td className="py-2.5 pr-3 text-center font-bold">{s.total}/100</td>
                      <td className="py-2.5 text-center">
                        <span className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                          s.grade === "O" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
                        )}>{s.grade}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ATTENDANCE TAB */}
      {activeTab === "attendance" && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={itemAnim} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <PremiumCard>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Overall Attendance</p>
              <p className="mt-1 text-3xl font-bold text-[#6C4CF1]"><AnimatedCounter value={attendanceData.overall} suffix="%" /></p>
            </PremiumCard>
            <PremiumCard>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Classes Attended</p>
              <p className="mt-1 text-3xl font-bold text-green-600">{attendanceData.classesAttended}</p>
            </PremiumCard>
            <PremiumCard>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Classes Missed</p>
              <p className="mt-1 text-3xl font-bold text-rose-600">{attendanceData.classesMissed}</p>
            </PremiumCard>
            <PremiumCard>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Status</p>
              <p className="mt-1 text-lg font-bold text-green-600">
                {attendanceData.overall >= 90 ? "Excellent" : attendanceData.overall >= 75 ? "Good" : "Needs Attention"}
              </p>
            </PremiumCard>
          </motion.div>

          {/* Month-wise */}
          <motion.div variants={itemAnim}>
            <PremiumCard className="p-5" hover={false}>
              <p className="text-sm font-semibold mb-4">Month-wise Attendance</p>
              <div className="flex items-end gap-3 h-32">
                {attendanceData.monthWise.map((m, i) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold" style={{ color: m.percent >= 90 ? "#22C55E" : m.percent >= 75 ? "#F59E0B" : "#EF4444" }}>
                      {m.percent}%
                    </span>
                    <div className="w-full rounded-t-lg" style={{
                      height: `${m.percent * 1.2}px`,
                      backgroundColor: m.percent >= 90 ? "#22C55E" : m.percent >= 75 ? "#F59E0B" : "#EF4444",
                      opacity: 0.8,
                    }} />
                    <span className="text-[9px] text-muted">{m.month}</span>
                  </div>
                ))}
              </div>
            </PremiumCard>
          </motion.div>

          {/* Subject-wise */}
          <motion.div variants={itemAnim}>
            <p className="text-sm font-semibold mb-3">Subject-wise Attendance</p>
            <div className="space-y-2">
              {attendanceData.subjectWise.map((s, i) => (
                <div key={s.subject} className="flex items-center gap-4 rounded-xl border border-line bg-white px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{s.subject}</p>
                    <p className="text-[11px] text-muted">{s.attended}/{s.total} classes</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className={cn(
                        "h-full rounded-full",
                        s.percent >= 90 ? "bg-green-500" : s.percent >= 75 ? "bg-amber-500" : "bg-red-500"
                      )} style={{ width: `${s.percent}%` }} />
                    </div>
                    <span className={cn(
                      "text-sm font-bold w-10 text-right",
                      s.percent >= 90 ? "text-green-600" : s.percent >= 75 ? "text-amber-600" : "text-red-600"
                    )}>{s.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ASSIGNMENTS & EXAMS TAB */}
      {activeTab === "assignments" && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={itemAnim} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <PremiumCard>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Pending</p>
              <p className="mt-1 text-3xl font-bold text-amber-600">{assignmentsData.pending}</p>
            </PremiumCard>
            <PremiumCard>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Submitted</p>
              <p className="mt-1 text-3xl font-bold text-green-600">{assignmentsData.submitted}</p>
            </PremiumCard>
            <PremiumCard>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Late Submissions</p>
              <p className="mt-1 text-3xl font-bold text-rose-600">{assignmentsData.lateSubmissions}</p>
            </PremiumCard>
            <PremiumCard>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Completion Rate</p>
              <p className="mt-1 text-3xl font-bold text-[#6C4CF1]">{kpiData.assignmentCompletion}%</p>
            </PremiumCard>
          </motion.div>

          {/* Assignments List */}
          <motion.div variants={itemAnim}>
            <p className="text-sm font-semibold mb-3">Assignment Status</p>
            <div className="space-y-2">
              {assignmentsData.list.map((a, i) => (
                <div key={i} className="flex items-center gap-4 rounded-xl border border-line bg-white px-4 py-3">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    a.status === "Pending" ? "bg-amber-50" : a.status === "Late" ? "bg-red-50" : "bg-green-50"
                  )}>
                    {a.status === "Submitted" ? <CheckCircle2 size={16} className="text-green-600" /> :
                     a.status === "Late" ? <AlertTriangle size={16} className="text-red-600" /> :
                     <Clock size={16} className="text-amber-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{a.title}</p>
                    <p className="text-[11px] text-muted">Due: {a.due}</p>
                  </div>
                  <span className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                    a.status === "Submitted" ? "bg-green-50 text-green-700" :
                    a.status === "Late" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                  )}>{a.status}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Upcoming Exams */}
          <motion.div variants={itemAnim}>
            <div className="mb-3 flex items-center gap-2">
              <Award size={15} className="text-[#6C4CF1]" />
              <p className="text-sm font-semibold">Upcoming Exams</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {upcomingExams.map((exam, i) => (
                <PremiumCard key={exam.subject}>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={14} className="text-[#6C4CF1]" />
                    <p className="text-sm font-bold">{exam.subject}</p>
                  </div>
                  <p className="text-xs text-muted">{exam.type} Exam</p>
                  <p className="text-xs font-semibold mt-1">{exam.date}</p>
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-600">
                    <Clock size={11} /> 7 days to prepare
                  </div>
                </PremiumCard>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* BEHAVIOR TAB */}
      {activeTab === "behavior" && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={itemAnim} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <PremiumCard>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Behavior Status</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{behaviorData.status}</p>
            </PremiumCard>
            <PremiumCard>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Classroom Engagement</p>
              <p className="mt-1 text-2xl font-bold text-[#6C4CF1]">{behaviorData.engagement}%</p>
            </PremiumCard>
            <PremiumCard>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Participation</p>
              <p className="mt-1 text-2xl font-bold text-[#3B82F6]">{behaviorData.participation}%</p>
            </PremiumCard>
            <PremiumCard>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Discipline Notes</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{behaviorData.disciplineNotes.length}</p>
            </PremiumCard>
          </motion.div>

          {/* Feedback */}
          <motion.div variants={itemAnim}>
            <p className="text-sm font-semibold mb-3">Faculty Feedback</p>
            <div className="space-y-2">
              {behaviorData.feedback.map((f, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] text-[10px] font-bold text-white">
                    {f.from.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{f.from}</p>
                      <span className="text-[10px] text-muted">{f.date}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">{f.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Improvement Areas */}
          {behaviorData.improvementAreas.length > 0 && (
            <motion.div variants={itemAnim}>
              <PremiumCard className="p-5" hover={false}>
                <div className="flex items-center gap-2 mb-3">
                  <Target size={15} className="text-amber-500" />
                  <p className="text-sm font-semibold">Improvement Areas</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {behaviorData.improvementAreas.map((area, i) => (
                    <span key={i} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">{area}</span>
                  ))}
                </div>
              </PremiumCard>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* MESSAGES TAB */}
      {activeTab === "messages" && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          {messagesData.map((msg, i) => (
            <motion.div key={i} variants={itemAnim}>
              <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] text-xs font-bold text-white">
                  {msg.from.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{msg.from}</p>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] font-semibold",
                      msg.type === "meeting" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                    )}>{msg.type === "meeting" ? "Meeting Request" : "Faculty Message"}</span>
                    <span className="text-[10px] text-muted ml-auto">{msg.date}</span>
                  </div>
                  <p className="text-xs text-muted mt-1">{msg.message}</p>
                  <div className="mt-3 flex gap-2">
                    <Button variant="secondary" className="!h-8 !text-xs">
                      <Mail size={12} /> Reply
                    </Button>
                    <Button variant="ghost" className="!h-8 !text-xs">
                      <CalendarDays size={12} /> Schedule Meeting
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* FEES TAB */}
      {activeTab === "fees" && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={itemAnim} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <PremiumCard>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Fee Status</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{feeData.status}</p>
              <div className="mt-2 flex h-2 w-full rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-green-500" style={{ width: feeData.status === "Paid" ? "100%" : "60%" }} />
              </div>
            </PremiumCard>
            <PremiumCard>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Pending Amount</p>
              <p className="mt-1 text-2xl font-bold text-green-600">₹{feeData.pendingAmount}</p>
            </PremiumCard>
            <PremiumCard>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Last Payment</p>
              <p className="mt-1 text-sm font-bold">{feeData.lastPaymentDate}</p>
            </PremiumCard>
            <PremiumCard>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Next Due</p>
              <p className="mt-1 text-sm font-bold text-amber-600">{feeData.nextDue}</p>
              <p className="text-[10px] text-muted">Due: {feeData.dueDate}</p>
            </PremiumCard>
          </motion.div>

          {/* Transactions */}
          <motion.div variants={itemAnim}>
            <p className="text-sm font-semibold mb-3">Payment History</p>
            <div className="space-y-2">
              {feeData.transactions.map((t, i) => (
                <div key={i} className="flex items-center gap-4 rounded-xl border border-line bg-white px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                    <CheckCircle2 size={16} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{t.label}</p>
                    <p className="text-[11px] text-muted">{t.date}</p>
                  </div>
                  <p className="text-sm font-bold">{t.amount}</p>
                  <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">{t.status}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Download */}
          <motion.div variants={itemAnim}>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => handleDownload("receipt")}>
                <Download size={15} /> Download Last Receipt
              </Button>
              <Button variant="secondary" onClick={() => handleDownload("statement")}>
                <FileBarChart size={15} /> Fee Statement
              </Button>
              <Button>
                <CreditCard size={15} /> Pay Fees
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* AI INSIGHTS TAB */}
      {activeTab === "insights" && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          <motion.div variants={itemAnim} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {aiInsights.map((insight, i) => (
              <PremiumCard key={i}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                    insight.priority === "High" ? "bg-red-50 text-red-600" :
                    insight.priority === "Medium" ? "bg-amber-50 text-amber-600" :
                    insight.priority === "Positive" ? "bg-green-50 text-green-600" :
                    insight.priority === "Strong" ? "bg-blue-50 text-blue-600" :
                    "bg-gray-50 text-gray-600"
                  )}>{insight.priority}</span>
                  <span className="rounded-full bg-[#6C4CF1]/10 px-2 py-0.5 text-[10px] font-medium text-[#6C4CF1]">{insight.category}</span>
                </div>
                <p className="text-sm font-semibold">{insight.reason}</p>
                <p className="mt-1.5 text-xs text-muted">{insight.suggestion}</p>
                <div className="mt-3 flex items-center gap-1 text-[11px] text-[#6C4CF1]">
                  <Brain size={11} /> AI Suggested Action
                </div>
              </PremiumCard>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* ALERTS TAB */}
      {activeTab === "alerts" && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {alertsData.map((alert, i) => (
            <motion.div key={i} variants={itemAnim}>
              <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
                <div className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  alert.type === "warning" ? "bg-amber-50 text-amber-600" :
                  alert.type === "success" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                )}>
                  {alert.type === "warning" ? <AlertTriangle size={14} /> :
                   alert.type === "success" ? <CheckCircle2 size={14} /> : <Bell size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{alert.title}</p>
                    <span className="text-[10px] text-muted ml-auto">{alert.date}</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{alert.message}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* REPORTS FOOTER */}
      <motion.div variants={itemAnim} className="border-t border-line pt-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <FileBarChart size={16} className="text-[#6C4CF1]" />
          <p className="text-sm font-semibold">Reports & Downloads</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => handleDownload("academic")}>
            <Download size={14} /> Academic Report
          </Button>
          <Button variant="secondary" onClick={() => handleDownload("attendance-report")}>
            <Download size={14} /> Attendance Report
          </Button>
          <Button variant="secondary" onClick={() => handleDownload("monthly")}>
            <Download size={14} /> Monthly Progress Report
          </Button>
          <Button variant="secondary" onClick={() => handleDownload("feedback")}>
            <Download size={14} /> Teacher Feedback Report
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
