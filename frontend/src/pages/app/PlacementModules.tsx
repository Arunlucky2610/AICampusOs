import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertTriangle, Award, BarChart3, Brain, Briefcase, Building2, CalendarDays, ChevronRight, Clock, FileText, GraduationCap, Sparkles, Target, TrendingUp, UserCheck, Users, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart as ReBar, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useState } from "react";
import { api } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { PremiumCard } from "../../components/ui/PremiumCard";
import { AnimatedCounter } from "../../components/ui/AnimatedCounter";
import { fetchCompanies } from "../../api/company";
import { generateDepartments, generateDrives, generateSkillAnalytics, generateApplicationPipeline } from "../../components/placement/mockData";

const palette = ["#6C4CF1", "#3B82F6", "#8B5CF6", "#22C55E", "#F59E0B", "#EF4444", "#EC4899"];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemAnim = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

// =====================================================
// DEPARTMENTS
// =====================================================
export function PlacementDepartments() {
  const navigate = useNavigate();
  const departments = generateDepartments();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">
      <motion.div variants={itemAnim}>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#6C4CF1]/10 px-3 py-1 text-[11px] font-semibold text-[#6C4CF1]">
          <Building2 size={13} /> Department Overview
        </div>
        <h2 className="text-2xl font-bold md:text-3xl">Department-wise Placement Overview</h2>
        <p className="mt-1 text-sm text-muted">Placement readiness and performance across all departments</p>
      </motion.div>

      <motion.div variants={itemAnim} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {departments.map((dept, i) => (
          <PremiumCard key={dept.department} index={i}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] text-sm font-bold text-white">
                {dept.department}
              </div>
              <div>
                <h3 className="text-lg font-bold">{dept.department}</h3>
                <p className="text-xs text-muted">{dept.totalStudents} students</p>
              </div>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-soft p-2.5 text-center">
                <p className="text-sm font-bold text-[#6C4CF1]"><AnimatedCounter value={dept.totalStudents} /></p>
                <p className="text-[10px] text-muted">Total</p>
              </div>
              <div className="rounded-xl bg-soft p-2.5 text-center">
                <p className="text-sm font-bold text-[#3B82F6]"><AnimatedCounter value={dept.eligibleStudents} /></p>
                <p className="text-[10px] text-muted">Eligible</p>
              </div>
              <div className="rounded-xl bg-soft p-2.5 text-center">
                <p className="text-sm font-bold text-[#22C55E]">{dept.placementReadyPercent}%</p>
                <p className="text-[10px] text-muted">Ready %</p>
              </div>
              <div className="rounded-xl bg-soft p-2.5 text-center">
                <p className="text-sm font-bold text-[#F59E0B]">{dept.avgCgpa}</p>
                <p className="text-[10px] text-muted">Avg CGPA</p>
              </div>
              <div className="rounded-xl bg-soft p-2.5 text-center">
                <p className="text-sm font-bold text-[#EC4899]">{dept.avgResumeScore}</p>
                <p className="text-[10px] text-muted">Resume Score</p>
              </div>
              <div className="rounded-xl bg-soft p-2.5 text-center">
                <p className="text-sm font-bold text-[#8B5CF6]"><AnimatedCounter value={dept.placedCount} /></p>
                <p className="text-[10px] text-muted">Placed</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-1 text-xs text-muted">Top Skills</p>
              <div className="flex flex-wrap gap-1">
                {dept.topSkills.map((skill) => (
                  <span key={skill} className="rounded-md bg-[#6C4CF1]/10 px-2 py-0.5 text-[10px] font-medium text-[#6C4CF1]">{skill}</span>
                ))}
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-[#6C4CF1]/5 to-[#8B5CF6]/5 p-2.5">
              <div>
                <p className="text-xs text-muted">Avg Package</p>
                <p className="text-lg font-bold text-[#6C4CF1]">{dept.avgPackage} LPA</p>
              </div>
              <GraduationCap size={28} className="text-[#6C4CF1]/30" />
            </div>

            <Button variant="secondary" className="w-full" onClick={() => navigate(`/app/placement/students?dept=${dept.department}`)}>
              <Users size={14} /> View Students
            </Button>
          </PremiumCard>
        ))}
      </motion.div>
    </motion.div>
  );
}

// =====================================================
// COMPANY ELIGIBILITY
// =====================================================
export function PlacementCompanyEligibility() {
  const navigate = useNavigate();
  const { data: companies, isLoading, isError } = useQuery({
    queryKey: ["placement-companies"],
    queryFn: fetchCompanies,
    staleTime: 30_000,
  });

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      upcoming: "bg-blue-50 text-blue-700",
      active: "bg-green-50 text-green-700",
      completed: "bg-gray-100 text-gray-500",
    };
    return map[status] || "bg-gray-100 text-gray-500";
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">
      <motion.div variants={itemAnim}>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#6C4CF1]/10 px-3 py-1 text-[11px] font-semibold text-[#6C4CF1]">
          <Briefcase size={13} /> Company Eligibility
        </div>
        <h2 className="text-2xl font-bold md:text-3xl">Company-wise Eligibility Criteria</h2>
        <p className="mt-1 text-sm text-muted">View and manage company eligibility requirements</p>
      </motion.div>

      <motion.div variants={itemAnim}>
        <PremiumCard className="overflow-hidden" hover={false}>
          {isError && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle size={18} className="shrink-0 text-amber-600" />
              <span>Showing cached company data because live data is unavailable.</span>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-soft text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Req. CGPA</th>
                  <th className="px-4 py-3 font-semibold">Required Skills</th>
                  <th className="px-4 py-3 font-semibold">Allowed Depts</th>
                  <th className="px-4 py-3 font-semibold">Backlog Policy</th>
                  <th className="px-4 py-3 font-semibold">Package</th>
                  <th className="px-4 py-3 font-semibold">Eligible</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-muted">Loading companies...</td></tr>
                ) : !companies?.length ? (
                  <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-muted">No companies found. Seed the database first.</td></tr>
                ) : companies.map((c: any) => (
                  <tr key={c.id} className="border-t border-line transition hover:bg-soft/70">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-muted">{c.role}</td>
                    <td className="px-4 py-3 font-semibold">{c.requiredCgpa}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(c.requiredSkills || []).map((s: string) => (
                          <span key={s} className="rounded-md bg-[#6C4CF1]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#6C4CF1]">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{(c.allowedDepartments || []).join(", ")}</td>
                    <td className="px-4 py-3 text-xs text-muted">{c.backlogPolicy}</td>
                    <td className="px-4 py-3 font-semibold">{c.package}</td>
                    <td className="px-4 py-3">{c.eligibleStudents ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="secondary"
                        className="!h-8 !text-xs !px-3"
                        onClick={() => navigate(`/app/placement/shortlist?company=${c.id}`)}
                      >
                        Shortlist
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PremiumCard>
      </motion.div>
    </motion.div>
  );
}

// =====================================================
// DRIVES
// =====================================================
export function PlacementDrives() {
  const drives = generateDrives();

  const sections = [
    { label: "Upcoming", status: "upcoming" as const, icon: CalendarDays },
    { label: "Active", status: "active" as const, icon: Zap },
    { label: "Completed", status: "completed" as const, icon: Clock },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">
      <motion.div variants={itemAnim}>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#6C4CF1]/10 px-3 py-1 text-[11px] font-semibold text-[#6C4CF1]">
          <Target size={13} /> Drive Management
        </div>
        <h2 className="text-2xl font-bold md:text-3xl">Placement Drives</h2>
        <p className="mt-1 text-sm text-muted">Manage and monitor all placement drives</p>
      </motion.div>

      {sections.map((section) => {
        const filtered = drives.filter((d) => d.status === section.status);
        if (!filtered.length) return null;
        const Icon = section.icon;

        return (
          <motion.div key={section.status} variants={itemAnim}>
            <div className="mb-4 flex items-center gap-2">
              <Icon size={16} className="text-[#6C4CF1]" />
              <h3 className="text-lg font-bold">{section.label}</h3>
              <span className="rounded-full bg-[#6C4CF1]/10 px-2 py-0.5 text-[10px] font-semibold text-[#6C4CF1]">{filtered.length}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((drive, i) => (
                <PremiumCard key={drive.id} index={i}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] text-sm font-bold text-white">
                      {drive.company.charAt(0)}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      drive.status === "completed" ? "bg-gray-100 text-gray-500" :
                      drive.status === "active" ? "bg-green-50 text-green-700" :
                      "bg-blue-50 text-blue-700"
                    }`}>{drive.status}</span>
                  </div>
                  <h4 className="text-base font-bold">{drive.company}</h4>
                  <p className="text-xs text-muted">{drive.role}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-muted"><CalendarDays size={11} /> {drive.date}</p>
                  <div className="mt-3 grid grid-cols-5 gap-1 text-center">
                    <div className="rounded-lg bg-soft p-1.5">
                      <p className="text-xs font-bold">{drive.eligible}</p>
                      <p className="text-[9px] text-muted">Elig</p>
                    </div>
                    <div className="rounded-lg bg-soft p-1.5">
                      <p className="text-xs font-bold">{drive.registered}</p>
                      <p className="text-[9px] text-muted">Reg</p>
                    </div>
                    <div className="rounded-lg bg-soft p-1.5">
                      <p className="text-xs font-bold">{drive.shortlisted}</p>
                      <p className="text-[9px] text-muted">Short</p>
                    </div>
                    <div className="rounded-lg bg-soft p-1.5">
                      <p className="text-xs font-bold">{drive.selected}</p>
                      <p className="text-[9px] text-muted">Sel</p>
                    </div>
                    <div className="rounded-lg bg-soft p-1.5">
                      <p className="text-xs font-bold">{drive.offers}</p>
                      <p className="text-[9px] text-muted">Offers</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-[#6C4CF1]/5 to-[#8B5CF6]/5 p-2.5">
                    <span className="text-xs text-muted">Package</span>
                    <span className="text-sm font-bold text-[#6C4CF1]">{drive.package}</span>
                  </div>
                </PremiumCard>
              ))}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// =====================================================
// PLACEMENT INSIGHTS
// =====================================================
export function PlacementInsights() {
  const skillAnalytics = generateSkillAnalytics();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">
      <motion.div variants={itemAnim}>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#6C4CF1]/10 px-3 py-1 text-[11px] font-semibold text-[#6C4CF1]">
          <Brain size={13} /> AI Insights
        </div>
        <h2 className="text-2xl font-bold md:text-3xl">AI Placement Insights</h2>
        <p className="mt-1 text-sm text-muted">Data-driven insights for placement preparation and strategy</p>
      </motion.div>

      <motion.div variants={itemAnim}>
        <PremiumCard className="p-6" hover={false}>
          <div className="mb-4">
            <p className="text-sm font-semibold">Skill Demand vs Student Skills</p>
            <p className="text-xs text-muted">Analyzing skill gaps between industry demand and student proficiency</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-soft text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Skill</th>
                  <th className="px-4 py-3 font-semibold">Student Count</th>
                  <th className="px-4 py-3 font-semibold">Company Demand</th>
                  <th className="px-4 py-3 font-semibold">Gap %</th>
                  <th className="px-4 py-3 font-semibold">Recommended Action</th>
                </tr>
              </thead>
              <tbody>
                {skillAnalytics.map((s, i) => (
                  <tr key={s.skill} className="border-t border-line transition hover:bg-soft/70">
                    <td className="px-4 py-3 font-medium">{s.skill}</td>
                    <td className="px-4 py-3">{s.studentCount}</td>
                    <td className="px-4 py-3">{s.companyDemand}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full ${s.gapPercent >= 40 ? "bg-red-500" : s.gapPercent >= 25 ? "bg-amber-500" : "bg-green-500"}`}
                            style={{ width: `${s.gapPercent}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${s.gapPercent >= 40 ? "text-red-600" : s.gapPercent >= 25 ? "text-amber-600" : "text-green-600"}`}>
                          {s.gapPercent}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{s.recommendedAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PremiumCard>
      </motion.div>

      <motion.div variants={itemAnim} className="flex flex-wrap gap-3">
        <Button><FileText size={15} /> Generate Training Plan</Button>
        <Button variant="secondary"><UserCheck size={15} /> Generate Shortlist</Button>
        <Button variant="secondary"><BarChart3 size={15} /> Generate Placement Report</Button>
      </motion.div>
    </motion.div>
  );
}

// =====================================================
// SKILL ANALYTICS
// =====================================================
export function PlacementSkillAnalytics() {
  const skillAnalytics = generateSkillAnalytics();

  const chartData = skillAnalytics.map((s) => ({
    name: s.skill,
    Supply: s.studentCount,
    Demand: s.companyDemand,
  }));

  const topGaps = [...skillAnalytics].sort((a, b) => b.gapPercent - a.gapPercent).slice(0, 6);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">
      <motion.div variants={itemAnim}>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#6C4CF1]/10 px-3 py-1 text-[11px] font-semibold text-[#6C4CF1]">
          <BarChart3 size={13} /> Skill Analytics
        </div>
        <h2 className="text-2xl font-bold md:text-3xl">Skill Demand vs Supply Analysis</h2>
        <p className="mt-1 text-sm text-muted">Identify skill gaps and plan targeted training programs</p>
      </motion.div>

      <motion.div variants={itemAnim}>
        <PremiumCard className="p-6" hover={false}>
          <p className="mb-4 text-sm font-semibold">Skill Demand vs Supply</p>
          <ResponsiveContainer width="100%" height={360}>
            <ReBar data={chartData} barGap={6}>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="Supply" fill="#6C4CF1" radius={[6, 6, 0, 0]} barSize={20} name="Student Supply" />
              <Bar dataKey="Demand" fill="#F59E0B" radius={[6, 6, 0, 0]} barSize={20} name="Company Demand" />
            </ReBar>
          </ResponsiveContainer>
        </PremiumCard>
      </motion.div>

      <motion.div variants={itemAnim}>
        <p className="mb-4 text-sm font-semibold">Top Skill Gaps</p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topGaps.map((s, i) => (
            <PremiumCard key={s.skill} index={i}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold">{s.skill}</h4>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.gapPercent >= 40 ? "bg-red-50 text-red-700" : s.gapPercent >= 25 ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>
                  {s.gapPercent}% gap
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted mb-2">
                <span>Students: {s.studentCount}</span>
                <span>Demand: {s.companyDemand}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${s.gapPercent >= 40 ? "bg-red-500" : s.gapPercent >= 25 ? "bg-amber-500" : "bg-green-500"}`}
                  style={{ width: `${s.gapPercent}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-muted">{s.recommendedAction}</p>
            </PremiumCard>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemAnim} className="flex flex-wrap gap-3">
        <Button><Sparkles size={15} /> Generate Training Plan</Button>
        <Button variant="secondary"><Target size={15} /> Focus Areas</Button>
      </motion.div>
    </motion.div>
  );
}
