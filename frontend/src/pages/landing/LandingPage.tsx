import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Brain,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  Database,
  GraduationCap,
  Lightbulb,
  MessageSquare,
  Sparkles,
  Target,
  Users,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

const missionCards = [
  { title: "Student Success", desc: "Personalized AI guidance helps every student achieve their full academic and career potential.", icon: GraduationCap },
  { title: "Smarter Educators", desc: "Actionable insights empower faculty to identify at-risk students and improve teaching outcomes.", icon: Lightbulb },
  { title: "AI-Driven Institutions", desc: "Predictive analytics and intelligent automation transform campus operations and decision-making.", icon: Target },
];

const capabilities = [
  { title: "Student Intelligence", icon: GraduationCap, items: ["AI Learning Roadmaps", "Skill Gap Analysis", "Placement Readiness Score", "Resume Analyzer", "Career Recommendations", "Internship Guidance"] },
  { title: "Faculty Intelligence", icon: Users, items: ["At-Risk Student Detection", "Class Performance Analytics", "Attendance Intelligence", "Student Engagement Tracking", "AI Teaching Insights", "Early Intervention Suggestions"] },
  { title: "Placement Intelligence", icon: BriefcaseBusiness, items: ["Placement Prediction", "Resume Quality Analysis", "Company Eligibility Matching", "Student Shortlisting", "Skill Demand Analytics", "Recruiter Dashboard"] },
  { title: "Parent Engagement", icon: MessageSquare, items: ["Academic Progress", "Attendance Tracking", "Performance Reports", "Assignment Updates", "AI Suggestions", "Parent-Teacher Communication"] },
  { title: "Institution Intelligence", icon: Building2, items: ["Department Analytics", "Institutional KPIs", "Student Success Analytics", "Campus Health Dashboard", "Executive Reports", "Predictive Decision Support"] },
  { title: "AI Engine", icon: Brain, items: ["Predictive Analytics", "Machine Learning Models", "AI Recommendations", "Explainable AI", "Risk Detection", "Smart Alerts"] },
];

const comparison = [
  { erp: "Stores data", ours: "Predicts outcomes" },
  { erp: "Manual reports", ours: "Recommends actions" },
  { erp: "Static dashboards", ours: "Live analytics" },
  { erp: "No prediction", ours: "Personalized guidance" },
  { erp: "Reactive decisions", ours: "Proactive decision-making" },
];

const outcomes = [
  "Improved Student Performance",
  "Higher Placement Readiness",
  "Early Risk Detection",
  "Reduced Manual Work",
  "Better Faculty Productivity",
  "Stronger Parent Engagement",
  "Smarter Leadership Decisions",
  "Data-Driven AI Campus",
];

export function LandingPage() {
  return <div className="bg-white text-ink">
    <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 font-bold">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/20">AI</span>
          <span>AI CampusOS</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-semibold text-muted lg:flex">
          <a href="#platform" className="hover:text-ink">Platform</a>
          <a href="#how-it-works" className="hover:text-ink">How It Works</a>
          <a href="#outcomes" className="hover:text-ink">Outcomes</a>
        </nav>
        <div className="flex gap-2">
          <Link to="/login"><Button variant="secondary">Explore Platform</Button></Link>
          <Link to="/register"><Button>Book Demo <ArrowRight size={16}/></Button></Link>
        </div>
      </div>
    </header>

    <section className="relative overflow-hidden border-b border-line">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute left-1/2 top-28 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mx-auto max-w-5xl px-4 py-20 text-center lg:py-28">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white px-3 py-1 text-sm font-semibold text-primary shadow-sm">
            <Sparkles size={16}/> AI-powered operating system for universities
          </div>
          <h1 className="text-6xl font-semibold tracking-normal md:text-8xl">AI CampusOS</h1>
          <p className="mt-6 text-2xl font-semibold tracking-normal text-ink md:text-3xl">The AI Operating System for Modern Universities.</p>
          <p className="mt-3 text-lg font-semibold text-primary md:text-xl">Predict. Analyze. Guide. Place.</p>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-muted md:text-xl md:leading-9">
            AI CampusOS unifies academics, placements, faculty intelligence, parent engagement, and institutional analytics into one AI-powered platform that helps universities improve student success through predictive AI.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link to="/register"><Button className="h-12 px-7">Book Demo <ArrowRight size={18}/></Button></Link>
            <Link to="/login"><Button variant="secondary" className="h-12 px-7">Explore Platform</Button></Link>
          </div>
        </motion.div>
      </div>
    </section>

    <section className="border-y border-line bg-soft py-20">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Our Mission</p>
        <h2 className="text-4xl font-semibold tracking-normal md:text-6xl">Empower every student to succeed.</h2>
        <p className="mx-auto mt-5 max-w-4xl text-lg leading-8 text-muted md:text-xl md:leading-9">
          Empower every student to succeed, every educator to make smarter decisions, and every institution to become truly AI-driven.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {missionCards.map(({ title, desc, icon: Icon }) => (
            <Card key={title} className="p-7 text-center transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_24px_80px_rgba(108,76,241,.12)]">
              <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon size={24}/></div>
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>

    <section id="platform" className="mx-auto max-w-7xl px-4 py-20">
      <div className="text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary">What AI CampusOS Delivers</p>
        <h2 className="text-4xl font-semibold tracking-normal md:text-6xl">One Platform. Every Campus Intelligence.</h2>
        <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-muted">
          Six integrated intelligence layers that transform scattered campus data into predictive insights and coordinated action.
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {capabilities.map(({ title, icon: Icon, items }) => (
          <motion.div key={title} whileHover={{ y: -4 }} transition={{ duration: .2 }}>
            <Card className="h-full p-6 transition hover:border-primary/30 hover:shadow-[0_24px_80px_rgba(108,76,241,.12)]">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon size={22}/></div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <ul className="mt-4 space-y-2">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted">
                    <Check size={14} className="mt-0.5 shrink-0 text-primary"/> {item}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>

    <section id="how-it-works" className="border-y border-line bg-soft py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary">How It Works</p>
          <h2 className="text-4xl font-semibold tracking-normal md:text-6xl">From Campus Data to Intelligent Action.</h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-muted">
            AI CampusOS transforms raw data into predictive insights, personalized recommendations, and measurable outcomes.
          </p>
        </div>
        <Flow />
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-20">
      <div className="text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Why AI CampusOS</p>
        <h2 className="text-4xl font-semibold tracking-normal md:text-6xl">Beyond Traditional Campus ERP.</h2>
        <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-muted">
          Traditional systems store data. AI CampusOS predicts outcomes, recommends actions, and drives proactive decisions.
        </p>
      </div>
      <div className="mx-auto mt-12 max-w-4xl">
        <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-2xl border border-line">
          <div className="bg-soft p-6 text-center text-sm font-semibold uppercase tracking-wider text-muted">Traditional ERP</div>
          <div className="bg-primary p-6 text-center text-sm font-semibold uppercase tracking-wider text-white">AI CampusOS</div>
          {comparison.map((row, i) => [
            <div key={`erp-${i}`} className="flex items-center gap-3 border-t border-line bg-white p-5 text-sm text-muted">
              <XCircle size={16} className="shrink-0 text-red-400"/> {row.erp}
            </div>,
            <div key={`ai-${i}`} className="flex items-center gap-3 border-t border-line bg-white p-5 text-sm font-medium text-ink">
              <Check size={16} className="shrink-0 text-primary"/> {row.ours}
            </div>,
          ])}
        </div>
      </div>
    </section>

    <section id="outcomes" className="border-y border-line bg-soft py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Outcomes</p>
          <h2 className="text-4xl font-semibold tracking-normal md:text-6xl">Outcomes We Help Create.</h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-muted">
            Designed to improve student success, placement readiness, faculty effectiveness, and institutional intelligence.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {outcomes.map((outcome) => (
            <Card key={outcome} className="flex items-center gap-4 p-5 transition hover:-translate-y-1 hover:border-primary/30">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><CheckCircle2 size={20}/></div>
              <p className="font-semibold">{outcome}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-20">
      <div className="overflow-hidden rounded-[32px] border border-primary/20 bg-gradient-to-br from-primary to-secondary p-10 text-white shadow-[0_28px_90px_rgba(108,76,241,.28)] md:p-16">
        <div className="text-center">
          <h2 className="text-4xl font-semibold md:text-6xl">Ready to Build a Smarter Campus?</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/80">
            Bring academics, placements, faculty, parents, and institutional intelligence into one AI-powered operating system.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link to="/register"><Button className="bg-white text-primary hover:bg-white">Book Demo</Button></Link>
            <Link to="/login"><Button variant="secondary" className="border-white/30 bg-white/10 text-white hover:bg-white/15">Get Started</Button></Link>
          </div>
        </div>
      </div>
    </section>

    <Footer />
  </div>;
}

function Flow() {
  const groups = [
    ["INPUT", ["Student Data", "Attendance", "Academics", "Skills", "Placement Records"], Database],
    ["AI PROCESS", ["Prediction Models", "Pattern Detection", "Recommendation Engine", "Risk Analysis", "Explainable AI"], Brain],
    ["OUTPUT", ["Performance Insights", "Career Suggestions", "Placement Readiness", "Faculty Alerts", "Parent Reports", "Institution Decisions"], CheckCircle2],
  ] as const;
  return <div className="mt-12 grid gap-5 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
    {groups.map(([title, items, Icon], index) => <div key={title} className="contents">
      <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .12 }}><Card className="p-7">
        <div className="mb-5 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white"><Icon size={22}/></div><h3 className="text-2xl font-semibold">{title}</h3></div>
        <div className="space-y-3">{items.map((item) => <div key={item} className="rounded-2xl border border-line bg-soft px-4 py-3 text-sm font-semibold">{item}</div>)}</div>
      </Card></motion.div>
      {index < groups.length - 1 && <div className="grid place-items-center text-primary"><ArrowDown className="lg:hidden"/><ArrowRight className="hidden lg:block"/></div>}
    </div>)}
  </div>;
}

function Footer() {
  const columns = {
    Product: ["AI Analytics", "AI Engine", "Role Dashboards", "Reports"],
    Solutions: ["Students", "Faculty", "Parents", "Placement Teams"],
    Resources: ["Documentation", "Case Studies", "Security", "API"],
    Company: ["About", "Contact", "Privacy", "Terms"],
  };
  return <footer className="border-t border-line bg-white py-14">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-[1.2fr_2fr]">
      <div><Link to="/" className="flex items-center gap-3 font-bold"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-white">AI</span>AI CampusOS</Link><p className="mt-5 max-w-sm leading-7 text-muted">The AI operating system for modern universities.</p><div className="mt-6 flex gap-3 text-sm font-semibold text-muted"><span>LinkedIn</span><span>Twitter</span><span>GitHub</span></div></div>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(columns).map(([title, links]) => <div key={title}><p className="font-semibold">{title}</p><div className="mt-4 space-y-3">{links.map((link) => <p key={link} className="text-sm text-muted">{link}</p>)}</div></div>)}</div>
    </div>
  </footer>;
}
