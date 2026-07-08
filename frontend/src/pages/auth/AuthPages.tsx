import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  LineChart,
  Lock,
  LogIn,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
  X,
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
  { value: "STUDENT", label: "Student", desc: "Learn • Grow • Get Placed", icon: GraduationCap },
  { value: "FACULTY", label: "Faculty", desc: "Track • Guide • Analyze", icon: Users },
  { value: "PARENT", label: "Parent", desc: "Monitor Progress", icon: MessageSquare },
  { value: "PLACEMENT_OFFICER", label: "Placement Officer", desc: "Placement Analytics", icon: BriefcaseBusiness },
  { value: "ADMIN", label: "Admin", desc: "Manage Platform", icon: ShieldCheck },
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

function RequiredMark() {
  return <span className="ml-0.5 text-red-500">*</span>;
}

function Divider() {
  return <div className="flex items-center gap-3"><div className="h-px flex-1 bg-line" /><span className="text-xs text-muted">OR</span><div className="h-px flex-1 bg-line" /></div>;
}

function GoogleSignInButton({ onClick, loading, disabled }: { onClick: () => void; loading: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-line bg-white text-sm font-semibold text-ink shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
    >
      <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
      {loading ? "Signing in..." : "Continue with Google"}
    </button>
  );
}

// ===================== LoginPage =====================

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login, googleSignIn } = useAuth();
  const navigate = useNavigate();

  const isFormValid = email.trim() !== "" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password !== "";

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = "Email Address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email";
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
      setErrors({ form: err.response?.data?.detail || "Invalid email or password" });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setErrors({});
    try {
      const userRole = await googleSignIn();
      navigate(rolePath[userRole]);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "";
      if (msg.includes("not configured")) {
        setErrors({ form: msg });
      } else if (msg.includes("popup") || msg.includes("window.closed") || msg.includes("cancelled")) {
        setErrors({ form: "Sign-in popup was blocked or closed. Try allowing popups for this site and try again." });
      } else {
        setErrors({ form: msg || "Google sign-in failed. Try using email/password instead." });
      }
    } finally {
      setGoogleLoading(false);
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

          <GoogleSignInButton onClick={handleGoogleSignIn} loading={googleLoading} />

          <div className="my-6"><Divider /></div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Email Address<RequiredMark /></label>
              <input value={email} onChange={(e) => { setEmail(e.target.value); clearError("email"); }} type="email" placeholder="you@university.edu" className={`h-12 w-full rounded-xl border bg-white px-4 text-sm outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/10 ${errors.email ? "border-red-400 focus:border-red-400" : "border-line"}`} />
              <FieldErr msg={errors.email} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Password<RequiredMark /></label>
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

            <p className="text-xs text-muted"><RequiredMark /> Required fields</p>

            <Button type="submit" disabled={!isFormValid || loading} className="h-12 w-full text-base">{loading ? "Signing in..." : "Sign in"} {!loading && <ArrowRight size={18}/>}</Button>

            <p className="text-center text-sm text-muted">New to AI CampusOS? <Link to="/register" className="font-semibold text-primary hover:underline">Create account</Link></p>
          </form>
        </div>
      </motion.div>
    </div>

  </div>;
}

// ===================== RegisterPage =====================

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register, googleSignIn } = useAuth();
  const navigate = useNavigate();

  const isFormValid = name.trim() !== "" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 8 && confirmPassword !== "" && confirmPassword === password && role !== "";
  const googleEnabled = role !== "";

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
    if (!name.trim()) errs.name = "Full Name is required";
    if (!email.trim()) errs.email = "Email Address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    else if (password.length < 8) errs.password = "Password must be at least 8 characters";
    if (!confirmPassword) errs.confirmPassword = "Passwords do not match";
    else if (confirmPassword !== password) errs.confirmPassword = "Passwords do not match";
    if (!role) errs.role = "Please select your role";
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

  async function handleGoogleSignIn() {
    if (!role) {
      setErrors({ form: "Please select your role first" });
      return;
    }
    setGoogleLoading(true);
    setErrors({});
    try {
      const userRole = await googleSignIn(role as Role);
      setSuccess(true);
      setTimeout(() => navigate(rolePath[userRole]), 1500);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "";
      if (msg.includes("not configured")) {
        setErrors({ form: msg });
      } else if (msg.includes("popup") || msg.includes("window.closed") || msg.includes("cancelled")) {
        setErrors({ form: "Sign-in popup was blocked or closed. Try allowing popups for this site and try again." });
      } else {
        setErrors({ form: msg || "Google sign-in failed. Try using email/password instead." });
      }
    } finally {
      setGoogleLoading(false);
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

          <div className="mb-5">
            <label className="mb-2.5 block text-sm font-medium text-ink">I am joining as<RequiredMark /></label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {roleOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setRole(opt.value); clearError("role"); }}
                  className={`relative flex flex-col items-center justify-center gap-1 rounded-2xl border p-3 text-center transition-all duration-[250ms] ${
                    role === opt.value
                      ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                      : "border-line bg-white shadow-sm hover:-translate-y-[3px] hover:shadow-lg"
                  }`}
                  style={{ minHeight: '85px' }}
                >
                  {role === opt.value && (
                    <div className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-white">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                  <div className={role === opt.value ? "text-primary" : "text-muted"}><opt.icon size={18}/></div>
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-[10px] leading-tight text-muted">{opt.desc}</p>
                </button>
              ))}
            </div>
            <FieldErr msg={errors.role} />
          </div>

          {!googleEnabled && (
            <p className="mb-3 text-center text-xs text-muted">Please select your role first to continue with Google.</p>
          )}
          <GoogleSignInButton onClick={handleGoogleSignIn} loading={googleLoading} disabled={!googleEnabled} />

          <div className="my-6"><Divider /></div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Full Name<RequiredMark /></label>
              <input value={name} onChange={(e) => { setName(e.target.value); clearError("name"); }} placeholder="Enter your full name" className={`h-12 w-full rounded-xl border bg-white px-4 text-sm outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/10 ${errors.name ? "border-red-400 focus:border-red-400" : "border-line"}`} />
              <FieldErr msg={errors.name} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Email Address<RequiredMark /></label>
              <input value={email} onChange={(e) => { setEmail(e.target.value); clearError("email"); }} type="email" placeholder="you@university.edu" className={`h-12 w-full rounded-xl border bg-white px-4 text-sm outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/10 ${errors.email ? "border-red-400 focus:border-red-400" : "border-line"}`} />
              <FieldErr msg={errors.email} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Password<RequiredMark /></label>
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
              <label className="mb-1.5 block text-sm font-medium text-ink">Confirm Password<RequiredMark /></label>
              <div className={`flex items-center rounded-xl border bg-white pr-4 transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 ${errors.confirmPassword ? "border-red-400" : "border-line"}`}>
                <input value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); clearError("confirmPassword"); }} type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" className="h-12 w-full bg-transparent px-4 text-sm outline-none placeholder:text-muted/60" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="shrink-0 text-muted hover:text-ink" tabIndex={-1}>{showConfirmPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
              </div>
              <FieldErr msg={errors.confirmPassword} />
            </div>

            {errors.form && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"><p className="text-sm text-red-600">{errors.form}</p></div>}

            <p className="text-xs text-muted"><RequiredMark /> Required fields</p>

            <Button type="submit" disabled={!isFormValid || loading} className="h-12 w-full text-base">{loading ? "Creating account..." : "Create account"} {!loading && <ArrowRight size={18}/>}</Button>

            <p className="text-center text-sm text-muted">Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link></p>
          </form>
        </div>
      </motion.div>
    </div>
  </div>;
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const isValid = email.trim() !== "" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return <div className="min-h-screen bg-white">
    <BackToLanding />
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }} className="w-full max-w-md">
        {sent ? (
          <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[24px] border border-line bg-white p-8 shadow-[0_24px_88px_rgba(17,24,39,.10)] text-center md:p-10">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/20"><CheckCircle2 size={26}/></div>
            <h2 className="text-2xl font-semibold">Check your inbox</h2>
            <p className="mt-2 text-muted">We sent password reset instructions to <strong className="text-ink">{email}</strong>.</p>
            <p className="mt-1 text-sm text-muted">If you don't see it, check your spam folder.</p>
            <Button onClick={() => navigate("/login")} className="mt-6 h-12 w-full text-base">Back to Sign in</Button>
          </motion.div>
        ) : (
          <div className="rounded-[24px] border border-line bg-white p-8 shadow-[0_24px_88px_rgba(17,24,39,.10)] md:p-10">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/20"><Lock size={26}/></div>
              <h2 className="text-2xl font-semibold">Forgot password?</h2>
              <p className="mt-2 text-muted">Enter your email and we'll send you a reset link.</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Email Address<RequiredMark /></label>
                <input value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} type="email" placeholder="you@university.edu" className={`h-12 w-full rounded-xl border bg-white px-4 text-sm outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/10 ${error ? "border-red-400 focus:border-red-400" : "border-line"}`} />
                <FieldErr msg={error} />
              </div>

              <Button type="submit" disabled={!isValid || loading} className="h-12 w-full text-base">
                {loading ? "Sending..." : "Send Reset Link"} {!loading && <ArrowRight size={18}/>}
              </Button>
            </form>

            <div className="mt-6 space-y-3 text-center">
              <p className="text-sm text-muted">Remember your password? <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link></p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  </div>;
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function getPasswordStrength(pw: string): number {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score += 25;
    if (/[a-z]/.test(pw)) score += 15;
    if (/[A-Z]/.test(pw)) score += 15;
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

  const requirements = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Uppercase", met: /[A-Z]/.test(password) },
    { label: "Lowercase", met: /[a-z]/.test(password) },
    { label: "Number", met: /\d/.test(password) },
    { label: "Special character", met: /[^a-zA-Z0-9]/.test(password) },
  ];

  const passwordsMatch = confirmPassword !== "" && password === confirmPassword;
  const isFormValid = password.length >= 8 && confirmPassword !== "" && password === confirmPassword && token !== "";

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reset password. The link may be expired.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return <div className="min-h-screen bg-white">
      <BackToLanding />
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <div className="rounded-[24px] border border-line bg-white p-8 shadow-[0_24px_88px_rgba(17,24,39,.10)] text-center md:p-10">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-green-100 text-green-600"><CheckCircle2 size={26}/></div>
            <h2 className="text-2xl font-semibold">Password Updated Successfully</h2>
            <p className="mt-2 text-muted">Your password has been reset. You can now sign in with your new password.</p>
            <Button onClick={() => navigate("/login")} className="mt-6 h-12 w-full text-base">Go to Login <ArrowRight size={18}/></Button>
          </div>
        </motion.div>
      </div>
    </div>;
  }

  if (!token) {
    return <div className="min-h-screen bg-white">
      <BackToLanding />
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="rounded-[24px] border border-line bg-white p-8 shadow-[0_24px_88px_rgba(17,24,39,.10)] md:p-10">
            <h2 className="text-2xl font-semibold">Invalid reset link</h2>
            <p className="mt-2 text-muted">This password reset link is invalid or missing a token.</p>
            <Button onClick={() => navigate("/forgot-password")} className="mt-6 h-12 w-full text-base">Request new reset link</Button>
          </div>
        </div>
      </div>
    </div>;
  }

  return <div className="min-h-screen bg-white">
    <BackToLanding />
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }} className="w-full max-w-md">
        <div className="rounded-[24px] border border-line bg-white p-8 shadow-[0_24px_88px_rgba(17,24,39,.10)] md:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/20"><Lock size={26}/></div>
            <h2 className="text-2xl font-semibold">Create New Password</h2>
            <p className="mt-2 text-muted">Choose a strong password for your account.</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">New Password<RequiredMark /></label>
              <div className={`flex items-center rounded-xl border bg-white pr-4 transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 ${error ? "border-red-400" : "border-line"}`}>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} placeholder="Create a new password" className="h-12 w-full bg-transparent px-4 text-sm outline-none placeholder:text-muted/60" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0 text-muted hover:text-ink" tabIndex={-1}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
              </div>
              {password && <div className="mt-2">
                <div className="flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200"><div className={`h-full rounded-full transition-all ${bar.color}`} style={{ width: `${bar.pct}%` }}/></div><span className="text-xs font-medium text-muted">{bar.label}</span></div>
              </div>}
              <div className="mt-2 space-y-1">
                {requirements.map((r) => (
                  <div key={r.label} className={`flex items-center gap-1.5 text-xs transition-colors ${r.met ? "text-green-600" : "text-muted"}`}>
                    {r.met ? <Check size={12} className="text-green-500" strokeWidth={3} /> : <div className="h-3 w-3 rounded-full border border-muted/40" />}
                    {r.label}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Confirm Password<RequiredMark /></label>
              <div className={`flex items-center rounded-xl border bg-white pr-4 transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 ${error ? "border-red-400" : "border-line"}`}>
                <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" className="h-12 w-full bg-transparent px-4 text-sm outline-none placeholder:text-muted/60" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="shrink-0 text-muted hover:text-ink" tabIndex={-1}>{showConfirmPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
              </div>
              {confirmPassword && (
                <div className={`mt-1 flex items-center gap-1 text-xs ${passwordsMatch ? "text-green-600" : "text-red-500"}`}>
                  {passwordsMatch ? <Check size={12} strokeWidth={3} /> : <X size={12} />}
                  {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                </div>
              )}
            </div>

            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"><p className="text-sm text-red-600">{error}</p></div>}

            <Button type="submit" disabled={!isFormValid || loading} className="h-12 w-full text-base">
              {loading ? "Updating password..." : "Update Password"} {!loading && <ArrowRight size={18}/>}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  </div>;
}

export function OtpPage() {
  return <Shell title="Verify OTP"><div className="mt-6 space-y-4"><Input placeholder="6-digit code" maxLength={6}/><Button className="w-full">Verify</Button><p className="text-sm text-muted">OTP verification is ready for provider integration.</p></div></Shell>;
}
