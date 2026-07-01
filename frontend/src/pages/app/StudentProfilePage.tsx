import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, Award, BookOpen, BriefcaseBusiness, CalendarDays, Camera, CheckCircle2, ChevronDown,
  Code2, Edit3, ExternalLink, FileText, GitBranch, Globe, GraduationCap, Layers,
  Info, Link2, Loader2, Mail, MapPin, Phone, Plus, Save, Sparkles, Upload, User, UserPlus, X,
} from "lucide-react";
import { api } from "../../api/client";
import { Card } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";
import { useAuth } from "../../context/AuthContext";
import { useStudentProfile } from "../../context/StudentProfileContext";
import { cn } from "../../utils/cn";
import type { StudentProfile } from "../../types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:8000";

// ─── Options ───────────────────────────────────────────────
const DEPARTMENTS = [
  "Computer Science & Engineering",
  "CSE (AI & ML)",
  "CSE (Data Science)",
  "Artificial Intelligence",
  "Information Technology",
  "Electronics & Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
];

const COURSES = ["B.Tech", "M.Tech", "MBA", "MCA"];

const YEARS = [
  { value: 1, label: "1st Year" },
  { value: 2, label: "2nd Year" },
  { value: 3, label: "3rd Year" },
  { value: 4, label: "4th Year" },
];

const SEMESTERS = Array.from({ length: 8 }, (_, i) => ({
  value: i + 1,
  label: `Semester ${i + 1}`,
}));

const SECTIONS = ["A", "B", "C", "D"];

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

const PREFERRED_ROLES = [
  "Software Engineer",
  "Full Stack Developer",
  "Backend Developer",
  "Frontend Developer",
  "AI Engineer",
  "ML Engineer",
  "Data Scientist",
  "DevOps Engineer",
  "Cloud Engineer",
  "Cyber Security",
];

const SKILL_CATEGORIES = [
  { key: "programming_languages", label: "Programming Languages" },
  { key: "frameworks", label: "Frameworks" },
  { key: "ai_skills", label: "AI Skills" },
  { key: "soft_skills", label: "Soft Skills" },
];

const ACADEMIC_YEARS = ["2025-26", "2026-27", "2027-28"];

const CURRENT_ACADEMIC_YEAR = (() => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  if (m >= 7) return `${y}-${(y + 1).toString().slice(-2)}`;
  return `${y - 1}-${y.toString().slice(-2)}`;
})();

const COUNTRY_CODES = [
  { code: "+1", label: "US +1" },
  { code: "+44", label: "UK +44" },
  { code: "+91", label: "IN +91" },
  { code: "+61", label: "AU +61" },
  { code: "+81", label: "JP +81" },
  { code: "+86", label: "CN +86" },
  { code: "+49", label: "DE +49" },
  { code: "+33", label: "FR +33" },
  { code: "+65", label: "SG +65" },
  { code: "+971", label: "AE +971" },
];

// ─── Hooks ──────────────────────────────────────────────────
function useDraftSave(form: Partial<StudentProfile>, editing: boolean) {
  const draftKey = "profile_draft";
  useEffect(() => {
    if (!editing || Object.keys(form).length === 0) return;
    const timer = setInterval(() => {
      try {
        const existing = localStorage.getItem(draftKey);
        const saved = existing ? JSON.parse(existing) : {};
        localStorage.setItem(draftKey, JSON.stringify({ ...saved, ...form, _savedAt: Date.now() }));
      } catch { }
    }, 5000);
    return () => clearInterval(timer);
  }, [form, editing]);
  return draftKey;
}

function useUnsavedWarning(form: Partial<StudentProfile>, editing: boolean) {
  const dirty = useMemo(() => editing && Object.keys(form).length > 0, [form, editing]);
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  return dirty;
}

// ─── Helpers ────────────────────────────────────────────────
function getDefaultPackage(year: number): string {
  if (year <= 2) return "6 LPA";
  if (year === 3) return "10 LPA";
  return "15 LPA";
}

// ─── Form Field Components ──────────────────────────────────

function FormLabel({ label, required, error }: { label: string; required?: boolean; error?: string }) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
        {label}
        {required && <span className="text-[#EF4444] ml-0.5">*</span>}
      </label>
      {error && <span className="text-[10px] font-medium text-[#EF4444]">{error}</span>}
    </div>
  );
}

function TextInput({ label, value, onChange, editable, required, disabled, placeholder, error, type, max }: {
  label: string; value: string; onChange?: (v: string) => void; editable?: boolean; required?: boolean;
  disabled?: boolean; placeholder?: string; error?: string; type?: string; max?: number;
}) {
  return (
    <div className="relative">
      <FormLabel label={label} required={required} error={error} />
      {editable && !disabled ? (
        <input
          type={type || "text"}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          max={max}
          className={cn(
            "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-[#111827] outline-none transition",
            error ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/10" :
              "border-[#E8ECF1] focus:border-[#6C4CF1] focus:ring-2 focus:ring-[#6C4CF1]/10",
            disabled && "bg-[#F5F7FA] text-[#9CA3AF] cursor-not-allowed",
          )}
        />
      ) : (
        <div className="rounded-xl bg-[#F5F7FA] px-3.5 py-2.5 text-sm font-medium text-[#111827]">
          {value || <span className="text-[#9CA3AF]">Not added</span>}
        </div>
      )}
    </div>
  );
}

function TextAreaInput({ label, value, onChange, editable, required, error }: {
  label: string; value: string; onChange?: (v: string) => void; editable?: boolean; required?: boolean; error?: string;
}) {
  return (
    <div className="relative">
      <FormLabel label={label} required={required} error={error} />
      {editable ? (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          rows={3}
          className={cn(
            "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-[#111827] outline-none transition resize-none",
            error ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/10" :
              "border-[#E8ECF1] focus:border-[#6C4CF1] focus:ring-2 focus:ring-[#6C4CF1]/10",
          )}
        />
      ) : (
        <div className="rounded-xl bg-[#F5F7FA] px-3.5 py-2.5 text-sm font-medium text-[#111827]">
          {value || <span className="text-[#9CA3AF]">Not added</span>}
        </div>
      )}
    </div>
  );
}

const PLACEHOLDER_MAP: Record<string, string> = {
  CGPA: "Enter CGPA",
  "Current SGPA": "Enter Current SGPA",
  Attendance: "Enter Attendance %",
  "Credits Earned": "Enter Credits Earned",
  "Total Credits": "Enter Total Credits",
  "Placement Readiness": "Enter Readiness %",
  "Resume Score": "Enter Resume Score",
  "Coding Score": "Enter Coding Score",
  "Communication Score": "Enter Communication Score",
  "Mock Interview Score": "Enter Mock Interview Score",
};

function NumberInput({ label, value, onChange, editable, required, min, max, step, suffix, error, placeholder }: {
  label: string; value: number | null; onChange?: (v: number | null) => void; editable?: boolean; required?: boolean;
  min?: number; max?: number; step?: number; suffix?: string; error?: string; placeholder?: string;
}) {
  const handleChange = (raw: string) => {
    if (raw === "") {
      onChange?.(null);
      return;
    }
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange?.(parsed);
    }
  };

  const hasValue = value != null && !isNaN(value);
  const clamped = hasValue ? Math.max(min ?? -Infinity, Math.min(max ?? Infinity, value)) : 0;
  const pct = min !== undefined && max !== undefined ? Math.min(100, ((clamped - min) / (max - min)) * 100) : 0;

  const displayVal = hasValue ? (suffix ? `${value}${suffix}` : String(value)) : "";

  return (
    <div className="relative">
      <FormLabel label={label} required={required} error={error} />
      {editable ? (
        <div className="relative">
          <input
            type="number"
            value={value ?? ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder || PLACEHOLDER_MAP[label] || `Enter ${label.toLowerCase()}`}
            min={min}
            max={max}
            step={step || "any"}
            className={cn(
              "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-[#111827] outline-none transition",
              error ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/10" :
                "border-[#E8ECF1] focus:border-[#6C4CF1] focus:ring-2 focus:ring-[#6C4CF1]/10",
              "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            )}
          />
          {min !== undefined && max !== undefined && hasValue && (
            <div className="mt-1 h-1.5 rounded-full bg-[#F3F4F6] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, ((value - min) / (max - min)) * 100)}%`,
                  background: value >= max * 0.8 ? "#22C55E" : value >= max * 0.5 ? "#F59E0B" : "#6C4CF1",
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-[#F5F7FA] px-3.5 py-2.5 text-sm font-medium text-[#111827]">
          {value != null ? displayVal : <span className="text-[#9CA3AF]">Not added</span>}
        </div>
      )}
    </div>
  );
}

function Dropdown({ label, value, options, onChange, editable, required, searchable, placeholder, error }: {
  label: string; value: string; options: { value: string; label: string }[];
  onChange?: (v: string) => void; editable?: boolean; required?: boolean; searchable?: boolean;
  placeholder?: string; error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    if (!search || !searchable) return options;
    return options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));
  }, [options, search, searchable]);

  const selectedLabel = options.find((o) => o.value === value)?.label || value || "";

  return (
    <div className="relative" ref={ref}>
      <FormLabel label={label} required={required} error={error} />
      {editable ? (
        <>
          <button
            type="button"
            onClick={() => { setOpen(!open); setSearch(""); }}
            className={cn(
              "flex w-full items-center justify-between rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-left transition",
              error ? "border-[#EF4444]" : "border-[#E8ECF1] hover:border-[#6C4CF1]/30",
              "focus:outline-none focus:border-[#6C4CF1] focus:ring-2 focus:ring-[#6C4CF1]/10",
              !value && "text-[#9CA3AF]",
            )}
          >
            <span className="truncate">{selectedLabel || placeholder || `Select ${label.toLowerCase()}`}</span>
            <ChevronDown size={15} className={cn("shrink-0 text-[#6B7280] transition", open && "rotate-180")} />
          </button>
          {open && (
            <div className="absolute z-50 mt-1 w-full rounded-xl border border-[#E8ECF1] bg-white shadow-lg animate-in fade-in slide-in-from-top-1 duration-150 max-h-60 overflow-hidden">
              {searchable && (
                <div className="p-2 border-b border-[#E8ECF1]">
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full rounded-lg border border-[#E8ECF1] px-3 py-1.5 text-xs outline-none focus:border-[#6C4CF1]"
                  />
                </div>
              )}
              <div className="overflow-y-auto max-h-48">
                {filtered.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-[#9CA3AF] text-center">No results found</div>
                ) : (
                  filtered.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { onChange?.(opt.value); setOpen(false); }}
                      className={cn(
                        "w-full px-3.5 py-2.5 text-left text-sm transition flex items-center gap-2",
                        opt.value === value
                          ? "bg-[#6C4CF1]/10 text-[#6C4CF1] font-semibold"
                          : "text-[#111827] hover:bg-[#F5F7FA]",
                      )}
                    >
                      {opt.value === value && <CheckCircle2 size={14} className="shrink-0 text-[#6C4CF1]" />}
                      <span className={cn(opt.value === value ? "" : "ml-6")}>{opt.label}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl bg-[#F5F7FA] px-3.5 py-2.5 text-sm font-medium text-[#111827]">
          {selectedLabel || <span className="text-[#9CA3AF]">Not added</span>}
        </div>
      )}
    </div>
  );
}

function NumberDropdown({ label, value, options, onChange, editable, required, error }: {
  label: string; value: number | null; options: { value: number; label: string }[];
  onChange?: (v: number | null) => void; editable?: boolean; required?: boolean; error?: string;
}) {
  const dropdownOptions = useMemo(() => options.map((o) => ({ value: String(o.value), label: o.label })), [options]);
  const strValue = value != null ? String(value) : "";
  return (
    <Dropdown
      label={label}
      value={strValue}
      options={dropdownOptions}
      onChange={(v) => onChange?.(v ? parseInt(v) : null)}
      editable={editable}
      required={required}
      error={error}
      placeholder={`Select ${label.toLowerCase()}`}
    />
  );
}

function PhoneInput({ label, value, onChange, editable, required, error }: {
  label: string; value: string; onChange?: (v: string) => void; editable?: boolean; required?: boolean; error?: string;
}) {
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      for (const cc of COUNTRY_CODES) {
        if (value.startsWith(cc.code)) {
          setCountryCode(cc.code);
          setPhone(value.slice(cc.code.length));
          return;
        }
      }
      setPhone(value);
    }
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (p: string) => {
    const cleaned = p.replace(/\D/g, "");
    setPhone(cleaned);
    onChange?.(`${countryCode}${cleaned}`);
  };

  return (
    <div className="relative">
      <FormLabel label={label} required={required} error={error} />
      {editable ? (
        <div className={cn(
          "flex rounded-xl border bg-white overflow-hidden transition",
          error ? "border-[#EF4444]" : "border-[#E8ECF1] focus-within:border-[#6C4CF1] focus-within:ring-2 focus-within:ring-[#6C4CF1]/10",
        )}>
          <div className="relative" ref={ref}>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="flex items-center gap-1 h-full px-3 text-sm font-medium text-[#111827] bg-[#F5F7FA] border-r border-[#E8ECF1] hover:bg-[#EEF0F4] transition whitespace-nowrap"
            >
              {countryCode}
              <ChevronDown size={12} className={cn("transition", open && "rotate-180")} />
            </button>
            {open && (
              <div className="absolute z-50 top-full left-0 mt-1 w-32 rounded-xl border border-[#E8ECF1] bg-white shadow-lg max-h-48 overflow-y-auto">
                {COUNTRY_CODES.map((cc) => (
                  <button
                    key={cc.code}
                    type="button"
                    onClick={() => { setCountryCode(cc.code); setOpen(false); onChange?.(`${cc.code}${phone}`); }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-xs transition",
                      cc.code === countryCode ? "bg-[#6C4CF1]/10 text-[#6C4CF1] font-semibold" : "text-[#111827] hover:bg-[#F5F7FA]",
                    )}
                  >
                    {cc.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Enter phone number"
            className="flex-1 px-3.5 py-2.5 text-sm font-medium text-[#111827] outline-none bg-white"
          />
        </div>
      ) : (
        <div className="rounded-xl bg-[#F5F7FA] px-3.5 py-2.5 text-sm font-medium text-[#111827]">
          {value || <span className="text-[#9CA3AF]">Not added</span>}
        </div>
      )}
    </div>
  );
}

function DatePicker({ label, value, onChange, editable, required, error }: {
  label: string; value: string; onChange?: (v: string) => void; editable?: boolean; required?: boolean; error?: string;
}) {
  const formatted = value ? (value.includes("-") ? value.split("T")[0] : value) : "";
  return (
    <div className="relative">
      <FormLabel label={label} required={required} error={error} />
      {editable ? (
        <input
          type="date"
          value={formatted}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-[#111827] outline-none transition",
            error ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/10" :
              "border-[#E8ECF1] focus:border-[#6C4CF1] focus:ring-2 focus:ring-[#6C4CF1]/10",
            !value && "text-[#9CA3AF]",
          )}
        />
      ) : (
        <div className="rounded-xl bg-[#F5F7FA] px-3.5 py-2.5 text-sm font-medium text-[#111827]">
          {value || <span className="text-[#9CA3AF]">Not added</span>}
        </div>
      )}
    </div>
  );
}

function FileUpload({ label, value, onChange, editable, accept, maxSize, hint }: {
  label: string; value: string | null; onChange?: (url: string | null) => void; editable?: boolean;
  accept: string; maxSize?: number; hint?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    const validTypes = accept.split(",").map((t) => t.trim().toLowerCase());
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!validTypes.some((t) => file.type.toLowerCase() === t || ext === t)) {
      alert(`Only ${accept} files are allowed.`);
      return;
    }
    if (maxSize && file.size > maxSize) {
      alert(`File too large. Max ${Math.round(maxSize / 1024 / 1024)}MB allowed.`);
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res = await api.post("/student/profile/photo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange?.(res.data.profile_photo_url);
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (!editable) {
    return value ? (
      <div>
        <FormLabel label={label} />
        <a href={value.startsWith("http") ? value : `${BASE_URL}${value}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl bg-[#F5F7FA] px-3.5 py-2.5 text-sm font-medium text-[#6C4CF1] hover:underline">
          <FileText size={15} /> View Uploaded File
        </a>
      </div>
    ) : null;
  }

  return (
    <div>
      <FormLabel label={label} />
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 transition",
          dragging ? "border-[#6C4CF1] bg-[#6C4CF1]/5" : "border-[#E8ECF1] bg-white hover:border-[#6C4CF1]/30 hover:bg-[#F5F7FA]",
        )}
      >
        {uploading ? (
          <Loader2 size={24} className="animate-spin text-[#6C4CF1]" />
        ) : value ? (
          <>
            <CheckCircle2 size={24} className="text-[#22C55E]" />
            <p className="mt-2 text-xs font-medium text-[#22C55E]">Uploaded</p>
            <button type="button" onClick={(e) => { e.stopPropagation(); onChange?.(null); }}
              className="mt-1 text-[10px] text-[#EF4444] hover:underline">Remove</button>
          </>
        ) : (
          <>
            <Upload size={22} className="text-[#6B7280]" />
            <p className="mt-2 text-xs font-medium text-[#6B7280]">Drop file here or click to browse</p>
            {hint && <p className="mt-1 text-[10px] text-[#9CA3AF]">{hint}</p>}
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

function MultiSelect({ categories, values, onChange, editable }: {
  categories: { key: string; label: string }[];
  values: Record<string, string[]>;
  onChange: (v: Record<string, string[]>) => void;
  editable: boolean;
}) {
  const [input, setInput] = useState("");
  const [activeCat, setActiveCat] = useState(categories[0]?.key || "");

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const current = values[activeCat] || [];
    onChange({ ...values, [activeCat]: [...current, trimmed] });
    setInput("");
  };

  const handleRemove = (cat: string, idx: number) => {
    const current = (values[cat] || []).filter((_, i) => i !== idx);
    onChange({ ...values, [cat]: current });
  };

  if (!editable) {
    const hasAny = categories.some((c) => (values[c.key] || []).length > 0);
    if (!hasAny) return <div className="text-xs text-[#9CA3AF]">None added</div>;
    return (
      <div className="space-y-3">
        {categories.map((cat) => {
          const items = values[cat.key] || [];
          if (items.length === 0) return null;
          return (
            <div key={cat.key}>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">{cat.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {items.map((s, i) => (
                  <span key={i} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-[#6C4CF1]/10 text-[#6C4CF1]">{s}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setActiveCat(cat.key)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition whitespace-nowrap",
              activeCat === cat.key ? "bg-[#6C4CF1] text-white" : "bg-[#F5F7FA] text-[#6B7280] hover:bg-[#EEF0F4]",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Add input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
          placeholder={`Add ${categories.find((c) => c.key === activeCat)?.label.toLowerCase() || "skill"}...`}
          className="flex-1 rounded-xl border border-[#E8ECF1] bg-white px-3.5 py-2 text-sm font-medium text-[#111827] outline-none transition focus:border-[#6C4CF1] focus:ring-2 focus:ring-[#6C4CF1]/10"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!input.trim()}
          className="flex items-center gap-1 rounded-xl bg-[#6C4CF1] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5B3FE0] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Tag list */}
      {categories.map((cat) => {
        const items = values[cat.key] || [];
        if (items.length === 0 && cat.key !== activeCat) return null;
        return (
          <div key={cat.key} className={cn(cat.key !== activeCat && "hidden")}>
            {items.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] text-center py-2">No {cat.label.toLowerCase()} added yet</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {items.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-[#6C4CF1]/10 px-3 py-1.5 text-xs font-medium text-[#6C4CF1] group">
                    {s}
                    <button type="button" onClick={() => handleRemove(cat.key, i)} className="hover:text-[#EF4444] transition">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Section Header ─────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#6C4CF1]/10 text-[#6C4CF1]">{icon}</div>
      <h3 className="text-lg font-bold text-[#111827]">{title}</h3>
    </div>
  );
}

// ─── Toast ──────────────────────────────────────────────────

type ToastType = "success" | "warning" | "error" | "info";
type ToastItem = { id: number; message: string; type: ToastType };

const TOAST_STYLES: Record<ToastType, { icon: typeof CheckCircle2; shell: string; iconBox: string; iconColor: string }> = {
  success: {
    icon: CheckCircle2,
    shell: "border-[#BBF7D0] bg-white text-[#14532D]",
    iconBox: "bg-[#DCFCE7]",
    iconColor: "text-[#16A34A]",
  },
  warning: {
    icon: AlertTriangle,
    shell: "border-[#FDE68A] bg-white text-[#78350F]",
    iconBox: "bg-[#FEF3C7]",
    iconColor: "text-[#D97706]",
  },
  error: {
    icon: AlertTriangle,
    shell: "border-[#FECACA] bg-white text-[#7F1D1D]",
    iconBox: "bg-[#FEE2E2]",
    iconColor: "text-[#DC2626]",
  },
  info: {
    icon: Info,
    shell: "border-[#DDD6FE] bg-white text-[#312E81]",
    iconBox: "bg-[#EEF2FF]",
    iconColor: "text-[#6C4CF1]",
  },
};

function ToastStack({ items, onClose }: { items: ToastItem[]; onClose: (id: number) => void }) {
  return (
    <motion.div
      initial={false}
      className="fixed left-4 right-4 top-[104px] z-[100] flex flex-col gap-2.5 md:left-auto md:right-6 md:top-[112px] md:w-[380px]"
    >
      {items.map((item) => {
        const style = TOAST_STYLES[item.type];
        const Icon = style.icon;
        return (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={cn(
              "flex w-full items-start gap-3 rounded-[18px] border px-4 py-3 text-sm shadow-[0_18px_48px_rgba(16,18,37,0.12)] backdrop-blur-xl",
              style.shell,
            )}
          >
            <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl", style.iconBox, style.iconColor)}>
              <Icon size={16} />
            </div>
            <p className="min-w-0 flex-1 pt-1 font-semibold leading-5">{item.message}</p>
            <button
              type="button"
              onClick={() => onClose(item.id)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[#9CA3AF] transition hover:bg-[#F5F7FA] hover:text-[#111827]"
              aria-label="Close notification"
            >
              <X size={15} />
            </button>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export function StudentProfilePage() {
  const { profile, loading, updateProfile, isUpdating, completion, refetch } = useStudentProfile();
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<StudentProfile>>({});
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"personal" | "academic" | "contact" | "social" | "skills">("personal");

  useDraftSave(form, editing);
  const hasUnsaved = useUnsavedWarning(form, editing);

  // ─── Validation ──────────────────────────────
  const REQUIRED_FIELDS: { key: string; label: string }[] = [
    { key: "department", label: "Department" },
    { key: "course", label: "Course" },
    { key: "year", label: "Year" },
    { key: "semester", label: "Semester" },
    { key: "section", label: "Section" },
    { key: "phone_number", label: "Phone Number" },
    { key: "parent_name", label: "Parent Name" },
    { key: "parent_phone", label: "Parent Phone" },
    { key: "date_of_birth", label: "Date of Birth" },
  ];

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    for (const { key, label } of REQUIRED_FIELDS) {
      const val = form[key as keyof Partial<StudentProfile>];
      if (val === undefined || val === null || val === "" || val === "Not Set" || (typeof val === "number" && val === 0 && key !== "year")) {
        errs[key] = `${label} is required`;
      }
    }
    // Year=0 is also invalid
    if (!form.year || form.year === 0) errs["year"] = "Year is required";
    if (!form.semester || form.semester === 0) errs["semester"] = "Semester is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form]);

  // ─── Toast helper ────────────────────────────
  const dismissToast = useCallback((id: number) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const friendlyMessage = message === "Please fill in all required fields before saving."
      ? "Please complete the required fields before saving."
      : message;
    const id = Date.now() + Math.random();
    setToasts((items) => [...items.slice(-2), { id, message: friendlyMessage, type }]);
    window.setTimeout(() => dismissToast(id), 3600);
  }, []);

  // ─── Restore draft ───────────────────────────
  useEffect(() => {
    if (!editing) return;
    try {
      const raw = localStorage.getItem("profile_draft");
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft._savedAt && Date.now() - draft._savedAt < 30 * 60 * 1000) {
          setForm((prev) => ({ ...prev, ...draft }));
        }
      }
    } catch { }
  }, [editing]);

  const numericValidation = useCallback((): Record<string, string> => {
    const errs: Record<string, string> = {};
    const numVal = (k: string) => form[k as keyof Partial<StudentProfile>] as number | null | undefined;

    const cgpa = numVal("cgpa");
    if (cgpa != null && (cgpa < 0 || cgpa > 10)) errs.cgpa = "CGPA must be 0–10";

    const sgpa = numVal("current_semester_gpa");
    if (sgpa != null && (sgpa < 0 || sgpa > 10)) errs.current_semester_gpa = "SGPA must be 0–10";

    const att = numVal("attendance_percentage");
    if (att != null && (att < 0 || att > 100)) errs.attendance_percentage = "Attendance must be 0–100%";

    const credE = numVal("credits_earned");
    if (credE != null && credE < 0) errs.credits_earned = "Credits cannot be negative";

    const credT = numVal("total_credits");
    if (credT != null && credT < 0) errs.total_credits = "Credits cannot be negative";

    for (const field of ["placement_readiness_score", "resume_score", "coding_score", "communication_score", "mock_interview_score"] as const) {
      const v = numVal(field);
      if (v != null && (v < 0 || v > 100)) errs[field] = `${field.replace(/_/g, " ")} must be 0–100`;
    }

    const pkg = form.expected_package;
    if (pkg && typeof pkg === "string" && pkg.trim()) {
      const num = parseFloat(pkg.replace(/[^0-9.]/g, ""));
      if (isNaN(num) || num < 0) errs.expected_package = "Invalid package value";
    }

    return errs;
  }, [form]);

  const hasChanges = useMemo(() => {
    if (Object.keys(form).length === 0) return false;
    return Object.entries(form).some(([k, v]) => {
      const orig = (profile as any)?.[k];
      if (v === null && (orig == null || orig === 0 || orig === "")) return false;
      if (v === "" && (orig == null || orig === "")) return false;
      return v !== orig;
    });
  }, [form, profile]);

  if (loading) return <ProfileSkeleton />;
  if (!profile) return null;

  const p = { ...profile, ...form } as StudentProfile;
  const profileTabs = [
    { key: "personal" as const, label: "Personal", icon: User },
    { key: "academic" as const, label: "Academic", icon: GraduationCap },
    { key: "contact" as const, label: "Contact", icon: Phone },
    { key: "social" as const, label: "Social", icon: ExternalLink },
    { key: "skills" as const, label: "Skills", icon: Code2 },
  ];

  // ─── Edit controls ───────────────────────────
  const startEdit = () => {
    setForm({
      department: profile.department,
      course: profile.course,
      branch: profile.branch,
      section: profile.section,
      year: profile.year,
      semester: profile.semester,
      academic_year: profile.academic_year,
      roll_number: profile.roll_number,
      registration_number: profile.registration_number,
      date_of_birth: profile.date_of_birth,
      gender: profile.gender,
      phone_number: profile.phone_number,
      address: profile.address,
      profile_photo_url: profile.profile_photo_url,
      faculty_advisor: profile.faculty_advisor,
      cgpa: profile.cgpa,
      current_semester_gpa: profile.current_semester_gpa,
      attendance_percentage: profile.attendance_percentage,
      credits_earned: profile.credits_earned,
      total_credits: profile.total_credits,
      placement_readiness_score: profile.placement_readiness_score,
      resume_score: profile.resume_score,
      coding_score: profile.coding_score,
      skill_score: profile.skill_score,
      mock_interview_score: profile.mock_interview_score,
      communication_score: profile.communication_score,
      applications: profile.applications,
      eligible_companies: profile.eligible_companies,
      offers: profile.offers,
      preferred_role: profile.preferred_role,
      expected_package: profile.expected_package,
      skills_data: profile.skills_data,
      certifications: profile.certifications,
      github_url: profile.github_url,
      linkedin_url: profile.linkedin_url,
      linkedin_headline: profile.linkedin_headline,
      linkedin_about: profile.linkedin_about,
      linkedin_skills: profile.linkedin_skills,
      linkedin_open_to_work: profile.linkedin_open_to_work,
      leetcode_url: profile.leetcode_url,
      portfolio_url: profile.portfolio_url,
      resume_url: profile.resume_url,
      parent_name: profile.parent_name,
      parent_phone: profile.parent_phone,
      parent_email: profile.parent_email,
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setForm({});
    setEditing(false);
    setToasts([]);
  };

  const handleSave = async () => {
    if (!validate()) {
      showToast("Please fill in all required fields before saving.", "error");
      return;
    }
    const numErrors = numericValidation();
    if (Object.keys(numErrors).length > 0) {
      setErrors(numErrors);
      showToast("Please fix validation errors before saving.", "error");
      return;
    }
    setSaving(true);
    try {
      const ALL_NUMERIC_KEYS = ["cgpa", "current_semester_gpa", "attendance_percentage", "credits_earned", "total_credits", "placement_readiness_score", "risk_score", "skill_score", "resume_score", "coding_score", "mock_interview_score", "communication_score", "applications", "eligible_companies", "offers"] as const;

      const cleaned: Record<string, any> = {};
      for (const [k, v] of Object.entries(form)) {
        const orig = (profile as any)?.[k];
        const isNumeric = ALL_NUMERIC_KEYS.includes(k as any);
        let normalized = v;
        if (isNumeric && (v === "" || v == null)) {
          normalized = null;
        }
        if (normalized === null && (orig == null || orig === 0 || orig === "")) continue;
        if (normalized === "" && (orig == null || orig === "")) continue;
        if (normalized !== orig) {
          cleaned[k] = normalized;
        }
      }
      await updateProfile(cleaned as Partial<StudentProfile>);
      await refetch();
      setEditing(false);
      setForm({});
      setErrors({});
      localStorage.removeItem("profile_draft");
      try { await refreshUser(); } catch { /* auth refresh is best-effort */ }
      showToast("Profile updated successfully! Changes are reflected across all dashboards.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      showToast("Failed to save profile. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showToast("Only JPG, PNG, WEBP files are allowed", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("File too large. Max 2MB allowed", "error");
      return;
    }
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res = await api.post("/student/profile/photo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const photoUrl = res.data.profile_photo_url;
      await updateProfile({ profile_photo_url: photoUrl });
      setForm((f) => ({ ...f, profile_photo_url: photoUrl }));
      refetch();
      showToast("Profile photo updated!");
    } catch {
      showToast("Upload failed. Please try again.", "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = async () => {
    await updateProfile({ profile_photo_url: null });
    setForm((f) => ({ ...f, profile_photo_url: null }));
    refetch();
    showToast("Profile photo removed.");
  };

  const set = (key: string, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    if (key === "year" && typeof value === "number" && !form.expected_package && !profile.expected_package) {
      setForm((f) => ({ ...f, expected_package: getDefaultPackage(value) }));
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-[1320px] space-y-6">
      <ToastStack items={toasts} onClose={dismissToast} />

      <div className="rounded-[28px] border border-[#ECEBFF] bg-white p-5 shadow-[0_18px_50px_rgba(16,18,37,0.055)]">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#6C4CF1]/15 bg-[#6C4CF1]/5 px-3 py-1.5 text-xs font-semibold text-[#6C4CF1]">
              <Sparkles size={13} /> Student Profile
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-[#111827]">My Profile</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              {editing ? "Edit your details and save when ready." : "Manage your academic identity, contact details, links, skills, and interests."}
            </p>
          </div>
        </div>
      </div>

      {hasUnsaved && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#F59E0B]/30 bg-[#FEF3C7] px-5 py-3 text-sm font-semibold text-[#F59E0B]">
          <Loader2 size={17} className="animate-spin" /> You have unsaved changes. Auto-save draft is active.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <Card className="rounded-[28px] p-5 text-center shadow-[0_18px_50px_rgba(16,18,37,0.055)]">
            <div className="relative mx-auto mb-4 h-28 w-28">
              <Avatar src={p.profile_photo_url} name={user?.full_name} size="xl" rounded="2xl" />
              {editing && (
                <div className="absolute -bottom-1 -right-1 flex gap-1">
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-[#E8ECF1] bg-white text-[#6B7280] shadow-sm hover:text-[#6C4CF1]">
                    {uploadingPhoto ? <Loader2 size={14} className="animate-spin" /> : <Camera size={15} />}
                  </button>
                  {p.profile_photo_url && (
                    <button onClick={removePhoto}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-[#E8ECF1] bg-white text-[#EF4444] shadow-sm hover:bg-[#FEE2E2]">
                      <X size={15} />
                    </button>
                  )}
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoUpload} />
            <h3 className="text-xl font-bold text-[#111827]">{user?.full_name}</h3>
            <p className="mt-1 text-sm font-semibold text-[#6C4CF1]">{p.roll_number || "Roll number pending"}</p>
            <p className="mt-1 truncate text-xs text-[#6B7280]">{p.department || "Department not set"}{p.year ? ` • Year ${p.year}` : ""}</p>
            {editing && <p className="mt-4 text-xs font-medium text-[#8B8FA3]">JPG, PNG or WEBP. Max 2MB.</p>}
            {uploadingPhoto && <p className="mt-2 text-xs text-[#6C4CF1]">Uploading...</p>}
            <div className="mt-5 flex flex-col gap-2">
              {editing ? (
                <>
                  <button onClick={handleSave} disabled={saving || isUpdating || !hasChanges}
                    className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#6C4CF1] px-4 text-sm font-semibold text-white shadow-lg shadow-[#6C4CF1]/20 transition hover:bg-[#5B3FE0] disabled:opacity-60">
                    {saving || isUpdating ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Save size={15} /> Save Changes</>}
                  </button>
                  <button onClick={cancelEdit}
                    className="h-11 rounded-2xl border border-[#E8ECF1] px-4 text-sm font-semibold text-[#6B7280] transition hover:border-[#EF4444]/30 hover:text-[#EF4444]">
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={startEdit}
                  className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#E8ECF1] px-4 text-sm font-semibold text-[#6B7280] transition hover:border-[#6C4CF1]/30 hover:text-[#6C4CF1]">
                  <Edit3 size={15} /> Edit Profile
                </button>
              )}
            </div>
          </Card>

          <Card className="rounded-[28px] p-5 shadow-[0_18px_50px_rgba(16,18,37,0.055)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6C4CF1]">Completion</p>
                <h3 className="mt-1 text-xl font-bold text-[#111827]">{completion.percent}% Complete</h3>
              </div>
              <div className="relative h-16 w-16">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#F3F4F6" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#6C4CF1" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${completion.percent * 0.97} 100`} />
                </svg>
                <span className="absolute inset-0 grid place-items-center text-sm font-bold text-[#6C4CF1]">{completion.percent}%</span>
              </div>
            </div>
            {completion.missing.length > 0 && (
              <div className="rounded-2xl bg-[#FEF3C7] p-3">
                <p className="mb-2 text-xs font-semibold text-[#F59E0B]">Missing Information</p>
                <div className="flex flex-wrap gap-2">
                  {completion.missing.slice(0, 8).map((m) => (
                    <span key={m} className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-medium text-[#F59E0B]">{m}</span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </aside>

        <div className="min-w-0 space-y-5">
          <div className="overflow-x-auto rounded-[24px] border border-[#ECEBFF] bg-white p-2 shadow-[0_14px_38px_rgba(16,18,37,0.045)] no-scrollbar">
            <div className="flex min-w-max gap-2">
              {profileTabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition",
                      active
                        ? "bg-[#6C4CF1] text-white shadow-[0_12px_28px_rgba(108,76,241,0.22)]"
                        : "text-[#6B7280] hover:bg-[#F5F7FA] hover:text-[#111827]",
                    )}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Card className={cn("rounded-[28px] p-5 shadow-[0_18px_50px_rgba(16,18,37,0.055)]", activeTab !== "personal" && "hidden")}>
            <SectionHeader icon={<User size={16} />} title="Personal Info" />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label="Full Name" value={user?.full_name || ""} disabled />
              <TextInput label="University Email" value={user?.email || ""} disabled />
              <TextInput label="Student ID" value={String(p.id)} disabled />
              <TextInput label="Roll Number" value={p.roll_number} editable={editing} onChange={(v) => set("roll_number", v)}
                placeholder="e.g. AICOS0001" />
              <TextInput label="Registration Number" value={p.registration_number || ""} editable={editing} onChange={(v) => set("registration_number", v)}
                placeholder="e.g. 2021CSE001" />
              <DatePicker label="Date of Birth" value={p.date_of_birth || ""} editable={editing} onChange={(v) => set("date_of_birth", v)}
                required error={errors.date_of_birth} />
              <Dropdown label="Gender" value={p.gender || ""} options={GENDERS.map((g) => ({ value: g, label: g }))}
                editable={editing} onChange={(v) => set("gender", v)} placeholder="Select gender" />
            </div>
          </Card>

          <Card className={cn("rounded-[28px] p-5 shadow-[0_18px_50px_rgba(16,18,37,0.055)]", activeTab !== "academic" && "hidden")}>
            <SectionHeader icon={<GraduationCap size={16} />} title="Academic Info" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Dropdown label="Department" value={p.department} options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
                editable={editing} onChange={(v) => set("department", v)} required searchable placeholder="Select department" error={errors.department} />
              <Dropdown label="Course" value={p.course || ""} options={COURSES.map((c) => ({ value: c, label: c }))}
                editable={editing} onChange={(v) => set("course", v)} searchable placeholder="Select course" error={errors.course} />
              <TextInput label="Branch" value={p.branch || ""} editable={editing} onChange={(v) => set("branch", v)}
                placeholder="e.g. Computer Science" />
              <NumberDropdown label="Year" value={p.year} options={YEARS}
                editable={editing} onChange={(v) => set("year", v)} required error={errors.year} />
              <NumberDropdown label="Semester" value={p.semester} options={SEMESTERS}
                editable={editing} onChange={(v) => set("semester", v)} required error={errors.semester} />
              <Dropdown label="Section" value={p.section || ""} options={SECTIONS.map((s) => ({ value: s, label: s }))}
                editable={editing} onChange={(v) => set("section", v)} placeholder="Select section" error={errors.section} />
              <Dropdown label="Academic Year" value={p.academic_year || CURRENT_ACADEMIC_YEAR}
                options={ACADEMIC_YEARS.map((y) => ({ value: y, label: y }))}
                editable={editing} onChange={(v) => set("academic_year", v)} placeholder="Select academic year" />
              <NumberInput label="CGPA" value={p.cgpa} editable={editing} onChange={(v) => set("cgpa", v)}
                min={0} max={10} step={0.01} />
              <NumberInput label="Current SGPA" value={p.current_semester_gpa} editable={editing} onChange={(v) => set("current_semester_gpa", v)}
                min={0} max={10} step={0.01} />
              <NumberInput label="Attendance" value={p.attendance_percentage} editable={editing} onChange={(v) => set("attendance_percentage", v)}
                min={0} max={100} step={0.1} suffix="%" />
              <NumberInput label="Credits Earned" value={p.credits_earned} editable={editing} onChange={(v) => set("credits_earned", v)}
                min={0} max={p.total_credits || 180} />
              <NumberInput label="Total Credits" value={p.total_credits} editable={editing} onChange={(v) => set("total_credits", v)}
                min={0} max={300} />
              <TextInput label="Faculty Advisor" value={p.faculty_advisor || ""} editable={editing} onChange={(v) => set("faculty_advisor", v)}
                placeholder="Enter faculty advisor name" />
            </div>
          </Card>

          <Card className={cn("rounded-[28px] p-5 shadow-[0_18px_50px_rgba(16,18,37,0.055)]", activeTab !== "contact" && "hidden")}>
            <SectionHeader icon={<Phone size={16} />} title="Contact Info" />
            <div className="grid gap-4 sm:grid-cols-2">
              <PhoneInput label="Phone Number" value={p.phone_number || ""} editable={editing} onChange={(v) => set("phone_number", v)} error={errors.phone_number} />
              <TextInput label="Parent Name" value={p.parent_name || ""} editable={editing} onChange={(v) => set("parent_name", v)}
                placeholder="Enter parent/guardian name" required error={errors.parent_name} />
              <PhoneInput label="Parent Phone" value={p.parent_phone || ""} editable={editing} onChange={(v) => set("parent_phone", v)} error={errors.parent_phone} />
              <TextInput label="Parent Email" value={p.parent_email || ""} editable={editing} onChange={(v) => set("parent_email", v)}
                placeholder="parent@email.com" type="email" />
              <div className="sm:col-span-2">
                <TextAreaInput label="Address" value={p.address || ""} editable={editing} onChange={(v) => set("address", v)} />
              </div>
            </div>
          </Card>

          <Card className={cn("rounded-[28px] p-5 shadow-[0_18px_50px_rgba(16,18,37,0.055)]", activeTab !== "social" && "hidden")}>
            <SectionHeader icon={<ExternalLink size={16} />} title="Social Links" />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label="GitHub" value={p.github_url || ""} editable={editing} onChange={(v) => set("github_url", v)}
                placeholder="https://github.com/username" />
              <TextInput label="LinkedIn" value={p.linkedin_url || ""} editable={editing} onChange={(v) => set("linkedin_url", v)}
                placeholder="https://linkedin.com/in/username" />
              <TextInput label="LeetCode" value={p.leetcode_url || ""} editable={editing} onChange={(v) => set("leetcode_url", v)}
                placeholder="https://leetcode.com/u/username" />
              <TextInput label="Portfolio" value={p.portfolio_url || ""} editable={editing} onChange={(v) => set("portfolio_url", v)}
                placeholder="https://your-portfolio.com" />
              <TextInput label="LinkedIn Headline" value={p.linkedin_headline || ""} editable={editing} onChange={(v) => set("linkedin_headline", v)}
                placeholder="Full Stack Developer | React, FastAPI, AI/ML" />
              <TextInput label="LinkedIn Skills" value={p.linkedin_skills || ""} editable={editing} onChange={(v) => set("linkedin_skills", v)}
                placeholder="React, FastAPI, Python, AI/ML" />
              <div className="sm:col-span-2">
                <TextAreaInput label="LinkedIn About" value={p.linkedin_about || ""} editable={editing} onChange={(v) => set("linkedin_about", v)} />
              </div>
              <div className="sm:col-span-2">
                <FormLabel label="LinkedIn Open To Work" />
                {editing ? (
                  <label className="flex items-center gap-3 rounded-xl border border-[#E8ECF1] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#111827]">
                    <input type="checkbox" checked={!!p.linkedin_open_to_work} onChange={(e) => set("linkedin_open_to_work", e.target.checked)}
                      className="h-4 w-4 rounded border-[#E8ECF1] accent-[#6C4CF1]" />
                    Open to work
                  </label>
                ) : (
                  <div className="rounded-xl bg-[#F5F7FA] px-3.5 py-2.5 text-sm font-medium text-[#111827]">
                    {p.linkedin_open_to_work ? "Yes" : "No"}
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className={cn("rounded-[28px] p-5 shadow-[0_18px_50px_rgba(16,18,37,0.055)]", activeTab !== "skills" && "hidden")}>
            <SectionHeader icon={<Code2 size={16} />} title="Skills & Interests" />
            <div className="grid gap-5 xl:grid-cols-2">
              <div>
                <p className="mb-3 text-xs font-semibold text-[#6B7280]">SKILLS</p>
                <MultiSelect
                  categories={SKILL_CATEGORIES}
                  values={p.skills_data as Record<string, string[]>}
                  onChange={(v) => set("skills_data", v)}
                  editable={editing}
                />
              </div>
              <div>
                <p className="mb-3 text-xs font-semibold text-[#6B7280]">CAREER INTERESTS</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Dropdown label="Preferred Job Role" value={p.preferred_role || ""}
                    options={PREFERRED_ROLES.map((r) => ({ value: r, label: r }))}
                    editable={editing} onChange={(v) => set("preferred_role", v)} searchable placeholder="Select preferred role" />
                  <TextInput label="Expected Package" value={p.expected_package || ""} editable={editing} onChange={(v) => set("expected_package", v)}
                    placeholder="e.g. 15 LPA" />
                  <NumberInput label="Placement Readiness" value={p.placement_readiness_score} editable={editing} onChange={(v) => set("placement_readiness_score", v)}
                    min={0} max={100} suffix="%" />
                  <NumberInput label="Resume Score" value={p.resume_score} editable={editing} onChange={(v) => set("resume_score", v)}
                    min={0} max={100} suffix="%" />
                  <NumberInput label="Coding Score" value={p.coding_score} editable={editing} onChange={(v) => set("coding_score", v)}
                    min={0} max={100} suffix="%" />
                  <NumberInput label="Mock Interview Score" value={p.mock_interview_score} editable={editing} onChange={(v) => set("mock_interview_score", v)}
                    min={0} max={100} suffix="%" />
                </div>
              </div>
              <div className="border-t border-[#E8ECF1] pt-5 xl:col-span-2">
                <p className="mb-3 text-xs font-semibold text-[#6B7280]">CERTIFICATIONS</p>
                {editing ? (
                  <CertificationsEditor
                    certifications={p.certifications || []}
                    onChange={(v) => set("certifications", v)}
                  />
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {(p.certifications || []).length === 0 ? (
                      <span className="text-xs text-[#9CA3AF]">None added</span>
                    ) : (
                      (p.certifications || []).map((cert, i) => (
                        <span key={i} className="rounded-lg bg-[#8B5CF6]/10 px-3 py-1.5 text-xs font-medium text-[#8B5CF6]">
                          {cert}
                        </span>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Certifications Editor ──────────────────────────────────

function CertificationsEditor({ certifications, onChange }: { certifications: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onChange([...certifications, trimmed]);
    setInput("");
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
          placeholder="Add certification..."
          className="flex-1 rounded-xl border border-[#E8ECF1] bg-white px-3.5 py-2 text-sm font-medium text-[#111827] outline-none transition focus:border-[#6C4CF1] focus:ring-2 focus:ring-[#6C4CF1]/10"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!input.trim()}
          className="flex items-center gap-1 rounded-xl bg-[#8B5CF6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={14} /> Add
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {certifications.length === 0 ? (
          <span className="text-xs text-[#9CA3AF]">No certifications added yet</span>
        ) : (
          certifications.map((cert, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-[#8B5CF6]/10 px-3 py-1.5 text-xs font-medium text-[#8B5CF6] group">
              {cert}
              <button type="button" onClick={() => onChange(certifications.filter((_, idx) => idx !== i))}
                className="hover:text-[#EF4444] transition"><X size={12} /></button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-20 animate-pulse rounded-2xl bg-white shadow-sm" />
      <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
        <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm" />
        <div className="space-y-6">
          <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />
          <div className="h-48 animate-pulse rounded-2xl bg-white shadow-sm" />
        </div>
      </div>
    </div>
  );
}
