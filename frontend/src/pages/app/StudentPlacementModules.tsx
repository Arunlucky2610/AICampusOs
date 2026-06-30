import { useState } from "react";
import { motion } from "framer-motion";
import {
  Award, BookOpen, Brain, CalendarDays, CheckCircle2, ChevronRight, Clock,
  Code2, Download, Edit3, ExternalLink, FileText, GraduationCap, Search,
  Sparkles, Star, Target, TrendingUp, Users, Video,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card } from "../../components/ui/Card";
import { cn } from "../../utils/cn";

// =====================================================
// Mock Interviews
// =====================================================

const mockInterviews = [
  { company: "Google", role: "SDE-1", date: "Jul 5, 2025", status: "Scheduled", type: "Technical", duration: "60 min" },
  { company: "Microsoft", role: "SWE", date: "Jul 12, 2025", status: "Scheduled", type: "System Design", duration: "45 min" },
  { company: "Amazon", role: "SDE-1", date: "Jun 20, 2025", status: "Completed", type: "Technical", duration: "60 min", score: 74 },
  { company: "Stripe", role: "Backend", date: "Jun 15, 2025", status: "Completed", type: "Coding", duration: "45 min", score: 82 },
  { company: "Google", role: "SDE-1", date: "May 28, 2025", status: "Completed", type: "Phone Screen", duration: "30 min", score: 85 },
];

const interviewStats = [
  { label: "Total Interviews", value: "5", color: "#6C4CF1" },
  { label: "Completed", value: "3", color: "#22C55E" },
  { label: "Avg Score", value: "80%", color: "#3B82F6" },
  { label: "Scheduled", value: "2", color: "#F59E0B" },
];

export function StudentMockInterviews() {
  return (
    <PageShell title="Mock Interviews" subtitle="Track and book mock interviews with AI-powered feedback.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {interviewStats.map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <p className="text-sm font-medium text-[#6B7280]">{kpi.label}</p>
            <p className="mt-2 text-[32px] font-bold tracking-tight text-[#111827]" style={{ color: kpi.color }}>{kpi.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#6C4CF1]">INTERVIEWS</p>
            <h3 className="mt-1 text-xl font-bold text-[#111827]">Interview History</h3>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-[#6C4CF1]/20 transition hover:shadow-xl">
            <Video size={14} /> Book Interview
          </button>
        </div>
        <div className="space-y-2">
          {mockInterviews.map((m, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-[#E8ECF1] px-5 py-4 transition hover:border-[#6C4CF1]/20 hover:bg-[#F5F7FA]">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold text-white ${
                m.status === "Completed" ? "bg-[#22C55E]" : "bg-[#6C4CF1]"
              }`}>{m.company[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#111827]">{m.company} • {m.role}</p>
                <p className="text-xs text-[#6B7280]">{m.type} • {m.duration} • {m.date}</p>
              </div>
              <div className="flex items-center gap-3">
                {m.score && (
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#6C4CF1]">{m.score}%</p>
                    <p className="text-[10px] text-[#6B7280]">Score</p>
                  </div>
                )}
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  m.status === "Completed" ? "bg-[#DCFCE7] text-[#22C55E]" :
                  m.status === "Scheduled" ? "bg-[#DBEAFE] text-[#3B82F6]" :
                  "bg-[#FEF3C7] text-[#F59E0B]"
                }`}>{m.status}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}

// =====================================================
// Coding Progress
// =====================================================

const codingPlatforms = [
  { platform: "LeetCode", username: "arun_21", solved: 185, rating: 1650, rank: "Top 15%", streak: 45, icon: Code2, color: "#F59E0B" },
  { platform: "CodeChef", username: "arun_s", solved: 120, rating: 1420, rank: "3★", streak: 30, icon: Code2, color: "#6C4CF1" },
  { platform: "HackerRank", username: "arun_dev", solved: 95, rating: 1380, rank: "Gold", streak: 20, icon: Code2, color: "#22C55E" },
  { platform: "Codeforces", username: "arun_cf", solved: 78, rating: 1250, rank: "Pupil", streak: 15, icon: Code2, color: "#3B82F6" },
];

const codingStats = [
  { label: "Total Problems", value: "478", color: "#6C4CF1" },
  { label: "Easy", value: "220", color: "#22C55E" },
  { label: "Medium", value: "185", color: "#3B82F6" },
  { label: "Hard", value: "73", color: "#EF4444" },
];

const monthlyCoding = [
  { month: "Jan", problems: 35 },
  { month: "Feb", problems: 42 },
  { month: "Mar", problems: 38 },
  { month: "Apr", problems: 55 },
  { month: "May", problems: 62 },
  { month: "Jun", problems: 48 },
];

const weeklyActivity = [
  { day: "Mon", hours: 2.5 },
  { day: "Tue", hours: 3.0 },
  { day: "Wed", hours: 1.5 },
  { day: "Thu", hours: 2.0 },
  { day: "Fri", hours: 3.5 },
  { day: "Sat", hours: 4.0 },
  { day: "Sun", hours: 1.0 },
];

export function StudentCodingProgress() {
  return (
    <PageShell title="Coding Progress" subtitle="Track your coding practice across platforms.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {codingStats.map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <p className="text-sm font-medium text-[#6B7280]">{kpi.label}</p>
            <p className="mt-2 text-[32px] font-bold tracking-tight text-[#111827]" style={{ color: kpi.color }}>{kpi.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card className="p-6">
          <div className="mb-4">
            <p className="text-sm font-semibold text-[#6C4CF1]">CODING PLATFORMS</p>
            <h3 className="mt-1 text-xl font-bold text-[#111827]">Platform-wise Progress</h3>
          </div>
          <div className="space-y-4">
            {codingPlatforms.map((p) => (
              <div key={p.platform} className="rounded-xl border border-[#E8ECF1] p-4 transition hover:border-[#6C4CF1]/20 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ backgroundColor: `${p.color}15`, color: p.color }}>
                      <p.icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#111827]">{p.platform}</p>
                      <p className="text-xs text-[#6B7280]">@{p.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#111827]">{p.solved}</p>
                    <p className="text-[10px] font-medium text-[#6B7280]">solved</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-medium text-[#6B7280]">
                  <span>Rating: {p.rating}</span>
                  <span>Rank: {p.rank}</span>
                  <span>🔥 {p.streak} day streak</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-4">
              <p className="text-sm font-semibold text-[#6C4CF1]">TREND</p>
              <h3 className="mt-1 text-lg font-bold text-[#111827]">Monthly Problems</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyCoding}>
                <CartesianGrid stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1" }} />
                <Bar dataKey="problems" fill="#6C4CF1" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <div className="mb-4">
              <p className="text-sm font-semibold text-[#6C4CF1]">WEEKLY</p>
              <h3 className="mt-1 text-lg font-bold text-[#111827]">Weekly Activity</h3>
            </div>
            <div className="flex items-end gap-2" style={{ height: 120 }}>
              {weeklyActivity.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-[#6C4CF1] to-[#8B5CF6] transition-all hover:opacity-80"
                    style={{ height: `${(d.hours / 4) * 100}%` }}
                  />
                  <span className="text-[10px] font-medium text-[#6B7280]">{d.day.slice(0, 3)}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-xs font-medium text-[#6B7280]">Avg: 2.5 hrs/day</p>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

// =====================================================
// Company Eligibility
// =====================================================

const companyEligibilityData = [
  { name: "Google", eligible: true, criteria: "CGPA ≥ 8.0", cgpaReq: 8.0, role: "SDE-1", deadline: "Jul 15, 2025", package: "₹42 LPA", status: "Applied" },
  { name: "Microsoft", eligible: true, criteria: "CGPA ≥ 7.5", cgpaReq: 7.5, role: "SWE", deadline: "Jul 20, 2025", package: "₹38 LPA", status: "Eligible" },
  { name: "Amazon", eligible: true, criteria: "CGPA ≥ 7.0", cgpaReq: 7.0, role: "SDE-1", deadline: "Jul 25, 2025", package: "₹35 LPA", status: "Eligible" },
  { name: "Stripe", eligible: true, criteria: "CGPA ≥ 8.5", cgpaReq: 8.5, role: "Backend Eng", deadline: "Aug 1, 2025", package: "₹45 LPA", status: "Shortlisted" },
  { name: "Atlassian", eligible: false, criteria: "CGPA ≥ 9.0", cgpaReq: 9.0, role: "SDE", deadline: "Aug 5, 2025", package: "₹30 LPA", status: "Not Eligible" },
  { name: "Adobe", eligible: true, criteria: "CGPA ≥ 7.5", cgpaReq: 7.5, role: "SDE-1", deadline: "Aug 10, 2025", package: "₹28 LPA", status: "Eligible" },
  { name: "Uber", eligible: false, criteria: "CGPA ≥ 8.5 + Backlog=0", cgpaReq: 8.5, role: "SDE", deadline: "Aug 15, 2025", package: "₹40 LPA", status: "Not Eligible" },
  { name: "Flipkart", eligible: true, criteria: "CGPA ≥ 7.0", cgpaReq: 7.0, role: "SDE-1", deadline: "Aug 20, 2025", package: "₹25 LPA", status: "Eligible" },
];

export function StudentCompanyEligibility() {
  return (
    <PageShell title="Company Eligibility" subtitle="Check your eligibility for top companies based on academic criteria.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {[
          { label: "Eligible Companies", value: "24", color: "#22C55E" },
          { label: "Applied", value: "1", color: "#3B82F6" },
          { label: "Shortlisted", value: "1", color: "#6C4CF1" },
          { label: "Not Eligible", value: "2", color: "#EF4444" },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <p className="text-sm font-medium text-[#6B7280]">{kpi.label}</p>
            <p className="mt-2 text-[32px] font-bold tracking-tight text-[#111827]" style={{ color: kpi.color }}>{kpi.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#6C4CF1]">COMPANIES</p>
            <h3 className="mt-1 text-xl font-bold text-[#111827]">Company Eligibility Check</h3>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-[#F5F7FA] px-3 py-1.5 text-xs text-[#6B7280]">
            <span className="font-semibold text-[#111827]">Your CGPA: 8.45</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E8ECF1] text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                <th className="py-3 pr-4">Company</th>
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 pr-4">Criteria</th>
                <th className="py-3 pr-4">Package</th>
                <th className="py-3 pr-4">Deadline</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {companyEligibilityData.map((c) => (
                <tr key={c.name} className="border-b border-[#F3F4F6] transition hover:bg-[#F5F7FA]">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <div className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold text-white ${
                        c.eligible ? "bg-[#22C55E]" : "bg-[#EF4444]"
                      }`}>{c.name[0]}</div>
                      <span className="font-semibold text-[#111827]">{c.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-[#6B7280]">{c.role}</td>
                  <td className="py-3.5 pr-4">
                    <span className={cn(
                      "text-xs font-semibold",
                      c.cgpaReq <= 8.45 ? "text-[#22C55E]" : "text-[#EF4444]"
                    )}>{c.criteria}</span>
                  </td>
                  <td className="py-3.5 pr-4 font-semibold text-[#111827]">{c.package}</td>
                  <td className="py-3.5 pr-4 text-xs text-[#6B7280]">{c.deadline}</td>
                  <td className="py-3.5">
                    <span className={cn(
                      "rounded-full px-3 py-0.5 text-xs font-semibold",
                      c.status === "Eligible" ? "bg-[#DCFCE7] text-[#22C55E]" :
                      c.status === "Applied" ? "bg-[#DBEAFE] text-[#3B82F6]" :
                      c.status === "Shortlisted" ? "bg-[#FEF3C7] text-[#F59E0B]" :
                      "bg-[#FEE2E2] text-[#EF4444]"
                    )}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}

// =====================================================
// Applications
// =====================================================

const applicationsData = [
  { company: "Google", role: "SDE-1", applied: "Jul 1, 2025", stage: "Resume Screening", nextStep: "Online Assessment", priority: "High", logo: "G" },
  { company: "Stripe", role: "Backend Engineer", applied: "Jun 25, 2025", stage: "Technical Interview", nextStep: "Interview on Jul 10", priority: "High", logo: "S" },
  { company: "Microsoft", role: "SWE", applied: "Jun 20, 2025", stage: "Application Sent", nextStep: "Awaiting Response", priority: "Medium", logo: "M" },
  { company: "Amazon", role: "SDE-1", applied: "Jun 15, 2025", stage: "Online Assessment", nextStep: "Complete by Jul 5", priority: "High", logo: "A" },
  { company: "Adobe", role: "SDE-1", applied: "Jun 10, 2025", stage: "Application Sent", nextStep: "Awaiting Response", priority: "Medium", logo: "A" },
];

const appStats = [
  { label: "Active Applications", value: "5", color: "#6C4CF1" },
  { label: "In Progress", value: "3", color: "#3B82F6" },
  { label: "Interviews", value: "1", color: "#22C55E" },
  { label: "Offers", value: "0", color: "#F59E0B" },
];

export function StudentApplications() {
  return (
    <PageShell title="Applications" subtitle="Track all your job applications and interview stages.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {appStats.map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <p className="text-sm font-medium text-[#6B7280]">{kpi.label}</p>
            <p className="mt-2 text-[32px] font-bold tracking-tight text-[#111827]" style={{ color: kpi.color }}>{kpi.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#6C4CF1]">TRACKER</p>
            <h3 className="mt-1 text-xl font-bold text-[#111827]">Application Pipeline</h3>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-xl border border-[#E8ECF1] px-4 py-2 text-xs font-semibold text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]">
              <Search size={13} /> Filter
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-[#6C4CF1]/20 transition hover:shadow-xl">
              <ExternalLink size={13} /> Track New
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {applicationsData.map((a, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-[#E8ECF1] px-5 py-4 transition hover:border-[#6C4CF1]/20 hover:bg-[#F5F7FA]">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] text-sm font-bold text-white">
                {a.logo}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-[#111827]">{a.company}</p>
                  <span className="rounded bg-[#F3F4F6] px-1.5 py-0.5 text-[10px] font-medium text-[#6B7280]">{a.role}</span>
                </div>
                <p className="mt-0.5 text-xs text-[#6B7280]">Applied: {a.applied} • Next: {a.nextStep}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-semibold text-[#111827]">{a.stage}</p>
                  <p className="text-[10px] text-[#6B7280]">Current Stage</p>
                </div>
                <span className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                  a.priority === "High" ? "bg-[#FEE2E2] text-[#EF4444]" : "bg-[#FEF3C7] text-[#F59E0B]"
                )}>{a.priority}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}

// =====================================================
// Page Shell
// =====================================================

function PageShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6C4CF1]">PLACEMENTS / {title.replace(" ", " ").toUpperCase()}</p>
          <h2 className="mt-1 text-[28px] font-bold tracking-tight text-[#111827]">{title}</h2>
          <p className="mt-2 text-sm text-[#6B7280]">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-xl border border-[#E8ECF1] px-4 py-2 text-xs font-semibold text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]">
            <Search size={13} /> Filter
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-[#E8ECF1] px-4 py-2 text-xs font-semibold text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]">
            <Download size={13} /> Export
          </button>
        </div>
      </div>
      {children}
    </motion.div>
  );
}
