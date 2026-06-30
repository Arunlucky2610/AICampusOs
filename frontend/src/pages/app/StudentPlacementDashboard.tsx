import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Award, Brain, BriefcaseBusiness, CalendarDays, ChevronRight, FileText,
  Send, Sparkles, Target, TrendingUp, Users,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart as RBarChart, CartesianGrid, Line, LineChart,
  PolarAngleAxis, PolarGrid, Radar, RadarChart, RadialBar, RadialBarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card } from "../../components/ui/Card";
import { useStudentProfile } from "../../context/StudentProfileContext";

export function StudentPlacementDashboard() {
  const { profile, completion } = useStudentProfile();
  const navigate = useNavigate();
  const [selectedInsight, setSelectedInsight] = useState(0);
  const p = profile;
  const hasRealData = !!(p?.placement_readiness_score || p?.resume_score || p?.coding_score);
  const profileIncomplete = completion.percent < 50;

  const placementKpis = [
    { label: "Placement Readiness", value: p?.placement_readiness_score ? `${p.placement_readiness_score}%` : "—", trend: p?.placement_readiness_score ? "+8%" : "", score: p?.placement_readiness_score || 0, color: "#6C4CF1" },
    { label: "Resume Score", value: p?.resume_score ? `${p.resume_score}%` : "—", trend: p?.resume_score ? "+12%" : "", score: p?.resume_score || 0, color: "#3B82F6" },
    { label: "Coding Score", value: p?.coding_score ? `${p.coding_score}%` : "—", trend: p?.coding_score ? "+6%" : "", score: p?.coding_score || 0, color: "#8B5CF6" },
    { label: "Communication", value: p?.skill_score ? `${Math.round(p.skill_score * 0.9)}%` : "—", trend: "+4%", score: p?.skill_score ? Math.round(p.skill_score * 0.9) : 0, color: "#22C55E" },
    { label: "Mock Interview Score", value: p?.mock_interview_score ? `${p.mock_interview_score}%` : "—", trend: p?.mock_interview_score ? "+15%" : "", score: p?.mock_interview_score || 0, color: "#F59E0B" },
    { label: "Company Eligibility", value: p?.eligible_companies ? String(p.eligible_companies) : "—", trend: "+8", score: Math.min(100, (p?.eligible_companies || 0) * 4), color: "#EF4444" },
    { label: "Applications Sent", value: p?.applications ? String(p.applications) : "—", trend: "+5", score: Math.min(100, (p?.applications || 0) * 8), color: "#6C4CF1" },
    { label: "Offers Received", value: p?.offers ? String(p.offers) : "—", trend: p?.offers ? "+2" : "", score: Math.min(100, (p?.offers || 0) * 50), color: "#22C55E" },
  ];

  const skills = p?.skills_data || {};
  const allSkills = [
    ...(skills.programming_languages || []).map((s: string) => ({ skill: s, score: 75 + Math.random() * 20 })),
    ...(skills.frameworks || []).map((s: string) => ({ skill: s, score: 65 + Math.random() * 25 })),
    ...(skills.ai_skills || []).map((s: string) => ({ skill: s, score: 60 + Math.random() * 30 })),
  ].slice(0, 6);

  const applicationTimeline = [
    { month: "Jan", sent: Math.max(0, (p?.applications || 12) - 10), interviews: 0, offers: 0 },
    { month: "Feb", sent: Math.max(0, (p?.applications || 12) - 7), interviews: 1, offers: 0 },
    { month: "Mar", sent: Math.max(0, (p?.applications || 12) - 5), interviews: 0, offers: 0 },
    { month: "Apr", sent: Math.max(0, (p?.applications || 12) - 3), interviews: 2, offers: Math.min(1, p?.offers || 0) },
    { month: "May", sent: Math.max(0, (p?.applications || 12) - 1), interviews: 1, offers: 0 },
    { month: "Jun", sent: p?.applications || 12, interviews: 2, offers: p?.offers || 0 },
  ];

  const resumeScoreTrend = [
    { month: "Jan", score: Math.max(0, (p?.resume_score || 81) - 19) },
    { month: "Feb", score: Math.max(0, (p?.resume_score || 81) - 16) },
    { month: "Mar", score: Math.max(0, (p?.resume_score || 81) - 13) },
    { month: "Apr", score: Math.max(0, (p?.resume_score || 81) - 9) },
    { month: "May", score: Math.max(0, (p?.resume_score || 81) - 3) },
    { month: "Jun", score: p?.resume_score || 81 },
  ];

  const aiPlacementInsights = [
    { icon: Brain, text: `Complete more coding practice to increase coding score from ${p?.coding_score || 0}%.`, color: "from-[#6C4CF1] to-[#8B5CF6]" },
    { icon: FileText, text: `Your resume ATS score is ${p?.resume_score || 0}%. Add project metrics to reach 90+.`, color: "from-[#3B82F6] to-[#60A5FA]" },
    { icon: Users, text: `You're eligible for ${p?.eligible_companies || 0} companies. Start preparing for top picks.`, color: "from-[#22C55E] to-[#4ADE80]" },
    { icon: Target, text: `Placement readiness is ${p?.placement_readiness_score || 0}%. Focus on mock interviews to improve.`, color: "from-[#F59E0B] to-[#FBBF24]" },
  ];

  const companies = [
    ...(p?.eligible_companies ? [
      { name: "Google", eligible: true, role: "SDE", deadline: "Jul 15" },
      { name: "Microsoft", eligible: true, role: "SWE", deadline: "Jul 20" },
      { name: "Amazon", eligible: true, role: "SDE", deadline: "Jul 25" },
      { name: "Stripe", eligible: true, role: "Backend", deadline: "Aug 1" },
    ] : []),
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#6C4CF1]/15 bg-[#6C4CF1]/5 px-3.5 py-1.5 text-xs font-semibold text-[#6C4CF1]">
            <Sparkles size={13} /> AI-Powered Placement Intelligence
          </div>
          <h2 className="text-[32px] font-bold tracking-tight text-[#111827]">Placement Dashboard</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6B7280]">
            {profileIncomplete ? "Complete your profile to unlock placement insights, company eligibility, and AI predictions." : "Track your placement readiness, coding progress, interview performance, and company eligibility."}
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          {profileIncomplete && (
            <button onClick={() => navigate("/app/student/profile")}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#F59E0B]/25 transition hover:shadow-xl">
              <Sparkles size={15} /> Complete Profile
            </button>
          )}
          <button className="flex items-center gap-2 rounded-xl border border-[#E8ECF1] bg-white px-4 py-2.5 text-sm font-medium text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]">
            <CalendarDays size={15} /> This Season
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#6C4CF1]/25 transition hover:shadow-xl hover:shadow-[#6C4CF1]/30">
            <Sparkles size={15} /> AI Career Plan
          </button>
        </div>
      </div>

      {profileIncomplete && (
        <div className="rounded-2xl border border-[#F59E0B]/30 bg-[#FEF3C7] px-5 py-4">
          <p className="text-sm font-semibold text-[#F59E0B]">Your profile is {completion.percent}% complete.</p>
          <p className="text-xs text-[#D97706] mt-1">Fill in your placement scores, skills, and details to get accurate AI-powered placement insights.</p>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {placementKpis.map((kpi, i) => (
          <Card key={kpi.label} className="group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-[#6B7280]">{kpi.label}</p>
              <div className="grid h-9 w-9 place-items-center rounded-xl text-white text-xs font-bold shadow-sm" style={{ backgroundColor: kpi.color }}>
                {i < 2 ? <Award size={16} /> : i < 4 ? <Brain size={16} /> : i < 6 ? <Target size={16} /> : <Send size={16} />}
              </div>
            </div>
            <p className="text-[28px] font-bold tracking-tight text-[#111827]">{kpi.value}</p>
            {kpi.trend && <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#22C55E]"><TrendingUp size={13} /> {kpi.trend}</div>}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
              <div className="h-full rounded-full transition-all" style={{ width: `${kpi.score}%`, backgroundColor: kpi.color }} />
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr_1fr]">
        <Card className="p-6">
          <div className="mb-4"><p className="text-sm font-semibold text-[#6C4CF1]">READINESS</p><h3 className="mt-1 text-xl font-bold text-[#111827]">Placement Readiness Gauge</h3></div>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={260}>
              <RadialBarChart innerRadius="60%" outerRadius="94%" data={[{ name: "Score", value: p?.placement_readiness_score || 0, fill: "#6C4CF1" }]} startAngle={180} endAngle={-180}>
                <RadialBar dataKey="value" cornerRadius={18} background={{ fill: "#F3F4F6" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1" }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="-mt-48 grid place-items-center">
              <p className="text-5xl font-bold text-[#111827]">{p?.placement_readiness_score || 0}%</p>
              <p className="mt-1 text-sm font-medium text-[#6B7280]">readiness score</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4"><p className="text-sm font-semibold text-[#6C4CF1]">COMPETENCIES</p><h3 className="mt-1 text-xl font-bold text-[#111827]">Skill Radar</h3></div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={allSkills.length > 0 ? allSkills : [{ skill: "No data", score: 0 }]}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: "#6B7280" }} />
              <Radar dataKey="score" stroke="#6C4CF1" fill="#6C4CF1" fillOpacity={0.18} strokeWidth={2} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1" }} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <div className="mb-4"><p className="text-sm font-semibold text-[#6C4CF1]">CODING</p><h3 className="mt-1 text-xl font-bold text-[#111827]">Coding Progress</h3></div>
          <div className="space-y-5">
            {["LeetCode", "CodeChef", "HackerRank"].map((p) => (
              <div key={p}>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#111827]">{p}</p>
                  <span className="text-xs font-bold text-[#6C4CF1]">{Math.round((profile?.coding_score || 72) * (0.8 + Math.random() * 0.4))}/250</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6]" style={{ width: `${profile?.coding_score || 72}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div><p className="text-sm font-semibold text-[#6C4CF1]">TRACKING</p><h3 className="mt-1 text-xl font-bold text-[#111827]">Application Timeline</h3></div>
            <div className="flex items-center gap-3 text-xs font-medium text-[#6B7280]">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#6C4CF1]" /> Sent</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#3B82F6]" /> Interviews</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" /> Offers</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={applicationTimeline}>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1" }} />
              <Line type="monotone" dataKey="sent" stroke="#6C4CF1" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="interviews" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="offers" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <div className="mb-4"><p className="text-sm font-semibold text-[#6C4CF1]">PERFORMANCE</p><h3 className="mt-1 text-xl font-bold text-[#111827]">Interview Performance</h3></div>
          <ResponsiveContainer width="100%" height={280}>
            <RBarChart data={[
              { round: "Phone Screen", score: Math.min(100, (p?.mock_interview_score || 72) + 10), avg: 70 },
              { round: "Technical", score: p?.coding_score || 72, avg: 65 },
              { round: "System Design", score: Math.min(100, (p?.skill_score || 74) - 6), avg: 60 },
              { round: "Behavioral", score: Math.min(100, (p?.placement_readiness_score || 78) + 7), avg: 72 },
            ]} layout="vertical" barGap={6}>
              <CartesianGrid stroke="#F3F4F6" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="round" type="category" width={100} tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1" }} />
              <Bar dataKey="score" fill="#6C4CF1" radius={[0, 6, 6, 0]} barSize={12} />
              <Bar dataKey="avg" fill="#E5E7EB" radius={[0, 6, 6, 0]} barSize={12} />
            </RBarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center justify-center gap-4 text-xs font-medium text-[#6B7280]">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#6C4CF1]" /> Your Score</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#E5E7EB]" /> Average</span>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr_1.2fr]">
        <Card className="p-6">
          <div className="mb-4"><p className="text-sm font-semibold text-[#6C4CF1]">RESUME</p><h3 className="mt-1 text-xl font-bold text-[#111827]">Resume Score Trend</h3></div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={resumeScoreTrend}>
              <defs><linearGradient id="resumeGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#6C4CF1" stopOpacity={0.3} /><stop offset="100%" stopColor="#6C4CF1" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8ECF1" }} />
              <Area type="monotone" dataKey="score" stroke="#6C4CF1" strokeWidth={2.5} fill="url(#resumeGrad)" dot={{ r: 4, fill: "#6C4CF1" }} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-3 rounded-xl border border-[#E8ECF1] bg-[#F5F7FA] p-3">
            <div className="flex items-center justify-between text-sm"><span className="font-medium text-[#6B7280]">ATS Optimization</span><span className="font-bold text-[#6C4CF1]">{p?.resume_score || 0}%</span></div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]"><div className="h-full rounded-full bg-gradient-to-r from-[#6C4CF1] to-[#8B5CF6]" style={{ width: `${p?.resume_score || 0}%` }} /></div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4"><p className="text-sm font-semibold text-[#6C4CF1]">ELIGIBILITY</p><h3 className="mt-1 text-xl font-bold text-[#111827]">Company Eligibility</h3></div>
          <div className="space-y-2">
            {companies.length > 0 ? companies.map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-xl border border-[#E8ECF1] px-4 py-3 transition hover:border-[#6C4CF1]/20 hover:bg-[#F5F7FA]">
                <div className="flex items-center gap-3">
                  <div className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold text-white ${c.eligible ? "bg-[#22C55E]" : "bg-[#EF4444]"}`}>{c.name[0]}</div>
                  <div><p className="text-sm font-semibold text-[#111827]">{c.name}</p><p className="text-xs text-[#6B7280]">{c.role} • Deadline: {c.deadline}</p></div>
                </div>
                <span className={`text-xs font-bold ${c.eligible ? "text-[#22C55E]" : "text-[#EF4444]"}`}>{c.eligible ? "Eligible" : "Restricted"}</span>
              </div>
            )) : <p className="text-sm text-[#6B7280] py-4 text-center">Update your profile to see eligible companies</p>}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div><p className="text-sm font-semibold text-[#6C4CF1]">AI INSIGHTS</p><h3 className="mt-1 text-xl font-bold text-[#111827]">Placement Intelligence</h3></div>
            <Brain size={20} className="text-[#6C4CF1]" />
          </div>
          <div className="mb-4 flex gap-1.5">
            {aiPlacementInsights.map((_, i) => (
              <button key={i} onClick={() => setSelectedInsight(i)} className={`h-2 flex-1 rounded-full transition ${i === selectedInsight ? "bg-[#6C4CF1]" : "bg-[#E5E7EB]"}`} />
            ))}
          </div>
          <div className="rounded-2xl border border-[#E8ECF1] bg-[#F5F7FA] p-5 transition hover:border-[#6C4CF1]/20">
            <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${aiPlacementInsights[selectedInsight].color} text-white shadow-sm`}>
              {(() => { const Icon = aiPlacementInsights[selectedInsight].icon; return <Icon size={17} />; })()}
            </div>
            <p className="text-sm font-semibold leading-relaxed text-[#111827]">{aiPlacementInsights[selectedInsight].text}</p>
            <button className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#6C4CF1] transition hover:gap-2">Take Action <ChevronRight size={13} /></button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: "Applications", value: String(p?.applications || 0), color: "#6C4CF1" },
              { label: "Eligible", value: String(p?.eligible_companies || 0), color: "#3B82F6" },
              { label: "Offers", value: String(p?.offers || 0), color: "#22C55E" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-[#E8ECF1] p-3 text-center">
                <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[10px] font-medium text-[#6B7280]">{stat.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </motion.div>
  );
}
