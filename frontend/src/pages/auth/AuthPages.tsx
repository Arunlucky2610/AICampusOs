import { FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  LineChart,
  LogIn,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { rolePath, useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Role } from "../../types";

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center bg-soft px-4"><Card className="w-full max-w-md p-8"><Link to="/" className="mb-8 flex items-center gap-3 font-bold"><span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white">AI</span>CampusOS</Link><h1 className="text-2xl font-semibold">{title}</h1>{children}</Card></div>;
}

const registerBenefits = [
  { icon: Brain, title: "AI-Powered Insights", desc: "Predictive analytics and personalized recommendations for every stakeholder." },
  { icon: Sparkles, title: "Role-Based Dashboards", desc: "Focused workspaces for students, faculty, parents, placement teams, and admins." },
  { icon: ShieldCheck, title: "Secure Campus Access", desc: "Enterprise-grade security with role-based access control and encryption." },
];

const loginBenefits = [
  { icon: Brain, title: "Predictive Insights", desc: "AI-driven predictions and recommendations tailored to your role and campus data." },
  { icon: ShieldCheck, title: "Secure Role-Based Access", desc: "Enterprise authentication with role-specific dashboards and data protection." },
  { icon: LineChart, title: "Real-Time Campus Analytics", desc: "Live operating dashboards for fast decisions across every stakeholder." },
];

const roleOptions: { value: Role; label: string; desc: string; icon: typeof GraduationCap }[] = [
  { value: "STUDENT", label: "Student", desc: "Access learning roadmap, skills, placements", icon: GraduationCap },
  { value: "FACULTY", label: "Faculty", desc: "Track class performance and at-risk students", icon: Users },
  { value: "PARENT", label: "Parent", desc: "Monitor student progress and updates", icon: MessageSquare },
  { value: "PLACEMENT_OFFICER", label: "Placement Officer", desc: "Manage readiness and recruitment insights", icon: BriefcaseBusiness },
  { value: "ADMIN", label: "Admin", desc: "Manage institution analytics and users", icon: ShieldCheck },
];

function LeftPanel({ title, desc, benefits }: { title: string; desc: string; benefits: readonly { icon: any; title: string; desc: string }[] }) {
  return <div className="relative flex items-center justify-center bg-soft px-6 py-16 lg:w-[45%] lg:px-12">
    <div className="absolute inset-0 grid-bg opacity-30" />
    <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
    <div className="relative max-w-md">
      <Link to="/" className="mb-10 flex items-center gap-3 font-bold">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/20">AI</span>
        <span className="text-xl">AI CampusOS</span>
      </Link>
      <h1 className="text-4xl font-semibold tracking-normal md:text-5xl">{title}</h1>
      <p className="mt-5 text-lg leading-8 text-muted">{desc}</p>
      <div className="mt-10 space-y-6">
        {benefits.map((b) => (
          <div key={b.title} className="flex items-start gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><b.icon size={20}/></div>
            <div><p className="font-semibold">{b.title}</p><p className="mt-1 text-sm text-muted">{b.desc}</p></div>
          </div>
        ))}
      </div>
    </div>
  </div>;
}

function FieldErr({ msg }: { msg: string | undefined }) {
  return msg ? <p className="mt-1 text-xs text-red-500">{msg}</p> : null;
}

function BackToLanding() {
  return <Link to="/" className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-primary bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm transition duration-200 hover:bg-primary hover:text-white md:left-8 md:top-8">
    <ArrowLeft size={16}/> Back to Landing Page
  </Link>;
}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login } = useAuth();
  const navigate = useNavigate();

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = "Please enter a valid email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Please enter a valid email";
    if (!password) errs.password = "Password is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function clearError(field: string) {
    if (errors[field]) setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const role = await login(email.trim(), password);
      navigate(rolePath[role]);
    } catch (err: any) {
      setErrors({ form: err.response?.data?.detail || "Invalid email or password." });
    } finally {
      setLoading(false);
    }
  }

  return <div className="min-h-screen bg-white lg:flex">
    <BackToLanding />
    <LeftPanel title="Welcome back to AI CampusOS" desc="Sign in to access your intelligent campus workspace, personalized dashboard, AI insights, and role-based analytics." benefits={loginBenefits} />

    <div className="flex items-center justify-center px-4 py-12 lg:w-[55%]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }} className="w-full max-w-lg">
        <div className="rounded-[24px] border border-line bg-white p-8 shadow-[0_24px_88px_rgba(17,24,39,.10)] md:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/20"><LogIn size={26}/></div>
            <h2 className="text-2xl font-semibold">Sign in to your workspace</h2>
            <p className="mt-2 text-muted">Continue to your AI CampusOS dashboard.</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Email Address</label>
              <input value={email} onChange={(e) => { setEmail(e.target.value); clearError("email"); }} type="email" placeholder="you@university.edu" className={`h-12 w-full rounded-xl border bg-white px-4 text-sm outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/10 ${errors.email ? "border-red-400 focus:border-red-400" : "border-line"}`} />
              <FieldErr msg={errors.email} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Password</label>
              <div className={`flex items-center rounded-xl border bg-white pr-4 transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 ${errors.password ? "border-red-400" : "border-line"}`}>
                <input value={password} onChange={(e) => { setPassword(e.target.value); clearError("password"); }} type={showPassword ? "text" : "password"} placeholder="Enter your password" className="h-12 w-full bg-transparent px-4 text-sm outline-none placeholder:text-muted/60" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0 text-muted hover:text-ink" tabIndex={-1}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
              </div>
              <FieldErr msg={errors.password} />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-line text-primary focus:ring-primary/30" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">Forgot password?</Link>
            </div>

            {errors.form && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"><p className="text-sm text-red-600">{errors.form}</p></div>}

            <Button type="submit" disabled={loading} className="h-12 w-full text-base">{loading ? "Signing in..." : "Sign in"} {!loading && <ArrowRight size={18}/>}</Button>

            <p className="text-center text-sm text-muted">New to AI CampusOS? <Link to="/register" className="font-semibold text-primary hover:underline">Create account</Link></p>
          </form>
        </div>
      </motion.div>
    </div>
  </div>;
}

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register } = useAuth();
  const navigate = useNavigate();

  function getPasswordStrength(pw: string): number {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score += 25;
    if (pw.length >= 10) score += 10;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 20;
    if (/\d/.test(pw)) score += 20;
    if (/[^a-zA-Z0-9]/.test(pw)) score += 25;
    return Math.min(100, score);
  }

  const strength = getPasswordStrength(password);

  function getStrengthBar(): { pct: number; color: string; label: string } {
    if (!password) return { pct: 0, color: "", label: "" };
    if (strength < 25) return { pct: 25, color: "bg-red-400", label: "Too weak" };
    if (strength < 50) return { pct: 50, color: "bg-orange-400", label: "Weak" };
    if (strength < 75) return { pct: 75, color: "bg-yellow-400", label: "Good" };
    return { pct: 100, color: "bg-green-500", label: "Strong" };
  }

  const bar = getStrengthBar();

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email.trim()) errs.email = "Enter a valid email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password must be at least 8 characters";
    else if (password.length < 8) errs.password = "Password must be at least 8 characters";
    if (!confirmPassword) errs.confirmPassword = "Passwords do not match";
    else if (confirmPassword !== password) errs.confirmPassword = "Passwords do not match";
    if (!role) errs.role = "Please select a role";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function clearError(field: string) {
    if (errors[field]) setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const next = await register(name.trim(), email.trim(), password, role as Role);
      setSuccess(true);
      setTimeout(() => navigate(rolePath[next]), 1500);
    } catch (err: any) {
      const detail = err.response?.data?.detail || "";
      if (detail.toLowerCase().includes("email already exists") || detail.toLowerCase().includes("already registered")) {
        setErrors({ email: "Email already exists" });
      } else {
        setErrors({ form: detail || "Could not create account. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return <div className="grid min-h-screen place-items-center bg-soft px-4">
      <BackToLanding />
      <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-green-100 text-green-600"><CheckCircle2 size={40}/></div>
        <h2 className="text-2xl font-semibold">Account created successfully.</h2>
        <p className="mt-3 text-muted">Redirecting to your dashboard...</p>
      </motion.div>
    </div>;
  }

  return <div className="min-h-screen bg-white lg:flex">
    <BackToLanding />
    <LeftPanel title="Start your AI CampusOS journey" desc="Create your account to access intelligent dashboards for students, faculty, parents, placement teams, and administrators." benefits={registerBenefits} />

    <div className="flex items-center justify-center px-4 py-12 lg:w-[55%]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }} className="w-full max-w-lg">
        <div className="rounded-[24px] border border-line bg-white p-8 shadow-[0_24px_88px_rgba(17,24,39,.10)] md:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/20"><GraduationCap size={26}/></div>
            <h2 className="text-2xl font-semibold">Create your account</h2>
            <p className="mt-2 text-muted">Choose your role and set up your workspace.</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Full Name</label>
              <input value={name} onChange={(e) => { setName(e.target.value); clearError("name"); }} placeholder="Enter your full name" className={`h-12 w-full rounded-xl border bg-white px-4 text-sm outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/10 ${errors.name ? "border-red-400 focus:border-red-400" : "border-line"}`} />
              <FieldErr msg={errors.name} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Email Address</label>
              <input value={email} onChange={(e) => { setEmail(e.target.value); clearError("email"); }} type="email" placeholder="you@university.edu" className={`h-12 w-full rounded-xl border bg-white px-4 text-sm outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/10 ${errors.email ? "border-red-400 focus:border-red-400" : "border-line"}`} />
              <FieldErr msg={errors.email} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Password</label>
              <div className={`flex items-center rounded-xl border bg-white pr-4 transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 ${errors.password ? "border-red-400" : "border-line"}`}>
                <input value={password} onChange={(e) => { setPassword(e.target.value); clearError("password"); }} type={showPassword ? "text" : "password"} placeholder="Create a password" className="h-12 w-full bg-transparent px-4 text-sm outline-none placeholder:text-muted/60" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0 text-muted hover:text-ink" tabIndex={-1}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
              </div>
              <FieldErr msg={errors.password} />
              {password && <div className="mt-2">
                <div className="flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200"><div className={`h-full rounded-full transition-all ${bar.color}`} style={{ width: `${bar.pct}%` }}/></div><span className="text-xs font-medium text-muted">{bar.label}</span></div>
                <p className="mt-1.5 text-xs text-muted">Use at least 8 characters with letters and numbers.</p>
              </div>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Confirm Password</label>
              <div className={`flex items-center rounded-xl border bg-white pr-4 transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 ${errors.confirmPassword ? "border-red-400" : "border-line"}`}>
                <input value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); clearError("confirmPassword"); }} type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" className="h-12 w-full bg-transparent px-4 text-sm outline-none placeholder:text-muted/60" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="shrink-0 text-muted hover:text-ink" tabIndex={-1}>{showConfirmPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
              </div>
              <FieldErr msg={errors.confirmPassword} />
            </div>

            <div>
              <label className="mb-2.5 block text-sm font-medium text-ink">I am a</label>
              <FieldErr msg={errors.role} />
              <div className="grid gap-2 sm:grid-cols-2">
                {roleOptions.map((opt) => (
                  <button key={opt.value} type="button" onClick={() => { setRole(opt.value); clearError("role"); }} className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${role === opt.value ? "border-primary bg-primary/[0.04] ring-2 ring-primary/20" : "border-line hover:border-primary/30 hover:bg-soft"}`}>
                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm ${role === opt.value ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}><opt.icon size={17}/></div>
                    <div><p className="text-sm font-semibold">{opt.label}</p><p className="mt-0.5 text-xs text-muted leading-relaxed">{opt.desc}</p></div>
                  </button>
                ))}
              </div>
            </div>

            {errors.form && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"><p className="text-sm text-red-600">{errors.form}</p></div>}

            <Button type="submit" disabled={loading} className="h-12 w-full text-base">{loading ? "Creating account..." : "Create account"} {!loading && <ArrowRight size={18}/>}</Button>

            <p className="text-center text-sm text-muted">Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link></p>
          </form>
        </div>
      </motion.div>
    </div>
  </div>;
}

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const email = new FormData(e.currentTarget).get("email"); await api.post("/auth/forgot-password", { email }); setSent(true); }
  return <Shell title="Reset your password"><form onSubmit={submit} className="mt-6 space-y-4"><Input name="email" placeholder="Email"/><Button className="w-full">Send reset link</Button>{sent && <p className="text-sm text-green-700">Reset instructions sent.</p>}<Link className="block text-center text-sm text-muted" to="/login">Back to login</Link></form></Shell>;
}

export function ResetPasswordPage() {
  const { token = "demo-reset-token" } = useParams();
  const [done, setDone] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const password = new FormData(e.currentTarget).get("password"); await api.post("/auth/reset-password", { token, password }); setDone(true); }
  return <Shell title="Choose a new password"><form onSubmit={submit} className="mt-6 space-y-4"><Input name="password" type="password" placeholder="New password"/><Button className="w-full">Reset password</Button>{done && <p className="text-sm text-green-700">Password reset accepted.</p>}</form></Shell>;
}

export function OtpPage() {
  return <Shell title="Verify OTP"><div className="mt-6 space-y-4"><Input placeholder="6-digit code" maxLength={6}/><Button className="w-full">Verify</Button><p className="text-sm text-muted">OTP verification is ready for provider integration.</p></div></Shell>;
}
