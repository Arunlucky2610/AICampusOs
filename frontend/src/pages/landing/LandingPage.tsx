import { memo, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  BriefcaseBusiness,
  Building2,
  ChartSpline,
  Check,
  GraduationCap,
  Lightbulb,
  Menu,
  MessageSquare,
  MinusCircle,
  Moon,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Users,
  Workflow,
  X,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useTheme } from "../../context/ThemeContext";

const capabilities = [
  { title: "Student Intelligence", icon: GraduationCap, items: ["AI Learning Roadmaps", "Skill Gap Analysis", "Placement Readiness Score", "Resume Analyzer", "Career Recommendations", "Internship Guidance"] },
  { title: "Faculty Intelligence", icon: Users, items: ["At-Risk Student Detection", "Class Performance Analytics", "Attendance Intelligence", "Student Engagement Tracking", "AI Teaching Insights", "Early Intervention Suggestions"] },
  { title: "Placement Intelligence", icon: BriefcaseBusiness, items: ["Placement Prediction", "Resume Quality Analysis", "Company Eligibility Matching", "Student Shortlisting", "Skill Demand Analytics", "Recruiter Dashboard"] },
  { title: "Parent Engagement", icon: MessageSquare, items: ["Academic Progress", "Attendance Tracking", "Performance Reports", "Assignment Updates", "AI Suggestions", "Parent-Teacher Communication"] },
  { title: "Institution Intelligence", icon: Building2, items: ["Department Analytics", "Institutional KPIs", "Student Success Analytics", "Campus Health Dashboard", "Executive Reports", "Predictive Decision Support"] },
  { title: "AI Engine", icon: Brain, items: ["Predictive Analytics", "Machine Learning Models", "AI Recommendations", "Explainable AI", "Risk Detection", "Smart Alerts"] },
];

type TagName = "NEW" | "AI" | "LIVE" | "SMART" | "PREDICTIVE" | "AUTO" | "REAL TIME";

const tagStyles: Record<TagName, { bg: string; text: string }> = {
  "NEW": { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
  "AI": { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-300" },
  "LIVE": { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-300" },
  "SMART": { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
  "PREDICTIVE": { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  "AUTO": { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300" },
  "REAL TIME": { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
};

const comparison = [
  { erp: "Stores Student Data", ours: "AI-Powered Student Intelligence", tag: "AI" as TagName, aiIcon: "Brain" },
  { erp: "Attendance Reports", ours: "Attendance Prediction & Risk Alerts", tag: "PREDICTIVE" as TagName, aiIcon: "TrendingUp" },
  { erp: "Manual Placement Tracking", ours: "AI Placement Readiness Score", tag: "AI" as TagName, aiIcon: "Target" },
  { erp: "Static Student Profiles", ours: "Dynamic AI Student Portfolio", tag: "SMART" as TagName, aiIcon: "BookOpen" },
  { erp: "Marks & CGPA Only", ours: "Holistic Performance Analytics", tag: "AI" as TagName, aiIcon: "ChartSpline" },
  { erp: "Manual Career Guidance", ours: "Personalized AI Career Roadmap", tag: "SMART" as TagName, aiIcon: "Lightbulb" },
  { erp: "Basic Resume Storage", ours: "AI Resume Analyzer & ATS Score", tag: "AI" as TagName, aiIcon: "Briefcase" },
  { erp: "No Mock Interviews", ours: "AI Mock Interview with Feedback", tag: "NEW" as TagName, aiIcon: "Bot" },
  { erp: "No Coding Analytics", ours: "Live Coding Progress Tracking", tag: "LIVE" as TagName, aiIcon: "Sparkles" },
  { erp: "No Skill Gap Analysis", ours: "AI Skill Gap Detection", tag: "AI" as TagName, aiIcon: "Brain" },
  { erp: "Manual Notifications", ours: "Smart AI Recommendations", tag: "SMART" as TagName, aiIcon: "Lightbulb" },
  { erp: "Static Dashboards", ours: "Real-time Interactive Dashboards", tag: "REAL TIME" as TagName, aiIcon: "ChartSpline" },
  { erp: "Department-wise Reports", ours: "Predictive Department Analytics", tag: "PREDICTIVE" as TagName, aiIcon: "Building2" },
  { erp: "No Company Matching", ours: "AI Company Eligibility Matching", tag: "AI" as TagName, aiIcon: "Briefcase" },
  { erp: "No Learning Guidance", ours: "AI Personalized Learning Paths", tag: "AI" as TagName, aiIcon: "BookOpen" },
  { erp: "No Student Risk Prediction", ours: "Early Dropout & Backlog Prediction", tag: "PREDICTIVE" as TagName, aiIcon: "AlertCircle" },
  { erp: "No Parent Insights", ours: "Parent Performance Dashboard", tag: "NEW" as TagName, aiIcon: "Users" },
  { erp: "No Faculty Intelligence", ours: "Faculty Performance Analytics", tag: "AI" as TagName, aiIcon: "GraduationCap" },
  { erp: "No Placement Insights", ours: "Placement Success Forecast", tag: "PREDICTIVE" as TagName, aiIcon: "TrendingUp" },
  { erp: "No Institutional AI", ours: "Institution-wide AI Decision Engine", tag: "AI" as TagName, aiIcon: "Brain" },
  { erp: "No Automation", ours: "AI Workflow Automation", tag: "AUTO" as TagName, aiIcon: "Workflow" },
];

const aiIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  Brain, TrendingUp, Target, BookOpen, ChartSpline, Lightbulb, Briefcase, Bot, Sparkles, Building2, AlertCircle, Users, GraduationCap, Workflow,
};

const dashColors = ["#7C3AED", "#2563EB", "#EC4899", "#F97316"];

function seededRandom(seed: number) {
  return Math.sin(seed * 9283.37) * 10000 % 1 + 1 - Math.floor(Math.sin(seed * 9283.37) * 10000 % 1);
}

const DASH_COUNT = 50;

const heroDashes = Array.from({ length: DASH_COUNT }, (_, index) => {
  const zone = seededRandom((index + 1) * 11);
  const area = zone < 0.34 ? "top" : zone < 0.62 ? "left" : zone < 0.9 ? "right" : "bottom";
  return {
    area,
    x: 6 + seededRandom((index + 1) * 17) * 88,
    y: 8 + seededRandom((index + 1) * 19) * 84,
    width: 3 + seededRandom((index + 1) * 41) * 3,
    opacity: 0.12 + seededRandom((index + 1) * 43) * 0.15,
    rotate: seededRandom((index + 1) * 47) * 180,
    color: dashColors[Math.floor(seededRandom((index + 1) * 53) * dashColors.length)],
  };
});

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const, delay },
});

function useScrollBlur() {
  const [blur, setBlur] = useState(false);
  useEffect(() => {
    let frame: number;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setBlur(window.scrollY > 20));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, []);
  return blur;
}

const ThemeToggle = memo(function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="grid h-9 w-9 place-items-center rounded-xl text-muted transition-all duration-300 hover:bg-soft hover:text-primary dark:text-white/50 dark:hover:bg-white/[0.06] dark:hover:text-primary"
    >
      <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
        {theme === "light" ? <Sun size={16} /> : <Moon size={16} />}
      </motion.span>
    </button>
  );
});

const ComparisonRow = memo(function ComparisonRow({ icon: Icon, text, tag, index, side }: { icon: React.ComponentType<{ size?: number }>; text: string; tag?: TagName; index: number; side: "erp" | "ai" }) {
  const tagStyle = tag ? tagStyles[tag] : null;
  const isErp = side === "erp";
  return (
    <motion.div
      initial={{ opacity: 0, x: isErp ? -16 : 16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all duration-300 ${
        isErp
          ? "text-gray-400 hover:bg-gray-50 hover:text-gray-500 dark:text-white/30 dark:hover:bg-white/[0.03] dark:hover:text-white/50"
          : "font-medium text-ink hover:bg-primary/[0.04] hover:text-primary dark:text-white/70 dark:hover:bg-primary/[0.06] dark:hover:text-primary"
      }`}
    >
      <div className={`shrink-0 transition-all duration-300 ${
        isErp
          ? "text-red-300 group-hover:text-red-400 dark:text-red-400/50 dark:group-hover:text-red-400"
          : "text-primary/60 group-hover:scale-110 group-hover:text-primary dark:text-primary/40 dark:group-hover:text-primary"
      }`}>
        <Icon size={16} />
      </div>
      <span className="flex-1 leading-snug">{text}</span>
      {tagStyle && (
        <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tagStyle.bg} ${tagStyle.text}`}>
          {tag}
        </span>
      )}
    </motion.div>
  );
});

const Footer = memo(function Footer() {
  return (
    <footer className="border-t border-gray-200/50 bg-white transition-colors dark:border-white/[0.04] dark:bg-[#050505]">
      <div className="mx-auto max-w-6xl px-4 py-12 text-center md:py-16">
        <Link to="/" className="inline-flex items-center gap-3 font-bold">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-sm text-white shadow-lg shadow-primary/20">
            AI
          </span>
          <span className="text-lg text-ink dark:text-white">AI CampusOS</span>
        </Link>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted dark:text-white/50">
          The AI Operating System for Modern Higher Education
        </p>
        <p className="mt-3 text-sm text-muted/60 dark:text-white/30">
          Empowering Students &bull; Faculty &bull; Parents &bull; Placement Officers &bull; Institutions
        </p>
        <div className="mx-auto mt-10 h-px max-w-xs bg-gradient-to-r from-transparent via-line to-transparent dark:via-white/[0.08]" />
        <p className="mt-8 text-sm text-muted/50 dark:text-white/25">
          &copy; 2026 AI CampusOS. All Rights Reserved.
        </p>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm text-muted/50 dark:text-white/25">
          <a href="#" className="transition hover:text-primary dark:hover:text-primary">Privacy Policy</a>
          <span className="h-1 w-1 rounded-full bg-line dark:bg-white/[0.08]" />
          <a href="#" className="transition hover:text-primary dark:hover:text-primary">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
});

const HeroDashes = memo(function HeroDashes() {
  const areas = {
    top: { left: 0, right: 0, top: 0, height: 48 },
    left: { left: 0, top: 180, bottom: 100, width: 100 },
    right: { right: 0, top: 180, bottom: 100, width: 100 },
    bottom: { left: 0, right: 0, bottom: 0, height: 80 },
  };

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden md:block">
      {Object.entries(areas).map(([area, style]) => (
        <div key={area} className="absolute" style={style}>
          {heroDashes.filter(dash => dash.area === area).map((dash, index) => (
            <span
              key={`${area}-${index}`}
              className="absolute block rounded-full"
              style={{
                left: `${dash.x}%`,
                top: `${dash.y}%`,
                width: `${dash.width}px`,
                height: "1px",
                opacity: dash.opacity,
                backgroundColor: dash.color,
                transform: `translate3d(-50%, -50%, 0) rotate(${dash.rotate}deg)`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
});

const navLinks = [
  { href: "#platform", label: "Platform" },
  { href: "#platform", label: "Features" },
  { href: "#outcomes", label: "Outcomes" },
  { href: "#contact", label: "Contact" },
];

function Navbar() {
  const blur = useScrollBlur();
  const [open, setOpen] = useState(false);

  const handleNav = (href: string) => {
    setOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        blur
          ? "border-b border-line/80 bg-white/80 shadow-[0_1px_12px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#050505]/80"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 font-bold">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/20">
            AI
          </span>
          <span className="text-ink dark:text-white">AI CampusOS</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 text-sm font-semibold lg:flex">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={(e) => { e.preventDefault(); handleNav(href); }}
              className="relative text-muted transition-colors hover:text-ink after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:rounded-full after:bg-primary after:transition-all after:duration-300 hover:after:w-full dark:text-white/50 dark:hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Desktop buttons */}
          <div className="hidden gap-2 sm:flex">
            <Link to="/login"><Button variant="secondary" className="h-10">Explore Platform</Button></Link>
            <Link to="/register"><Button className="h-10">Book Demo <ArrowRight size={16}/></Button></Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            className="grid h-9 w-9 place-items-center rounded-xl text-muted transition-colors hover:bg-soft hover:text-primary lg:hidden dark:text-white/50 dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <motion.div
        initial={false}
        animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="overflow-hidden border-t border-line/60 bg-white/95 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#050505]/95 lg:hidden"
      >
        <div className="mx-auto max-w-7xl space-y-1 px-4 py-5">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={(e) => { e.preventDefault(); handleNav(href); }}
              className="block rounded-xl px-4 py-3 text-sm font-semibold text-muted transition-colors hover:bg-soft hover:text-ink dark:text-white/50 dark:hover:bg-white/[0.04] dark:hover:text-white"
            >
              {label}
            </a>
          ))}
          <div className="flex gap-3 pt-3">
            <Link to="/login" className="flex-1" onClick={() => setOpen(false)}><Button variant="secondary" className="w-full">Explore Platform</Button></Link>
            <Link to="/register" className="flex-1" onClick={() => setOpen(false)}><Button className="w-full">Book Demo</Button></Link>
          </div>
        </div>
      </motion.div>
    </header>
  );
}

export function LandingPage() {
  const prefersReduced = useReducedMotion();
  const anim = !prefersReduced;

  return (
    <div className="relative min-h-screen bg-white text-ink transition-colors dark:bg-[#050505] dark:text-white">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative flex min-h-[calc(100vh-88px)] items-center justify-center overflow-hidden bg-white px-4 py-20 dark:bg-[#050505]">
        <HeroDashes />
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.055] blur-2xl dark:bg-primary/[0.08]" />
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          {anim ? (
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-1 text-sm font-semibold text-primary shadow-sm backdrop-blur-xl dark:border-primary/20 dark:bg-white/[0.04]">
                <Sparkles size={16}/> AI-powered operating system for universities
              </div>
              <h1 className="text-6xl font-semibold tracking-tight md:text-8xl">AI CampusOS</h1>
              <p className="mt-6 text-2xl font-semibold tracking-tight text-ink md:text-3xl dark:text-white">The AI Operating System for Modern Universities.</p>
              <p className="mt-3 text-lg font-semibold text-primary md:text-xl">Predict. Analyze. Guide. Place.</p>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-muted md:text-xl md:leading-9 dark:text-white/60">
                AI CampusOS unifies academics, placements, faculty intelligence, parent engagement, and institutional analytics into one AI-powered platform that helps universities improve student success through predictive AI.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link to="/register">
                  <Button className="group/btn relative h-12 overflow-hidden rounded-xl px-7 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-[0_0_24px_rgba(108,76,241,0.35)]">
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity duration-500 group-hover/btn:opacity-100" />
                    <span className="relative z-10 flex items-center gap-2">
                      Book Demo <ArrowRight size={18} className="transition-transform duration-300 group-hover/btn:translate-x-0.5" />
                    </span>
                  </Button>
                </Link>
                <Link to="/login"><Button variant="secondary" className="h-12 px-7">Explore Platform</Button></Link>
              </div>
            </motion.div>
          ) : (
            <div>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-1 text-sm font-semibold text-primary shadow-sm backdrop-blur-xl dark:border-primary/20 dark:bg-white/[0.04]">
                <Sparkles size={16}/> AI-powered operating system for universities
              </div>
              <h1 className="text-6xl font-semibold tracking-tight md:text-8xl">AI CampusOS</h1>
              <p className="mt-6 text-2xl font-semibold tracking-tight text-ink md:text-3xl dark:text-white">The AI Operating System for Modern Universities.</p>
              <p className="mt-3 text-lg font-semibold text-primary md:text-xl">Predict. Analyze. Guide. Place.</p>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-muted md:text-xl md:leading-9 dark:text-white/60">
                AI CampusOS unifies academics, placements, faculty intelligence, parent engagement, and institutional analytics into one AI-powered platform that helps universities improve student success through predictive AI.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link to="/register"><Button className="h-12 px-7">Book Demo <ArrowRight size={18}/></Button></Link>
                <Link to="/login"><Button variant="secondary" className="h-12 px-7">Explore Platform</Button></Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Platform / Features ── */}
      <section id="platform" className="mx-auto max-w-7xl px-4 py-20 scroll-mt-24 md:py-28">
        <motion.div {...fadeUp()} className="text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary">What AI CampusOS Delivers</p>
          <h2 className="text-4xl font-semibold tracking-tight md:text-6xl">One Platform. Every Campus Intelligence.</h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-muted dark:text-white/60">
            Six integrated intelligence layers that transform scattered campus data into predictive insights and coordinated action.
          </p>
        </motion.div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(({ title, icon: Icon, items }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5 }}
              whileHover={anim ? { y: -6 } : undefined}
            >
              <Card className="group/card h-full p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_24px_80px_rgba(108,76,241,0.1)] dark:hover:border-primary/40 dark:hover:shadow-[0_24px_80px_rgba(108,76,241,0.06)]">
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover/card:scale-110 group-hover/card:bg-primary/15 dark:bg-primary/15 dark:group-hover/card:bg-primary/20">
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <ul className="mt-4 space-y-2">
                  {items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted dark:text-white/50">
                      <Check size={14} className="mt-0.5 shrink-0 text-primary dark:text-primary/70"/> {item}
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Outcomes ── */}
      <section id="outcomes" className="mx-auto max-w-7xl px-4 py-20 scroll-mt-24 md:py-28">
        <motion.div {...fadeUp()} className="text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Why AI CampusOS</p>
          <h2 className="text-4xl font-semibold tracking-tight md:text-6xl">More Than a Traditional Campus ERP</h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-muted dark:text-white/60">
            Traditional ERP systems only store institutional data. AI CampusOS transforms that data into intelligence, predictions, automation, and personalized guidance for every stakeholder.
          </p>
        </motion.div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-6 lg:grid-cols-2">
          {/* Traditional ERP Card */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="rounded-[24px] border border-line bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all duration-300 md:p-8 dark:border-white/[0.06] dark:bg-[#111] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
          >
            <div className="mb-6 flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-white/[0.04] dark:text-white/30">
                <MinusCircle size={22} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white/80">Traditional Campus ERP</h3>
                <p className="mt-0.5 text-sm text-gray-400 dark:text-white/30">Legacy approach</p>
              </div>
            </div>
            <div className="space-y-0.5">
              {comparison.map((row, i) => (
                <ComparisonRow key={`erp-${i}`} icon={XCircle} text={row.erp} index={i} side="erp" />
              ))}
            </div>
          </motion.div>

          {/* AI CampusOS Card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="group/ai-card relative rounded-[24px] border-2 border-primary/20 bg-white p-6 shadow-[0_16px_48px_rgba(108,76,241,0.10)] transition-all duration-300 hover:shadow-[0_24px_64px_rgba(108,76,241,0.18)] md:p-8 dark:border-primary/25 dark:bg-[#111] dark:shadow-[0_16px_48px_rgba(108,76,241,0.04)] dark:hover:shadow-[0_24px_64px_rgba(108,76,241,0.08)]"
            style={{ animation: anim ? "pulseGlow 3s ease-in-out infinite" : undefined }}
          >
            <div className="absolute -inset-[1px] rounded-[24px] bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-60 pointer-events-none dark:from-primary/15 dark:to-primary/8" />
            <div className="relative z-10">
              <div className="mb-6 flex items-center gap-4">
                <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/20">
                  <Sparkles size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-ink dark:text-white">AI CampusOS</h3>
                    <span className="rounded-full bg-gradient-to-r from-primary to-secondary px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
                      AI Powered
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-primary/70 dark:text-primary/50">Next-generation platform</p>
                </div>
              </div>
              <div className="space-y-0.5">
                {comparison.map((row, i) => {
                  const Icon = aiIcons[row.aiIcon] || Sparkles;
                  return <ComparisonRow key={`ai-${i}`} icon={Icon} text={row.ours} tag={row.tag} index={i} side="ai" />;
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="mx-auto max-w-3xl px-4 py-16 scroll-mt-24 md:py-20">
        <motion.div {...fadeUp()} className="text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Contact</p>
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">Let's Transform Your Campus Together</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted dark:text-white/60">
            Ready to see AI CampusOS in action? Get in touch with our team for a personalised demo and consultation.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button className="h-12 px-8">Book a Demo <ArrowRight size={18} /></Button>
            </Link>
            <a href="mailto:hello@aicampusos.com">
              <Button variant="secondary" className="h-12 px-8">hello@aicampusos.com</Button>
            </a>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
